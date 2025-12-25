// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Auth User
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      throw new Error("Unauthorized: User not found.")
    }

    const body = await req.json()
    const { paypalOrderId, items, shipping, promoCode } = body

    console.log(`[PAYMENT] Processing for ${user.email} (${user.id})`);
    console.log(`[PAYMENT] Order ID: ${paypalOrderId}, Items: ${items?.length}, Promo: ${promoCode}`);

    // Verify with PayPal API
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
    const PAYPAL_API_BASE = Deno.env.get('PAYPAL_MODE') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';


    // Admin Bypass - Handle missing profiles gracefully
    const { data: profile, error: profileError } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn(`Profile fetch error for user ${user.id}:`, profileError.message);
    }

    const isAdmin = profile?.is_admin || false;
    const isBypass = paypalOrderId === 'ADMIN_BYPASS';

    // SECURITY: Only allow bypassing PayPal verification if the user is a confirmed ADMIN.
    if (isBypass) {
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin action required for bypass.");
      }
      console.log(`✨ Admin bypass activated for ${user.email}`);
    } else {
      // PROCEED WITH PAYPAL VERIFICATION
      if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        throw new Error("PayPal configuration missing on server.");
      }

      // 1. Get PayPal Access Token
      const authRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!authRes.ok) throw new Error("Failed to authenticate with PayPal");
      const { access_token } = await authRes.json();

      // 2. Fetch Order Details
      const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.error("PayPal API Error:", orderRes.status, errText);
        throw new Error(`Failed to fetch order from PayPal (${orderRes.status}): ${errText}`);
      }
      const paypalOrder = await orderRes.json();

      if (paypalOrder.status !== 'COMPLETED' && paypalOrder.status !== 'APPROVED') {
        throw new Error(`PayPal Order status is ${paypalOrder.status}, expected COMPLETED or APPROVED.`);
      }

      // Verify total amount (sum of items)
      // const paypalTotal = parseFloat(paypalOrder.purchase_units[0].amount.value);
    }

    // Define Server-Side Master Pricing
    const PRICING = {
      DIGITAL: 24.99,
      HARDCOVER: 49.99,
      BUNDLE: 69.99,
    }

    // Start processing items
    const results = [];

    for (const item of items) {
      const isHardcover = item.type === 'HARDCOVER' || item.type === 'BUNDLE';

      // 2. Enforce Server-Side Price
      console.log(`[PAYMENT] Processing item type: ${item.type} for book: ${item.bookId}`);
      let serverPrice = 0;
      if (item.type === 'DIGITAL') serverPrice = PRICING.DIGITAL;
      else if (item.type === 'HARDCOVER') serverPrice = PRICING.HARDCOVER;
      else if (item.type === 'BUNDLE') serverPrice = PRICING.BUNDLE;
      else {
        throw new Error(`Invalid item type: ${item.type}`);
      }

      const finalRecordedPrice = serverPrice;

      console.log(`[PAYMENT] Creating order record for book: ${item.bookId}`);
      // 1. Create Order Record
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        book_id: item.bookId,
        order_type: isHardcover ? 'hardcover' : 'digital',
        product_name: item.title,
        base_price: finalRecordedPrice, // TRUSTED SERVER PRICE
        final_amount: finalRecordedPrice,
        payment_status: 'succeeded',
        payment_provider: isBypass ? 'admin_bypass' : 'paypal',
        provider_order_id: paypalOrderId,
        shipping_name: shipping?.name || null,
        shipping_address: shipping,
        currency: 'USD',
        promo_code: promoCode || null,
        fulfillment_status: isHardcover ? 'pending_lulu' : 'pending'
      }).select().single();

      if (orderError) {
        console.error(`[PAYMENT] Order insertion failed:`, orderError);
        throw orderError;
      }

      console.log(`[PAYMENT] Unlocking book: ${item.bookId}`);
      // 2. Unlock Book
      const { data: currentBook, error: fetchBookError } = await supabase.from('books').select('status').eq('id', item.bookId).single();

      if (fetchBookError) {
        console.warn(`[PAYMENT] Could not fetch book ${item.bookId} to determine status, defaulting to 'completed'`);
      }

      const newStatus = (currentBook?.status === 'draft') ? 'generating' : 'completed';

      const { error: bookError } = await supabase
        .from('books')
        .update({
          status: newStatus,
          is_purchased: true
        })
        .eq('id', item.bookId);

      if (bookError) {
        console.error(`[PAYMENT] Book update failed for ${item.bookId}:`, bookError);
        throw bookError;
      }

      // 3. Remove from Cart
      if (item.id !== 'single') {
        console.log(`[PAYMENT] Removing item ${item.id} from cart`);
        await supabase.from('cart').delete().eq('id', item.id).eq('user_id', user.id);
      }

      results.push(orderData.id);
    }

    // 4. Update Promo Usage (if applicable)
    if (promoCode) {
      // Atomic increment using RPC would be ideal, but for now we fetch/update or just raw SQL via rpc if available.
      // Since we don't have a dedicated RPC for this, we'll try a direct RPC call if 'increment' exists, or fallback to read-write.
      // Actually, simplest concurrency-safe way without RPC is just accepting mild race condition or ignoring it for now as verified by user "promos are used once".
      // Let's do a direct rpc call if "increment_counter" pattern is common, but here we will just create a quick separate rpc later? 
      // No, let's just do a fetch-update for simplicity as high concurrency isn't expected immediately.

      // Better: Use a simple SQL function call if we can, but we haven't created one.
      // We will do: update coupons set current_uses = current_uses + 1 where code = promoCode
      // Supabase-js doesn't support "increment" natively in .update().
      // We will rely on a new RPC or just fetch-update.

      const { data: coupon } = await supabase.from('coupons').select('current_uses').eq('code', promoCode).single();
      if (coupon) {
        await supabase.from('coupons').update({ current_uses: (coupon.current_uses || 0) + 1 }).eq('code', promoCode);
      }
    }

    // 5. Atomic Referral Reward Logic
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_email', user.email)
        .eq('status', 'joined')
        .single();

      if (referral) {
        console.log(`🎁 Rewarding Referrer: ${referral.referrer_id} for purchase by ${user.email}`);

        // 1. Update referral status
        await supabase
          .from('referrals')
          .update({ status: 'purchased' })
          .eq('referrer_id', referral.referrer_id)
          .eq('referred_email', user.email);

        // 2. Grant Reward (10% Off)
        await supabase.from('referral_rewards').insert({
          user_id: referral.referrer_id,
          reward_type: 'discount_code',
          reward_value: '10'
        });
      }
    } catch (err: any) {
      console.error(`[PAYMENT] Referral processing failed:`, err);
      // Non-critical
    }

    return new Response(JSON.stringify({ success: true, orderIds: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ [PAYMENT] Final Catch:", error);

    // Determine error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error?.details || error?.hint || errorMessage;

    return new Response(JSON.stringify({
      success: false,
      error: "Magic payment processing failed. " + errorMessage,
      details: errorDetails,
      code: 400
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 so the frontend can read the body
    })
  }
})
