import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasscodeBarrierProps {
  onUnlock: () => void;
  onCancel: () => void;
}

const CORRECT_CODE = '0107';

export const PasscodeBarrier: React.FC<PasscodeBarrierProps> = ({ onUnlock, onCancel }) => {
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');

  // Handle digit input
  const handleDigit = (digit: string) => {
    if (status !== 'idle' || code.length >= 4) return;

    const nextCode = code + digit;
    setCode(nextCode);

    if (nextCode.length === 4) {
      if (nextCode === CORRECT_CODE) {
        setStatus('success');
        setTimeout(() => {
          onUnlock();
        }, 400);
      } else {
        setStatus('error');
        setTimeout(() => {
          setCode('');
          setStatus('idle');
        }, 650);
      }
    }
  };

  // Clear code
  const handleClear = () => {
    if (status !== 'idle') return;
    setCode('');
  };

  // Backspace
  const handleBackspace = () => {
    if (status !== 'idle') return;
    setCode((prev) => prev.slice(0, -1));
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, status]);

  const keypadButtons = [
    { label: '1', action: () => handleDigit('1') },
    { label: '2', action: () => handleDigit('2') },
    { label: '3', action: () => handleDigit('3') },
    { label: '4', action: () => handleDigit('4') },
    { label: '5', action: () => handleDigit('5') },
    { label: '6', action: () => handleDigit('6') },
    { label: '7', action: () => handleDigit('7') },
    { label: '8', action: () => handleDigit('8') },
    { label: '9', action: () => handleDigit('9') },
    { label: '*', action: handleClear, title: 'Limpar' },
    { label: '0', action: () => handleDigit('0') },
    { label: '⌫', action: handleBackspace, title: 'Apagar' },
  ];

  return (
    <div className="flex flex-col items-center justify-center my-auto py-2 w-full animate-fadeIn select-none">
      {/* Outer Pastel Card in Layout Pink Tones */}
      <div className="w-full max-w-[320px] bg-[#fff5f8] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-pink-300 shadow-[0_8px_25px_-5px_rgba(244,114,182,0.22)] flex flex-col gap-2 sm:gap-2.5">
        {/* Top Mini Header Bar */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 bg-white/95 text-[#f172b2] font-['Space_Mono',monospace] text-[0.7rem] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md shadow-xs border border-pink-200">
            <Lock className="w-3 h-3 text-[#f172b2]" />
            <span>234.</span>
          </div>
          <button
            onClick={onCancel}
            title="Voltar para a página inicial"
            className="bg-white/95 hover:bg-white text-pink-400 hover:text-[#f172b2] w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold shadow-xs border border-pink-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Box with Keypad */}
        <div className="bg-white/85 p-2.5 sm:p-3 rounded-xl border border-pink-200/90 shadow-xs flex flex-col">
          {/* Display / Passcode Status Box */}
          <div
            className={`bg-white rounded-lg border border-pink-200 shadow-xs py-2 px-3 text-center mb-2 sm:mb-2.5 min-h-[36px] sm:min-h-[40px] flex items-center justify-center transition-all ${
              status === 'error' ? 'animate-shake border-rose-300 bg-rose-50/60' : ''
            } ${status === 'success' ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
          >
            {status === 'error' ? (
              <span className="text-rose-400 font-bold text-xs">senha incorreta ♡</span>
            ) : status === 'success' ? (
              <span className="text-emerald-500 font-bold text-xs">desbloqueado! ✨</span>
            ) : code.length === 0 ? (
              <span className="text-pink-300 font-['Space_Mono',monospace] font-bold text-xs tracking-wider">
                Enter Passcode
              </span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                      idx < code.length
                        ? 'bg-[#f172b2] scale-110 shadow-xs'
                        : 'border border-pink-200 bg-pink-50/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {keypadButtons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                title={btn.title}
                className="py-2 sm:py-2.5 rounded-lg bg-white hover:bg-[#fff0f5] border-[1.5px] border-pink-200 text-[#f172b2] font-['Space_Mono',monospace] text-sm sm:text-base font-bold shadow-xs hover:text-[#e45ea1] active:translate-y-0.5 transition-all text-center flex items-center justify-center cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
