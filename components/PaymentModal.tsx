import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
// Force fast refresh
import { ArrowLeftIcon, BookIcon, RocketIcon, XIcon, StarIcon } from './Icons';
import { PRICING, ShippingDetails, paymentService, PromoCode } from '../services/paymentService';
import { UserProfile, CartItem } from '../types';
import { supabase } from '../utils/supabaseClient';
import { supabaseService } from '../services/supabaseService';
import { SUPPORTED_COUNTRIES, US_STATES, CA_PROVINCES } from '../utils/countries';

interface PaymentModalProps {
    storyTitle?: string;
    storyId?: string;
    pageCount?: number;
    cartTotal?: number;
    cartItems?: CartItem[];
    userProfile: UserProfile | null;
    onClose: () => void;
    onSuccess: (type: 'digital' | 'print' | 'cart', orderId: string) => void;
    onSubscribeClick: () => void;
    initialTab?: 'DIGITAL' | 'PRINT';
}

type PaymentTab = 'DIGITAL' | 'PRINT';

export const PaymentModal: React.FC<PaymentModalProps> = ({
    storyTitle,
    storyId,
    cartTotal,
    cartItems,
    userProfile,
    onClose,
    onSuccess,
    initialTab = 'DIGITAL'
}) => {
    // If storyId is present, we are in "Direct Checkout" mode for that book.
    // We only use Cart Mode if no specific story is targeted.
    const isCartMode = !storyId && !!cartItems && cartItems.length > 0;

    // State for UI interactions
    const [activeTab, setActiveTab] = useState<PaymentTab>(initialTab);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);

    const [showSuccess, setShowSuccess] = useState(false);
    const [purchaseType, setPurchaseType] = useState<'digital' | 'print' | 'cart'>('digital');
    const [successOrderId, setSuccessOrderId] = useState('');

    const [shipping, setShipping] = useState<ShippingDetails>({
        name: '', address: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '', level: 'MAIL'
    });

    // Growth System State
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [useCredits, setUseCredits] = useState(true); // Auto-apply credits if available by default
    const [referralRewards, setReferralRewards] = useState<any[]>([]);
    const [hasLoadedPendingPromo, setHasLoadedPendingPromo] = useState(false);

    // Load extra discounts
    React.useEffect(() => {
        if (userProfile?.id && !hasLoadedPendingPromo) {
            (async () => {
                // 1. Pending Promo from URL
                const pending = localStorage.getItem('childtale_pending_promo');
                if (pending) {
                    setPromoInput(pending);
                    const promo = await paymentService.validatePromoCode(pending, userProfile.id);
                    if (promo) setAppliedPromo(promo);
                }

                // 2. Automated Referral Rewards (10% Off Each - Stacking)
                const rewards = await supabaseService.getPendingRewards(userProfile.id);
                if (rewards && rewards.length > 0) {
                    setReferralRewards(rewards); // Apply all available rewards
                }

                setHasLoadedPendingPromo(true);
            })();
        }
    }, [userProfile?.id, hasLoadedPendingPromo]);

    const handleShippingChange = (field: keyof ShippingDetails, value: string) => {
        setShipping(prev => ({ ...prev, [field]: value }));
        // Reset calculated shipping if address changes
        if (calculatedShippingCost !== null) {
            setCalculatedShippingCost(null);
        }
    };

    const handleCalculateShipping = async () => {
        if (!shipping.address || !shipping.city || !shipping.zip) {
            setErrorMessage("Please fill in your address to calculate shipping.");
            return;
        }
        setIsCalculatingShipping(true);
        setErrorMessage(null);
        try {
            // Import dynamically to avoid circular dependencies if any, though here it's fine
            const { luluService } = await import('../services/luluService');
            // Estimate quantity based on cart or single item
            const quantity = isCartMode ? cartItems!.filter(i => i.type === 'HARDCOVER' || i.type === 'BUNDLE').length : 1;

            const rate = await luluService.getShippingRate(shipping, quantity);
            setCalculatedShippingCost(rate);
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not calculate shipping. Please check your address.");
        } finally {
            setIsCalculatingShipping(false);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoInput) return;
        setIsValidatingPromo(true);
        setErrorMessage(null);
        try {
            const promo = await paymentService.validatePromoCode(promoInput, userProfile?.id);
            if (promo) {
                setAppliedPromo(promo);
            } else {
                setErrorMessage("Invalid or expired promo code.");
                setAppliedPromo(null);
            }
        } catch (err) {
            setErrorMessage("Error validating code.");
        } finally {
            setIsValidatingPromo(false);
        }
    };

    // Derived Values & Anti-Bleed Logic
    const digitalPrice = PRICING.DIGITAL_SINGLE;
    const hardcoverPrice = PRICING.HARDCOVER;

    // Convert single item to temp list for calc logic reuse
    const effectiveItems: CartItem[] = isCartMode ? cartItems! : [{
        id: 'single',
        bookId: storyId || '',
        title: storyTitle || 'Story',
        type: activeTab === 'DIGITAL' ? 'DIGITAL' : 'HARDCOVER',
        price: activeTab === 'DIGITAL' ? digitalPrice : hardcoverPrice
    } as CartItem];

    const {
        subtotal,
        selectedDiscount,
        discountType,
        total: totalAmount,
        requiresShipping,
        referralRewardAmount,
        referralRewardPercentage
    } = paymentService.calculateOrderTotal(
        effectiveItems,
        appliedPromo,
        useCredits ? (userProfile?.storeCreditBalance || 0) : 0,
        referralRewards
    );

    // Shipping cost logic - Hybrid Model:
    // US: Free standard, +$8 expedited, +$20 express (built into price)
    // International: Lulu calculated rate
    const isUSShipping = shipping.country === 'US';
    let shippingUpgradeCost = 0;

    if (isUSShipping && requiresShipping) {
        // Standard (MAIL) = $0 upgrade (free)
    }

    const finalShippingCost = requiresShipping
        ? (isUSShipping ? shippingUpgradeCost : (calculatedShippingCost || 0))
        : 0;

    const finalTotalWithShipping = totalAmount + finalShippingCost;

    // For US: Ready to pay immediately. For international: Need Lulu rate first.
    const isReadyToPay = !requiresShipping || (isUSShipping || calculatedShippingCost !== null);


    const initialOptions = {
        "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        "currency": "USD",
        "intent": "capture"
    };

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4">
                <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-12 text-center relative overflow-hidden group">
                    {/* Magical Flourishes */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -translate-x-12 -translate-y-12 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-50 rounded-full translate-x-12 translate-y-12 animate-pulse delay-700"></div>

                    <div className="relative z-10 space-y-8">
                        <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto animate-bounce-soft shadow-xl shadow-green-100/50">
                            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 leading-tight">Payment Received!</h2>
                            <p className="text-slate-500 font-bold text-lg">
                                {purchaseType === 'print' || (purchaseType === 'cart' && requiresShipping)
                                    ? "ChildTale is stitching your hardcover masterpiece right now. We'll notify you when it ships!"
                                    : "Magic is unfolding! Your digital story is now fully unlocked and ready in your library."}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 grid gap-4">
                            <button
                                onClick={() => onSuccess(purchaseType, successOrderId)}
                                className="bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {purchaseType === 'digital' && storyId ? "Enter Magical World" : "Back to Library"}
                                <RocketIcon className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Order ID: {successOrderId}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            Secure Checkout
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">PayPal Secured</span>
                        </h3>
                        <p className="text-sm text-slate-500">{isCartMode ? 'Cart Checkout' : `Purchasing ${storyTitle || 'Story'}`}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Close">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Tabs - Only show if NOT in Cart Mode */}
                {!isCartMode && (
                    <div className="flex border-b border-slate-100 shrink-0">
                        <button
                            onClick={() => setActiveTab('DIGITAL')}
                            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2
                        ${activeTab === 'DIGITAL' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}
                    `}
                        >
                            <RocketIcon className="w-4 h-4" /> Digital (${digitalPrice})
                        </button>
                        <button
                            onClick={() => setActiveTab('PRINT')}
                            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'PRINT' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-orange-50'}`}
                        >
                            <BookIcon className="w-4 h-4" /> Hardcover (${PRICING.HARDCOVER})
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto">
                    {/* Cart Summary */}
                    {isCartMode && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">Order Summary</h4>
                            <ul className="text-sm text-slate-600 space-y-1 mb-3">
                                {cartItems!.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.title} ({item.type === 'HARDCOVER' ? 'Print' : 'Digital'})</span>
                                        <span>${item.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            {requiresShipping && (
                                <div className="flex justify-between text-sm text-slate-600 mb-2 border-t border-slate-200 pt-2">
                                    <span>Shipping</span>
                                    <span>{calculatedShippingCost !== null ? `$${calculatedShippingCost.toFixed(2)}` : 'Calculated below'}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* GROWTH SYSTEM: Promo Code & Credits */}
                    <div className="mb-6 space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Promo Code (e.g. HERO25)"
                                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white uppercase text-sm font-bold tracking-wider"
                                    value={promoInput}
                                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                                />
                                {appliedPromo && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-[10px] font-black uppercase">Active ✓</span>
                                )}
                            </div>
                            <button
                                onClick={handleApplyPromo}
                                disabled={isValidatingPromo || !promoInput}
                                className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                            >
                                {isValidatingPromo ? '...' : 'Apply'}
                            </button>
                        </div>

                        {userProfile && userProfile.storeCreditBalance > 0 && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">$</div>
                                    <div className="text-xs">
                                        <p className="font-bold text-green-800">Use Referral Credits</p>
                                        <p className="text-green-600">Balance: ${userProfile.storeCreditBalance.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUseCredits(!useCredits)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${useCredits ? 'bg-green-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useCredits ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        )}
                    </div>


                    {/* Content Logic */}
                    {((!isCartMode && activeTab === 'DIGITAL') || (isCartMode && !requiresShipping)) ? (
                        <div className="space-y-6">
                            {!isCartMode && (
                                <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="bg-indigo-100 p-3 rounded-lg"><RocketIcon className="w-8 h-8 text-indigo-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">25-Page Digital Story</h4>
                                        <div className="mt-2 flex gap-2">
                                            <span className="text-xs font-bold bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-100">No Watermarks</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Shipping Form */
                        <div className="space-y-6 mb-6">
                            {!isCartMode && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <div className="bg-orange-100 p-3 rounded-lg"><BookIcon className="w-8 h-8 text-orange-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Premium Hardcover</h4>
                                            <p className="text-sm text-slate-600 mt-1">8.5x11" Hardcover, glossy finish.</p>
                                            <div className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-200">
                                                <StarIcon className="w-3 h-3" />
                                                Includes FREE Digital PDF & Studio Access
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    Shipping Address
                                </h4>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                        value={shipping.name}
                                        onChange={(e) => handleShippingChange('name', e.target.value)}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Required for Shipping)"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                        value={shipping.phone || ''}
                                        onChange={(e) => handleShippingChange('phone', e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                        value={shipping.email || ''}
                                        onChange={(e) => handleShippingChange('email', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Street Address"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                        value={shipping.address}
                                        onChange={(e) => handleShippingChange('address', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                            value={shipping.city}
                                            onChange={(e) => handleShippingChange('city', e.target.value)}
                                        />
                                        {shipping.country === 'US' ? (
                                            <select
                                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white appearance-none"
                                                value={shipping.state}
                                                onChange={(e) => handleShippingChange('state', e.target.value)}
                                            >
                                                <option value="">Select State</option>
                                                {US_STATES.map(s => (
                                                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                                ))}
                                            </select>
                                        ) : shipping.country === 'CA' ? (
                                            <select
                                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white appearance-none"
                                                value={shipping.state}
                                                onChange={(e) => handleShippingChange('state', e.target.value)}
                                            >
                                                <option value="">Select Province</option>
                                                {CA_PROVINCES.map(p => (
                                                    <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="State / Province"
                                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                                value={shipping.state || ''}
                                                onChange={(e) => handleShippingChange('state', e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Zip / Postal Code"
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 bg-white"
                                        value={shipping.zip}
                                        onChange={(e) => handleShippingChange('zip', e.target.value)}
                                    />
                                    <select
                                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                                        value={shipping.country}
                                        onChange={(e) => handleShippingChange('country', e.target.value)}
                                    >
                                        {SUPPORTED_COUNTRIES.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Shipping Speed Selection - US Only */}
                                {shipping.country === 'US' && (
                                    <div className="mt-4 space-y-3">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                            <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                            Shipping Speed
                                        </h4>
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => setShipping(prev => ({ ...prev, level: 'MAIL' }))}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${shipping.level === 'MAIL' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-slate-900">📦 Standard Shipping</span>
                                                        <p className="text-xs text-slate-500 mt-1">Reliable delivery with tracking</p>
                                                    </div>
                                                    <span className="text-green-600 font-black">FREE</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* International Shipping - Calculated via Lulu */}
                                {shipping.country !== 'US' && (
                                    <div className="mt-4">
                                        <button
                                            onClick={handleCalculateShipping}
                                            disabled={isCalculatingShipping || !shipping.address || !shipping.city || !shipping.zip}
                                            className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${calculatedShippingCost !== null ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed'}`}
                                        >
                                            {isCalculatingShipping ? (
                                                <span className="animate-pulse">Calculating International Shipping...</span>
                                            ) : (
                                                calculatedShippingCost !== null ? `Shipping: $${calculatedShippingCost.toFixed(2)} ✓` : 'Calculate Shipping to Your Country'
                                            )}
                                        </button>
                                        <p className="text-xs text-slate-400 text-center mt-2">International shipping typically $12-25</p>
                                    </div>
                                )}
                            </div>

                            {/* Breakdown for Pricing */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Item Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {selectedDiscount > 0 && discountType === 'PROMO' && (
                                    <div className="flex justify-between text-green-600 font-bold">
                                        <span>Promo Discount</span>
                                        <span>-${selectedDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedDiscount > 0 && discountType === 'BULK' && (
                                    <div className="flex justify-between text-indigo-600 font-bold">
                                        <span>Bulk Discount</span>
                                        <span>-${selectedDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {referralRewardAmount > 0 && (
                                    <div className="flex justify-between text-pink-600 font-bold">
                                        <span>Referral Reward ({referralRewardPercentage}% Off)</span>
                                        <span>-${referralRewardAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>
                                        {!requiresShipping ? 'Shipping' : (
                                            isUSShipping
                                                ? (shipping.level === 'MAIL' ? 'Shipping (Free Standard)' :
                                                    shipping.level === 'PRIORITY_MAIL' ? 'Shipping (Expedited)' : 'Shipping (Express)')
                                                : 'International Shipping'
                                        )}
                                    </span>
                                    <span className={finalShippingCost === 0 && requiresShipping ? 'text-green-600 font-bold' : ''}>
                                        {!requiresShipping ? 'N/A' : (finalShippingCost === 0 ? 'FREE' : `$${finalShippingCost.toFixed(2)}`)}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold text-slate-900">
                                    <span>Total</span>
                                    <span>${finalTotalWithShipping.toFixed(2)}</span>
                                </div>
                            </div>

                        </div>
                    )}

                    {errorMessage && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 animate-pulse">
                            {errorMessage}
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6 mt-4 px-2">
                        <span className="text-slate-500 font-bold">Total due</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">${finalTotalWithShipping.toFixed(2)}</span>
                    </div>

                    {/* Admin Bypass Shortcut */}
                    {userProfile?.isAdmin && (
                        <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 border-dashed animate-pulse-soft">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-black text-purple-900 text-sm uppercase tracking-widest">Admin Magic Tool</h4>
                                    <p className="text-xs text-purple-600 font-bold">You can bypass payment and unlock this instantly.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        setErrorMessage(null);
                                        try {
                                            let result: { success: boolean; error?: string } = { success: false };
                                            let successType: 'digital' | 'print' | 'cart' = 'digital';

                                            if (isCartMode) {
                                                successType = 'cart';
                                                result = await paymentService.processCartCheckout(cartItems!, requiresShipping ? shipping : null, 'ADMIN_BYPASS');
                                            }
                                            else if (activeTab === 'PRINT') {
                                                successType = 'print';
                                                if (!storyId) throw new Error("Missing Story ID");
                                                result = await paymentService.orderHardcover(storyId, shipping, 'ADMIN_BYPASS');
                                            }
                                            else {
                                                successType = 'digital';
                                                if (!storyId) throw new Error("Missing Story ID");
                                                result = await paymentService.processDigitalPayment(storyId, 'ADMIN_BYPASS');
                                            }

                                            if (result.success) {
                                                setPurchaseType(successType);
                                                setSuccessOrderId('ADMIN_MAGIC_' + Date.now());
                                                setShowSuccess(true);
                                            } else {
                                                throw new Error(result.error);
                                            }
                                        } catch (err: any) {
                                            setErrorMessage(err.message || "Admin bypass failed");
                                        }
                                    }}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95"
                                >
                                    ✨ Magical Unlock
                                </button>
                            </div>
                        </div>
                    )}

                    {isReadyToPay ? (
                        <div className="mt-2 relative z-0 animate-fade-in">
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{ layout: "vertical", shape: "pill" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            intent: "CAPTURE",
                                            purchase_units: [
                                                {
                                                    description: isCartMode ? "ChildTale Cart" : `ChildTale: ${storyTitle}`,
                                                    amount: {
                                                        currency_code: "USD",
                                                        value: finalTotalWithShipping.toFixed(2)
                                                    },
                                                    shipping: requiresShipping ? {
                                                        name: { full_name: shipping.name },
                                                        address: {
                                                            address_line_1: shipping.address,
                                                            admin_area_2: shipping.city,
                                                            admin_area_1: shipping.state,
                                                            postal_code: shipping.zip,
                                                            country_code: shipping.country as any
                                                        }
                                                    } : undefined,
                                                }
                                            ],
                                            application_context: {
                                                shipping_preference: requiresShipping ? "SET_PROVIDED_ADDRESS" : "NO_SHIPPING"
                                            }
                                        });
                                    }}
                                    onApprove={async (data, actions) => {
                                        try {
                                            const details = await actions.order!.capture();
                                            const paypalOrderId = details.id;

                                            // Determine transaction type and PROCESS VIA BACKEND SERVICE
                                            let result: { success: boolean; error?: string } = { success: false };
                                            let successType: 'digital' | 'print' | 'cart' = 'digital';

                                            if (isCartMode) {
                                                successType = 'cart';
                                                console.log("Processing cart checkout with", cartItems?.length, "items");
                                                result = await paymentService.processCartCheckout(cartItems!, requiresShipping ? shipping : null, paypalOrderId, appliedPromo?.code);
                                            }
                                            else if (activeTab === 'PRINT') {
                                                successType = 'print';
                                                if (!storyId) {
                                                    console.error("Missing storyId for hardcover purchase. isCartMode:", isCartMode, "activeTab:", activeTab);
                                                    throw new Error("Missing Story ID for hardcover purchase. Please select a story first.");
                                                }
                                                result = await paymentService.orderHardcover(storyId, shipping, paypalOrderId, appliedPromo?.code);
                                            }
                                            else {
                                                // Digital Single
                                                successType = 'digital';
                                                if (!storyId) {
                                                    console.error("Missing storyId for digital purchase. isCartMode:", isCartMode, "activeTab:", activeTab);
                                                    throw new Error("Missing Story ID for digital purchase. Please select a story first.");
                                                }
                                                result = await paymentService.processDigitalPayment(storyId, paypalOrderId, appliedPromo?.code);
                                            }

                                            if (result.success) {
                                                console.log("✅ Payment & Order verified by service.");

                                                // Redeem referral rewards if used
                                                if (referralRewards.length > 0) {
                                                    await Promise.all(referralRewards.map(rw => supabaseService.redeemReward(rw.id)));
                                                }

                                                setPurchaseType(successType);
                                                setSuccessOrderId(paypalOrderId);
                                                setShowSuccess(true); // TRIGGER SUCCESS VIEW
                                                // Success will be confirmed by user on SuccessView
                                            } else {
                                                throw new Error(result.error || "Payment verification failed");
                                            }

                                        } catch (error: any) {
                                            console.error("Capture Error", error);
                                            setErrorMessage(error.message || "Payment processing failed. Please contact support.");
                                        }
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal Error", err);
                                        setErrorMessage("An unexpected error occurred with PayPal.");
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-slate-50 text-slate-400 text-center rounded-xl border border-slate-100 text-sm">
                            Complete the shipping details above to proceed to payment.
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
};