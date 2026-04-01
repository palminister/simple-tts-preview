import charactersJson from './characters.json';

export interface CharacterVoiceDirection {
  tone: string;
  authority: string;
  pacing: string;
  warmth: string;
  archetype: string;
  emotion: string;
}

export interface CharacterVoice {
  id: string;
  name: string;
  age_tag: string | null;
  voice_id: string;
  language: string;
  rate: number;
  volume: number;
  voice_direction: CharacterVoiceDirection;
}

interface CharacterAssets {
  previewText: string;
  characters: CharacterVoice[];
}

const characterAssets = charactersJson as CharacterAssets;

export const characterPreviewText = characterAssets.previewText;
export const characters = characterAssets.characters.map((character) => ({
  ...character,
  avatar: getDiceBearAvatar(character.id),
  audio: `/audio/characters/${character.id}.mp3`,
}));

export type Character = (typeof characters)[number];

export const characterMap = Object.fromEntries(
  characters.map((character) => [character.id, character]),
) as Record<string, Character>;

export function formatAgeTag(ageTag: string | null) {
  if (!ageTag) {
    return 'timeless';
  }

  return ageTag.replace('-', ' ');
}

function getDiceBearAvatar(seed: string) {
  const params = new URLSearchParams({
    seed,
    backgroundType: 'gradientLinear',
    radius: '24',
  });

  return `https://api.dicebear.com/9.x/glass/svg?${params.toString()}`;
}
