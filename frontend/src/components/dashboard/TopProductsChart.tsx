import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { fadeUp } from '../../motionVariants';
import type { TopProductDatum } from '../../mock/dashboardData';

const BAR_COLORS = ['#00d9f5', '#a78bfa', '#fbbf24', '#34d399', '#f87171'];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: TopProductDatum }>;
}

function ProductTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="glass-panel rounded-xl px-3 py-2" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <p className="max-w-[160px] text-xs" style={{ color: 'var(--color-ink)' }}>
        {item.name}
      </p>
      <p className="font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
        {item.quantity} ly
      </p>
    </div>
  );
}

interface TopProductsChartProps {
  data: TopProductDatum[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel glass-edge-glow relative flex flex-col rounded-2xl p-5"
      style={{ minHeight: 320 }}
    >
      <div className="mb-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
          Top 5 Sản Phẩm
        </h2>
        <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
          Bán chạy nhất hôm nay
        </p>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#3a5070"
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#7b92b8"
              tick={{ fontSize: 10.5, fontFamily: 'DM Sans, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={128}
            />
            <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="quantity" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
