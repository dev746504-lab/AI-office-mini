export interface AgentTheme {
  color: string;
  glow: string;
  hasMonitor?: boolean;
  timing: { bd: string; bdy: string; bld: string; bldy: string; fd: string; fdy: string };
}

/**
 * Theo dung bang mau 5 bot trong login.html (bot-a..e) de dong bo hinh anh
 * xuyen suot he thong. Bot con lai (do) khong gan agent nao - chi la nhan
 * vat dung nen cho dung tinh than "5 nhan vat AI dang ngoi cho lenh".
 */
export const AGENT_THEME: Record<string, AgentTheme> = {
  finance: {
    color: 'var(--color-cyan)',
    glow: 'rgba(0, 217, 245, 0.5)',
    timing: { bd: '3.6s', bdy: '0s', bld: '2.8s', bldy: '0s', fd: '4.2s', fdy: '0s' },
  },
  business: {
    color: 'var(--color-purple)',
    glow: 'rgba(167, 139, 250, 0.5)',
    timing: { bd: '3.2s', bdy: '.65s', bld: '3.1s', bldy: '.4s', fd: '3.8s', fdy: '.7s' },
  },
  marketing: {
    color: 'var(--color-amber)',
    glow: 'rgba(251, 191, 36, 0.5)',
    timing: { bd: '3.8s', bdy: '1.95s', bld: '2.2s', bldy: '.2s', fd: '3.5s', fdy: '1.8s' },
  },
  synthesizer: {
    color: 'var(--color-green)',
    glow: 'rgba(52, 211, 153, 0.5)',
    hasMonitor: true,
    timing: { bd: '4.0s', bdy: '1.3s', bld: '2.5s', bldy: '.8s', fd: '4.6s', fdy: '1.2s' },
  },
};

export const STANDBY_BOT_THEME: AgentTheme = {
  color: 'var(--color-red)',
  glow: 'rgba(248, 113, 113, 0.5)',
  timing: { bd: '3.4s', bdy: '2.6s', bld: '3.3s', bldy: '.6s', fd: '4.0s', fdy: '2.3s' },
};

const RULE_ICONS: Record<string, string> = {
  'data-strict': '🛡️',
  'output-html': '🎨',
};

const SKILL_ICONS: Record<string, string> = {
  'content-writing': '✍️',
  'market-research': '🔎',
  'customer-psychology': '🧠',
  'plan-tracking': '📈',
  'expense-summary': '🧾',
};

export function getAgentTheme(agentName: string): AgentTheme {
  return AGENT_THEME[agentName] ?? STANDBY_BOT_THEME;
}

export function getRuleIcon(agentName: string): string {
  return RULE_ICONS[agentName] ?? '📜';
}

export function getSkillIcon(agentName: string): string {
  return SKILL_ICONS[agentName] ?? '🧩';
}

/** Mau + icon hien thi cho 1 muc cau hinh AI, tuy theo nhom (department/system-rule/skill). */
export function getEntryVisual(entry: {
  agentName: string;
  group: 'department' | 'system-rule' | 'skill';
}): { color: string; icon?: string } {
  if (entry.group === 'skill') {
    return { color: 'var(--color-purple)', icon: getSkillIcon(entry.agentName) };
  }
  if (entry.group === 'system-rule') {
    return { color: 'var(--color-dim)', icon: getRuleIcon(entry.agentName) };
  }
  return { color: AGENT_THEME[entry.agentName]?.color ?? STANDBY_BOT_THEME.color };
}
