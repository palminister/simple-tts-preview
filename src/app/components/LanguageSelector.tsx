'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../data/voices';

interface LanguageSelectorProps {
  value: Language;
  onChange: (value: Language) => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en' as const, name: 'English', flag: 'US' },
  { code: 'th' as const, name: 'Thai', flag: 'TH' },
] as const;

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage =
    LANGUAGE_OPTIONS.find((language) => language.code === value) ??
    LANGUAGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex cursor-pointer items-center gap-[6.507px] transition-opacity hover:opacity-80'
      >
        <FlagPill flag={selectedLanguage.flag} />
        <p className='whitespace-nowrap text-[14px] font-bold tracking-[-0.28px] text-black'>
          {selectedLanguage.name}
        </p>
        <span
          className='text-[10px] text-[#b5b8bf] transition-transform'
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className='absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 min-w-[140px]'>
          {LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onChange(language.code);
                setIsOpen(false);
              }}
              className='flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-[#fbfaf9] cursor-pointer'
            >
              <FlagPill flag={language.flag} small />
              <p className='text-[13px] font-bold text-black'>
                {language.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagPill({ flag, small = false }: { flag: string; small?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#f1efe9] font-bold text-black ${
        small ? 'h-6 w-8 text-[10px]' : 'h-[19.523px] w-[29.284px] text-[10px]'
      }`}
    >
      {flag}
    </div>
  );
}
