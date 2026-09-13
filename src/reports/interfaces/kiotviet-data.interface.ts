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
  targetOrders: number | null;
  targetAvgTicket: number | null;
  costBudgetTotal: number | null;
  notes: string | null;
}

export interface CostBreakdownItem {
  category: string;
  type: 'cogs' | 'labor' | 'opex';
  amount: number;
}

export interface PreviousPeriodSummary {
  netRevenue: number;
  cogs: number;
  laborCost: number;
  netProfit: number;
}

export interface FinancialSummaryPayload {
  cogs: number;
  laborCost: number;
  opex: number;
  fixedCosts: number;
  variableCostRatio: number;
  netProfit: number;
  primeCostPct: number;
  foodCostPct: number;
  laborCostPct: number;
  netProfitMarginPct: number;
  breakEvenRevenue: number;
  breakEvenOrders: number;
  costsByCategory: CostBreakdownItem[];
  previousPeriod: PreviousPeriodSummary | null;
}

export interface HistoricalMonthEntry {
  month: string;
  revenue: number;
  orders: number;
  avgTicket: number;
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
  /** Tong hop chi phi van hanh — null neu chua nhap du lieu chi phi. */
  financialSummary: FinancialSummaryPayload | null;
  /** Du lieu doanh thu cac thang truoc — dung cho de xuat ke hoach (optional). */
  historicalMonths: HistoricalMonthEntry[] | null;
}
