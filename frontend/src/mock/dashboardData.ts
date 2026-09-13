/**
 * Du lieu mau cho Dashboard - dung de dung giao dien ngay, thay bang API
 * KiotViet/backend thuc te sau (xem src/reports/kiotviet.service.ts o backend
 * de biet cac truong du lieu that su co san).
 */

export interface KpiDatum {
  id: string;
  label: string;
  icon: string;
  value: string;
  deltaPct: number;
  color: string;
}

export const KPI_DATA: KpiDatum[] = [
  { id: 'revenue', label: 'Tổng Doanh Thu', icon: '💰', value: '42.850.000₫', deltaPct: 5.2, color: 'var(--color-cyan)' },
  { id: 'orders', label: 'Tổng Đơn Hàng', icon: '🧾', value: '186', deltaPct: 3.1, color: 'var(--color-purple)' },
  { id: 'margin', label: 'Biên Lợi Nhuận', icon: '📊', value: '34.6%', deltaPct: -1.4, color: 'var(--color-green)' },
  { id: 'newCustomerRate', label: 'Tỷ Lệ Khách Mới', icon: '🆕', value: '21.3%', deltaPct: 2.8, color: 'var(--color-amber)' },
];

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  profit: number;
}

export const REVENUE_TREND: RevenueTrendPoint[] = [
  { date: '06/09', revenue: 32_500_000, profit: 10_800_000 },
  { date: '07/09', revenue: 35_100_000, profit: 11_500_000 },
  { date: '08/09', revenue: 29_800_000, profit: 9_200_000 },
  { date: '09/09', revenue: 38_200_000, profit: 12_600_000 },
  { date: '10/09', revenue: 40_650_000, profit: 13_950_000 },
  { date: '11/09', revenue: 40_700_000, profit: 13_100_000 },
  { date: '12/09', revenue: 42_850_000, profit: 14_830_000 },
];

export interface TopProductDatum {
  name: string;
  quantity: number;
}

export const TOP_PRODUCTS: TopProductDatum[] = [
  { name: 'Trà sữa trân châu đường đen', quantity: 152 },
  { name: 'Trà đào cam sả', quantity: 121 },
  { name: 'Hồng trà sữa nướng', quantity: 98 },
  { name: 'Matcha đá xay', quantity: 76 },
  { name: 'Trà vải hoa hồng', quantity: 64 },
];

export interface AiInsightEntry {
  id: string;
  timestamp: string;
  message: string;
  highlight?: boolean;
}

export const AI_INSIGHT_FEED: AiInsightEntry[] = [
  {
    id: 'latest',
    timestamp: 'Hôm nay 23:00',
    message:
      'Doanh thu hôm nay đạt 42.850.000₫, tăng 5.2% so với hôm qua. Trà sữa trân châu đường đen bán vượt kỳ vọng (152 ly). Cần chú ý chi phí nguyên liệu do tỷ lệ chiết khấu nhóm topping tăng nhẹ.',
    highlight: true,
  },
  {
    id: 'yesterday',
    timestamp: 'Hôm qua 23:00',
    message: 'Doanh thu ổn định, không phát sinh cảnh báo công nợ. Chi nhánh trung tâm dẫn đầu doanh số.',
  },
  {
    id: 'two-days-ago',
    timestamp: '2 ngày trước 23:00',
    message: 'Phát hiện tỷ lệ chiết khấu vượt 15% doanh thu gộp trong khung giờ 17h-19h — đã cảnh báo Giám đốc Tài chính.',
  },
];
