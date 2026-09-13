import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OfficeScene } from '../components/login/OfficeScene';
import { LoginForm } from '../components/login/LoginForm';
import { useAuth } from '../auth/AuthContext';
import { useTypewriter } from '../hooks/useTypewriter';
import { fadeUp } from '../motionVariants';

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Uu tien: hover nut Login (nguoc nhin) > dang go password (che mat) > idle.
  const mascotState = useMemo(
    () => (buttonHovered ? 'attention' : passwordFocused ? 'peek' : 'idle'),
    [buttonHovered, passwordFocused],
  );

  const title = useTypewriter('Welcome to the AI Office', 45);

  const handleSubmit = async (email: string, password: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      const from = (location.state as LocationState | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col-reverse overflow-hidden font-body md:flex-row" style={{ background: 'var(--color-void)' }}>
      {/* Ben trai: Form */}
      <div
        className="relative flex w-full shrink-0 items-center justify-center overflow-auto p-6 md:h-full md:w-[42%] md:max-w-[480px]"
        style={{ background: 'linear-gradient(150deg, #05080f 0%, #070d1c 100%)' }}
      >
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="w-full max-w-sm py-8">
          <div className="mb-8 text-center">
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
              style={{ background: 'rgba(0,217,245,0.08)', border: '1px solid rgba(0,217,245,0.2)', color: 'var(--color-cyan)' }}
            >
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-current" />
              System Online
            </span>
            <h1 className="min-h-[62px] font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              {title}
              <span className="cursor-blink" style={{ color: 'var(--color-cyan)' }}>
                ▌
              </span>
            </h1>
            <p className="mt-2 font-mono text-[11px] tracking-widest" style={{ color: 'var(--color-mono-dim)' }}>
              // Authentication Required
            </p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
            onPasswordFocus={() => setPasswordFocused(true)}
            onPasswordBlur={() => setPasswordFocused(false)}
            onButtonHoverStart={() => setButtonHovered(true)}
            onButtonHoverEnd={() => setButtonHovered(false)}
          />

          <p className="mt-6 text-center font-mono text-[10px]" style={{ color: 'var(--color-faint)' }}>
            sys_v1.0.0 · secure channel · UTC+7
          </p>
        </motion.div>
      </div>

      {/* Ben phai (desktop) / phia tren (mobile, nho flex-col-reverse): Van phong AI 2.5D */}
      <div className="relative h-40 shrink-0 md:h-full md:flex-1">
        <OfficeScene state={mascotState} />
      </div>
    </div>
  );
}
