import type { Language, Voice } from '../../data/voices';
import { VoiceAvatar } from './VoiceAvatar';

interface VoiceCardProps {
  voice: Voice;
  language: Language;
  isPlaying: boolean;
  isLoading: boolean;
  isDimmed: boolean;
  level: number;
  onPlay: () => void;
}

export function VoiceCard({
  voice,
  language,
  isPlaying,
  isLoading,
  isDimmed,
  level,
  onPlay,
}: VoiceCardProps) {
  const cardBackground = isPlaying ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
  const cardBorder = isPlaying ? 'rgba(0, 0, 0, 0.08)' : 'transparent';
  const cardShadow = isPlaying
    ? '0 14px 30px rgba(241, 239, 233, 1)'
    : '0 0 0 rgba(15, 23, 42, 0)';
  const cardScale = isPlaying ? 1.01 : 1;
  const buttonScale = isPlaying ? 'scale(0.95)' : 'scale(1)';

  return (
    <div
      className='smooth-card-corners flex w-full items-center justify-between border border-transparent px-4 py-5 transition-all duration-200'
      style={{
        backgroundColor: cardBackground,
        borderColor: cardBorder,
        boxShadow: cardShadow,
        opacity: isDimmed ? 0.42 : 1,
        transform: `scale(${cardScale})`,
      }}
    >
      <div className='flex gap-[28px] pr-3 items-center'>
        <VoiceAvatar voice={voice} isPlaying={isPlaying} level={level} />
        <div className='flex max-w-[240px] flex-col items-start gap-[6px]'>
          <p className='text-[20px] leading-[20px] font-bold text-black'>
            {voice.name}
          </p>
          <p
            className='text-[13px] leading-[20px] font-medium text-[#b5b8bf]'
            lang={language}
          >
            {voice.description[language]}
          </p>
        </div>
      </div>
      <button
        onClick={onPlay}
        className='bg-black rounded-full size-[60px] flex items-center justify-center shrink-0 hover:opacity-90 hover:scale-105 transition-all cursor-pointer'
        style={{
          transform: buttonScale,
        }}
        aria-label={
          isLoading
            ? `Loading ${voice.name}`
            : isPlaying
              ? `Pause ${voice.name}`
              : `Play ${voice.name}`
        }
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden='true'
      className='ml-0.5 h-[40px] w-[40px] fill-white'
      viewBox='0 0 24 24'
    >
      <path d='M8 6.5v11l9-5.5-9-5.5Z' />
    </svg>
  );
}

function PauseIcon() {
  return (
    <div className='size-[26.78px] flex items-center justify-center gap-1'>
      <div className='w-[6px] h-[16px] bg-white rounded-sm'></div>
      <div className='w-[6px] h-[16px] bg-white rounded-sm'></div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className='size-[22px] animate-spin rounded-full border-2 border-white/25 border-t-white' />
  );
}
