export type ReportPeriodType = 'day' | 'week' | 'month';

export interface KiotVietInvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  discount: number;
}

export interface KiotVietInvoice {
  id: number;
  code: string;
  purchaseDate: string;
  branchName: string | null;
  customerName: string | null;
  total: number;
  totalPayment: number;
  discount: number;
  status: number;
  invoiceDetails: KiotVietInvoiceItem[];
}

export interface KiotVietDebtCustomer {
  customerName: string;
  debtAmount: number;
}

export interface DailyBreakdownEntry {
  date: string;
  revenue: number;
  invoiceCount: number;
  discount: number;
}

export interface TopProductSummary {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface BusinessPlanSummary {
  month: string;
  targetRevenue: number;
  notes: string | null;
}

/**
 * Payload day du duoc gui cho Claude - dung lam "nguon su that" duy nhat.
 * Cac agent CHI duoc phep dung so lieu xuat hien trong object nay.
 * Dung chung cho ca 3 chu ky bao cao: ngay/tuan/thang.
 */
export interface PeriodKiotVietData {
  periodType: ReportPeriodType;
  /** Mo ta ky bao cao bang tieng Viet, vd "Ngay 12/09/2026", "Tuan 07/09 - 13/09/2026". */
  periodLabel: string;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalInvoices: number;
  totalDiscount: number;
  newDebtInPeriod: number;
  /** Doanh thu/so hoa don/chiet khau theo tung ngay trong ky - de thay xu huong. */
  dailyBreakdown: DailyBreakdownEntry[];
  /** Top san pham gop theo so luong ban trong ca ky (toi da 10). */
  topProducts: TopProductSummary[];
  topDebtCustomers: KiotVietDebtCustomer[];
  /** Chi co du lieu hoa don chi tiet tung cai khi periodType = "day" (tranh payload qua lon/ton kem cho tuan/thang). */
  invoices: KiotVietInvoice[] | null;
  /** Ke hoach kinh doanh cua thang chua ky bao cao nay - null neu chua cau hinh. */
  businessPlan: BusinessPlanSummary | null;
}
