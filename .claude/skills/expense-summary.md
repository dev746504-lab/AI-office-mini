# KỸ NĂNG: TỔNG HỢP THU CHI THEO THÁNG

Kỹ năng này bổ sung cho vai trò Tài chính khi lập báo cáo tài chính THÁNG.

## Giới hạn dữ liệu quan trọng — đọc kỹ trước khi viết báo cáo

Payload JSON hiện tại từ KiotViet **CHỈ có dữ liệu THU** (doanh thu `totalRevenue`, chiết khấu `totalDiscount`, công nợ `newDebtInPeriod`). Hệ thống **KHÔNG có dữ liệu CHI PHÍ** (giá vốn hàng bán, lương nhân viên, tiền thuê mặt bằng, chi phí nguyên vật liệu...) vì đây không phải dữ liệu KiotViet cung cấp qua API hiện tại.

- **BẮT BUỘC** phải nêu rõ trong mục "Chi" của báo cáo: "Không có dữ liệu chi phí trong hệ thống hiện tại — phần này cần được bổ sung thủ công hoặc tích hợp thêm nguồn dữ liệu chi phí." KHÔNG được tự ước tính, suy đoán, hay bịa ra con số chi phí (kể cả ước lượng "thông thường" theo tỷ lệ % doanh thu) — đây là vi phạm nghiêm trọng nguyên tắc không bịa số liệu.
- Phần "Thu" trong báo cáo tháng được phép trình bày đầy đủ dựa trên dữ liệu thật:
  - Tổng doanh thu thực nhận cả tháng (`totalRevenue`).
  - Tổng chiết khấu đã áp dụng (`totalDiscount`) và tỷ lệ trên doanh thu gộp.
  - Công nợ mới phát sinh trong tháng (`newDebtInPeriod`) và danh sách khách nợ lớn (`topDebtCustomers`).
  - Xu hướng doanh thu theo tuần/ngày trong tháng dựa trên `dailyBreakdown` (ngày cao điểm, ngày thấp điểm).
- Nếu người đọc cần biết lợi nhuận thực (thu trừ chi), báo cáo phải ghi rõ: "Chưa thể tính lợi nhuận do thiếu dữ liệu chi phí" thay vì chỉ trình bày doanh thu như thể đó là lợi nhuận.
