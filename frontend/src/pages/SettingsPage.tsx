import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AmbientGrid } from '../components/AmbientGrid';
import { CommandToast, type CommandToastState } from '../components/CommandToast';
import { useAuth } from '../auth/AuthContext';
import {
  createUserRequest,
  deleteBusinessPlan,
  deleteUserRequest,
  fetchAgentConfigs,
  fetchAgentSchedule,
  fetchBrandContext,
  fetchBusinessPlans,
  fetchContentSchedule,
  fetchSettings,
  fetchUsers,
  saveAgentConfig,
  saveAgentScheduleItem,
  saveBrandContext,
  saveBusinessPlan,
  saveContentScheduleItem,
  saveSettings,
  sendTestEmail,
} from '../api';
import { fadeUp, staggerContainer } from '../motionVariants';
import type { AgentScheduleItem, AgentSendConfig, AppSettingsData, AuthUser, BrandContext, BusinessPlan, ContentScheduleItem, UserRole } from '../types';

const DAY_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const AGENT_META = [
  { name: 'finance', label: 'Tài Chính', icon: '🧮', color: '#10b981' },
  { name: 'business', label: 'Kinh Doanh', icon: '📊', color: '#3b82f6' },
  { name: 'marketing', label: 'Marketing', icon: '📣', color: '#8b5cf6' },
];

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10.5px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-mono text-[10px]" style={{ color: 'var(--color-faint)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-cyan-400/40';

function SectionCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h2>
        <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
          {desc}
        </p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user: currentUser } = useAuth();

  const [settings, setSettings] = useState<AppSettingsData | null>(null);
  const [savedSettings, setSavedSettings] = useState<AppSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [toast, setToast] = useState<CommandToastState | null>(null);

  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('ai_manager');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  const [plans, setPlans] = useState<BusinessPlan[] | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [planMonth, setPlanMonth] = useState(currentMonthStr());
  const [planTarget, setPlanTarget] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planFormError, setPlanFormError] = useState<string | null>(null);

  const emptyBrand: BrandContext = { storeName: null, storeAddress: null, productsOverview: null, targetAudience: null, toneOfVoice: null, uniquePoints: null };
  const [brandEdit, setBrandEdit] = useState<BrandContext>(emptyBrand);
  const [savingBrand, setSavingBrand] = useState(false);

  const [schedule, setSchedule] = useState<ContentScheduleItem[]>([]);
  const [savingScheduleDay, setSavingScheduleDay] = useState<number | null>(null);

  const [agentConfigs, setAgentConfigs] = useState<AgentSendConfig[]>([]);
  const [savingAgentConfig, setSavingAgentConfig] = useState<string | null>(null);
  const [agentSchedules, setAgentSchedules] = useState<Record<string, AgentScheduleItem[]>>({});
  const [savingAgentSchedule, setSavingAgentSchedule] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: CommandToastState['type']) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSettings(data);
        setSavedSettings(data);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));

    fetchUsers()
      .then(setUsers)
      .catch((err: Error) => setUsersError(err.message));

    fetchBusinessPlans()
      .then(setPlans)
      .catch((err: Error) => setPlansError(err.message));

    fetchBrandContext()
      .then((data) => { if (data) setBrandEdit(data); })
      .catch(() => {});

    fetchContentSchedule()
      .then(setSchedule)
      .catch(() => {});

    fetchAgentConfigs()
      .then(setAgentConfigs)
      .catch(() => {});

    Promise.all(AGENT_META.map((a) => fetchAgentSchedule(a.name).then((s) => ({ name: a.name, schedule: s }))))
      .then((results) => {
        const map: Record<string, AgentScheduleItem[]> = {};
        for (const r of results) map[r.name] = r.schedule;
        setAgentSchedules(map);
      })
      .catch(() => {});
  }, []);

  const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);

  const update = <K extends keyof AppSettingsData>(key: K, value: AppSettingsData[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await sendTestEmail();
      showToast(res.message, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !isDirty) return;
    setSaving(true);
    try {
      const result = await saveSettings(settings);
      setSettings(result);
      setSavedSettings(result);
      showToast('Đã lưu cấu hình hệ thống.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setUserFormError(null);
    if (!newUserEmail || !newUserPassword) {
      setUserFormError('Nhập đủ email và mật khẩu.');
      return;
    }
    setCreatingUser(true);
    try {
      const created = await createUserRequest(newUserEmail.trim().toLowerCase(), newUserPassword, newUserRole);
      setUsers((prev) => (prev ? [...prev, created] : [created]));
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('ai_manager');
      showToast(`Đã tạo tài khoản "${created.email}".`, 'success');
    } catch (err) {
      setUserFormError((err as Error).message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: number, email: string) => {
    const confirmed = window.confirm(`Xoá tài khoản "${email}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    try {
      await deleteUserRequest(id);
      setUsers((prev) => prev?.filter((u) => u.id !== id) ?? null);
      showToast(`Đã xoá tài khoản "${email}".`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleSavePlan = async () => {
    setPlanFormError(null);
    if (!/^\d{4}-\d{2}$/.test(planMonth)) {
      setPlanFormError('Chọn tháng hợp lệ.');
      return;
    }
    const targetRevenue = Number(planTarget);
    if (!Number.isFinite(targetRevenue) || targetRevenue < 0) {
      setPlanFormError('Mục tiêu doanh thu phải là số không âm.');
      return;
    }
    setSavingPlan(true);
    try {
      const saved = await saveBusinessPlan(planMonth, targetRevenue, planNotes.trim() || null);
      setPlans((prev) => {
        const others = (prev ?? []).filter((p) => p.month !== saved.month);
        return [saved, ...others].sort((a, b) => (a.month < b.month ? 1 : -1));
      });
      setPlanTarget('');
      setPlanNotes('');
      showToast(`Đã lưu kế hoạch tháng ${saved.month}.`, 'success');
    } catch (err) {
      setPlanFormError((err as Error).message);
    } finally {
      setSavingPlan(false);
    }
  };

  const getAgentConfig = (agentName: string): AgentSendConfig =>
    agentConfigs.find((c) => c.agentName === agentName) ?? { agentName, sendHour: 8, sendMinute: 0, enabled: true };

  const updateAgentConfig = (agentName: string, field: keyof AgentSendConfig, value: unknown) => {
    setAgentConfigs((prev) => {
      const idx = prev.findIndex((c) => c.agentName === agentName);
      const item = idx >= 0 ? { ...prev[idx], [field]: value } : { agentName, sendHour: 8, sendMinute: 0, enabled: true, [field]: value };
      if (idx >= 0) { const next = [...prev]; next[idx] = item as AgentSendConfig; return next; }
      return [...prev, item as AgentSendConfig];
    });
  };

  const handleSaveAgentConfig = async (agentName: string) => {
    setSavingAgentConfig(agentName);
    try {
      const cfg = getAgentConfig(agentName);
      const saved = await saveAgentConfig(cfg);
      setAgentConfigs((prev) => {
        const idx = prev.findIndex((c) => c.agentName === agentName);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      showToast(`Đã lưu lịch gửi cho agent ${agentName}.`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingAgentConfig(null);
    }
  };

  const getAgentScheduleItem = (agentName: string, dow: number): AgentScheduleItem =>
    (agentSchedules[agentName] ?? []).find((s) => s.dayOfWeek === dow) ?? { agentName, dayOfWeek: dow, theme: null, notes: null };

  const updateAgentScheduleItem = (agentName: string, dow: number, field: 'theme' | 'notes', value: string) => {
    setAgentSchedules((prev) => {
      const list = prev[agentName] ?? [];
      const idx = list.findIndex((s) => s.dayOfWeek === dow);
      const item = idx >= 0 ? { ...list[idx], [field]: value || null } : { agentName, dayOfWeek: dow, theme: null, notes: null, [field]: value || null };
      const next = idx >= 0 ? [...list.slice(0, idx), item, ...list.slice(idx + 1)] : [...list, item];
      return { ...prev, [agentName]: next };
    });
  };

  const handleSaveAgentScheduleItem = async (agentName: string, dow: number) => {
    const key = `${agentName}:${dow}`;
    setSavingAgentSchedule(key);
    try {
      const item = getAgentScheduleItem(agentName, dow);
      const saved = await saveAgentScheduleItem(item);
      setAgentSchedules((prev) => {
        const list = prev[agentName] ?? [];
        const idx = list.findIndex((s) => s.dayOfWeek === dow);
        const next = idx >= 0 ? [...list.slice(0, idx), saved, ...list.slice(idx + 1)] : [...list, saved];
        return { ...prev, [agentName]: next };
      });
      showToast(`Đã lưu kịch bản ${DAY_LABELS[dow]} cho ${agentName}.`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingAgentSchedule(null);
    }
  };

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      await saveBrandContext(brandEdit);
      showToast('Đã lưu thông tin thương hiệu.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingBrand(false);
    }
  };

  const getScheduleItem = (dow: number): ContentScheduleItem =>
    schedule.find((s) => s.dayOfWeek === dow) ?? { dayOfWeek: dow, theme: null, notes: null };

  const updateScheduleItem = (dow: number, field: 'theme' | 'notes', value: string) => {
    setSchedule((prev) => {
      const idx = prev.findIndex((s) => s.dayOfWeek === dow);
      const item = idx >= 0 ? { ...prev[idx], [field]: value || null } : { dayOfWeek: dow, theme: null, notes: null, [field]: value || null };
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
      return [...prev, item];
    });
  };

  const handleSaveScheduleItem = async (dow: number) => {
    setSavingScheduleDay(dow);
    try {
      const item = getScheduleItem(dow);
      const saved = await saveContentScheduleItem(item);
      setSchedule((prev) => {
        const idx = prev.findIndex((s) => s.dayOfWeek === dow);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
      showToast(`Đã lưu lịch ${DAY_LABELS[dow]}.`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingScheduleDay(null);
    }
  };

  const handleDeletePlan = async (month: string) => {
    const confirmed = window.confirm(`Xoá kế hoạch kinh doanh tháng ${month}?`);
    if (!confirmed) return;
    try {
      await deleteBusinessPlan(month);
      setPlans((prev) => prev?.filter((p) => p.month !== month) ?? null);
      showToast(`Đã xoá kế hoạch tháng ${month}.`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="relative flex h-full items-center justify-center p-6">
        <AmbientGrid />
        <p className="relative z-10 font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
          &gt; Đang tải cấu hình...
        </p>
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="relative flex h-full items-center justify-center p-6">
        <AmbientGrid />
        <p className="relative z-10 font-mono text-xs" style={{ color: 'var(--color-red)' }}>
          {loadError ?? 'Không tải được cấu hình.'}
        </p>
      </div>
    );
  }

  const reportTimeValue = `${pad2(settings.reportSendHour ?? 23)}:${pad2(settings.reportSendMinute ?? 0)}`;
  const contentTimeValue = `${pad2(settings.contentSendHour ?? 8)}:${pad2(settings.contentSendMinute ?? 0)}`;

  return (
    <div className="relative min-h-full p-4 pb-24 md:p-6">
      <AmbientGrid />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 flex flex-col gap-6">
        <motion.div
          variants={fadeUp}
          className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:-mx-6 md:px-6"
          style={{ backdropFilter: 'blur(12px)', background: 'var(--color-bg-sticky, rgba(3,16,24,0.82))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="font-display text-xl font-bold tracking-wide" style={{ color: 'var(--color-ink)' }}>
              CÀI ĐẶT HỆ THỐNG
            </h1>
            <p className="mt-1 font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
              // Cấu hình API &amp; dịch vụ — lưu vào database
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider"
              style={
                isDirty
                  ? { background: 'rgba(251,191,36,0.12)', color: 'var(--color-amber)' }
                  : { background: 'rgba(52,211,153,0.12)', color: 'var(--color-green)' }
              }
            >
              {isDirty ? 'Chưa lưu' : 'Đã lưu'}
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#031018] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </motion.div>

        <SectionCard title="🏪 KiotViet API" desc="Kết nối với hệ thống bán hàng KiotViet">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Client ID">
              <input
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.kiotvietClientId ?? ''}
                onChange={(e) => update('kiotvietClientId', e.target.value)}
              />
            </Field>
            <Field label="Retailer (tên shop)">
              <input
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.kiotvietRetailer ?? ''}
                onChange={(e) => update('kiotvietRetailer', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Client Secret">
            <input
              type="password"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={settings.kiotvietClientSecret ?? ''}
              onChange={(e) => update('kiotvietClientSecret', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Token URL" hint="Thường không cần đổi">
              <input
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.kiotvietTokenUrl}
                onChange={(e) => update('kiotvietTokenUrl', e.target.value)}
              />
            </Field>
            <Field label="API Base URL" hint="Thường không cần đổi">
              <input
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.kiotvietApiBaseUrl}
                onChange={(e) => update('kiotvietApiBaseUrl', e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="🧠 Anthropic AI" desc="API key để gọi Claude phân tích báo cáo">
          <Field label="API Key" hint="Lấy tại console.anthropic.com — giữ bí mật">
            <input
              type="password"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              placeholder="sk-ant-..."
              value={settings.anthropicApiKey ?? ''}
              onChange={(e) => update('anthropicApiKey', e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard title="⏰ Lịch gửi báo cáo" desc="Giờ gửi báo cáo kinh doanh hàng ngày (giờ Việt Nam)">
          <Field label="Giờ gửi" hint="Báo cáo luôn tổng hợp trọn vẹn dữ liệu ngày hôm trước, dù chọn giờ nào.">
            <input
              type="time"
              step={60}
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={reportTimeValue}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                update('reportSendHour', h);
                update('reportSendMinute', m);
              }}
            />
          </Field>
        </SectionCard>

        <SectionCard title="📱 Lịch gửi Content AI" desc="Giờ AI tự động tạo và gửi bài đăng Facebook/Zalo + kịch bản quảng cáo (giờ Việt Nam)">
          <Field label="Giờ gửi content" hint="AI sẽ tạo content cho ngày hôm nay và gửi email tới cùng danh sách người nhận với báo cáo.">
            <input
              type="time"
              step={60}
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={contentTimeValue}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                update('contentSendHour', h);
                update('contentSendMinute', m);
              }}
            />
          </Field>
        </SectionCard>

        <motion.div variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
              📈 Kế Hoạch Kinh Doanh
            </h2>
            <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
              Mục tiêu doanh thu theo tháng — để Agent Kinh doanh bám sát &amp; so sánh thực tế
            </p>
          </div>

          {plansError && (
            <p className="mb-3 font-mono text-xs" style={{ color: 'var(--color-red)' }}>
              {plansError}
            </p>
          )}

          <div className="mb-4 flex flex-col gap-2">
            {plans && plans.length === 0 && (
              <p className="font-mono text-xs" style={{ color: 'var(--color-faint)' }}>
                Chưa có kế hoạch nào — Agent Kinh doanh sẽ báo "chưa có kế hoạch" cho tới khi bạn thêm.
              </p>
            )}
            {plans?.map((p) => (
              <div
                key={p.month}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm" style={{ color: 'var(--color-ink)' }}>
                    Tháng {p.month} — mục tiêu {formatVnd(p.targetRevenue)}₫
                  </p>
                  {p.notes && (
                    <p className="mt-0.5 truncate font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
                      {p.notes}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePlan(p.month)}
                  className="shrink-0 font-mono text-xs transition-colors hover:text-red-400"
                  style={{ color: 'var(--color-dim)' }}
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-white/8 pt-4 sm:grid-cols-[auto_1fr_1fr_auto]">
            <input
              type="month"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={planMonth}
              onChange={(e) => setPlanMonth(e.target.value)}
            />
            <input
              type="number"
              min={0}
              placeholder="Mục tiêu doanh thu (đ)"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={planTarget}
              onChange={(e) => setPlanTarget(e.target.value)}
            />
            <input
              type="text"
              placeholder="Ghi chú (không bắt buộc)"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#031018] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingPlan ? '...' : 'Lưu'}
            </button>
          </div>
          {planFormError && (
            <p className="mt-2 font-mono text-xs" style={{ color: 'var(--color-red)' }}>
              {planFormError}
            </p>
          )}
        </motion.div>

        <SectionCard title="📧 Email / SMTP" desc="Gửi báo cáo hàng ngày qua email">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SMTP Host">
              <input
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.smtpHost ?? ''}
                onChange={(e) => update('smtpHost', e.target.value)}
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.smtpPort}
                onChange={(e) => update('smtpPort', Number(e.target.value))}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
            <input
              type="checkbox"
              checked={settings.smtpSecure}
              onChange={(e) => update('smtpSecure', e.target.checked)}
            />
            Dùng SSL/TLS (port 465)
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email / Username">
              <input
                type="email"
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.smtpUser ?? ''}
                onChange={(e) => update('smtpUser', e.target.value)}
              />
            </Field>
            <Field label="App Password" hint="Gmail: Bật 2FA → tạo App Password">
              <input
                type="password"
                className={inputClass}
                style={{ color: 'var(--color-ink)' }}
                value={settings.smtpPass ?? ''}
                onChange={(e) => update('smtpPass', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Tên người gửi">
            <input
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={settings.reportEmailFrom ?? ''}
              onChange={(e) => update('reportEmailFrom', e.target.value)}
            />
          </Field>
          <Field label="Người nhận" hint="Nhiều địa chỉ cách nhau bằng dấu phẩy">
            <input
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={settings.reportEmailTo ?? ''}
              onChange={(e) => update('reportEmailTo', e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-end border-t border-white/8 pt-3">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="rounded-xl border border-cyan-400/30 px-4 py-2 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {testingEmail ? '⏳ Đang gửi...' : '🧪 Gửi test email (data giả + Excel)'}
            </button>
          </div>
        </SectionCard>

        {/* Agent Runner — Finance, Business, Marketing */}
        {AGENT_META.map(({ name, label, icon, color }) => {
          const cfg = getAgentConfig(name);
          const timeVal = `${pad2(cfg.sendHour)}:${pad2(cfg.sendMinute)}`;
          return (
            <motion.div key={name} variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
                    {icon} AI {label} — Tư Vấn Tự Động
                  </h2>
                  <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
                    Tự viết bản tư vấn {label.toLowerCase()} hàng ngày theo kịch bản bạn đặt
                  </p>
                </div>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                  <input type="checkbox" checked={cfg.enabled} onChange={(e) => updateAgentConfig(name, 'enabled', e.target.checked)} />
                  Bật
                </label>
              </div>

              {/* Send time + save */}
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <Field label="Giờ gửi (VN)" hint="AI chạy và gửi email vào giờ này mỗi ngày">
                    <input
                      type="time"
                      step={60}
                      className={inputClass}
                      style={{ color: 'var(--color-ink)' }}
                      value={timeVal}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map(Number);
                        updateAgentConfig(name, 'sendHour', h);
                        updateAgentConfig(name, 'sendMinute', m);
                      }}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveAgentConfig(name)}
                  disabled={savingAgentConfig === name}
                  className="shrink-0 rounded-xl px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: color }}
                >
                  {savingAgentConfig === name ? '...' : 'Lưu giờ gửi'}
                </button>
              </div>

              {/* Weekly schedule */}
              <div>
                <p className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
                  Kịch bản hàng tuần
                </p>
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                    const item = getAgentScheduleItem(name, dow);
                    const key = `${name}:${dow}`;
                    return (
                      <div key={dow} className="flex flex-wrap items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-2.5">
                        <span className="w-20 shrink-0 pt-2.5 font-mono text-[11px]" style={{ color: 'var(--color-dim)' }}>
                          {DAY_LABELS[dow]}
                        </span>
                        <input
                          className={`${inputClass} flex-1 min-w-[120px]`}
                          style={{ color: 'var(--color-ink)' }}
                          placeholder="Chủ đề / câu hỏi cho AI..."
                          value={item.theme ?? ''}
                          onChange={(e) => updateAgentScheduleItem(name, dow, 'theme', e.target.value)}
                        />
                        <input
                          className={`${inputClass} flex-1 min-w-[120px]`}
                          style={{ color: 'var(--color-ink)' }}
                          placeholder="Ghi chú bổ sung (không bắt buộc)"
                          value={item.notes ?? ''}
                          onChange={(e) => updateAgentScheduleItem(name, dow, 'notes', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveAgentScheduleItem(name, dow)}
                          disabled={savingAgentSchedule === key}
                          className="shrink-0 rounded-xl bg-white/8 px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          {savingAgentSchedule === key ? '...' : 'Lưu'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Brand Context */}
        <motion.div variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
              🏷️ Thông Tin Thương Hiệu
            </h2>
            <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
              AI dùng thông tin này để tạo content phù hợp với cửa hàng của bạn
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tên cửa hàng">
                <input className={inputClass} style={{ color: 'var(--color-ink)' }} value={brandEdit.storeName ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, storeName: e.target.value || null }))} />
              </Field>
              <Field label="Địa chỉ">
                <input className={inputClass} style={{ color: 'var(--color-ink)' }} value={brandEdit.storeAddress ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, storeAddress: e.target.value || null }))} />
              </Field>
            </div>
            <Field label="Mô tả sản phẩm / dịch vụ" hint="Liệt kê các mặt hàng chính, thế mạnh sản phẩm">
              <textarea rows={3} className={inputClass} style={{ color: 'var(--color-ink)', resize: 'vertical' }} value={brandEdit.productsOverview ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, productsOverview: e.target.value || null }))} />
            </Field>
            <Field label="Đối tượng khách hàng mục tiêu">
              <input className={inputClass} style={{ color: 'var(--color-ink)' }} placeholder="vd: phụ nữ 25–45, thích làm đẹp, sống ở TP.HCM" value={brandEdit.targetAudience ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, targetAudience: e.target.value || null }))} />
            </Field>
            <Field label="Tone of Voice" hint="Phong cách viết mong muốn">
              <input className={inputClass} style={{ color: 'var(--color-ink)' }} placeholder="vd: thân thiện, gần gũi, hài hước nhẹ nhàng" value={brandEdit.toneOfVoice ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, toneOfVoice: e.target.value || null }))} />
            </Field>
            <Field label="Điểm khác biệt (USP)">
              <textarea rows={2} className={inputClass} style={{ color: 'var(--color-ink)', resize: 'vertical' }} placeholder="vd: nguồn hàng chính hãng, giao hàng nhanh 2h nội thành" value={brandEdit.uniquePoints ?? ''} onChange={(e) => setBrandEdit((p) => ({ ...p, uniquePoints: e.target.value || null }))} />
            </Field>
            <div>
              <button type="button" onClick={handleSaveBrand} disabled={savingBrand} className="rounded-xl bg-cyan-500 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#031018] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                {savingBrand ? 'Đang lưu...' : 'Lưu thông tin thương hiệu'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Schedule */}
        <motion.div variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
              📅 Lịch Content Hàng Tuần
            </h2>
            <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
              Đặt chủ đề cho từng ngày — AI sẽ viết content bám theo lịch này
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
              const item = getScheduleItem(dow);
              return (
                <div key={dow} className="flex flex-wrap items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <span className="w-20 shrink-0 pt-2.5 font-mono text-[11px] font-medium" style={{ color: 'var(--color-dim)' }}>
                    {DAY_LABELS[dow]}
                  </span>
                  <input
                    className={`${inputClass} flex-1 min-w-[140px]`}
                    style={{ color: 'var(--color-ink)' }}
                    placeholder="Chủ đề (vd: Khuyến mãi, Spotlight sản phẩm...)"
                    value={item.theme ?? ''}
                    onChange={(e) => updateScheduleItem(dow, 'theme', e.target.value)}
                  />
                  <input
                    className={`${inputClass} flex-1 min-w-[140px]`}
                    style={{ color: 'var(--color-ink)' }}
                    placeholder="Ghi chú cho AI (không bắt buộc)"
                    value={item.notes ?? ''}
                    onChange={(e) => updateScheduleItem(dow, 'notes', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScheduleItem(dow)}
                    disabled={savingScheduleDay === dow}
                    className="shrink-0 rounded-xl bg-white/8 px-3.5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {savingScheduleDay === dow ? '...' : 'Lưu'}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-panel glass-edge-glow rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
              👤 Người Dùng &amp; Phân Quyền
            </h2>
            <p className="font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
              Admin: toàn quyền · Quản lý AI: chỉ Dashboard (xem) &amp; Cấu hình AI (sửa)
            </p>
          </div>

          {usersError && (
            <p className="mb-3 font-mono text-xs" style={{ color: 'var(--color-red)' }}>
              {usersError}
            </p>
          )}

          <div className="mb-4 flex flex-col gap-2">
            {users?.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm" style={{ color: 'var(--color-ink)' }}>
                    {u.email}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
                        (bạn)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                    style={
                      u.role === 'admin'
                        ? { background: 'rgba(0,217,245,0.12)', color: 'var(--color-cyan)' }
                        : { background: 'rgba(167,139,250,0.12)', color: 'var(--color-purple)' }
                    }
                  >
                    {u.role === 'admin' ? 'Admin' : 'Quản lý AI'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    disabled={u.id === currentUser?.id}
                    className="font-mono text-xs transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                    style={{ color: 'var(--color-dim)' }}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-white/8 pt-4 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input
              type="email"
              placeholder="email@ai-office.sys"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Mật khẩu (≥ 6 ký tự)"
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
            <select
              className={inputClass}
              style={{ color: 'var(--color-ink)' }}
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as UserRole)}
            >
              <option value="ai_manager">Quản lý AI</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="button"
              onClick={handleCreateUser}
              disabled={creatingUser}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[#031018] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingUser ? '...' : '+ Thêm'}
            </button>
          </div>
          {userFormError && (
            <p className="mt-2 font-mono text-xs" style={{ color: 'var(--color-red)' }}>
              {userFormError}
            </p>
          )}
        </motion.div>
      </motion.div>

      <CommandToast toast={toast} />
    </div>
  );
}
