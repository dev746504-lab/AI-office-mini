import { motion } from 'framer-motion';
import { AgentBadge } from './AgentBadge';
import { getEntryVisual } from '../agentTheme';
import type { AiConfigEntry, AiConfigGroup } from '../types';

interface AgentSidebarProps {
  entries: AiConfigEntry[];
  selected: string | null;
  dirtyAgent: string | null;
  onSelect: (agentName: string) => void;
}

const GROUP_ORDER: AiConfigGroup[] = ['department', 'skill', 'system-rule'];

const GROUP_LABELS: Record<AiConfigGroup, string> = {
  department: 'Phòng ban',
  skill: 'Kỹ năng',
  'system-rule': 'Ràng buộc hệ thống',
};

const GROUP_TAG: Record<AiConfigGroup, string> = {
  department: 'AGENT',
  skill: 'SKILL',
  'system-rule': 'RULE',
};

function AgentCard({
  entry,
  isActive,
  isDirty,
  onSelect,
}: {
  entry: AiConfigEntry;
  isActive: boolean;
  isDirty: boolean;
  onSelect: () => void;
}) {
  const { color, icon } = getEntryVisual(entry);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left transition-all duration-300 ${
        isActive ? '' : 'opacity-60 hover:opacity-100'
      }`}
      style={{ minWidth: 168 }}
    >
      <div className="glass-panel absolute inset-0 rounded-2xl" />
      {isActive && (
        <motion.div
          layoutId="agent-active-glow"
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid ${color}`,
            boxShadow: `0 0 26px color-mix(in srgb, ${color} 45%, transparent), inset 0 0 22px color-mix(in srgb, ${color} 12%, transparent)`,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        />
      )}

      <div className="relative z-10">
        <AgentBadge color={color} icon={icon} active={isActive} />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <p
          className="truncate font-display text-[11px] font-bold uppercase tracking-wider"
          style={{ color: isActive ? 'var(--color-ink)' : 'var(--color-dim)' }}
        >
          {entry.label}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
          {GROUP_TAG[entry.group]}
        </p>
      </div>
      {isDirty && (
        <span
          className="relative z-10 h-2 w-2 shrink-0 rounded-full"
          style={{ background: 'var(--color-amber)', boxShadow: '0 0 8px var(--color-amber)' }}
          title="Có thay đổi chưa lưu"
        />
      )}
    </button>
  );
}

export function AgentSidebar({ entries, selected, dirtyAgent, onSelect }: AgentSidebarProps) {
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: entries.filter((e) => e.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <nav className="flex w-full shrink-0 flex-row gap-3 overflow-x-auto px-4 py-3 md:w-72 md:flex-col md:gap-6 md:overflow-visible md:px-0 md:py-0">
      {groups.map(({ group, items }, idx) => (
        <div key={group} className="flex shrink-0 flex-row items-stretch gap-3 md:flex-col md:gap-2">
          {idx > 0 && <div className="my-auto block w-px self-stretch bg-white/10 md:hidden" />}
          <div className="flex shrink-0 flex-row gap-3 md:flex-col md:gap-2">
            <h2
              className="hidden px-1 font-mono text-[10px] uppercase tracking-[0.2em] md:block"
              style={{ color: 'var(--color-mono-dim)' }}
            >
              {GROUP_LABELS[group]}
            </h2>
            {items.map((entry) => (
              <AgentCard
                key={entry.agentName}
                entry={entry}
                isActive={entry.agentName === selected}
                isDirty={entry.agentName === dirtyAgent}
                onSelect={() => onSelect(entry.agentName)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
