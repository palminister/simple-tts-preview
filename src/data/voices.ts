import voiceAssetsJson from "./voice-assets.json";

export type Language = "en" | "th";

export interface Voice {
  id: string;
  name: string;
  avatar: string;
  description: Record<Language, string>;
  audio: Record<Language, string>;
}

interface VoiceAssets {
  previewText: Record<Language, string>;
  voices: Voice[];
}

const voiceAssets = voiceAssetsJson as VoiceAssets;

export const previewText = voiceAssets.previewText;
export const voices = voiceAssets.voices;
export const voiceMap = Object.fromEntries(
  voices.map((voice) => [voice.id, voice]),
) as Record<string, Voice>;
