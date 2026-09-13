import { motion } from 'framer-motion';
import { AmbientGrid } from '../components/AmbientGrid';
import { KpiCard } from '../components/dashboard/KpiCard';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { TopProductsChart } from '../components/dashboard/TopProductsChart';
import { AiInsightWidget } from '../components/dashboard/AiInsightWidget';
import { AI_INSIGHT_FEED, KPI_DATA, REVENUE_TREND, TOP_PRODUCTS } from '../mock/dashboardData';
import { fadeUp, staggerContainer } from '../motionVariants';

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-full p-4 md:p-6">
      <AmbientGrid />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col gap-6"
      >
        <motion.div variants={fadeUp}>
          <h1 className="font-display text-xl font-bold tracking-wide" style={{ color: 'var(--color-ink)' }}>
            DASHBOARD TỔNG QUAN
          </h1>
          <p className="mt-1 font-mono text-xs capitalize" style={{ color: 'var(--color-mono-dim)' }}>
            // {today} · Dữ liệu mẫu, chưa nối API KiotViet thật
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_DATA.map((kpi) => (
            <KpiCard key={kpi.id} {...kpi} />
          ))}
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <RevenueChart data={REVENUE_TREND} />
          <TopProductsChart data={TOP_PRODUCTS} />
        </motion.div>

        <AiInsightWidget entries={AI_INSIGHT_FEED} />
      </motion.div>
    </div>
  );
}
