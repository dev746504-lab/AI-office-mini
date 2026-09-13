import { motion } from 'framer-motion';
import './OfficeScene.css';
import { AiMascot, type MascotState } from './AiMascot';
import { OfficeDesk } from './OfficeDesk';

const MASCOT_COLORS = ['#00d9f5', '#a78bfa', '#fbbf24', '#34d399', '#f87171'];

interface OfficeSceneProps {
  state: MascotState;
}

/** Van phong AI 2.5D flat-design - 5 nhan vat dat quanh 1 chiec ban chung. */
export function OfficeScene({ state }: OfficeSceneProps) {
  return (
    <div className="office-scene">
      <div className="office-scene-grid" />
      <motion.div
        className="office-scene-glow"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <span className="office-scene-banner">AI Staff — Online (5/5)</span>

      <div className="office-scene-mascots">
        {MASCOT_COLORS.map((color, i) => (
          <AiMascot key={i} state={state} color={color} idleOffset={i * 0.22} scale={i === 2 ? 1.08 : 0.94} />
        ))}
      </div>

      <div className="office-scene-desk">
        <OfficeDesk />
      </div>
    </div>
  );
}
