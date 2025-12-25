
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { PRICING } from '../services/paymentService';

interface DownloadOptionsModalProps {
  bookId: string;
  onClose: () => void;
  onDownloadPdf: () => void;
  onOrderHardcover: () => void;
}

export const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  bookId,
  onClose,
  onDownloadPdf,
  onOrderHardcover
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hardcoverPrice, setHardcoverPrice] = useState(PRICING.HARDCOVER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, we'd fetch dynamic pricing or discounts here
  }, []);

  const handleContinue = () => {
    if (!selectedOption) return;

    if (selectedOption === 'pdf') {
      onDownloadPdf();
      onClose();
    } else if (selectedOption === 'hardcover' || selectedOption === 'both') {
      onOrderHardcover();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Format</h2>

        <div className="space-y-4 mb-8">
          <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOption === 'pdf' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="download-option"
                value="pdf"
                checked={selectedOption === 'pdf'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-5 h-5 text-indigo-600 focus:ring-indigo-50"
              />
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-900">📄 Digital PDF</h3>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Included</span>
                </div>
                <ul className="text-sm text-slate-500 list-disc list-inside">
                  <li>Instant download</li>
                  <li>Combined PDF (Cover + Story)</li>
                  <li>25 pages, high-resolution</li>
                </ul>
              </div>
            </div>
          </label>

          <div className="opacity-50 grayscale cursor-not-allowed">
            <label className="block p-4 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-400">📖 Hardcover Book</h3>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Perfecting the print experience. Join the waitlist!</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
