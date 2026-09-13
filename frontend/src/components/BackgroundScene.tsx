import { motion } from 'framer-motion';
import './BackgroundScene.css';
import { BotFigure } from './BotFigure';
import { AGENT_THEME, STANDBY_BOT_THEME } from '../agentTheme';
import type { AiConfigEntry } from '../types';

interface BackgroundSceneProps {
  departments: AiConfigEntry[];
  activeAgent: string | null;
}

/**
 * POV cua Giam doc: nhin qua mep ban lam viec ve phia 5 nhan vat AI dang
 * ngoi cho lenh. Bot tuong ung voi agent dang chon se sang len va "nguoc
 * dau nhan lenh"; cac bot con lai mo di.
 */
export function BackgroundScene({ departments, activeAgent }: BackgroundSceneProps) {
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

      <div className={`war-room-bots ${activeAgent ? 'has-active' : ''}`}>
        {departments.map((dept) => {
          const theme = AGENT_THEME[dept.agentName] ?? STANDBY_BOT_THEME;
          return (
            <BotFigure
              key={dept.agentName}
              color={theme.color}
              hasMonitor={theme.hasMonitor}
              timing={theme.timing}
              active={activeAgent === dept.agentName}
            />
          );
        })}
        <BotFigure color={STANDBY_BOT_THEME.color} timing={STANDBY_BOT_THEME.timing} />
      </div>

      <div className="war-room-desk" />
    </div>
  );
}
