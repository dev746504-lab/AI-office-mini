import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AmbientGrid } from '../components/AmbientGrid';
import { fetchReportLogs, submitReportFeedback } from '../api';
import type { ReportLog } from '../types';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const PERIOD_LABEL: Record<string, string> = { day: 'Ngày', week: 'Tuần', month: 'Tháng' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 26,
            padding: 0,
            color: n <= (hover || value) ? '#f5c518' : 'rgba(255,255,255,0.18)',
            transition: 'color 0.15s',
          }}
          aria-label={`${n} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface FeedbackModalProps {
  log: ReportLog;
  onClose: () => void;
  onSubmitted: (log: ReportLog) => void;
}

function FeedbackModal({ log, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState(log.latestFeedback?.rating ?? 0);
  const [comment, setComment] = useState(log.latestFeedback?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) { setError('Vui lòng chọn số sao (1–5)'); return; }
    setSaving(true);
    setError('');
    try {
      const fb = await submitReportFeedback(log.id, rating, comment || undefined);
      onSubmitted({ ...log, latestFeedback: fb });
      onClose();
    } catch (e) {
      setError((e as Error).message ?? 'Lỗi khi lưu feedback');
    } finally {
      setSaving(false);
    }
  };

  const periodStr = `${PERIOD_LABEL[log.periodType]} ${fmtDate(log.reportDate)}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #1a1a2e)',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ margin: '0 0 4px', color: 'var(--color-ink)', fontSize: 15, fontFamily: 'var(--font-display, monospace)', letterSpacing: '0.05em' }}>
          ĐÁNH GIÁ BÁO CÁO
        </h3>
        <p style={{ margin: '0 0 20px', color: 'var(--color-mono-dim)', fontSize: 12 }}>{periodStr}</p>

        <p style={{ margin: '0 0 8px', color: 'var(--color-ink)', fontSize: 13 }}>Chất lượng báo cáo</p>
        <StarRow value={rating} onChange={setRating} />

        <p style={{ margin: '20px 0 8px', color: 'var(--color-ink)', fontSize: 13 }}>Nhận xét (tuỳ chọn)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Ví dụ: Phân tích Marketing thiếu insight về khách hàng mới..."
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: 'var(--color-ink)',
            fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />

        {error && <p style={{ margin: '8px 0 0', color: '#f87171', fontSize: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8, padding: '8px 16px', color: 'var(--color-mono-dim)',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || rating === 0}
            style={{
              background: saving || rating === 0 ? 'rgba(0,212,170,0.25)' : 'var(--color-accent, #00d4aa)',
              border: 'none', borderRadius: 8, padding: '8px 18px',
              color: saving || rating === 0 ? 'rgba(0,212,170,0.6)' : '#000',
              fontSize: 13, fontWeight: 600, cursor: saving || rating === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'success';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: ok ? 'rgba(30,126,52,0.18)' : 'rgba(198,40,40,0.18)',
      color: ok ? '#4ade80' : '#f87171',
      border: `1px solid ${ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
    }}>
      <span style={{ fontSize: 8, lineHeight: 1 }}>●</span>
      {ok ? 'Thành công' : 'Thất bại'}
    </span>
  );
}

function PeriodBadge({ type }: { type: string }) {
  const colors: Record<string, [string, string]> = {
    day:   ['rgba(0,212,170,0.15)',  '#00d4aa'],
    week:  ['rgba(139,92,246,0.15)', '#a78bfa'],
    month: ['rgba(245,158,11,0.15)', '#fbbf24'],
  };
  const [bg, fg] = colors[type] ?? ['rgba(255,255,255,0.1)', '#fff'];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, background: bg, color: fg,
    }}>
      {PERIOD_LABEL[type] ?? type}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f5c518', letterSpacing: -1, fontSize: 14 }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState<ReportLog | null>(null);

  useEffect(() => {
    fetchReportLogs()
      .then(setLogs)
      .catch((e: Error) => setError(e.message ?? 'Không tải được lịch sử báo cáo'))
      .finally(() => setLoading(false));
  }, []);

  const handleFeedbackSubmitted = (updated: ReportLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  return (
    <div className="relative min-h-[70vh] p-4 md:p-6">
      <AmbientGrid />

      <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative z-10">
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, color: 'var(--color-ink)', fontFamily: 'var(--font-display, monospace)', fontSize: 18, letterSpacing: '0.08em', fontWeight: 700 }}>
            LỊCH SỬ BÁO CÁO
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-mono-dim)', fontSize: 12 }}>
            Log các lần chạy báo cáo tự động — tối đa 100 bản ghi gần nhất
          </p>
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--color-mono-dim)', fontSize: 13, padding: '48px 0' }}>
            Đang tải...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 16 }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>🗂️</p>
            <p style={{ margin: 0, color: 'var(--color-mono-dim)', fontSize: 13 }}>
              Chưa có báo cáo nào được chạy. Cron job sẽ tự động chạy vào giờ cấu hình trong Settings.
            </p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['#', 'Chu kỳ', 'Ngày báo cáo', 'Trạng thái', 'Số HĐ', 'Chạy lúc', 'Đánh giá', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                        color: 'var(--color-mono-dim)', fontSize: 11, letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,212,170,0.04)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
                  >
                    <td style={{ padding: '10px 12px', color: 'var(--color-mono-dim)', fontSize: 11 }}>
                      {log.id}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <PeriodBadge type={log.periodType} />
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-ink)', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {fmtDate(log.reportDate)}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-ink)', textAlign: 'right', fontFamily: 'monospace' }}>
                      {log.status === 'success' ? log.invoiceCount.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-mono-dim)', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {fmtDateTime(log.createdAt)}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {log.latestFeedback ? (
                        <StarDisplay rating={log.latestFeedback.rating} />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {log.status === 'success' && (
                        <button
                          type="button"
                          onClick={() => setFeedbackTarget(log)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            borderRadius: 8, padding: '4px 12px',
                            color: 'var(--color-mono-dim)', fontSize: 11,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,170,0.4)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent, #00d4aa)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-mono-dim)';
                          }}
                        >
                          {log.latestFeedback ? 'Sửa đánh giá' : 'Đánh giá'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Feedback modal */}
      <AnimatePresence>
        {feedbackTarget && (
          <FeedbackModal
            log={feedbackTarget}
            onClose={() => setFeedbackTarget(null)}
            onSubmitted={(updated) => {
              handleFeedbackSubmitted(updated);
              setFeedbackTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
