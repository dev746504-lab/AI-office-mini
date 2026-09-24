import type { AgentScheduleItem, AgentSendConfig, AiConfigEntry, AiConfigResult, ApiError, AppSettingsData, AuthUser, BrandContext, BusinessPlan, ContentScheduleItem, ReportFeedback, ReportLog } from './types';
import { clearToken, getToken } from './auth/token';

const LOGIN_PATH = '/ai-agent-config/login';

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && window.location.pathname !== LOGIN_PATH) {
      // Token het han/khong hop le - dang xuat va quay ve trang login.
      clearToken();
      window.location.assign(LOGIN_PATH);
    }

    const rawMessage =
      data && typeof data === 'object' && 'message' in data ? (data as { message: unknown }).message : null;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : `HTTP ${res.status}`;

    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }

  return data as T;
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── AI Configs ────────────────────────────────────────────────────────────

export function fetchConfigList(): Promise<AiConfigEntry[]> {
  return fetch('/api/ai-configs', { headers: authHeaders() }).then((res) => parseJsonOrThrow<AiConfigEntry[]>(res));
}

export function fetchConfigContent(agentName: string): Promise<AiConfigResult> {
  return fetch(`/api/ai-configs/${encodeURIComponent(agentName)}`, { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<AiConfigResult>(res),
  );
}

export function saveConfigContent(agentName: string, content: string): Promise<AiConfigResult> {
  return fetch(`/api/ai-configs/${encodeURIComponent(agentName)}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content }),
  }).then((res) => parseJsonOrThrow<AiConfigResult>(res));
}

// ── Settings (admin only) ───────────────────────────────────────────────────

export function fetchSettings(): Promise<AppSettingsData> {
  return fetch('/api/settings', { headers: authHeaders() }).then((res) => parseJsonOrThrow<AppSettingsData>(res));
}

export function saveSettings(data: Partial<AppSettingsData>): Promise<AppSettingsData> {
  return fetch('/api/settings', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }).then((res) => parseJsonOrThrow<AppSettingsData>(res));
}

export function sendTestEmail(): Promise<{ message: string }> {
  return fetch('/api/reports/test-email', {
    method: 'POST',
    headers: authHeaders(),
  }).then((res) => parseJsonOrThrow<{ message: string }>(res));
}

// ── Auth / Users (admin only cho quan ly user) ─────────────────────────────

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((res) =>
    parseJsonOrThrow<AuthUser>(res),
  );
}

export function loginRequest(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((res) => parseJsonOrThrow<{ accessToken: string; user: AuthUser }>(res));
}

export function fetchUsers(): Promise<AuthUser[]> {
  return fetch('/api/auth/users', { headers: authHeaders() }).then((res) => parseJsonOrThrow<AuthUser[]>(res));
}

export function createUserRequest(email: string, password: string, role: AuthUser['role']): Promise<AuthUser> {
  return fetch('/api/auth/users', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email, password, role }),
  }).then((res) => parseJsonOrThrow<AuthUser>(res));
}

export function deleteUserRequest(id: number): Promise<{ success: boolean }> {
  return fetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then((res) => parseJsonOrThrow<{ success: boolean }>(res));
}

// ── Ke hoach kinh doanh (admin only) ────────────────────────────────────────

export function fetchBusinessPlans(): Promise<BusinessPlan[]> {
  return fetch('/api/business-plan', { headers: authHeaders() }).then((res) => parseJsonOrThrow<BusinessPlan[]>(res));
}

export function saveBusinessPlan(
  month: string,
  targetRevenue: number,
  notes: string | null,
): Promise<BusinessPlan> {
  return fetch('/api/business-plan', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ month, targetRevenue, notes }),
  }).then((res) => parseJsonOrThrow<BusinessPlan>(res));
}

export function deleteBusinessPlan(month: string): Promise<{ success: boolean }> {
  return fetch(`/api/business-plan/${encodeURIComponent(month)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then((res) => parseJsonOrThrow<{ success: boolean }>(res));
}

// ── Brand Context (admin only) ───────────────────────────────────────────────

export function fetchBrandContext(): Promise<BrandContext | null> {
  return fetch('/api/content/brand-context', { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<BrandContext | null>(res),
  );
}

export function saveBrandContext(data: Partial<BrandContext>): Promise<BrandContext> {
  return fetch('/api/content/brand-context', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }).then((res) => parseJsonOrThrow<BrandContext>(res));
}

// ── Content Schedule (admin only) ───────────────────────────────────────────

export function fetchContentSchedule(): Promise<ContentScheduleItem[]> {
  return fetch('/api/content/schedule', { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<ContentScheduleItem[]>(res),
  );
}

export function saveContentScheduleItem(item: ContentScheduleItem): Promise<ContentScheduleItem> {
  return fetch('/api/content/schedule', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(item),
  }).then((res) => parseJsonOrThrow<ContentScheduleItem>(res));
}

// ── Agent Runner (admin only) ────────────────────────────────────────────────

export function fetchAgentConfigs(): Promise<AgentSendConfig[]> {
  return fetch('/api/agent-runner/config', { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<AgentSendConfig[]>(res),
  );
}

export function saveAgentConfig(data: AgentSendConfig): Promise<AgentSendConfig> {
  return fetch('/api/agent-runner/config', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }).then((res) => parseJsonOrThrow<AgentSendConfig>(res));
}

export function fetchAgentSchedule(agentName: string): Promise<AgentScheduleItem[]> {
  return fetch(`/api/agent-runner/schedule/${encodeURIComponent(agentName)}`, { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<AgentScheduleItem[]>(res),
  );
}

export function saveAgentScheduleItem(item: AgentScheduleItem): Promise<AgentScheduleItem> {
  return fetch(`/api/agent-runner/schedule/${encodeURIComponent(item.agentName)}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(item),
  }).then((res) => parseJsonOrThrow<AgentScheduleItem>(res));
}

// ── Lịch sử báo cáo ─────────────────────────────────────────────────────────

export function fetchReportLogs(): Promise<ReportLog[]> {
  return fetch('/api/reports/logs', { headers: authHeaders() }).then((res) =>
    parseJsonOrThrow<ReportLog[]>(res),
  );
}

export function submitReportFeedback(
  reportLogId: number,
  rating: number,
  comment?: string,
): Promise<ReportFeedback> {
  return fetch(`/api/reports/${reportLogId}/feedback`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ rating, comment }),
  }).then((res) => parseJsonOrThrow<ReportFeedback>(res));
}
