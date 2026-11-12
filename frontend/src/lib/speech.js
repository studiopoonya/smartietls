import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

const RecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null;
const FINISH_TIMEOUT_MS = 1500;

let speaking = false;
let playbackId = 0;
const listeners = new Set();

function setSpeaking(value) {
  speaking = value;
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsSpeaking() {
  return useSyncExternalStore(subscribe, () => speaking);
}

function bestVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => /natural|neural|online/i.test(v.name) && v.lang.startsWith('en'))
    || voices.find(v => v.lang.startsWith('en-GB'))
    || voices.find(v => v.lang.startsWith('en'))
    || null;
}

// Chrome stops long utterances, so the script is spoken in short sentence-sized chunks.
function chunk(text) {
  const clean = text.replace(/^[A-Za-z .]{1,20}:\s*/gm, '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  let current = '';
  for (const sentence of clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [clean]) {
    if ((current + sentence).length > 180 && current) { chunks.push(current.trim()); current = ''; }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function speak(text, { onEnd, onError, rate = 0.9 } = {}) {
  window.speechSynthesis.cancel();
  playbackId += 1;
  const id = playbackId;
  const chunks = chunk(text);
  let index = 0;
  setSpeaking(true);

  const next = () => {
    if (id !== playbackId) return;
    if (index >= chunks.length) { setSpeaking(false); onEnd?.(); return; }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = rate;
    const voice = bestVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => { index += 1; next(); };
    utterance.onerror = () => {
      if (id !== playbackId) return;
      setSpeaking(false);
      onError?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  next();
}

export function stopSpeaking() {
  if (!hasSpeechSynthesis) return;
  playbackId += 1;
  setSpeaking(false);
  window.speechSynthesis.cancel();
}

export function useSpeechInput(onFinalText) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);
  const onEndedRef = useRef(null);
  const onFinalRef = useRef(onFinalText);
  useEffect(() => { onFinalRef.current = onFinalText; }, [onFinalText]);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const start = useCallback(() => {
    if (!RecognitionAPI) return;
    const recognition = new RecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => { activeRef.current = true; setListening(true); };
    recognition.onend = () => {
      activeRef.current = false;
      setListening(false);
      onEndedRef.current?.();
    };
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) onFinalRef.current(event.results[i][0].transcript.trim());
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // The last phrase is delivered after stop(), so callers await this before reading the transcript.
  const finish = useCallback(() => new Promise((resolve) => {
    if (!activeRef.current) { resolve(); return; }
    const timeout = setTimeout(resolve, FINISH_TIMEOUT_MS);
    onEndedRef.current = () => { clearTimeout(timeout); onEndedRef.current = null; resolve(); };
    recognitionRef.current.stop();
  }), []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { listening, start, stop, finish, supported: !!RecognitionAPI };
}
