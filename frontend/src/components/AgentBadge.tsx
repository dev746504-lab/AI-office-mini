interface AgentBadgeProps {
  color: string;
  icon?: string;
  active?: boolean;
  size?: number;
}

/** Avatar vector don gian (khong phai emoji anh) dai dien cho 1 AI tren the sidebar. */
export function AgentBadge({ color, icon, active = false, size = 44 }: AgentBadgeProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-2xl border transition-all duration-300"
        style={{
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          borderColor: active ? color : 'rgba(255,255,255,0.1)',
          boxShadow: active ? `0 0 18px color-mix(in srgb, ${color} 60%, transparent)` : 'none',
          color,
        }}
      >
        {icon ? (
          <span style={{ fontSize: size * 0.42 }}>{icon}</span>
        ) : (
          <div className="flex gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
          </div>
        )}
      </div>
      {!icon && (
        <span
          className="status-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
          style={{ background: '#34D399', borderColor: 'var(--color-void)' }}
          title="Online"
        />
      )}
    </div>
  );
}
