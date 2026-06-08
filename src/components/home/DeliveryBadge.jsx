import { Zap, MapPin, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeliveryBadge() {
  return (
    <div className="px-4 pt-4 pb-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-xl tracking-tight">zappr</h1>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="text-[11px] font-medium">Deliver to Home</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full flex items-center gap-1.5"
      >
        <Zap className="w-3.5 h-3.5 fill-accent" />
        <span className="text-xs font-bold">20 min</span>
      </motion.div>
    </div>
  );
}