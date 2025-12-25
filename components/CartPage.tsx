
import React from 'react';
import { CartItem } from '../types';
import { PRICING, paymentService } from '../services/paymentService';
import { XIcon, RocketIcon, BookIcon, ArrowLeftIcon, ShoppingCartIcon } from './Icons';

interface CartPageProps {
   items: CartItem[];
   onRemoveItem: (id: string) => void;
   onUpdateItemType: (id: string, type: 'DIGITAL' | 'HARDCOVER') => void;
   onCheckout: () => void;
   onBack: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ items, onRemoveItem, onUpdateItemType, onCheckout, onBack }) => {
   // Use the anti-bleed discount calculator for accurate pricing
   const { subtotal, selectedDiscount, discountType, shippingTotal, total } = paymentService.calculateOrderTotal(items, null, 0, []);
   const hasPhysicalItems = items.some(item => item.type === 'HARDCOVER' || item.type === 'BUNDLE');
   const shippingCost = hasPhysicalItems ? PRICING.SHIPPING_FLAT_RATE : 0;

   return (
      <div className="max-w-4xl mx-auto animate-fade-in">
         <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
               <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
            </button>
            <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>
         </div>

         {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCartIcon className="w-10 h-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-700 mb-2">Your cart is empty</h3>
               <p className="text-slate-500 mb-8">Go create some magic to fill your cart.</p>
               <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">
                  Start Creating
               </button>
            </div>
         ) : (
            <div className="flex flex-col lg:flex-row gap-8">
               {/* Items List */}
               <div className="flex-1 space-y-4">
                  {items.map((item) => (
                     <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                           {item.coverUrl ? (
                              <img src={item.coverUrl} className="w-full h-full object-cover" alt={item.title} />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                 <BookIcon className="w-8 h-8 text-slate-300" />
                              </div>
                           )}
                        </div>
                        <div className="flex-grow">
                           <h3 className="font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                           <div className="flex items-center gap-2 mt-2">
                              <button
                                 onClick={() => onUpdateItemType(item.id, 'DIGITAL')}
                                 className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 border ${item.type === 'DIGITAL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}`}
                              >
                                 <RocketIcon className="w-3 h-3" /> PDF Story
                              </button>
                              <button
                                 onClick={() => onUpdateItemType(item.id, 'HARDCOVER')}
                                 className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 border ${item.type === 'HARDCOVER' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-orange-200'}`}
                              >
                                 <BookIcon className="w-3 h-3" /> Hardcover
                              </button>
                           </div>
                        </div>

                        <div className="text-right">
                           <div className="font-bold text-slate-900">${item.price.toFixed(2)}</div>
                           <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-bold mt-2"
                           >
                              Remove
                           </button>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Summary Sidebar */}
               <div className="w-full lg:w-80 h-fit">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-24">
                     <h3 className="font-bold text-slate-900 mb-4 text-lg">Order Summary</h3>

                     <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-500 text-sm">
                           <span>Subtotal ({items.length} items)</span>
                           <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {selectedDiscount > 0 && (
                           <div className="flex justify-between text-green-600 text-sm font-bold">
                              <span>{discountType === 'BULK' ? (items.length >= 3 ? '20% Bulk Discount' : '15% Bulk Discount') : 'Promo Applied'}</span>
                              <span>-${selectedDiscount.toFixed(2)}</span>
                           </div>
                        )}
                        <div className="flex justify-between text-slate-500 text-sm">
                           <span>Shipping (US Standard)</span>
                           <span className="text-green-600 font-bold">FREE</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">⚡ Expedited & 🚀 Express options at checkout</p>
                        <div className="w-full h-px bg-slate-100 my-2"></div>
                        <div className="flex justify-between text-slate-900 font-black text-xl">
                           <span>Total</span>
                           <span>${total.toFixed(2)}</span>
                        </div>
                     </div>

                     <button
                        onClick={onCheckout}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                     >
                        Checkout Now
                     </button>
                     <p className="text-xs text-slate-400 text-center mt-4">
                        Secure checkout powered by PayPal
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
