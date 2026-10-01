export type SpeechConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
  voice: string;
};

export const SPEECH_BASE_URL = "https://ai.gateway.lovable.dev";
export const SPEECH_MODEL = "openai/gpt-4o-mini-tts";

export const VOICE_PRESETS = {
  male: {
    classic: { voice: "onyx", direction: "a grounded, resonant baritone with thoughtful pauses and understated cinematic presence" },
    romantic: { voice: "echo", direction: "a soft, charming leading voice with gentle warmth and intimate phrasing" },
    action: { voice: "ash", direction: "a bold, energetic leading voice with crisp diction and confident momentum" },
    storyteller: { voice: "ballad", direction: "a rich, theatrical narrator with expressive pacing and a sweeping cinematic feel" },
  },
  female: {
    classic: { voice: "shimmer", direction: "a warm, composed leading voice with thoughtful pauses and understated cinematic presence" },
    romantic: { voice: "nova", direction: "a soft, charming leading voice with gentle warmth and intimate phrasing" },
    action: { voice: "coral", direction: "a bold, energetic leading voice with crisp diction and confident momentum" },
    storyteller: { voice: "sage", direction: "a rich, theatrical narrator with expressive pacing and a sweeping cinematic feel" },
  },
} as const;

export type VoiceGender = keyof typeof VOICE_PRESETS;
export type VoicePreset = keyof typeof VOICE_PRESETS.male;

export const EMOTIONS = {
  natural: "natural and conversational, with subtle human inflection",
  joyful: "genuinely joyful and bright, with a smile in the voice",
  heartfelt: "tender and sincere, with emotional warmth and natural pauses",
  dramatic: "dramatic and intense, with measured tension and expressive emphasis",
  suspenseful: "quietly suspenseful, with deliberate pauses and controlled anticipation",
} as const;

export type Emotion = keyof typeof EMOTIONS;

export const LANGUAGE_LABELS = {
  hi: "Hindi",
  en: "English",
  mr: "Marathi",
} as const;

export type LanguageCode = keyof typeof LANGUAGE_LABELS;

export function buildInstructions(language: LanguageCode, gender: VoiceGender, preset: VoicePreset, emotion: Emotion) {
  const lang = LANGUAGE_LABELS[language];
  return `Speak the provided text in natural, fluent ${lang} with an authentic Indian accent. Use ${VOICE_PRESETS[gender][preset].direction}. Deliver it ${EMOTIONS[emotion]}. Let emotion vary naturally with the meaning of each sentence rather than sounding exaggerated or robotic. Pronounce Devanagari script accurately when present. This is an original fictional cinematic performance; do not imitate any real person or celebrity. Speak only the provided text.`;
}

export async function requestSpeech(
  config: SpeechConfig,
  text: string,
  instructions: string,
  speed: number,
) {
  return fetch(`${config.baseURL}/v1/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: text,
      voice: config.voice,
      instructions,
      speed,
      stream_format: "audio",
      response_format: "mp3",
    }),
  });
}
