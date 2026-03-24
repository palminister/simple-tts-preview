import type { Voice } from '../../data/voices';

export const AVATAR_MOTION_CONFIG = {
  // levelSensitivity: 4,
  // verticalStrength: 8,
  // verticalDriftStrength: 1,
  // horizontalStrength: 0.7,
  // rotationStrength: 1.1,
  // phaseSpeed: 150,
  // horizontalPhaseMultiplier: 0.8,
  // rotationPhaseMultiplier: 0.65,
  // transitionMs: 1,
  levelSensitivity: 2,
  verticalStrength: 15,
  verticalDriftStrength: 1,
  horizontalStrength: 1,
  rotationStrength: 0.6,
  phaseSpeed: 40,
  horizontalPhaseMultiplier: 0,
  rotationPhaseMultiplier: 1,
  transitionMs: 1,
} as const;

interface VoiceAvatarProps {
  voice: Voice;
  isPlaying: boolean;
  level: number;
}

export function VoiceAvatar({ voice, isPlaying, level }: VoiceAvatarProps) {
  const now = typeof performance === 'undefined' ? 0 : performance.now();
  const seed = voice.name
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const motionLevel = Math.min(
    1,
    level * AVATAR_MOTION_CONFIG.levelSensitivity,
  );
  const nudgePhase = now / AVATAR_MOTION_CONFIG.phaseSpeed + seed;
  const translateY = isPlaying
    ? -(
        motionLevel * AVATAR_MOTION_CONFIG.verticalStrength +
        Math.sin(nudgePhase) *
          motionLevel *
          AVATAR_MOTION_CONFIG.verticalDriftStrength
      )
    : 0;
  const translateX = isPlaying
    ? Math.sin(nudgePhase * AVATAR_MOTION_CONFIG.horizontalPhaseMultiplier) *
      motionLevel *
      AVATAR_MOTION_CONFIG.horizontalStrength
    : 0;
  const rotate = isPlaying
    ? Math.sin(nudgePhase * AVATAR_MOTION_CONFIG.rotationPhaseMultiplier) *
      motionLevel *
      AVATAR_MOTION_CONFIG.rotationStrength
    : 0;

  return (
    <div
      className='h-[95px] shrink-0 will-change-transform'
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg)`,
        transitionDuration: `${AVATAR_MOTION_CONFIG.transitionMs}ms`,
        transitionProperty: 'transform',
      }}
    >
      <img
        src={voice.avatar}
        alt={`${voice.name} avatar`}
        className='block h-full w-full object-cover'
        width={95}
        height={95}
      />
    </div>
  );
}
