/**
 * Speaks the given Japanese text using the Web Speech API (SpeechSynthesis).
 * Safely handles SSR environments and cancels any ongoing speech before starting a new utterance.
 *
 * @param text The Japanese text to speak
 * @param rate Playback rate (default: 1.0)
 */
export function speakJapanese(text: string, rate: number = 1.0): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();

  if (!text || text.trim() === '') {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(
    (voice) => voice.lang === 'ja-JP' || voice.lang.toLowerCase().startsWith('ja')
  );

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
}
