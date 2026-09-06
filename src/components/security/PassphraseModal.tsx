import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, X } from 'lucide-react';

interface PassphraseModalProps {
  isOpen: boolean;
  mode: 'setup' | 'unlock';
  title?: string;
  description?: string;
  onConfirm: (passphrase: string) => void | Promise<void>;
  onClose: () => void;
}

export const PassphraseModal: React.FC<PassphraseModalProps> = ({
  isOpen,
  mode,
  title,
  description,
  onConfirm,
  onClose,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = passphrase.trim();
    if (!trimmed) {
      setError('Please enter a passphrase.');
      return;
    }

    if (mode === 'setup') {
      if (trimmed.length < 6) {
        setError('Passphrase must be at least 6 characters for security.');
        return;
      }
      if (trimmed !== confirmPassphrase.trim()) {
        setError('Passphrases do not match.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onConfirm(trimmed);
      setPassphrase('');
      setConfirmPassphrase('');
    } catch (err: any) {
      setError(err?.message || 'Decryption failed. Please verify your passphrase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              {mode === 'setup' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
                {title || (mode === 'setup' ? 'Encrypt Reflection' : 'Unlock Sanctuary Entry')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {mode === 'setup' ? 'AES-GCM 256-bit Zero-Knowledge Security' : 'Enter your passphrase to read this entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {description && (
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {description}
            </p>
          )}

          {mode === 'setup' && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong>Important:</strong> Your passphrase is never stored on our servers. If forgotten, this reflection cannot be recovered by anyone.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {mode === 'setup' ? 'Set Sanctuary Passphrase' : 'Enter Passphrase'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 pr-10 transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'setup' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Confirm Passphrase
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter passphrase..."
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Processing...' : mode === 'setup' ? 'Protect Entry' : 'Unlock Reflection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
