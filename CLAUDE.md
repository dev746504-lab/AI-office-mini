# Hệ thống Báo cáo KiotViet Tự động

## Mục tiêu

Vào giờ do người dùng cấu hình trên màn hình Settings (mặc định **23:00**, giờ Việt Nam), hệ thống tự động chạy báo cáo theo **3 chu kỳ**: NGÀY (mỗi ngày), TUẦN (mỗi khi vừa hết 1 tuần Thứ Hai→Chủ Nhật), THÁNG (mỗi khi vừa hết 1 tháng) — không cần cấu hình lịch riêng, `cron.service.ts` tự tính dựa trên "hôm qua" có phải Chủ Nhật/ngày cuối tháng không. Mỗi lần chạy:
1. Lấy dữ liệu bán hàng trong kỳ từ **API KiotViet** (hóa đơn, doanh thu, chiết khấu, công nợ) — ngày thì lấy chi tiết từng hóa đơn, tuần/tháng thì lấy dữ liệu đã tổng hợp sẵn (xem `PeriodKiotVietData`).
2. Đưa dữ liệu qua một **pipeline Multi-Agent AI** (Claude) gồm 4 vai trò: Giám đốc Tài chính, Trưởng phòng Kinh doanh, Trưởng phòng Marketing, và Agent Tổng hợp — để phân tích và dựng báo cáo. Mỗi agent còn được gắn thêm **Skill** (`.claude/skills/`) bổ sung kiến thức chuyên môn theo đúng phạm vi công việc (xem mục "Skills" bên dưới).
3. Gửi báo cáo dưới dạng **email HTML** tới Ban Giám đốc.
4. Ghi log kết quả từng lần chạy vào **MySQL** (qua **Prisma**) để tra cứu/audit sau này.

## Nguyên tắc kiến trúc

- **Tách biệt Code và AI Context**: Toàn bộ logic nghiệp vụ nằm trong `src/`. Toàn bộ "tư duy" của AI — luật ràng buộc, persona, và skill của từng agent — nằm trong `.claude/`, dưới dạng file Markdown thuần. `src/reports/claude.service.ts` chỉ có nhiệm vụ **đọc** các file này và ghép thành system prompt, KHÔNG được hardcode bất kỳ đoạn prompt nghiệp vụ nào trong code TypeScript (map agent↔skill trong `AGENT_SKILLS` chỉ là wiring tên file, không phải nội dung prompt).
- **Không bịa số liệu**: Đây là ràng buộc quan trọng nhất của toàn hệ thống — xem chi tiết tại `.claude/rules/data-strict.md`. Mọi thay đổi prompt phải giữ nguyên tinh thần này. Lưu ý: hệ thống hiện **không có dữ liệu chi phí** (giá vốn, lương, mặt bằng...) — báo cáo tài chính tháng chỉ trình bày được phần Thu, phần Chi phải luôn ghi rõ "không có dữ liệu" (xem `.claude/skills/expense-summary.md`).
- **Multi-Agent, không phải 1 lần gọi API**: Finance, Business và Marketing phân tích độc lập (song song) trên cùng dữ liệu gốc, sau đó Synthesizer hợp nhất thành báo cáo cuối. Tách vai trò để mỗi agent tập trung vào một góc nhìn, giảm rủi ro bỏ sót.

## Skills — kỹ năng gắn theo từng agent

Mỗi agent có thể được gắn thêm 1 hoặc nhiều "skill" (file `.md` trong `.claude/skills/`) để bổ sung chuyên môn mà không phải sửa persona chính:

| Agent | Phạm vi công việc | Skill đang gắn |
|---|---|---|
| Marketing (report) | Content, nghiên cứu khách hàng, hành vi/tâm lý khách hàng, tín hiệu thị trường | `content-writing.md`, `market-research.md`, `customer-psychology.md` |
| Kinh doanh (report) | Kế hoạch kinh doanh tháng, báo cáo doanh thu ngày/tuần/tháng bám kế hoạch | `plan-tracking.md` |
| Tài chính (report) | Báo cáo tài chính tháng, tổng hợp thu chi | `expense-summary.md` |
| **Content Creator** | **Tạo content hàng ngày: bài đăng Facebook/Zalo + kịch bản quảng cáo** | **`social-post.md`, `ad-script.md`** |

- **Muốn thêm skill mới**: tạo file `.claude/skills/ten-skill.md`, thêm vào `AGENT_SKILLS` trong `src/reports/claude.service.ts` (map agent file ↔ danh sách skill file), rồi thêm entry vào `AI_CONFIG_MAP` (`src/ai-config/ai-config.constants.ts`, `group: 'skill'`) để sửa được qua UI "Cấu hình AI" mà không cần đụng code.
- Skill được ghép vào system prompt của agent tương ứng, chèn giữa rule dùng chung (`data-strict.md`) và persona chính — xem `buildSystemPrompt()` trong `claude.service.ts`.
- **Kế hoạch kinh doanh** (module `src/business-plan/`, bảng `business_plans`) là dữ liệu THẬT để skill `plan-tracking.md` so sánh — Admin nhập tại Cài đặt hệ thống > Kế hoạch Kinh doanh. Nếu chưa nhập, agent Kinh doanh phải báo "chưa có kế hoạch", không được tự đặt mục tiêu.

## Lựa chọn model — lưu ý quan trọng

Yêu cầu gốc của dự án là dùng "Claude 3.5 Sonnet" với `temperature: 0.1` để đảm bảo output ổn định, ít "sáng tạo" khi xử lý số liệu tài chính. Tuy nhiên:

- Claude 3.5 Sonnet đã ngừng phục vụ (retired).
- Các model thế hệ hiện tại (`claude-opus-5`, `claude-sonnet-5`) đã **bỏ tham số `temperature`/`top_p`/`top_k`** — request kèm `temperature` sẽ bị từ chối với lỗi 400. Việc kiểm soát mức độ "chắc chắn" của output giờ thực hiện qua `effort` / adaptive thinking, không phải qua sampling.

=> Dự án này chọn **`claude-sonnet-4-6`** làm model mặc định (cấu hình tại `.claude/settings.json`) vì đây là model Sonnet còn hỗ trợ `temperature`, giữ đúng tinh thần yêu cầu gốc (ổn định, ít biến thiên). Nếu sau này nâng cấp lên model thế hệ mới hơn, phải bỏ tham số `temperature` khỏi `claude.service.ts` và cân nhắc dùng `output_config.effort` thay thế.

## Content AI tự động hàng ngày

Ngoài báo cáo KiotViet (3 chu kỳ Ngày/Tuần/Tháng), hệ thống còn tự động **tạo content marketing mỗi ngày** — 1 bài đăng Facebook/Zalo và 1 kịch bản quảng cáo — gửi qua email.

**Luồng hoạt động:**
1. `ContentCronService` chạy mỗi phút, kiểm tra `contentSendHour/contentSendMinute` trong Settings (mặc định 08:00).
2. Đúng giờ → gọi `ContentService.runDailyContent(todayStr)`.
3. `ContentService` tổng hợp 3 nguồn: **Brand Context** (thông tin cửa hàng — Admin nhập 1 lần) + **Content Schedule** (chủ đề theo thứ trong tuần) + **Top products hôm qua** từ KiotViet (optional, không fail nếu chưa cấu hình).
4. Gọi `ClaudeService.generateContent()` → agent `content-creator.md` + skills `social-post.md`, `ad-script.md`.
5. Parse output (tag `[FB_POST]...[/FB_POST]` và `[AD_SCRIPT]...[/AD_SCRIPT]`).
6. Lưu vào bảng `content_logs`, gửi email (cùng SMTP và danh sách người nhận với báo cáo).

**Cấu hình từ UI:**
- Settings > **Lịch gửi Content AI** — giờ gửi
- Settings > **Thông tin thương hiệu** — brand context (1 lần)
- Settings > **Lịch Content hàng tuần** — chủ đề T2→CN

**Không cần cấu hình KiotViet để dùng Content AI** — nếu KiotViet chưa cấu hình, AI vẫn tạo content dựa trên brand context + chủ đề, chỉ không có "top sản phẩm bán chạy".

## Cấu trúc thư mục

```
/
├── src/
│   ├── app.module.ts
│   ├── reports/
│   │   ├── reports.module.ts    # Export ClaudeService, KiotVietService, EmailService cho ContentModule dùng
│   │   ├── kiotviet.service.ts  # Fetch dữ liệu từ API KiotViet
│   │   ├── claude.service.ts    # Đọc .claude/, gọi Anthropic API (multi-agent + content)
│   │   ├── email.service.ts     # Build & gửi email HTML (báo cáo + content)
│   │   └── cron.service.ts      # Điều phối báo cáo Ngày/Tuần/Tháng theo giờ cấu hình
│   ├── content/
│   │   ├── content.module.ts         # Import ReportsModule + SettingsModule
│   │   ├── content.service.ts        # Tạo content: brand ctx + schedule + KiotViet → Claude
│   │   ├── content-cron.service.ts   # Cron hàng ngày trigger content theo giờ contentSendHour
│   │   ├── brand-context.controller.ts    # GET/POST /api/content/brand-context (admin)
│   │   └── content-schedule.controller.ts # GET/POST /api/content/schedule (admin)
│   ├── ai-config/                 # API doc/ghi file .claude/agents|rules|skills qua man hinh "Cau hinh AI"
│   ├── settings/                  # API cau hinh he thong (chi Admin)
│   ├── business-plan/             # API ke hoach kinh doanh theo thang (chi Admin)
│   ├── auth/                      # Dang nhap, JWT, phan quyen (admin / ai_manager)
│   └── prisma/                    # PrismaService/PrismaModule (global) - inject vao service can DB
├── prisma/
│   ├── schema.prisma               # Nguon su that duy nhat cho DB - sua o day, KHONG sua truc tiep MySQL
│   └── migrations/                 # Lich su migration co phien ban (di kem git)
├── .claude/
│   ├── settings.json              # model, temperature, max_tokens
│   ├── rules/                     # Ràng buộc áp dụng cho MỌI agent
│   ├── agents/                    # Persona của từng agent (incl. content-creator.md)
│   └── skills/                    # Ky nang bo sung, gan theo tung agent (incl. social-post.md, ad-script.md)
├── frontend/                      # React SPA (Vite) - build ra public/ai-agent-config/
│   └── src/
│       ├── pages/                 # LoginPage, DashboardPage, AiConfigPage, HistoryPage, SettingsPage
│       └── auth/                  # AuthContext, RequireAuth (route guard theo role)
└── CLAUDE.md                      # File này
```

## Database — Prisma

Dự án dùng **Prisma** (không phải TypeORM) để thao tác MySQL, vì dễ mở rộng: sửa 1 file `schema.prisma`, chạy 1 lệnh là có migration + type an toàn xuyên suốt code.

- **Nguồn kết nối**: biến `DATABASE_URL` trong `.env` (KHÔNG còn dùng `DB_HOST`/`DB_PORT`/...). Format: `mysql://user:password@host:port/database`.
- **Muốn thêm bảng/cột mới**: sửa `prisma/schema.prisma` → chạy `npm run prisma:migrate -- --name ten-thay-doi` (tạo migration + áp dụng vào DB dev + tự generate lại Prisma Client) → dùng ngay `this.prisma.tenBang.findMany(...)` trong service (inject `PrismaService` từ `src/prisma/prisma.service.ts`, module đã đánh dấu `@Global()` nên không cần import lại ở từng module).
- **Deploy lên môi trường khác** (server mới, DB rỗng hoặc đã có schema): chạy `npm run prisma:deploy` (áp toàn bộ migration đã commit, không hỏi xác nhận, an toàn cho CI/CD) rồi mới `npm run build && npm run start:prod`.
- **Xem/sửa dữ liệu trực quan**: `npm run prisma:studio` (mở UI ở trình duyệt).
- Tên bảng/cột thật trong MySQL vẫn giữ nguyên snake_case (`app_settings`, `password_hash`...) qua `@@map`/`@map` trong schema — phía TypeScript dùng camelCase (`appSettings`, `passwordHash`...) như bình thường, không có gì thay đổi ở tầng service/controller.
- Migration đầu tiên (`prisma/migrations/0_init`) là baseline của schema đã tồn tại trước khi chuyển sang Prisma — được đánh dấu "đã áp dụng" chứ không chạy lại, để không đụng dữ liệu cũ (users, settings đã cấu hình...).

## Đăng nhập & phân quyền

- 2 role: `admin` (toàn quyền) và `ai_manager` (chỉ Dashboard xem + Cấu hình AI sửa — không vào được Lịch sử Báo cáo/Cài đặt hệ thống, kể cả gọi thẳng API cũng bị chặn ở backend).
- Toàn bộ Login/Settings đã chuyển vào React SPA (`frontend/src/pages/LoginPage.tsx`, `SettingsPage.tsx`) — KHÔNG còn `public/login.html`/`public/settings.html`.
- Tài khoản admin + quản lý AI mặc định được tự tạo khi DB chưa có user nào (xem `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`MANAGER_EMAIL`/`MANAGER_PASSWORD` trong `.env`). Tạo thêm tài khoản qua màn hình Cài đặt hệ thống > Người dùng & Phân quyền.

## Quy tắc khi chỉnh sửa dự án

- Muốn đổi văn phong/cấu trúc báo cáo → sửa `.claude/agents/*.md` hoặc `.claude/rules/output-html.md`, KHÔNG sửa code TypeScript.
- Muốn đổi ràng buộc số liệu → sửa `.claude/rules/data-strict.md`.
- Muốn đổi model/temperature/max_tokens → sửa `.claude/settings.json` (nhớ kiểm tra model đích có hỗ trợ tham số đó không, xem mục "Lựa chọn model" ở trên).
- Không log số liệu nhạy cảm (doanh thu chi tiết, thông tin khách hàng) ra console ở môi trường production — chỉ log trạng thái từng bước (đang fetch, đã fetch xong N hóa đơn, đang gọi agent X, đã gửi email...).
