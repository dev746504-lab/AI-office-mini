import { motion } from 'framer-motion';
import { AmbientGrid } from '../components/AmbientGrid';
import { fadeUp } from '../motionVariants';

/** Placeholder - se noi voi bang report_log (MySQL) o backend sau. */
export default function HistoryPage() {
  return (
    <div className="relative flex h-full min-h-[70vh] items-center justify-center p-4 md:p-6">
      <AmbientGrid />
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="glass-panel glass-edge-glow relative z-10 max-w-sm rounded-2xl px-8 py-10 text-center"
      >
        <p className="text-3xl">🗂️</p>
        <h1 className="mt-3 font-display text-lg font-bold tracking-wider" style={{ color: 'var(--color-ink)' }}>
          LỊCH SỬ BÁO CÁO
        </h1>
        <p className="mt-2 font-mono text-xs leading-relaxed" style={{ color: 'var(--color-mono-dim)' }}>
          Đang phát triển — sẽ hiển thị log các lần chạy báo cáo (thành công/thất bại, số hóa đơn) từ bảng{' '}
          <code>report_log</code> trong MySQL.
        </p>
      </motion.div>
    </div>
  );
}
