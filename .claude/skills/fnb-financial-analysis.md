# KY NANG: PHAN TICH TAI CHINH F&B CHUYEN SAU (COFFEE SHOP)

Ky nang nay bo sung cho ca Agent Tai chinh (finance.md) va Agent Kinh doanh (business.md) khi he thong co du lieu chi phi van hanh (operational costs). Khi payload JSON co truong `financialSummary`, PHAI ap dung framework phan tich duoi day. Khi `financialSummary` la `null`, chi nhan dinh phan doanh thu (Thu) va ghi ro "Chua co du lieu chi phi de phan tich loi nhuan".

---

## 1. KHUNG PHAN TICH TAI CHINH F&B

### 1.1 Cau truc P&L (Profit & Loss) cho quan cafe

```
Doanh thu gop (Gross Revenue)
  - Chiet khau / Khuyen mai (Discounts)
= Doanh thu thuan (Net Revenue)                    ← totalRevenue trong payload
  - Gia von hang ban (COGS)                         ← financialSummary.cogs
    (nguyen lieu ca phe, tra, sua, ly, ong hut...)
= Loi nhuan gop (Gross Profit)
  - Chi phi nhan su (Labor Cost)                    ← financialSummary.laborCost
    (luong, BHXH, thuong, an ca)
= Prime Cost Margin
  - Chi phi van hanh (Operating Expenses / OPEX)    ← financialSummary.opex
    (thue mat bang, dien nuoc, internet, bao tri, marketing, van phong pham...)
= Loi nhuan truoc thue (Net Operating Profit)       ← financialSummary.netProfit
```

### 1.2 Cac chi so then chot F&B (KPIs) — chi tinh khi co du lieu

| Chi so | Cong thuc | Nguong tot cho cafe VN | Canh bao |
|--------|-----------|----------------------|----------|
| Food Cost % | `cogs / netRevenue * 100` | 28–35% | > 38% |
| Labor Cost % | `laborCost / netRevenue * 100` | 25–32% | > 35% |
| **Prime Cost %** | `(cogs + laborCost) / netRevenue * 100` | **55–65%** | **> 68%** |
| OPEX % | `opex / netRevenue * 100` | 15–25% | > 30% |
| Net Profit Margin | `netProfit / netRevenue * 100` | 10–20% | < 5% |
| Gia tri don trung binh (AOV) | `netRevenue / totalInvoices` | — | Giam > 10% so ky truoc |
| Doanh thu / m2 / thang | `netRevenue / dienTichMat` | — | Chi tinh khi co dien tich |

**QUAN TRONG**: Cac nguong tren la khung tham chieu chung cho nganh cafe Viet Nam. KHONG duoc trinh bay chung nhu la "muc tieu cua cua hang" tru khi `businessPlan` co ghi ro. Khi su dung, phai ghi chu "theo khung tham chieu nganh F&B" de phan biet voi chi tieu noi bo.

### 1.3 Quy tac tinh toan

- Moi con so phai truy nguon duoc ve truong cu the trong `financialSummary` hoac `PeriodKiotVietData`.
- KHONG duoc tu uoc tinh chi phi khi `financialSummary` la `null` — ke ca "uoc luong theo ty le nganh" cung la vi pham `data-strict.md`.
- Ty le phan tram lam tron 1 chu so thap phan (vd: 32.4%), so tien lam tron den ngan dong (vd: 15.234.000d).
- Khi so sanh voi ky truoc (`previousPeriod` trong financialSummary), phai tinh % thay doi: `(actual - previous) / previous * 100`. Neu `previousPeriod` la `null`, ghi "Khong co du lieu ky truoc de so sanh".

---

## 2. PHAN TICH HOA VON (BREAK-EVEN ANALYSIS)

Chi ap dung cho bao cao THANG (`periodType = "month"`) va khi co du lieu chi phi.

### 2.1 Cach tinh

```
Diem hoa von (BEP) = Chi phi co dinh / (1 - Ty le chi phi bien)

Trong do:
  Chi phi co dinh = thue mat bang + luong co dinh + khau hao + bao hiem + internet/dien co ban
                   ← financialSummary.fixedCosts
  Ty le chi phi bien = (COGS + luong theo gio + bao bi + van chuyen) / Doanh thu thuan
                      ← financialSummary.variableCostRatio

  BEP (so don hang) = BEP (tien) / AOV
  BEP (ngay) = BEP (tien) / (Doanh thu trung binh / ngay)
```

### 2.2 Cach trinh bay

- "Cua hang can dat **X don** (tuong duong **Y trieu dong**) moi thang de hoa von."
- "Voi doanh thu trung binh Z trieu/ngay, can **N ngay** de hoa von. Thang nay co K ngay kinh doanh."
- Neu doanh thu thuc te < BEP: CANH BAO DO — "Chua dat diem hoa von, thieu A trieu dong."
- Neu doanh thu > BEP: bao nhieu % vuot muc hoa von (margin of safety).

### 2.3 Khi khong du du lieu

Neu `financialSummary.fixedCosts` hoac `financialSummary.variableCostRatio` la `null`:
→ "Khong du du lieu chi phi co dinh/bien de tinh diem hoa von. Can bo sung tai Cai dat he thong > Chi phi van hanh."

---

## 3. LAP KE HOACH KINH DOANH THANG (MONTHLY PLAN)

Skill nay HO TRO Agent Kinh doanh khi lap ke hoach, KHONG tu dong lap — ke hoach phai do Admin nhap va xac nhan.

### 3.1 Du lieu de xuat ke hoach

Khi payload co `historicalMonths` (3–6 thang gan nhat), Agent co the DE XUAT muc tieu:

```json
"historicalMonths": [
  { "month": "2026-06", "revenue": 180000000, "orders": 4200, "avgTicket": 42857 },
  { "month": "2026-07", "revenue": 195000000, "orders": 4500, "avgTicket": 43333 },
  { "month": "2026-08", "revenue": 210000000, "orders": 4800, "avgTicket": 43750 }
]
```

### 3.2 Phuong phap de xuat

1. **Tang truong binh quan**: tinh % tang truong trung binh 3 thang → ap dung cho thang toi.
2. **Dieu chinh mua vu**: thang 1–2 (Tet) +15–25%, thang 6–8 (he) +5–10%, thang 11–12 (cuoi nam) +10–15%. Day la GIA DINH — phai ghi ro la "dieu chinh uoc tinh theo mua, can Admin xac nhan".
3. **De xuat kem dieu kien**: "Voi tang truong trung binh X%/thang va khong co bien dong lon, de xuat muc tieu thang Y la Z trieu dong (~N don/ngay, AOV ~K dong). Day la de xuat, Admin can xac nhan tai man hinh Ke hoach Kinh doanh."

### 3.3 KHONG DUOC

- Tu dung de xuat lam muc tieu chinh thuc — phai luon di kem cau "day la de xuat can Admin xac nhan".
- Bịa du lieu lich su khi `historicalMonths` la `null`.
- Dieu chinh mua vu ma khong ghi ro la gia dinh.

---

## 4. THEO DOI HIEU SUAT SO VOI KE HOACH (PERFORMANCE TRACKING)

### 4.1 Trang thai hieu suat (tinh tu `businessPlan` + thuc te)

| Trang thai | Dieu kien | Mau hieu thi |
|-----------|-----------|-------------|
| ON TRACK | Tien do >= 95% ke hoach tuong ung | Xanh la `#1E7E34` |
| AT RISK | Tien do 80–94% | Vang `#B26A00` |
| OFF TRACK | Tien do < 80% | Do `#C62828` |
| VƯỢT KE HOACH | Tien do > 105% | Xanh duong `#1565C0` |

Tien do = `(doanh thu luy ke / muc tieu) * 100`, dieu chinh theo so ngay da qua trong thang:
```
Tien do dieu chinh = (doanh thu luy ke / muc tieu) / (so ngay da qua / tong so ngay trong thang) * 100
```

### 4.2 Canh bao tu dong

Khi trang thai la AT RISK hoac OFF TRACK, PHAI dua ra:
1. **So lieu cu the**: "Sau N ngay (X% thoi gian), dat Y trieu (Z% ke hoach). Can dat trung binh A trieu/ngay con lai de ve dich."
2. **Hanh dong khuyen nghi** (toi da 3, phai bam sat du lieu):
   - Neu AOV giam → "Xem xet combo/upsell de tang gia tri don hang"
   - Neu so don giam → "Kiem tra luu luong khach va hoat dong marketing"
   - Neu COGS tang → "Kiem tra gia nguyen lieu va luong hang ton"
   - Neu mot ngay trong tuan lien tuc thap → "Can chien luoc khuyen mai cho [thu X]"
3. **Du bao cuoi thang**: "Voi toc do hien tai, du kien dat B trieu (C% ke hoach)."

### 4.3 Khi khong co ke hoach

Neu `businessPlan` la `null`: bao cao hieu suat theo xu huong noi tai (so voi tuan truoc, thang truoc neu co `previousPeriod`) — KHONG tu dat muc tieu.

---

## 5. PARSING DU LIEU DAU VAO — HUONG DAN KY THUAT

### 5.1 Truong financialSummary trong payload (co the null)

```json
"financialSummary": {
  "cogs": 65000000,
  "laborCost": 48000000,
  "opex": 35000000,
  "fixedCosts": 55000000,
  "variableCostRatio": 0.35,
  "netProfit": 62000000,
  "primeCostPct": 53.8,
  "foodCostPct": 30.9,
  "laborCostPct": 22.8,
  "netProfitMarginPct": 29.5,
  "breakEvenRevenue": 84615385,
  "breakEvenOrders": 1975,
  "costsByCategory": [
    { "category": "Nguyen lieu", "type": "cogs", "amount": 52000000 },
    { "category": "Bao bi", "type": "cogs", "amount": 13000000 },
    { "category": "Luong co dinh", "type": "labor", "amount": 35000000 },
    { "category": "Luong theo gio", "type": "labor", "amount": 13000000 },
    { "category": "Thue mat bang", "type": "opex", "amount": 18000000 },
    { "category": "Dien nuoc", "type": "opex", "amount": 8000000 },
    { "category": "Marketing", "type": "opex", "amount": 5000000 },
    { "category": "Khac", "type": "opex", "amount": 4000000 }
  ],
  "previousPeriod": {
    "netRevenue": 195000000,
    "cogs": 60000000,
    "laborCost": 46000000,
    "netProfit": 54000000
  }
}
```

### 5.2 Truong historicalMonths (optional, dung cho de xuat ke hoach)

```json
"historicalMonths": [
  { "month": "2026-07", "revenue": 195000000, "orders": 4500, "avgTicket": 43333 }
]
```

### 5.3 Luu y khi doc du lieu

- `financialSummary.netProfit` da duoc he thong tinh san = `totalRevenue - cogs - laborCost - opex`. KHONG tinh lai — neu thay khong khop, CANH BAO bat thuong.
- `costsByCategory` la chi tiet cua cogs + laborCost + opex — tong cua no phai bang `cogs + laborCost + opex`. Neu khong khop, ghi chu.
- `previousPeriod` la du lieu cung ky truoc (thang truoc, tuan truoc, hoac hom qua) — dung de tinh % thay doi. Co the la `null`.
- Cac truong `*Pct` (primeCostPct, foodCostPct...) da duoc he thong tinh san — uu tien dung gia tri nay thay vi tu tinh lai, de dam bao nhat quan.

---

## 6. GIONG VAN VA FORMAT DAU RA

- **Giong van**: chuyen gia tai chinh F&B — chinh xac, co cau truc, huong hanh dong. Khong pho dien so lieu ma khong co nhan dinh. Khong dung tu phong dai khi so lieu khong the hien ro.
- **Format**: van ban/markdown thuan (khong HTML) — dau ra se duoc Synthesizer tong hop.
- **Cau truc bao cao khi co du lieu chi phi**:
  1. Tong quan P&L (bang tom tat)
  2. Phan tich chi so then chot (Food Cost %, Prime Cost %, Net Margin)
  3. Phan tich hoa von (chi bao cao thang)
  4. So sanh ky truoc (neu co `previousPeriod`)
  5. Bam sat ke hoach (neu co `businessPlan`)
  6. Canh bao va khuyen nghi hanh dong (toi da 3 diem)
