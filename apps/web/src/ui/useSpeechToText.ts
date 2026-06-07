import { useEffect, useRef, useState } from 'react';

/** Sous-ensemble minimal de l'API Web Speech (non typée par lib.dom selon les versions). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechResultEvent {
  resultIndex: number;
  results: { isFinal: boolean; 0: { transcript: string } }[];
}
type SRCtor = new () => SpeechRecognitionLike;

function getCtor(): SRCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Reconnaissance vocale du navigateur (STT). `onResult` reçoit le **transcript cumulé**
 * de la session de dictée en cours (interim + final), à chaque mise à jour.
 */
export function useSpeechToText(onResult: (transcript: string) => void) {
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onResult);
  cbRef.current = onResult;
  const [listening, setListening] = useState(false);
  const supported = getCtor() !== null;

  // Arrête proprement la reconnaissance au démontage.
  useEffect(() => () => recRef.current?.stop(), []);

  const start = () => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return;
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      cbRef.current((finalText + interim).trim());
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    rec.onerror = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stop = () => recRef.current?.stop();
  const toggle = () => (listening ? stop() : start());

  return { supported, listening, toggle };
}
