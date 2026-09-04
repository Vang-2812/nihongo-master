/**
 * High-reliability Japanese Text-to-Speech (TTS) Engine.
 *
 * Specifically engineered for mobile compatibility and domestic China ROM devices
 * (such as Oppo ColorOS China, Xiaomi HyperOS China, Vivo OriginOS), where:
 * 1. Offline Japanese voice packs are absent in Web Speech API and default system TTS
 *    engines (Breeno / Xiaobu / iFlytek) mistakenly read Kanji characters in Mandarin Chinese.
 * 2. Direct requests to some foreign services may be restricted or blocked by Referer policies.
 *
 * Architecture:
 * - Primary: High-fidelity native Japanese audio stream via NetEase Youdao (unblocked, studio Tokyo accent).
 * - Secondary: Google Translate TTS endpoint with no-referrer policy (full sentences and phrases).
 * - Tertiary Fallback: Client Web Speech API ONLY IF a verified native Japanese voice is installed on device.
 *   (Strictly refuses to use Web Speech API if only Chinese/English voices exist).
 */

let sharedAudio: HTMLAudioElement | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Remove pronunciation dots, hyphens, and normalize whitespace
 * e.g. "た.べる" -> "たべる", "-やま" -> "やま"
 */
export function sanitizeJapaneseText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[.・\-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Validates whether a SpeechSynthesisVoice is genuinely Japanese and NOT Chinese
 */
function isJapaneseVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = (voice.lang || '').toLowerCase().replace('_', '-');
  const name = (voice.name || '').toLowerCase();

  // Strictly eliminate Chinese voices (Mandarin, Cantonese, etc.)
  if (
    lang.startsWith('zh') ||
    name.includes('chinese') ||
    name.includes('mandarin') ||
    name.includes('cantonese') ||
    name.includes('xiaobu') ||
    name.includes('breeno')
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

function initVoices(): void {
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
    // Ignore restricted environments
  }
}

// Preload voices in browser
if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * Returns or initializes a singleton HTML5 Audio element attached to the DOM
 * (attaching to DOM prevents mobile browsers from garbage-collecting during buffering)
 */
function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudio) {
    try {
      const audio = document.createElement('audio');
      audio.setAttribute('referrerpolicy', 'no-referrer');
      audio.preload = 'auto';
      audio.style.display = 'none';
      document.body.appendChild(audio);
      sharedAudio = audio;
    } catch {
      sharedAudio = new Audio();
    }
  }
  return sharedAudio;
}

/**
 * Determines primary audio URL for text:
 * - Single words / Kanji / terms (< 25 chars without sentence punctuation): Youdao (unblocked, studio MP3)
 * - Full sentences / long text: Google Translate TTS with no-referrer
 */
function getPrimaryAudioUrl(cleanText: string): string {
  const isShortWord = cleanText.length <= 25 && !/[。！？!?,\n]/.test(cleanText);
  if (isShortWord) {
    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&le=jap`;
  }
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
}

/**
 * Alternate backup audio URL
 */
function getBackupAudioUrl(cleanText: string): string {
  const isShortWord = cleanText.length <= 25 && !/[。！？!?,\n]/.test(cleanText);
  if (isShortWord) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
  }
  // For sentences that fail, try first 25 chars on Youdao
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText.slice(0, 25))}&le=jap`;
}

/**
 * Web Speech API fallback - ONLY called if a native Japanese voice exists
 */
function tryWebSpeech(text: string, rate: number = 1.0): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const jaVoice = (voices || []).find(isJapaneseVoice);

    // CRITICAL: NEVER call speak if no native Japanese voice exists on device
    if (!jaVoice) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.voice = jaVoice;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech errors
  }
}

/**
 * Speaks the given Japanese text.
 * Safely plays across all mobile devices, tablets, and desktop browsers.
 *
 * @param text The Japanese word, kanji, or sentence
 * @param rate Playback rate (default: 1.0)
 */
export function speakJapanese(text: string, rate: number = 1.0): void {
  if (typeof window === 'undefined') return;

  const clean = sanitizeJapaneseText(text);
  if (!clean) return;

  // Stop any ongoing speech
  stopJapaneseSpeech();

  const audio = getSharedAudio();
  if (!audio) {
    tryWebSpeech(clean, rate);
    return;
  }

  const primaryUrl = getPrimaryAudioUrl(clean);
  const backupUrl = getBackupAudioUrl(clean);

  let hasFallenBack = false;

  // Error listener to switch to backup stream
  audio.onerror = () => {
    if (!hasFallenBack && backupUrl && backupUrl !== primaryUrl) {
      hasFallenBack = true;
      audio.src = backupUrl;
      audio.load();
      audio.play().catch(() => {
        tryWebSpeech(clean, rate);
      });
    } else {
      tryWebSpeech(clean, rate);
    }
  };

  try {
    audio.playbackRate = rate;
    audio.src = primaryUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback on autoplay rejection or stream error
        if (!hasFallenBack && backupUrl && backupUrl !== primaryUrl) {
          hasFallenBack = true;
          audio.src = backupUrl;
          audio.load();
          audio.play().catch(() => {
            tryWebSpeech(clean, rate);
          });
        }
      });
    }
  } catch {
    tryWebSpeech(clean, rate);
  }
}

/**
 * Stops any active Japanese speech or audio playback.
 */
export function stopJapaneseSpeech(): void {
  if (typeof window === 'undefined') return;

  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
    } catch {}
  }

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
