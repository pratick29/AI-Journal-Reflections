import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, X } from 'lucide-react';

interface VaultLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  onSetPin: (newPin: string) => void;
  savedPin: string | null;
}

export const VaultLockModal: React.FC<VaultLockModalProps> = ({
  isLocked,
  onUnlock,
  onSetPin,
  savedPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSettingMode, setIsSettingMode] = useState(!savedPin);

  if (!isLocked) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    if (isSettingMode || !savedPin) {
      onSetPin(pinInput);
      setIsSettingMode(false);
      onUnlock();
      setPinInput('');
    } else {
      if (pinInput === savedPin) {
        onUnlock();
        setPinInput('');
      } else {
        setErrorMsg('Incorrect PIN passcode. Please try again.');
        setPinInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/90 backdrop-blur-md p-4">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-md w-full p-8 shadow-2xl space-y-6 rounded-xs text-center">
        <div className="w-12 h-12 bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center rounded-full mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] font-bold text-[#C4432B]">
            Journal Privacy Vault
          </span>
          <h2 className="text-2xl font-serif font-light text-[#2B2A28]">
            {isSettingMode ? 'Set Vault Passcode' : 'Vault Locked'}
          </h2>
          <p className="text-xs text-[#595652] font-serif max-w-xs mx-auto">
            {isSettingMode
              ? 'Choose a 4-digit PIN to secure your private reflections.'
              : 'Enter your 4-digit PIN to unlock your journal.'}
          </p>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto">
          <div>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-3 bg-[#F7F4EE] border border-[#E2DDD5] focus:border-[#C4432B] focus:outline-none text-[#2B2A28]"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-[#C4432B] font-sans flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all rounded-xs flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>{isSettingMode ? 'Save PIN & Unlock' : 'Unlock Journal'}</span>
          </button>
        </form>

        {savedPin && !isSettingMode && (
          <button
            onClick={() => {
              setIsSettingMode(true);
              setPinInput('');
              setErrorMsg('');
            }}
            className="text-[10px] font-sans uppercase tracking-widest text-[#8A8478] hover:text-[#C4432B] underline"
          >
            Reset Passcode
          </button>
        )}
      </div>
    </div>
  );
};
