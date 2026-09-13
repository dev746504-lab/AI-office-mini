import { motion } from 'framer-motion';
import './BackgroundScene.css';

/**
 * Nen "cong nghe" dung chung cho cac trang khong can nhan vat AI o background
 * (Dashboard, Lich su Bao cao) - cung mau/luoi hologram voi War Room nhung
 * nhe hon, khong ve bot de khong lam roi so lieu.
 */
export function AmbientGrid() {
  return (
    <div className="war-room-scene">
      <div className="war-room-grid" />
      <motion.div
        className="war-room-glow-a"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="war-room-glow-b"
        animate={{ opacity: [0.9, 0.6, 0.9] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
