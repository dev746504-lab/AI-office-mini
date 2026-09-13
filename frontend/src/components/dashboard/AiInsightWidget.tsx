import { motion } from 'framer-motion';
import { fadeUp } from '../../motionVariants';
import { AgentBadge } from '../AgentBadge';
import { useTypewriter } from '../../hooks/useTypewriter';
import type { AiInsightEntry } from '../../mock/dashboardData';

interface AiInsightWidgetProps {
  entries: AiInsightEntry[];
}

export function AiInsightWidget({ entries }: AiInsightWidgetProps) {
  const [latest, ...older] = entries;
  const typed = useTypewriter(latest?.message ?? '');

  return (
    <motion.div variants={fadeUp} className="glass-panel glass-edge-glow relative overflow-hidden rounded-2xl p-5">
      <div className="scanline" />

      <div className="relative z-10 mb-4 flex items-center gap-3">
        <AgentBadge color="var(--color-green)" active />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
            AI Tổng Hợp — Nhận Định Mới Nhất
          </h2>
          <p className="font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
            {latest?.timestamp ?? 'Chưa có dữ liệu'}
          </p>
        </div>
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
          style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--color-green)' }}
        >
          <span className="status-dot h-1.5 w-1.5 rounded-full bg-current" />
          Live
        </span>
      </div>

      {latest && (
        <div className="relative z-10 space-y-3 font-mono text-[13px] leading-relaxed">
          <p style={{ color: 'var(--color-ink)' }}>
            <span style={{ color: 'var(--color-green)' }}>{'> '}</span>
            {typed}
            <span className="cursor-blink" style={{ color: 'var(--color-green)' }}>
              ▌
            </span>
          </p>
          {older.map((entry) => (
            <p key={entry.id} style={{ color: 'var(--color-dim)', opacity: 0.55 }}>
              <span style={{ color: 'var(--color-mono-dim)' }}>{'> '}</span>
              <span className="mr-2 text-[10px]">[{entry.timestamp}]</span>
              {entry.message}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
