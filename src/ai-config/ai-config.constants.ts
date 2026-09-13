export interface AiConfigEntry {
  /** Duong dan tuong doi tinh tu thu muc .claude/ */
  path: string;
  label: string;
  group: 'department' | 'system-rule' | 'skill';
}

/**
 * Whitelist cac file .md duoc phep doc/ghi qua API. BAT BUOC dung whitelist
 * nay thay vi ghep truc tiep tham so URL vao duong dan file, de tranh path
 * traversal (vd ?agentName=../../.env).
 */
export const AI_CONFIG_MAP: Record<string, AiConfigEntry> = {
  finance: { path: 'agents/finance.md', label: 'Tài chính', group: 'department' },
  business: { path: 'agents/business.md', label: 'Kinh doanh', group: 'department' },
  marketing: { path: 'agents/marketing.md', label: 'Marketing', group: 'department' },
  synthesizer: { path: 'agents/synthesizer.md', label: 'Tổng hợp', group: 'department' },
  'data-strict': { path: 'rules/data-strict.md', label: 'Toàn vẹn số liệu', group: 'system-rule' },
  'output-html': { path: 'rules/output-html.md', label: 'Định dạng HTML Email', group: 'system-rule' },
  'content-writing': { path: 'skills/content-writing.md', label: 'Viết content (Marketing)', group: 'skill' },
  'market-research': { path: 'skills/market-research.md', label: 'Đọc tín hiệu thị trường (Marketing)', group: 'skill' },
  'customer-psychology': {
    path: 'skills/customer-psychology.md',
    label: 'Hành vi/tâm lý khách hàng (Marketing)',
    group: 'skill',
  },
  'marketing-psychology-retail': {
    path: 'skills/marketing-psychology-retail.md',
    label: 'Tâm lý học marketing bán lẻ (Marketing)',
    group: 'skill',
  },
  'customer-behavior-signals': {
    path: 'skills/customer-behavior-signals.md',
    label: 'Tín hiệu hành vi khách hàng (Marketing)',
    group: 'skill',
  },
  'plan-tracking': { path: 'skills/plan-tracking.md', label: 'Bám kế hoạch kinh doanh (Kinh doanh)', group: 'skill' },
  'expense-summary': { path: 'skills/expense-summary.md', label: 'Tổng hợp thu chi tháng (Tài chính)', group: 'skill' },
  'content-creator': { path: 'agents/content-creator.md', label: 'Content Creator (tạo content hàng ngày)', group: 'department' },
  'social-post': { path: 'skills/social-post.md', label: 'Viết bài Facebook/Zalo (Content Creator)', group: 'skill' },
  'ad-script': { path: 'skills/ad-script.md', label: 'Kịch bản quảng cáo (Content Creator)', group: 'skill' },
  'finance-daily': { path: 'agents/finance-daily.md', label: 'Tài chính (tư vấn hàng ngày)', group: 'department' },
  'business-daily': { path: 'agents/business-daily.md', label: 'Kinh doanh (tư vấn hàng ngày)', group: 'department' },
  'marketing-daily': { path: 'agents/marketing-daily.md', label: 'Marketing (tư vấn hàng ngày)', group: 'department' },
};
