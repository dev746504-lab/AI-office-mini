import { AnimatePresence, motion } from 'framer-motion';

export interface CommandToastState {
  message: string;
  type: 'success' | 'error';
}

interface CommandToastProps {
  toast: CommandToastState | null;
}

export function CommandToast({ toast }: CommandToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          role="status"
          className="glass-panel fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5"
          style={
            toast.type === 'success'
              ? { border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 30px rgba(52,211,153,0.25)' }
              : { border: '1px solid rgba(248,113,113,0.4)', boxShadow: '0 0 30px rgba(248,113,113,0.2)' }
          }
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
            style={
              toast.type === 'success'
                ? { background: 'rgba(52,211,153,0.15)', color: 'var(--color-green)' }
                : { background: 'rgba(248,113,113,0.15)', color: 'var(--color-red)' }
            }
          >
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <div>
            <p
              className="font-display text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: toast.type === 'success' ? 'var(--color-green)' : 'var(--color-red)' }}
            >
              {toast.type === 'success' ? 'Command Accepted' : 'Command Rejected'}
            </p>
            <p className="mt-0.5 font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
              {toast.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
