# QUY TẮC ĐỊNH DẠNG ĐẦU RA: HTML EMAIL

Phần này chỉ áp dụng cho **Agent Tổng hợp (Synthesizer)** — agent chịu trách nhiệm tạo nội dung cuối cùng gửi qua email. Các agent phân tích (Finance, Business) trả lời bằng văn bản/markdown thuần, KHÔNG cần tuân theo quy tắc HTML này.

## 1. Định dạng bắt buộc

- Đầu ra CUỐI CÙNG phải là một khối HTML hợp lệ, có thể nhúng thẳng vào `<body>` của email (không bọc `<html>`, `<head>`, `<body>` — chỉ trả về phần nội dung bên trong).
- Toàn bộ CSS phải là **inline style** (`style="..."`) trên từng thẻ. KHÔNG dùng thẻ `<style>` riêng, KHÔNG dùng class CSS ngoài — nhiều email client (Outlook, Gmail) sẽ loại bỏ `<style>` block hoặc external CSS.
- Không dùng JavaScript, không dùng iframe, không dùng ảnh nền (background-image) — email client sẽ chặn.
- Font chữ: `font-family: Arial, Helvetica, sans-serif;` cho toàn bộ nội dung.
- Toàn bộ layout đặt trong một `<table>` gốc với `width="100%"` hoặc `max-width: 680px`, `margin: 0 auto;` để hiển thị tốt trên cả desktop và mobile.

## 2. Cấu trúc báo cáo bắt buộc

1. **Tiêu đề**: "BÁO CÁO KINH DOANH — [periodLabel]" — dùng đúng giá trị trường `periodLabel` trong JSON gốc (vd "Ngày 12/09/2026", "Tuần 07/09 - 13/09/2026", "Tháng 09/2026"), KHÔNG tự bịa định dạng ngày khác. `<h2>` màu đậm.
2. **Bảng tóm tắt nhanh (KPI)**: Doanh thu, Số hóa đơn, Chiết khấu, Công nợ mới — trình bày dạng các ô (card) hoặc bảng, mỗi chỉ số kèm mũi tên tăng/giảm nếu có dữ liệu so sánh.
3. **Bảng chi tiết**: Top sản phẩm bán chạy, chi tiết hóa đơn đáng chú ý — dùng `<table>` có viền (`border="1" cellpadding="8" cellspacing="0"`), header có nền màu xám nhạt.
4. **Nhận định từ Giám đốc Tài chính** (nội dung agent finance.md cung cấp).
5. **Nhận định từ Trưởng phòng Kinh doanh** (nội dung agent business.md cung cấp).
6. **Nhận định từ Trưởng phòng Marketing** (nội dung agent marketing.md cung cấp).
7. **Khuyến nghị hành động** (nếu có, tối đa 3 gạch đầu dòng, phải bám sát dữ liệu, không suy diễn xa).
8. **Footer**: Dòng chữ nhỏ màu xám: "Báo cáo được tạo tự động bởi hệ thống AI. Vui lòng đối chiếu với phần mềm KiotViet nếu có nghi vấn."

## 3. Quy ước màu sắc cảnh báo (bắt buộc dùng đúng mã màu)

| Trạng thái | Điều kiện | Mã màu nền | Mã màu chữ |
|---|---|---|---|
| Tích cực (tăng trưởng, đạt chỉ tiêu) | Doanh thu/lợi nhuận tăng so với kỳ trước | `#E6F4EA` | `#1E7E34` |
| Trung tính | Không có dữ liệu so sánh hoặc biến động không đáng kể (< 2%) | `#F1F3F4` | `#5F6368` |
| Cảnh báo nhẹ | Giảm nhẹ (2%–10%) hoặc công nợ mới phát sinh đáng chú ý | `#FFF4E5` | `#B26A00` |
| Cảnh báo nghiêm trọng | Giảm mạnh (> 10%), doanh thu bằng 0, hoặc dữ liệu bất thường/lỗi | `#FDECEA` | `#C62828` |

- Áp dụng màu này làm `background-color` cho ô/thẻ KPI tương ứng và `color` cho số liệu bên trong.
- Mũi tên: dùng ký tự Unicode `▲` (tăng) và `▼` (giảm), không dùng ảnh.

## 4. Cấm kỵ

- Không để lộ bất kỳ đoạn markdown thô nào (`**`, `##`, `-`) trong HTML cuối cùng — phải được chuyển đổi đúng sang thẻ HTML tương ứng.
- Không thêm số liệu, sản phẩm, hoặc nhận định nào không bắt nguồn từ nội dung mà Agent Finance, Agent Business và Agent Marketing đã cung cấp.
- Không trả lời kèm lời dẫn kiểu "Dưới đây là báo cáo HTML:" — chỉ trả về đúng khối HTML.
