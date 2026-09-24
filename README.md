# AI Office Mini

Hệ thống báo cáo kinh doanh tự động tích hợp KiotViet + Claude Multi-Agent AI, xây dựng trên NestJS (backend) và React/Vite (frontend).

---

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| **Báo cáo tự động** | Ngày/Tuần/Tháng — chạy đúng giờ cấu hình (mặc định 23:00), lấy dữ liệu KiotViet, phân tích qua 4 AI agent, gửi email HTML |
| **Content AI hàng ngày** | Tự động tạo 1 bài Facebook/Zalo + 1 kịch bản quảng cáo mỗi sáng (mặc định 08:00), gửi email |
| **Cấu hình AI qua UI** | Sửa agent/rule/skill trực tiếp trên giao diện web, không cần chỉnh code |
| **Kế hoạch kinh doanh** | Admin nhập mục tiêu tháng, agent Kinh doanh tự so sánh thực tế vs kế hoạch |
| **Phân quyền** | 2 role: `admin` (toàn quyền) và `ai_manager` (xem Dashboard + sửa cấu hình AI) |

---

## Kiến trúc

```
KiotViet API
     │
     ▼
cron.service.ts ──► Ngày/Tuần/Tháng ──► claude.service.ts ──► Anthropic API
                                              │                      │
content-cron.service.ts ──► hàng ngày ───────┘            4 Agent pipeline:
                                                          ┌─ Finance Agent
                                                          ├─ Business Agent
                                                          ├─ Marketing Agent
                                                          └─ Synthesizer → HTML Email
                                                                  │
                                                          email.service.ts (Resend)
                                                                  │
                                                          MySQL (Prisma) ← log kết quả
```

**Nguyên tắc quan trọng:** Toàn bộ logic nghiệp vụ AI (persona, rule, skill) nằm trong `.claude/` dưới dạng Markdown — KHÔNG hardcode prompt trong TypeScript.

---

## Cấu trúc thư mục

```
/
├── src/
│   ├── reports/            # KiotViet, Claude, Email, CronReports
│   ├── content/            # Content AI hàng ngày (brand context, schedule, cron)
│   ├── ai-config/          # API đọc/ghi .claude/ qua màn hình Cấu hình AI
│   ├── settings/           # Cài đặt hệ thống (chỉ admin)
│   ├── business-plan/      # Kế hoạch kinh doanh theo tháng
│   ├── auth/               # JWT, phân quyền
│   └── prisma/             # PrismaService (global)
├── prisma/
│   ├── schema.prisma       # Nguồn sự thật duy nhất cho DB
│   └── migrations/
├── .claude/
│   ├── settings.json       # model, temperature, max_tokens
│   ├── agents/             # Persona của từng agent
│   ├── rules/              # Ràng buộc áp dụng cho MỌI agent
│   └── skills/             # Kỹ năng bổ sung, gắn theo từng agent
└── frontend/               # React SPA (Vite)
    └── src/pages/          # Login, Dashboard, AiConfig, History, Settings
```

---

## AI Agents (`.claude/agents/`)

| File | Vai trò | Chu kỳ |
|---|---|---|
| `finance.md` | Giám đốc Tài chính — phân tích doanh thu, tài chính | Tuần, Tháng |
| `finance-daily.md` | Giám đốc Tài chính — phiên bản báo cáo ngày | Ngày |
| `business.md` | Trưởng phòng Kinh doanh — sản phẩm, bán hàng, kế hoạch | Tuần, Tháng |
| `business-daily.md` | Trưởng phòng Kinh doanh — phiên bản báo cáo ngày | Ngày |
| `marketing.md` | Trưởng phòng Marketing — content, hành vi khách hàng, thị trường | Tuần, Tháng |
| `marketing-daily.md` | Trưởng phòng Marketing — phiên bản báo cáo ngày | Ngày |
| `synthesizer.md` | Agent Tổng hợp — ghép nhận định 3 agent thành HTML email | Tất cả |
| `content-creator.md` | Content Creator — tạo bài đăng FB/Zalo + kịch bản quảng cáo | Hàng ngày |

---

## Skills (`.claude/skills/`)

Skills là các module kỹ năng chuyên sâu, được ghép vào system prompt của agent tương ứng — giúp mở rộng năng lực mà không phải sửa persona chính.

### Skills dùng cho Báo cáo

| File | Tên kỹ năng | Gắn cho agent |
|---|---|---|
| `expense-summary.md` | Tổng hợp thu chi theo tháng | Finance |
| `fnb-financial-analysis.md` | Phân tích tài chính F&B chuyên sâu (coffee shop) | Finance |
| `plan-tracking.md` | Bám sát kế hoạch kinh doanh theo tháng (so sánh thực tế vs mục tiêu) | Business |
| `market-research.md` | Đọc tín hiệu thị trường từ dữ liệu nội bộ | Marketing |
| `customer-psychology.md` | Phân tích hành vi/tâm lý khách hàng từ dữ liệu giao dịch | Marketing |
| `customer-behavior-signals.md` | Đọc tín hiệu hành vi khách hàng từ dữ liệu giao dịch | Marketing |
| `marketing-psychology-retail.md` | Tâm lý học marketing áp dụng vào báo cáo bán lẻ | Marketing |
| `content-writing.md` | Viết content dựa trên dữ liệu | Marketing |

### Skills dùng cho Content AI hàng ngày

| File | Tên kỹ năng | Gắn cho agent |
|---|---|---|
| `social-post.md` | Viết bài đăng Facebook / Zalo | Content Creator |
| `ad-script.md` | Viết kịch bản quảng cáo ngắn 30–60 giây (Hook → Vấn đề → Giải pháp → CTA) | Content Creator |

### Skills dạng Pack (từ thư viện marketing bên ngoài)

Các file `pack-*.md` là skill pack chuyên dụng, có thể gắn thêm khi cần:

| File | Mô tả |
|---|---|
| `pack-social.md` | Social media content: LinkedIn, Facebook, TikTok, Instagram |
| `pack-ad-creative.md` | Tạo ad creative, headline, video ad, creative format |
| `pack-copywriting.md` | Marketing copy cho landing page, homepage, CTA, value proposition |
| `pack-customer-research.md` | Nghiên cứu khách hàng: ICP, phỏng vấn, survey, VOC, JTBD |
| `pack-marketing-psychology.md` | Tâm lý học marketing: cognitive bias, persuasion, behavioral science |

---

## Rules (`.claude/rules/`)

Ràng buộc áp dụng cho **mọi** agent — không thể ghi đè:

| File | Mô tả |
|---|---|
| `data-strict.md` | **Bất khả xâm phạm** — cấm bịa số liệu, mọi con số phải từ JSON gốc |
| `output-html.md` | Quy tắc định dạng HTML email cho Synthesizer (inline CSS, cấu trúc bắt buộc, mã màu KPI) |

---

## Cấu hình model (`.claude/settings.json`)

```json
{
  "model": "claude-sonnet-4-6",
  "temperature": 0.1,
  "max_tokens": 4096
}
```

> Dùng `claude-sonnet-4-6` vì đây là model Sonnet còn hỗ trợ `temperature`. Các model thế hệ mới hơn (`claude-sonnet-5`, `claude-opus-5`) đã bỏ tham số này — nếu nâng cấp, phải xóa `temperature` khỏi `claude.service.ts`.

---

## Database

- **ORM:** Prisma + MySQL
- **Kết nối:** biến `DATABASE_URL` trong `.env`
- **Bảng chính:** `report_logs`, `content_logs`, `app_settings`, `business_plans`, `users`

```bash
# Tạo migration mới
npm run prisma:migrate -- --name ten-thay-doi

# Deploy lên môi trường mới
npm run prisma:deploy

# Xem dữ liệu trực quan
npm run prisma:studio
```

---

## Cài đặt & chạy

```bash
# Cài dependencies
npm install

# Tạo file .env (copy từ .env.example, điền DATABASE_URL, ANTHROPIC_API_KEY, RESEND_API_KEY...)
cp .env.example .env

# Chạy migration
npm run prisma:deploy

# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

Frontend (React/Vite) được build ra `public/ai-agent-config/`, chạy cùng server NestJS.

```bash
cd frontend
yarn install
yarn build
```

---

## Thêm skill mới

1. Tạo file `.claude/skills/ten-skill.md`
2. Thêm vào `AGENT_SKILLS` trong [src/reports/claude.service.ts](src/reports/claude.service.ts) (map agent ↔ danh sách skill file)
3. Thêm entry vào `AI_CONFIG_MAP` trong [src/ai-config/ai-config.constants.ts](src/ai-config/ai-config.constants.ts) với `group: 'skill'` để sửa được qua UI

---

## Ghi chú quan trọng

- **Đổi văn phong/cấu trúc báo cáo** → sửa `.claude/agents/*.md` hoặc `.claude/rules/output-html.md`, KHÔNG sửa TypeScript
- **Đổi ràng buộc số liệu** → sửa `.claude/rules/data-strict.md`
- **Không log doanh thu/thông tin khách hàng** ra console ở production — chỉ log trạng thái từng bước
- Hệ thống **không có dữ liệu chi phí** (giá vốn, lương...) — báo cáo tài chính tháng chỉ trình bày được phần Thu; phần Chi phải ghi "không có dữ liệu"
