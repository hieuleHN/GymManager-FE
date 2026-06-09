import { Phone } from 'lucide-react';
import { motion } from 'motion/react';

export function FloatingContact({ phoneNumber }: { phoneNumber: string }) {
  return (
    <motion.a
      href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-colors"
    >
      <div className="bg-white/20 p-2 rounded-full">
        <Phone className="w-6 h-6 animate-pulse" />
      </div>
      <span className="font-bold text-lg hidden md:block">{phoneNumber}</span>
    </motion.a>
  );
}
