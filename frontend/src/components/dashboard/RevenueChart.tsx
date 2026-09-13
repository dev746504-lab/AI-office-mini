import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { fadeUp } from '../../motionVariants';
import type { RevenueTrendPoint } from '../../mock/dashboardData';

function formatCompactVnd(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}tr`;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ dataKey?: string | number; name?: string | number; value?: number; color?: string }>;
}

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-3 py-2" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <p className="font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-mono text-xs" style={{ color: entry.color }}>
          {entry.name}: {(entry.value ?? 0).toLocaleString('vi-VN')}₫
        </p>
      ))}
    </div>
  );
}

interface RevenueChartProps {
  data: RevenueTrendPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel glass-edge-glow relative flex flex-col rounded-2xl p-5"
      style={{ minHeight: 320 }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
            Xu hướng 7 ngày
          </h2>
          <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
            Doanh thu &amp; Lợi nhuận
          </p>
        </div>
        <div className="flex gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--color-cyan)' }}>
            <span className="h-2 w-2 rounded-full bg-current" /> Doanh thu
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--color-green)' }}>
            <span className="h-2 w-2 rounded-full bg-current" /> Lợi nhuận
          </span>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d9f5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00d9f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#3a5070"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#3a5070"
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCompactVnd}
              width={52}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Doanh thu"
              stroke="#00d9f5"
              fill="url(#revenueFill)"
              strokeWidth={2}
              dot={{ r: 3, fill: '#00d9f5', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Lợi nhuận"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
