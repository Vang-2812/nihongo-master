/**
 * Speaks the given Japanese text using Web Speech API or high-reliability Audio Fallback.
 * Specifically handles Chinese domestic ROM devices (Oppo, Xiaomi, Vivo) where SpeechSynthesis
 * might lack Japanese voice packages or default to Chinese TTS voices.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];
let activeAudio: HTMLAudioElement | null = null;

function isJapaneseVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = (voice.lang || '').toLowerCase().replace('_', '-');
  const name = (voice.name || '').toLowerCase();

  // Strictly eliminate Chinese voices
  if (
    lang.startsWith('zh') ||
    name.includes('chinese') ||
    name.includes('mandarin') ||
    name.includes('cantonese')
  ) {
    return false;
  }

  // Positive Japanese match
  return (
    lang === 'ja-jp' ||
    lang.startsWith('ja') ||
    name.includes('japanese') ||
    name.includes('japan') ||
    name.includes('nihongo') ||
    voice.name.includes('日本語')
  );
}

function initVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        cachedVoices = window.speechSynthesis.getVoices() || [];
      });
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices() || [];
      };
    }
  } catch {
    // Ignore errors in restricted environments
  }
}

// Eager initialization if in browser
if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * Fallback to playing audio via standard Google Translate TTS endpoint.
 * Highly dependable on devices without offline Japanese TTS voice packs.
 */
function playAudioFallback(text: string, rate: number = 1.0): void {
  if (typeof window === 'undefined') return;

  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }

    const cleanText = text.trim();
    if (!cleanText) return;

    // Use Google TTS API endpoint
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(url);
    audio.playbackRate = rate;

    activeAudio = audio;
    audio.play().catch(() => {
      // Audio playback might be restricted by browser autoplay policy
    });
  } catch {
    // Fallback gracefully
  }
}

/**
 * Speaks the given Japanese text.
 * Cancels ongoing speech before starting a new utterance.
 *
 * @param text The Japanese text to speak
 * @param rate Playback rate (default: 1.0)
 */
export function speakJapanese(text: string, rate: number = 1.0): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Cancel any active audio playback
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  const cleanText = text ? text.trim() : '';
  if (!cleanText) return;

  if (!window.speechSynthesis) {
    playAudioFallback(cleanText, rate);
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {}

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }

  const jaVoice = (cachedVoices || []).find(isJapaneseVoice);

  // If no native Japanese voice exists on this device (e.g. Oppo China domestic ROM),
  // DO NOT allow the device to fall back to its system default voice (which would be Chinese!).
  // Use online Japanese TTS audio stream instead.
  if (!jaVoice) {
    playAudioFallback(cleanText, rate);
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.voice = jaVoice;

    // In case utterance errors out, try audio fallback
    utterance.onerror = () => {
      playAudioFallback(cleanText, rate);
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    playAudioFallback(cleanText, rate);
  }
}

/**
 * Stop any ongoing speech or audio.
 */
export function stopJapaneseSpeech(): void {
  if (typeof window === 'undefined') return;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
