import { motion } from 'framer-motion';
import { fadeUp } from '../../motionVariants';
import type { KpiDatum } from '../../mock/dashboardData';

export function KpiCard({ label, icon, value, deltaPct, color }: KpiDatum) {
  const isUp = deltaPct >= 0;

  return (
    <motion.div variants={fadeUp} className="glass-panel glass-edge-glow relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
        >
          {icon}
        </div>
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
          style={
            isUp
              ? { background: 'rgba(52,211,153,0.12)', color: 'var(--color-green)' }
              : { background: 'rgba(248,113,113,0.12)', color: 'var(--color-red)' }
          }
        >
          {isUp ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}%
        </span>
      </div>

      <p className="mt-4 font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
        {value}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-mono-dim)' }}>
        {label}
      </p>
      <p className="mt-2 font-mono text-[10px]" style={{ color: 'var(--color-faint)' }}>
        so với hôm qua
      </p>
    </motion.div>
  );
}
