import type { Character } from '../../../data/characters';
import { formatAgeTag } from '../../../data/characters';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterVoiceCardProps {
  character: Character;
  isPlaying: boolean;
  isLoading: boolean;
  isDimmed: boolean;
  level: number;
  onPlay: () => void;
}

export function CharacterVoiceCard({
  character,
  isPlaying,
  isLoading,
  isDimmed,
  level,
  onPlay,
}: CharacterVoiceCardProps) {
  const cardBackground = isPlaying ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
  const cardBorder = isPlaying ? 'rgba(0, 0, 0, 0.08)' : 'transparent';
  const cardShadow = isPlaying
    ? '0 14px 30px rgba(241, 239, 233, 1)'
    : '0 0 0 rgba(15, 23, 42, 0)';
  const cardScale = isPlaying ? 1.01 : 1;
  const buttonScale = isPlaying ? 'scale(0.95)' : 'scale(1)';

  return (
    <div
      className='smooth-card-corners flex w-full flex-col gap-5 border border-transparent px-4 py-5 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between'
      style={{
        backgroundColor: cardBackground,
        borderColor: cardBorder,
        boxShadow: cardShadow,
        opacity: isDimmed ? 0.42 : 1,
        transform: `scale(${cardScale})`,
      }}
    >
      <div className='flex w-full items-start gap-4 pr-0 sm:items-center sm:gap-[28px] sm:pr-3'>
        <CharacterAvatar
          avatar={character.avatar}
          name={character.name}
          isPlaying={isPlaying}
          level={level}
        />

        <div className='flex max-w-[420px] flex-1 flex-col items-start gap-[10px]'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <p className='text-[20px] leading-[20px] font-bold text-black'>
              {character.name}
            </p>
            <span className='rounded-full bg-[#f3efe9] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a8074]'>
              {formatAgeTag(character.age_tag)}
            </span>
            <span className='text-[12px] font-medium tracking-[-0.24px] text-[#b5b8bf]'>
              {character.voice_id}
            </span>
          </div>

          <p className='text-[13px] leading-[20px] font-medium text-[#b5b8bf]'>
            {character.voice_direction.archetype}
          </p>

          <div className='flex flex-wrap gap-2 text-[11px] font-medium tracking-[-0.22px] text-[#8e918f]'>
            <span className='rounded-full bg-[#f6f4f1] px-3 py-1'>
              {character.voice_direction.tone}
            </span>
            <span className='rounded-full bg-[#f6f4f1] px-3 py-1'>
              {character.voice_direction.authority}
            </span>
            <span className='rounded-full bg-[#f6f4f1] px-3 py-1'>
              {character.voice_direction.pacing}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onPlay}
        className='flex size-[60px] shrink-0 cursor-pointer items-center justify-center self-end rounded-full bg-black transition-all hover:scale-105 hover:opacity-90 sm:self-auto'
        style={{
          transform: buttonScale,
        }}
        aria-label={
          isLoading
            ? `Loading ${character.name}`
            : isPlaying
              ? `Pause ${character.name}`
              : `Play ${character.name}`
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
    <div className='flex size-[26.78px] items-center justify-center gap-1'>
      <div className='h-[16px] w-[6px] rounded-sm bg-white'></div>
      <div className='h-[16px] w-[6px] rounded-sm bg-white'></div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className='size-[22px] animate-spin rounded-full border-2 border-white/25 border-t-white' />
  );
}
