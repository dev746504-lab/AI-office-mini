import { Injectable, Logger } from '@nestjs/common';
import {
  BusinessPlanSummary,
  DailyBreakdownEntry,
  KiotVietDebtCustomer,
  KiotVietInvoice,
  PeriodKiotVietData,
  ReportPeriodType,
  TopProductSummary,
} from './interfaces/kiotviet-data.interface';
import { SettingsService } from '../settings/settings.service';

interface KiotVietTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface KiotVietInvoiceListResponse {
  total: number;
  pageSize: number;
  data: KiotVietInvoice[];
}

interface KiotVietCustomer {
  name: string;
  debt: number;
}

interface KiotVietCustomerListResponse {
  total: number;
  pageSize: number;
  data: KiotVietCustomer[];
}

const PAGE_SIZE = 100;
const TOP_PRODUCTS_LIMIT = 10;

@Injectable()
export class KiotVietService {
  private readonly logger = new Logger(KiotVietService.name);

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly settingsService: SettingsService) {}

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const s = await this.settingsService.getSettings();
    if (!s.kiotvietClientId || !s.kiotvietClientSecret) {
      throw new Error('KiotViet Client ID / Secret chua duoc cau hinh. Vao Settings de dien vao.');
    }

    this.logger.log('[KiotViet] Dang xin access token moi...');

    const body = new URLSearchParams({
      scopes: 'PublicApi.Access',
      grant_type: 'client_credentials',
      client_id: s.kiotvietClientId,
      client_secret: s.kiotvietClientSecret,
    });

    const response = await fetch(s.kiotvietTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`KiotViet token request that bai (${response.status}): ${text}`);
    }

    const tokenData = (await response.json()) as KiotVietTokenResponse;
    this.accessToken = tokenData.access_token;
    this.tokenExpiresAt = now + (tokenData.expires_in - 60) * 1000;

    this.logger.log('[KiotViet] Da lay access token thanh cong.');
    return this.accessToken;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const [token, s] = await Promise.all([
      this.getAccessToken(),
      this.settingsService.getSettings(),
    ]);
    if (!s.kiotvietRetailer) {
      throw new Error('KiotViet Retailer chua duoc cau hinh. Vao Settings de dien vao.');
    }
    return {
      Authorization: `Bearer ${token}`,
      Retailer: s.kiotvietRetailer,
    };
  }

  private async fetchInvoices(fromDate: string, toDate: string): Promise<KiotVietInvoice[]> {
    const s = await this.settingsService.getSettings();
    const headers = await this.authHeaders();

    const invoices: KiotVietInvoice[] = [];
    let currentItem = 0;
    let total = Infinity;

    while (currentItem < total) {
      const url = new URL(`${s.kiotvietApiBaseUrl}/api/invoices`);
      url.searchParams.set('pageSize', String(PAGE_SIZE));
      url.searchParams.set('currentItem', String(currentItem));
      url.searchParams.set('purchaseDateFrom', fromDate);
      url.searchParams.set('purchaseDateTo', toDate);
      url.searchParams.set('includePayment', 'true');
      url.searchParams.set('orderBy', 'purchaseDate');

      this.logger.log(`[KiotViet] Dang fetch hoa don, currentItem=${currentItem}...`);

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`KiotViet fetch invoices that bai (${response.status}): ${text}`);
      }

      const page = (await response.json()) as KiotVietInvoiceListResponse;
      invoices.push(...page.data);
      total = page.total;
      currentItem += page.data.length;

      if (page.data.length === 0) break;
    }

    this.logger.log(`[KiotViet] Da fetch xong tong cong ${invoices.length} hoa don.`);
    return invoices;
  }

  private async fetchTopDebtCustomers(limit = 5): Promise<KiotVietDebtCustomer[]> {
    const s = await this.settingsService.getSettings();
    const headers = await this.authHeaders();

    const url = new URL(`${s.kiotvietApiBaseUrl}/api/customers`);
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    url.searchParams.set('orderBy', 'debt');
    url.searchParams.set('orderDirection', 'Desc');

    this.logger.log('[KiotViet] Dang fetch danh sach cong no khach hang...');

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`KiotViet fetch customers that bai (${response.status}): ${text}`);
    }

    const page = (await response.json()) as KiotVietCustomerListResponse;
    return page.data
      .filter((c) => c.debt > 0)
      .slice(0, limit)
      .map((c) => ({ customerName: c.name, debtAmount: c.debt }));
  }

  private buildDailyBreakdown(
    invoices: KiotVietInvoice[],
    fromDateStr: string,
    toDateStr: string,
  ): DailyBreakdownEntry[] {
    const map = new Map<string, { revenue: number; invoiceCount: number; discount: number }>();

    for (const inv of invoices) {
      const day = (inv.purchaseDate ?? '').slice(0, 10);
      if (!day) continue;
      const entry = map.get(day) ?? { revenue: 0, invoiceCount: 0, discount: 0 };
      entry.revenue += inv.totalPayment ?? inv.total ?? 0;
      entry.invoiceCount += 1;
      entry.discount += inv.discount ?? 0;
      map.set(day, entry);
    }

    // Dien du tat ca cac ngay trong khoang (ke ca ngay khong co hoa don, revenue=0)
    // de agent thay ro ngay nao "trang", khong bi mat tich khoi bao cao.
    const days: DailyBreakdownEntry[] = [];
    const cursor = new Date(`${fromDateStr}T00:00:00.000Z`);
    const end = new Date(`${toDateStr}T00:00:00.000Z`);
    while (cursor <= end) {
      const dayStr = cursor.toISOString().slice(0, 10);
      const entry = map.get(dayStr) ?? { revenue: 0, invoiceCount: 0, discount: 0 };
      days.push({ date: dayStr, ...entry });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
  }

  private buildTopProducts(invoices: KiotVietInvoice[], limit = TOP_PRODUCTS_LIMIT): TopProductSummary[] {
    const map = new Map<string, { quantity: number; revenue: number }>();

    for (const inv of invoices) {
      for (const item of inv.invoiceDetails ?? []) {
        if (!item.productName) continue;
        const entry = map.get(item.productName) ?? { quantity: 0, revenue: 0 };
        entry.quantity += item.quantity ?? 0;
        entry.revenue += (item.price ?? 0) * (item.quantity ?? 0) - (item.discount ?? 0);
        map.set(item.productName, entry);
      }
    }

    return Array.from(map.entries())
      .map(([productName, v]) => ({ productName, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  /**
   * Lay + tong hop du lieu KiotViet cho 1 ky bao cao bat ky (ngay/tuan/thang).
   * @param fromDateStr, toDateStr "YYYY-MM-DD" (theo lich Viet Nam).
   * @param businessPlan Ke hoach kinh doanh cua thang chua ky nay (neu co) - do
   * CronService/BusinessPlanService cung cap, KiotVietService khong tu fetch.
   */
  async fetchReportData(
    fromDateStr: string,
    toDateStr: string,
    periodType: ReportPeriodType,
    periodLabel: string,
    businessPlan: BusinessPlanSummary | null,
  ): Promise<PeriodKiotVietData> {
    const fromDate = `${fromDateStr} 00:00:00`;
    const toDate = `${toDateStr} 23:59:59`;

    this.logger.log(`[KiotViet] Bat dau lay du lieu (${periodType}) tu ${fromDateStr} den ${toDateStr}...`);

    const [invoices, topDebtCustomers] = await Promise.all([
      this.fetchInvoices(fromDate, toDate),
      this.fetchTopDebtCustomers(),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalPayment ?? inv.total ?? 0), 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount ?? 0), 0);
    const newDebtInPeriod = invoices.reduce(
      (sum, inv) => sum + Math.max((inv.total ?? 0) - (inv.totalPayment ?? 0), 0),
      0,
    );

    const result: PeriodKiotVietData = {
      periodType,
      periodLabel,
      fromDate: fromDateStr,
      toDate: toDateStr,
      totalRevenue,
      totalInvoices: invoices.length,
      totalDiscount,
      newDebtInPeriod,
      dailyBreakdown: this.buildDailyBreakdown(invoices, fromDateStr, toDateStr),
      topProducts: this.buildTopProducts(invoices),
      topDebtCustomers,
      // Chi gui hoa don chi tiet tung cai cho bao cao NGAY - tuan/thang co the
      // co hang nghin hoa don, gui het se qua tai prompt va ton kem token.
      invoices: periodType === 'day' ? invoices : null,
      businessPlan,
    };

    this.logger.log(
      `[KiotViet] Hoan tat: ${result.totalInvoices} hoa don, doanh thu ${result.totalRevenue.toLocaleString('vi-VN')}d.`,
    );

    return result;
  }
}
