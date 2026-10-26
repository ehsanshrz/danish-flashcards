export const DANISH_LOCALE = 'da-DK'
export const SPEECH_RATE = 0.9

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function findDanishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => voice.lang === DANISH_LOCALE) ??
    voices.find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith('da'))
  )
}

/** Speaks Danish text with the Web Speech API. Returns false if speech is unavailable. */
export function speakDanish(text: string): boolean {
  if (!isSpeechSupported() || !text.trim()) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = DANISH_LOCALE
  utterance.rate = SPEECH_RATE
  const voice = findDanishVoice()
  if (voice) utterance.voice = voice
  synth.speak(utterance)
  return true
}
