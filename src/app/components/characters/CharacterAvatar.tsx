import { AVATAR_MOTION_CONFIG } from '../VoiceAvatar';

interface CharacterAvatarProps {
  avatar: string;
  name: string;
  isPlaying: boolean;
  level: number;
}

export function CharacterAvatar({
  avatar,
  name,
  isPlaying,
  level,
}: CharacterAvatarProps) {
  const now = typeof performance === 'undefined' ? 0 : performance.now();
  const seed = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
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
      className='h-[95px] w-[95px] shrink-0 overflow-hidden rounded-[24px] will-change-transform'
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg)`,
        transitionDuration: `${AVATAR_MOTION_CONFIG.transitionMs}ms`,
        transitionProperty: 'transform',
      }}
    >
      <img
        src={avatar}
        alt={`${name} avatar`}
        className='block h-full w-full object-cover'
        width={95}
        height={95}
      />
    </div>
  );
}
