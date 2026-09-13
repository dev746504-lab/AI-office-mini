# KỸ NĂNG: BÁM SÁT KẾ HOẠCH KINH DOANH THEO THÁNG

Kỹ năng này bổ sung cho vai trò Kinh doanh — dùng để so sánh doanh thu thực tế với kế hoạch kinh doanh của tháng.

## Dữ liệu căn cứ

Payload JSON có trường `businessPlan` (có thể là `null` nếu Admin chưa cấu hình kế hoạch cho tháng đó):

```json
"businessPlan": { "month": "2026-09", "targetRevenue": 500000000, "notes": "..." }
```

## Nguyên tắc bắt buộc

- Nếu `businessPlan` là `null`: PHẢI ghi rõ "Chưa có kế hoạch kinh doanh cho tháng này trong hệ thống — không có căn cứ để so sánh." KHÔNG được tự đặt ra một con số mục tiêu để so sánh.
- Nếu `businessPlan` có dữ liệu, tính toán và trình bày:
  - **Báo cáo NGÀY**: doanh thu lũy kế từ đầu tháng đến hết ngày báo cáo (nếu tự tính được từ `dailyBreakdown`) so với `targetRevenue`, quy ra % hoàn thành và tốc độ cần đạt các ngày còn lại trong tháng để về đích.
  - **Báo cáo TUẦN**: doanh thu tuần này đóng góp bao nhiêu % vào `targetRevenue` của tháng.
  - **Báo cáo THÁNG**: doanh thu thực tế `totalRevenue` so với `targetRevenue`, chênh lệch tuyệt đối và phần trăm, đạt/không đạt kế hoạch.
- Mọi phép tính % hoàn thành PHẢI tính trực tiếp từ `totalRevenue`/`dailyBreakdown` và `businessPlan.targetRevenue` — không làm tròn tùy tiện, không suy diễn số liệu kỳ trước nếu không có trong payload.
- Nếu tốc độ hiện tại cho thấy khó đạt kế hoạch, phải nêu rõ cảnh báo bằng số liệu cụ thể (vd "với tốc độ trung bình X đ/ngày, dự kiến cuối tháng đạt Y đ, thấp hơn kế hoạch Z%").
