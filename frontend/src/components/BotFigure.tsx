import './BotFigure.css';

export interface BotFigureProps {
  /** Mau chu dao (currentColor) - vd 'var(--color-cyan)' hoac ma hex. */
  color: string;
  /** true khi day la agent dang duoc chon - bot se ngang dau len "nhan lenh". */
  active?: boolean;
  /** Bot cua Synthesizer co them man hinh monitor phia tren dau. */
  hasMonitor?: boolean;
  /** Toc do bob/led/eye rieng cho tung bot de tranh dong bo cung nhau. */
  timing?: { bd?: string; bdy?: string; bld?: string; bldy?: string; fd?: string; fdy?: string };
  className?: string;
}

export function BotFigure({ color, active = false, hasMonitor = false, timing, className }: BotFigureProps) {
  const style = {
    '--bot-color': color,
    ...(timing?.bd ? { '--bd': timing.bd } : {}),
    ...(timing?.bdy ? { '--bdy': timing.bdy } : {}),
    ...(timing?.bld ? { '--bld': timing.bld } : {}),
    ...(timing?.bldy ? { '--bldy': timing.bldy } : {}),
    ...(timing?.fd ? { '--fd': timing.fd } : {}),
    ...(timing?.fdy ? { '--fdy': timing.fdy } : {}),
  } as React.CSSProperties;

  return (
    <div
      className={`war-bot ${active ? 'commanding frozen' : ''} ${className ?? ''}`}
      style={style}
      aria-hidden="true"
    >
      {hasMonitor && (
        <div className="monitor">
          <div className="monitor-line" />
          <div className="monitor-line" />
          <div className="monitor-line" />
        </div>
      )}
      <div className="bot-head">
        <div className="eyes">
          <span className="eye" />
          <span className="eye" />
        </div>
        <div className="mouth" />
      </div>
      <div className="bot-body">
        <div className="arm arm-l" />
        <div className="arm arm-r" />
        <div className="chest" />
      </div>
    </div>
  );
}
