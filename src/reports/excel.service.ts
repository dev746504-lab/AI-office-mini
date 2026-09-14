import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { PeriodKiotVietData } from './interfaces/kiotviet-data.interface';

const VND = (n: number) =>
  n.toLocaleString('vi-VN') + ' đ';

const PCT = (n: number) =>
  n.toFixed(1) + '%';

@Injectable()
export class ExcelService {
  async buildReportBuffer(data: PeriodKiotVietData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AI Office Mini';
    wb.created = new Date();

    this.addSummarySheet(wb, data);
    this.addTopProductsSheet(wb, data);
    this.addDailyBreakdownSheet(wb, data);
    if (data.topDebtCustomers.length > 0) {
      this.addDebtSheet(wb, data);
    }
    if (data.invoices && data.invoices.length > 0) {
      this.addInvoicesSheet(wb, data);
    }
    if (data.financialSummary) {
      this.addFinancialSheet(wb, data);
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // ── Sheet 1: Tóm tắt ────────────────────────────────────────────────────

  private addSummarySheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    const ws = wb.addWorksheet('Tóm tắt');
    ws.columns = [
      { key: 'label', width: 32 },
      { key: 'value', width: 26 },
    ];

    this.addTitle(ws, `BÁO CÁO KINH DOANH — ${data.periodLabel}`, 2);
    ws.addRow([]);

    const grossRevenue = data.totalRevenue + data.totalDiscount;
    const avgTicket = data.totalInvoices > 0
      ? Math.round(data.totalRevenue / data.totalInvoices)
      : 0;
    const discountRate = grossRevenue > 0
      ? (data.totalDiscount / grossRevenue) * 100
      : 0;

    const rows: [string, string][] = [
      ['Kỳ báo cáo', data.periodLabel],
      ['Từ ngày', data.fromDate],
      ['Đến ngày', data.toDate],
      ['─────────────────────', '─────────────────────'],
      ['Doanh thu thực nhận', VND(data.totalRevenue)],
      ['Doanh thu gộp (trước chiết khấu)', VND(grossRevenue)],
      ['Tổng chiết khấu', VND(data.totalDiscount)],
      ['Tỷ lệ chiết khấu / doanh thu gộp', PCT(discountRate)],
      ['Tổng số hóa đơn', data.totalInvoices.toString()],
      ['Giá trị trung bình / hóa đơn', VND(avgTicket)],
      ['Công nợ mới phát sinh', VND(data.newDebtInPeriod)],
    ];

    if (data.businessPlan) {
      const plan = data.businessPlan;
      rows.push(['─────────────────────', '─────────────────────']);
      rows.push(['Kế hoạch doanh thu tháng', VND(plan.targetRevenue)]);
      if (plan.targetOrders) rows.push(['Kế hoạch số đơn tháng', plan.targetOrders.toString()]);
      if (plan.targetAvgTicket) rows.push(['Kế hoạch AOV tháng', VND(plan.targetAvgTicket)]);
    }

    if (data.financialSummary) {
      const f = data.financialSummary;
      rows.push(['─────────────────────', '─────────────────────']);
      rows.push(['Giá vốn hàng bán (COGS)', VND(f.cogs)]);
      rows.push(['Chi phí nhân sự', VND(f.laborCost)]);
      rows.push(['Chi phí vận hành (OPEX)', VND(f.opex)]);
      rows.push(['Lợi nhuận ròng', VND(f.netProfit)]);
      rows.push(['Food Cost %', PCT(f.foodCostPct)]);
      rows.push(['Labor Cost %', PCT(f.laborCostPct)]);
      rows.push(['Prime Cost %', PCT(f.primeCostPct)]);
      rows.push(['Net Profit Margin %', PCT(f.netProfitMarginPct)]);
      rows.push(['Doanh thu hòa vốn', VND(f.breakEvenRevenue)]);
      rows.push(['Số đơn hòa vốn', f.breakEvenOrders.toString()]);
    }

    for (const [label, value] of rows) {
      const row = ws.addRow({ label, value });
      if (label.startsWith('─')) {
        row.font = { color: { argb: 'FFAAAAAA' } };
      } else {
        this.styleDataRow(row);
      }
    }
  }

  // ── Sheet 2: Sản phẩm bán chạy ──────────────────────────────────────────

  private addTopProductsSheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    const ws = wb.addWorksheet('Sản phẩm bán chạy');
    ws.columns = [
      { key: 'rank', header: 'STT', width: 8 },
      { key: 'name', header: 'Sản phẩm', width: 40 },
      { key: 'qty', header: 'Số lượng bán', width: 18 },
      { key: 'revenue', header: 'Doanh thu', width: 22 },
    ];

    this.addTitle(ws, `Top sản phẩm — ${data.periodLabel}`, 4);
    this.addHeaderRow(ws, ['STT', 'Sản phẩm', 'Số lượng bán', 'Doanh thu']);

    data.topProducts.forEach((p, i) => {
      const row = ws.addRow({
        rank: i + 1,
        name: p.productName,
        qty: p.quantity,
        revenue: p.revenue,
      });
      this.styleDataRow(row);
      (row.getCell('revenue') as ExcelJS.Cell).numFmt = '#,##0 "đ"';
    });

    ws.getColumn('qty').alignment = { horizontal: 'right' };
    ws.getColumn('revenue').alignment = { horizontal: 'right' };
  }

  // ── Sheet 3: Theo ngày ──────────────────────────────────────────────────

  private addDailyBreakdownSheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    const ws = wb.addWorksheet('Theo ngày');
    ws.columns = [
      { key: 'date', header: 'Ngày', width: 16 },
      { key: 'revenue', header: 'Doanh thu', width: 22 },
      { key: 'invoiceCount', header: 'Số hóa đơn', width: 16 },
      { key: 'discount', header: 'Chiết khấu', width: 20 },
      { key: 'avgTicket', header: 'AOV', width: 20 },
    ];

    this.addTitle(ws, `Doanh thu theo ngày — ${data.periodLabel}`, 5);
    this.addHeaderRow(ws, ['Ngày', 'Doanh thu', 'Số hóa đơn', 'Chiết khấu', 'AOV']);

    for (const d of data.dailyBreakdown) {
      const avg = d.invoiceCount > 0 ? Math.round(d.revenue / d.invoiceCount) : 0;
      const row = ws.addRow({
        date: d.date,
        revenue: d.revenue,
        invoiceCount: d.invoiceCount,
        discount: d.discount,
        avgTicket: avg,
      });
      this.styleDataRow(row);
      (['revenue', 'discount', 'avgTicket'] as const).forEach((col) => {
        (row.getCell(col) as ExcelJS.Cell).numFmt = '#,##0 "đ"';
      });
    }

    // Tổng cộng
    const total = data.dailyBreakdown.reduce(
      (acc, d) => ({ rev: acc.rev + d.revenue, inv: acc.inv + d.invoiceCount, disc: acc.disc + d.discount }),
      { rev: 0, inv: 0, disc: 0 },
    );
    const totalRow = ws.addRow({
      date: 'TỔNG',
      revenue: total.rev,
      invoiceCount: total.inv,
      discount: total.disc,
      avgTicket: total.inv > 0 ? Math.round(total.rev / total.inv) : 0,
    });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    (['revenue', 'discount', 'avgTicket'] as const).forEach((col) => {
      (totalRow.getCell(col) as ExcelJS.Cell).numFmt = '#,##0 "đ"';
    });

    ws.getColumn('revenue').alignment = { horizontal: 'right' };
    ws.getColumn('discount').alignment = { horizontal: 'right' };
    ws.getColumn('avgTicket').alignment = { horizontal: 'right' };
    ws.getColumn('invoiceCount').alignment = { horizontal: 'right' };
  }

  // ── Sheet 4: Công nợ ────────────────────────────────────────────────────

  private addDebtSheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    const ws = wb.addWorksheet('Công nợ');
    ws.columns = [
      { key: 'rank', header: 'STT', width: 8 },
      { key: 'name', header: 'Khách hàng', width: 36 },
      { key: 'debt', header: 'Công nợ', width: 22 },
    ];

    this.addTitle(ws, `Công nợ khách hàng — ${data.periodLabel}`, 3);
    this.addHeaderRow(ws, ['STT', 'Khách hàng', 'Công nợ']);

    data.topDebtCustomers.forEach((c, i) => {
      const row = ws.addRow({ rank: i + 1, name: c.customerName, debt: c.debtAmount });
      this.styleDataRow(row);
      (row.getCell('debt') as ExcelJS.Cell).numFmt = '#,##0 "đ"';
    });

    ws.getColumn('debt').alignment = { horizontal: 'right' };
  }

  // ── Sheet 5: Hóa đơn chi tiết (chỉ báo cáo ngày) ───────────────────────

  private addInvoicesSheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    if (!data.invoices) return;
    const ws = wb.addWorksheet('Hóa đơn chi tiết');
    ws.columns = [
      { key: 'code', header: 'Mã hóa đơn', width: 18 },
      { key: 'date', header: 'Ngày', width: 22 },
      { key: 'customer', header: 'Khách hàng', width: 28 },
      { key: 'branch', header: 'Chi nhánh', width: 20 },
      { key: 'total', header: 'Tổng tiền', width: 20 },
      { key: 'discount', header: 'Chiết khấu', width: 18 },
      { key: 'payment', header: 'Thanh toán', width: 20 },
    ];

    this.addTitle(ws, `Chi tiết hóa đơn — ${data.periodLabel}`, 7);
    this.addHeaderRow(ws, ['Mã hóa đơn', 'Ngày', 'Khách hàng', 'Chi nhánh', 'Tổng tiền', 'Chiết khấu', 'Thanh toán']);

    for (const inv of data.invoices) {
      const row = ws.addRow({
        code: inv.code,
        date: inv.purchaseDate,
        customer: inv.customerName ?? 'Khách lẻ',
        branch: inv.branchName ?? '',
        total: inv.total,
        discount: inv.discount,
        payment: inv.totalPayment,
      });
      this.styleDataRow(row);
      (['total', 'discount', 'payment'] as const).forEach((col) => {
        (row.getCell(col) as ExcelJS.Cell).numFmt = '#,##0 "đ"';
      });
    }

    (['total', 'discount', 'payment'] as const).forEach((col) => {
      ws.getColumn(col).alignment = { horizontal: 'right' };
    });
  }

  // ── Sheet 6: Chi phí (khi có financialSummary) ──────────────────────────

  private addFinancialSheet(wb: ExcelJS.Workbook, data: PeriodKiotVietData): void {
    const f = data.financialSummary!;
    const ws = wb.addWorksheet('Chi phí & Lợi nhuận');
    ws.columns = [
      { key: 'category', header: 'Danh mục', width: 36 },
      { key: 'type', header: 'Loại', width: 14 },
      { key: 'amount', header: 'Số tiền', width: 22 },
    ];

    this.addTitle(ws, `Chi phí & Lợi nhuận — ${data.periodLabel}`, 3);
    this.addHeaderRow(ws, ['Danh mục', 'Loại', 'Số tiền']);

    const typeLabel: Record<string, string> = {
      cogs: 'Giá vốn',
      labor: 'Nhân sự',
      opex: 'Vận hành',
    };

    for (const item of f.costsByCategory) {
      const row = ws.addRow({
        category: item.category,
        type: typeLabel[item.type] ?? item.type,
        amount: item.amount,
      });
      this.styleDataRow(row);
      (row.getCell('amount') as ExcelJS.Cell).numFmt = '#,##0 "đ"';
    }

    ws.addRow([]);

    const summaryRows: [string, number][] = [
      ['Doanh thu thực nhận', data.totalRevenue],
      ['Giá vốn hàng bán (COGS)', f.cogs],
      ['Chi phí nhân sự', f.laborCost],
      ['Chi phí vận hành (OPEX)', f.opex],
      ['Lợi nhuận ròng', f.netProfit],
    ];

    for (const [label, amount] of summaryRows) {
      const row = ws.addRow({ category: label, type: '', amount });
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
      (row.getCell('amount') as ExcelJS.Cell).numFmt = '#,##0 "đ"';
    }

    ws.getColumn('amount').alignment = { horizontal: 'right' };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private addTitle(ws: ExcelJS.Worksheet, title: string, colSpan: number): void {
    const row = ws.addRow([title]);
    const cell = row.getCell(1);
    cell.font = { bold: true, size: 13, color: { argb: 'FF1A1A2E' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    ws.mergeCells(row.number, 1, row.number, colSpan);
    row.height = 24;
    ws.addRow([]);
  }

  private addHeaderRow(ws: ExcelJS.Worksheet, headers: string[]): void {
    const row = ws.addRow(headers);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    row.height = 20;
    row.alignment = { vertical: 'middle' };
  }

  private styleDataRow(row: ExcelJS.Row): void {
    const isEven = row.number % 2 === 0;
    if (isEven) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
    }
    row.border = {
      bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
    };
  }
}
