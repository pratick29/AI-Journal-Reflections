/**
 * Google Cloud Text-to-Speech Client Utility
 * Integrates Google Cloud Neural2 & Journey voices for studio-grade contemplative narration.
 */

export interface GoogleTtsOptions {
  voiceName?: string; // e.g. 'en-US-Journey-F', 'en-US-Journey-D', 'en-GB-Neural2-B'
  speakingRate?: number; // default 0.95
  pitch?: number; // default 0.0
}

const audioCache = new Map<string, HTMLAudioElement>();

export async function synthesizeGoogleSpeech(
  text: string,
  apiKey: string,
  options: GoogleTtsOptions = {}
): Promise<HTMLAudioElement> {
  const {
    voiceName = 'en-US-Journey-F',
    speakingRate = 0.95,
    pitch = 0.0,
  } = options;

  const cacheKey = `${voiceName}_${speakingRate}_${text.slice(0, 100)}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const languageCode = voiceName.startsWith('en-GB') ? 'en-GB' : 'en-US';

  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Cloud TTS failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error('No audio content returned from Google Cloud TTS.');
  }

  const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
  const audio = new Audio(audioSrc);
  audioCache.set(cacheKey, audio);
  return audio;
}
