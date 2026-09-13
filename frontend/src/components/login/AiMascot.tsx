import { motion, type Variants } from 'framer-motion';

export type MascotState = 'idle' | 'peek' | 'attention';

export interface AiMascotProps {
  state: MascotState;
  color: string;
  /** Lech pha animation idle de 5 con khong "tho" cung nhip - trong tu nhien hon. */
  idleOffset?: number;
  scale?: number;
}

/**
 * Placeholder SVG cho 1 nhan vat AI - hinh khoi don gian, de thay bang file
 * thiet ke that sau nay (chi can giu nguyen 3 state: idle/peek/attention).
 */
export function AiMascot({ state, color, idleOffset = 0, scale = 1 }: AiMascotProps) {
  const bodyVariants: Variants = {
    idle: {
      y: [0, -6, 0],
      transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: idleOffset },
    },
    peek: { y: 3, transition: { duration: 0.35, ease: 'easeOut' } },
    attention: { y: -14, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  };

  const headVariants: Variants = {
    idle: { rotate: 0 },
    peek: { rotate: 6 },
    attention: { rotate: -6 },
  };

  const eyesOpenVariants: Variants = {
    idle: { opacity: 1, scaleY: 1 },
    peek: { opacity: 0 },
    attention: { opacity: 1, scaleY: 1.3 },
  };

  const eyesClosedVariants: Variants = {
    idle: { opacity: 0 },
    peek: { opacity: 1 },
    attention: { opacity: 0 },
  };

  const leftArmVariants: Variants = {
    idle: {
      rotate: [0, -10, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: idleOffset },
    },
    peek: { rotate: -145, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    attention: { rotate: 6, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  };

  const rightArmVariants: Variants = {
    idle: {
      rotate: [0, 10, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: idleOffset + 0.25 },
    },
    peek: { rotate: 145, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    attention: { rotate: -6, transition: { type: 'spring', stiffness: 260, damping: 18 } },
  };

  const chestVariants: Variants = {
    idle: { opacity: [0.5, 0.9, 0.5], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
    peek: { opacity: 0.4 },
    attention: { opacity: 1 },
  };

  const ledVariants: Variants = {
    idle: { opacity: [1, 0.2, 1], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: idleOffset } },
    peek: { opacity: 0.5 },
    attention: { opacity: 1 },
  };

  return (
    <motion.svg
      viewBox="0 0 120 170"
      width={104 * scale}
      height={148 * scale}
      style={{ overflow: 'visible', color }}
      animate={state}
      initial="idle"
    >
      <motion.g variants={bodyVariants}>
        {/* Than */}
        <rect x="25" y="70" width="70" height="62" rx="16" fill="#0a1628" stroke="currentColor" strokeOpacity="0.35" />
        <motion.rect
          variants={chestVariants}
          x="46"
          y="90"
          width="28"
          height="10"
          rx="5"
          fill="currentColor"
          style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
        />

        {/* Tay trai */}
        <motion.g variants={leftArmVariants} style={{ transformBox: 'fill-box', transformOrigin: 'top right' }}>
          <rect x="8" y="76" width="16" height="42" rx="8" fill="#0f1e38" stroke="currentColor" strokeOpacity="0.3" />
        </motion.g>

        {/* Tay phai */}
        <motion.g variants={rightArmVariants} style={{ transformBox: 'fill-box', transformOrigin: 'top left' }}>
          <rect x="96" y="76" width="16" height="42" rx="8" fill="#0f1e38" stroke="currentColor" strokeOpacity="0.3" />
        </motion.g>

        {/* Dau */}
        <motion.g variants={headVariants} style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
          <line x1="60" y1="8" x2="60" y2="-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <motion.circle
            variants={ledVariants}
            cx="60"
            cy="-8"
            r="4.5"
            fill="currentColor"
            style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}
          />
          <rect x="28" y="8" width="64" height="54" rx="18" fill="#0f1e38" stroke="currentColor" strokeOpacity="0.35" />

          {/* Mat mo */}
          <motion.g variants={eyesOpenVariants}>
            <circle cx="48" cy="35" r="6" fill="currentColor" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
            <circle cx="72" cy="35" r="6" fill="currentColor" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
          </motion.g>

          {/* Mat nham/che (khi peek) */}
          <motion.g variants={eyesClosedVariants}>
            <rect x="42" y="33" width="12" height="4" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="66" y="33" width="12" height="4" rx="2" fill="currentColor" opacity="0.8" />
          </motion.g>

          <rect x="49" y="48" width="22" height="3" rx="1.5" fill="#ffffff" opacity="0.12" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
