
import React from 'react';
import { UserProfile } from '../types';
import { LibraryIcon, PaletteIcon, PlusIcon, SparklesIcon, XIcon } from './Icons';
import { supabase } from '../utils/supabaseClient';

interface AccountDropdownProps {
  user: UserProfile;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onLibrary: () => void;
  onCreate: () => void;
  onStudio: () => void;
  onClose: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({ user, onLogout, onDeleteAccount, onLibrary, onCreate, onStudio, onClose }) => {
  return (
    <div className="absolute right-0 top-12 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-pop-in origin-top-right z-50">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Signed in as</p>
          <p className="text-white font-bold text-xs truncate opacity-80">{user.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Utility Menu */}
      <div className="p-2">
        <button
          onClick={onLibrary}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-sm group"
        >
          <LibraryIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          My Library
        </button>

        <button
          onClick={onCreate}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-sm group"
        >
          <PlusIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          Create New
        </button>

        <button
          onClick={onStudio}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-sm group"
        >
          <PaletteIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          Magical Studio
        </button>

        <div className="mx-2 mt-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 text-center">Refer & Reward</p>
          <p className="text-[9px] text-white/50 font-bold mb-3 text-center leading-tight">
            Give 10%, Get 10% off your next purchase after their first order.<br />
            <span className="text-indigo-400 opacity-60 italic">(Refer 10 and get a free purchase!)</span>
          </p>
          <button
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.id}`;
              navigator.clipboard.writeText(link);
              alert("Invitation link copied! Share it to earn a 10% discount on your next purchase once they complete their first order.");
            }}
            className="w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
          >
            Copy My Invite Link
          </button>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="p-2 border-t border-white/5 mt-1 bg-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold text-sm group"
        >
          <XIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          Sign Out
        </button>

        <button
          onClick={() => {
            if (window.confirm('⚠️ Delete Account?\n\nThis will permanently delete:\n• All your stories\n• All saved progress\n• Your account data\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?')) {
              onDeleteAccount();
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Account
        </button>
      </div>
    </div>
  );
};
