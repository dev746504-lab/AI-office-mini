export type AiConfigGroup = 'department' | 'system-rule' | 'skill';

export interface AiConfigEntry {
  agentName: string;
  path: string;
  label: string;
  group: AiConfigGroup;
}

export interface AiConfigResult extends AiConfigEntry {
  content: string;
}

export interface ApiError extends Error {
  status?: number;
}

export type UserRole = 'admin' | 'ai_manager';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface BusinessPlan {
  id: number;
  month: string;
  targetRevenue: number;
  notes: string | null;
  updatedAt: string;
}

export interface AppSettingsData {
  kiotvietClientId: string | null;
  kiotvietClientSecret: string | null;
  kiotvietRetailer: string | null;
  kiotvietTokenUrl: string;
  kiotvietApiBaseUrl: string;
  anthropicApiKey: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  reportEmailFrom: string | null;
  reportEmailTo: string | null;
  reportSendHour: number;
  reportSendMinute: number;
  contentSendHour: number;
  contentSendMinute: number;
  updatedAt?: string;
}

export interface BrandContext {
  id?: number;
  storeName: string | null;
  storeAddress: string | null;
  productsOverview: string | null;
  targetAudience: string | null;
  toneOfVoice: string | null;
  uniquePoints: string | null;
  updatedAt?: string;
}

export interface ContentScheduleItem {
  id?: number;
  dayOfWeek: number;
  theme: string | null;
  notes: string | null;
}

export interface AgentSendConfig {
  id?: number;
  agentName: string;
  sendHour: number;
  sendMinute: number;
  enabled: boolean;
}

export interface AgentScheduleItem {
  id?: number;
  agentName: string;
  dayOfWeek: number;
  theme: string | null;
  notes: string | null;
}
