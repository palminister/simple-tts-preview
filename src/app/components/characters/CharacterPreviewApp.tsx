'use client';

import { useEffect, useRef, useState } from 'react';
import { AUDIO_REACTIVITY_CONFIG } from '../VoicePreviewApp';
import {
  characterMap,
  characters,
  characterPreviewText,
} from '../../../data/characters';
import { CharacterVoiceCard } from './CharacterVoiceCard';

export function CharacterPreviewApp() {
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState<string | null>(null);
  const [playingLevel, setPlayingLevel] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferCacheRef = useRef<Record<string, Promise<AudioBuffer> | AudioBuffer>>(
    {},
  );
  const frameRef = useRef<number | null>(null);
  const playbackRequestRef = useRef(0);

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

  const prewarmAudio = () => {
    for (const character of characters) {
      void loadAudioBuffer(character.audio).catch(() => {
        // Ignore prewarm failures and retry on demand.
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
    setLoadingCharacter(null);
    setPlayingLevel(0);
    setPlayingCharacter(null);
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
    prewarmAudio();
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const startPlayback = (characterId: string, audioPath: string) => {
    stopPlayback();

    const requestId = playbackRequestRef.current + 1;
    playbackRequestRef.current = requestId;
    setLoadingCharacter(characterId);
    setPlaybackError(null);
    setPlayingLevel(0);

    void (async () => {
      try {
        const audioContext = getAudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const audioBuffer = await loadAudioBuffer(audioPath);
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
        setLoadingCharacter(null);
        setPlayingCharacter(characterId);
        startLevelTracking(analyser);
        source.start(0);
      } catch {
        if (playbackRequestRef.current === requestId) {
          stopPlayback();
          setPlaybackError(
            'Preview audio has not been generated yet. Run the generator script to create the files in public/audio/characters.',
          );
        }
      }
    })();
  };

  const handlePlay = (characterId: string) => {
    const activeCharacter = playingCharacter ?? loadingCharacter;

    if (activeCharacter === characterId) {
      stopPlayback();
      return;
    }

    startPlayback(characterId, characterMap[characterId].audio);
  };

  const activeCharacter = playingCharacter ?? loadingCharacter;

  return (
    <main className='min-h-screen bg-[#fbfaf9] py-8'>
      <div className='mx-auto w-full max-w-[860px] rounded-[16px] bg-[#fbfaf9] p-4 sm:p-6'>
        <div className='mb-6 flex flex-col gap-4'>
          <p className='text-[18px] font-bold tracking-[-0.36px] text-[#b5b8bf]'>
            Preview Text
          </p>
          <p className='text-[14px] font-medium tracking-[-0.28px] text-[#b5b8bf]'>
            {characterPreviewText}
          </p>
        </div>

        {playbackError ? (
          <div className='mb-6 rounded-[18px] border border-[#ebe6dd] bg-[#f7f3ee] px-4 py-3 text-[13px] font-medium tracking-[-0.26px] text-[#8a8074]'>
            {playbackError}
          </div>
        ) : null}

        <div className='flex flex-col gap-6'>
          {characters.map((character) => (
            <CharacterVoiceCard
              key={character.id}
              character={character}
              isPlaying={playingCharacter === character.id}
              isLoading={loadingCharacter === character.id}
              isDimmed={
                activeCharacter !== null && activeCharacter !== character.id
              }
              level={playingCharacter === character.id ? playingLevel : 0}
              onPlay={() => handlePlay(character.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
