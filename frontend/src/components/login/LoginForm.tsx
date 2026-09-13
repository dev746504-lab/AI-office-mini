import { useState, type FormEvent } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void> | void;
  submitting: boolean;
  error: string | null;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
  onButtonHoverStart: () => void;
  onButtonHoverEnd: () => void;
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LoginForm({
  onSubmit,
  submitting,
  error,
  onPasswordFocus,
  onPasswordBlur,
  onButtonHoverStart,
  onButtonHoverEnd,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit(email.trim(), password);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="font-mono text-[10.5px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
          Identifier
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="agent@ai-office.sys"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition-colors focus:border-cyan-400/40"
          style={{ color: 'var(--color-ink)' }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="font-mono text-[10.5px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
          Access Key
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-cyan-400/40"
            style={{ color: 'var(--color-ink)' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center transition-colors hover:text-cyan-300"
            style={{ color: 'var(--color-mono-dim)' }}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg px-3 py-2 font-mono text-xs"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--color-red)' }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        onMouseEnter={onButtonHoverStart}
        onMouseLeave={onButtonHoverEnd}
        onFocus={onButtonHoverStart}
        onBlur={onButtonHoverEnd}
        className="group relative mt-2 h-12 overflow-hidden rounded-xl font-display text-xs font-bold uppercase tracking-[0.14em] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, var(--color-cyan), #8b5cf6)', backgroundSize: '200% 200%', color: '#031018' }}
      >
        <span className="laser-sweep absolute inset-0" />
        <span className="relative">{submitting ? 'Đang xác thực...' : 'Access System'}</span>
      </button>
    </form>
  );
}
