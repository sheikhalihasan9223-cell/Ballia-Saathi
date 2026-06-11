import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X } from 'lucide-react';

const WA_NUMBER = '919565189483';
const WA_DEFAULT_MSG = encodeURIComponent('Namaste! Ballia Saathi se order karna hai 🛒');

export default function WhatsAppFloat() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="bg-[#111] border border-white/10 rounded-2xl px-3 py-2 pr-7 max-w-[200px] shadow-2xl relative"
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white/70"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-white text-[11px] font-semibold leading-snug">WhatsApp pe order karein!</p>
            <p className="text-white/40 text-[10px] mt-0.5">Tap to chat with us</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_DEFAULT_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 relative"
        style={{ background: '#25D366' }}
        onClick={() => setShowTooltip(false)}
      >
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-green-400"
        />
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" className="w-8 h-8 relative z-10" fill="white">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.67 4.77 1.83 6.76L2 30l7.44-1.79A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 01-5.83-1.6l-.42-.25-4.41 1.06 1.1-4.31-.27-.44A11.5 11.5 0 1116 27.5zm6.32-8.58c-.35-.17-2.05-1.01-2.37-1.13-.32-.12-.55-.17-.78.17-.23.35-.9 1.13-1.1 1.36-.2.23-.41.26-.76.09-.35-.17-1.47-.54-2.8-1.72-1.04-.92-1.74-2.06-1.94-2.41-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.57-.28-.68-.57-.58-.78-.59h-.67c-.23 0-.6.09-.91.43-.32.35-1.2 1.17-1.2 2.86 0 1.69 1.23 3.32 1.4 3.55.17.23 2.42 3.7 5.87 5.19.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.05-.84 2.34-1.65.29-.81.29-1.51.2-1.65-.08-.14-.31-.23-.66-.4z" />
        </svg>
      </motion.a>
    </div>
  );
}