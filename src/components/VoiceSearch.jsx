import { useState, useRef } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [show, setShow] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi first, fallback to English
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (transcript) {
        navigate(`/search?q=${encodeURIComponent(transcript)}`);
        setShow(false);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice search failed, try again');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setShow(true);
    setTranscript('');
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (transcript) {
      navigate(`/search?q=${encodeURIComponent(transcript)}`);
      setShow(false);
    }
  };

  const cancel = () => {
    recognitionRef.current?.abort();
    setIsListening(false);
    setShow(false);
    setTranscript('');
  };

  return (
    <>
      {/* Mic trigger button */}
      <button
        onClick={isListening ? stop : startListening}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
          isListening ? 'bg-red-500 shadow-lg shadow-red-500/40' : 'bg-white/10 hover:bg-white/15'
        }`}
      >
        {isListening
          ? <MicOff className="w-4 h-4 text-white" />
          : <Mic className="w-4 h-4 text-white/70" />
        }
      </button>

      {/* Listening overlay */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center px-6"
          >
            <button onClick={cancel} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>

            <p className="text-white/50 text-sm mb-6 font-medium">
              {isListening ? 'Bol raha hai...' : 'Processing...'}
            </p>

            {/* Animated mic */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
              {isListening && [0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.8 + i * 0.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="absolute inset-0 rounded-full bg-green-400/30"
                />
              ))}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isListening ? 'bg-green-500' : 'bg-white/20'}`}>
                <Mic className="w-9 h-9 text-white" />
              </div>
            </div>

            <p className="text-white font-heading font-bold text-2xl text-center min-h-[36px]">
              {transcript || (isListening ? '...' : '')}
            </p>
            <p className="text-white/40 text-xs mt-2">
              Try: "Amul milk", "Sabzi", "Bread butter"
            </p>

            {transcript && (
              <button
                onClick={stop}
                className="mt-6 px-8 py-3 bg-primary text-white font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Search "{transcript}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}