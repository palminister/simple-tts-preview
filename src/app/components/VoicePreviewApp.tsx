'use client';

import { useEffect, useRef, useState } from 'react';
import {
  previewText,
  type Language,
  voiceMap,
  voices,
} from '../../data/voices';
import { LanguageSelector } from './LanguageSelector';
import { VoiceCard } from './VoiceCard';

export const AUDIO_REACTIVITY_CONFIG = {
  analyserFftSize: 256,
  analyserSmoothing: 0.82,
  levelFloor: 0.015,
  levelSensitivity: 1.5,
  levelSmoothing: 0.72,
} as const;

export function VoicePreviewApp() {
  const [language, setLanguage] = useState<Language>('en');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [playingLevel, setPlayingLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferCacheRef = useRef<Record<string, Promise<AudioBuffer> | AudioBuffer>>(
    {},
  );
  const frameRef = useRef<number | null>(null);
  const playbackRequestRef = useRef(0);

  const getAudioPath = (voiceId: string, nextLanguage: Language) =>
    voiceMap[voiceId].audio[nextLanguage];

  const getAudioContext = () => {
    const currentContext =
      audioContextRef.current ?? new window.AudioContext();
    audioContextRef.current = currentContext;

    return currentContext;
  };

  const loadAudioBuffer = async (audioPath: string) => {
    const cachedBuffer = bufferCacheRef.current[audioPath];
    if (cachedBuffer instanceof AudioBuffer) {
      return cachedBuffer;
    }

    if (cachedBuffer) {
      return cachedBuffer;
    }

    const pendingBuffer = fetch(audioPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${audioPath}`);
        }

        const audioData = await response.arrayBuffer();
        const audioContext = getAudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(
          audioData.slice(0),
        );

        bufferCacheRef.current[audioPath] = decodedBuffer;
        return decodedBuffer;
      })
      .catch((error) => {
        delete bufferCacheRef.current[audioPath];
        throw error;
      });

    bufferCacheRef.current[audioPath] = pendingBuffer;
    return pendingBuffer;
  };

  const prewarmLanguageAudio = (nextLanguage: Language) => {
    for (const voice of voices) {
      void loadAudioBuffer(getAudioPath(voice.id, nextLanguage)).catch(() => {
        // Ignore prewarm failures and retry on demand when the user taps play.
      });
    }
  };

  const stopPlayback = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();

    sourceRef.current = null;
    analyserRef.current = null;
    playbackRequestRef.current += 1;
    setLoadingVoice(null);
    setPlayingLevel(0);
    setPlayingVoice(null);
  };

  const startLevelTracking = (analyser: AnalyserNode) => {
    const samples = new Uint8Array(analyser.frequencyBinCount);
    let smoothedLevel = 0;

    const updateLevel = () => {
      analyser.getByteFrequencyData(samples);

      let total = 0;
      for (const sample of samples) {
        total += sample;
      }

      const average = total / (samples.length * 255);
      const responsiveLevel = Math.max(
        0,
        average - AUDIO_REACTIVITY_CONFIG.levelFloor,
      );
      const amplifiedLevel = Math.min(
        1,
        responsiveLevel * AUDIO_REACTIVITY_CONFIG.levelSensitivity,
      );
      smoothedLevel =
        smoothedLevel * AUDIO_REACTIVITY_CONFIG.levelSmoothing +
        amplifiedLevel * (1 - AUDIO_REACTIVITY_CONFIG.levelSmoothing);
      setPlayingLevel(smoothedLevel);
      frameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  useEffect(() => {
    prewarmLanguageAudio(language);
  }, [language]);

  useEffect(() => {
    return () => {
      stopPlayback();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const startPlayback = (voiceId: string, nextAudioPath: string) => {
    stopPlayback();

    const requestId = playbackRequestRef.current + 1;
    playbackRequestRef.current = requestId;
    setLoadingVoice(voiceId);
    setPlayingLevel(0);

    void (async () => {
      try {
        const audioContext = getAudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const audioBuffer = await loadAudioBuffer(nextAudioPath);
        if (playbackRequestRef.current !== requestId) {
          return;
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = AUDIO_REACTIVITY_CONFIG.analyserFftSize;
        analyser.smoothingTimeConstant =
          AUDIO_REACTIVITY_CONFIG.analyserSmoothing;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        source.onended = () => {
          if (playbackRequestRef.current === requestId) {
            stopPlayback();
          }
        };

        analyserRef.current = analyser;
        sourceRef.current = source;
        setLoadingVoice(null);
        setPlayingVoice(voiceId);
        startLevelTracking(analyser);
        source.start(0);
      } catch {
        if (playbackRequestRef.current === requestId) {
          stopPlayback();
        }
      }
    })();
  };

  const handlePlay = (voiceId: string) => {
    const nextAudioPath = getAudioPath(voiceId, language);
    const activeVoice = playingVoice ?? loadingVoice;

    if (activeVoice === voiceId) {
      stopPlayback();
      return;
    }

    startPlayback(voiceId, nextAudioPath);
  };

  useEffect(() => {
    const activeVoice = playingVoice ?? loadingVoice;
    if (!activeVoice) {
      return;
    }

    startPlayback(activeVoice, getAudioPath(activeVoice, language));
  }, [language]);

  const activeVoice = playingVoice ?? loadingVoice;

  return (
    <main className='min-h-screen bg-[#fbfaf9] py-8'>
      <div className='mx-auto w-full max-w-[660px] rounded-[16px] bg-[#fbfaf9] p-6'>
        <div className='mb-6 flex flex-col gap-4'>
          <p className='text-[18px] font-bold tracking-[-0.36px] text-[#b5b8bf]'>
            Preview Text
          </p>
          <p
            className='text-[14px] font-medium tracking-[-0.28px] text-[#b5b8bf]'
            lang={language}
          >
            {previewText[language]}
          </p>
        </div>

        <div className='mb-8 flex justify-end'>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>

        <div className='flex flex-col gap-6'>
          {voices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              language={language}
              isPlaying={playingVoice === voice.id}
              isLoading={loadingVoice === voice.id}
              isDimmed={activeVoice !== null && activeVoice !== voice.id}
              level={playingVoice === voice.id ? playingLevel : 0}
              onPlay={() => handlePlay(voice.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
