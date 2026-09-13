# KỸ NĂNG: TÂM LÝ HỌC MARKETING ÁP DỤNG VÀO BÁO CÁO BÁN LẺ

Kỹ năng này bổ sung cho vai trò Marketing khi phân tích dữ liệu KiotViet, giúp lý giải hành vi mua hàng và đề xuất hành động có cơ sở tâm lý học.

## Giới hạn áp dụng

Chỉ áp dụng các mô hình dưới đây khi dữ liệu KiotViet **thực sự thể hiện** tín hiệu tương ứng. KHÔNG được áp dụng lý thuyết mà không có bằng chứng trong JSON. Nếu dữ liệu không rõ ràng, ghi "Không đủ dữ liệu để áp dụng mô hình X".

## Các mô hình tư duy áp dụng được

### Nguyên tắc Pareto (80/20)
Khoảng 20% sản phẩm thường tạo ra ~80% doanh thu. Khi phân tích `topProducts`:
- Xác định nhóm sản phẩm "cốt lõi" đang gánh phần lớn doanh thu.
- Nếu 1-2 sản phẩm chiếm tỷ trọng quá cao (>50%), cảnh báo rủi ro phụ thuộc và đề xuất phát triển sản phẩm thứ hai.
- Nếu doanh thu dàn trải đều, đây là tín hiệu tốt về đa dạng hóa, nhưng khó tập trung nguồn lực marketing.

### Nhạy cảm giá (Price Sensitivity)
Từ trường `discount` (chiết khấu):
- Chiết khấu cao + doanh số cao → khách hàng **nhạy cảm giá** mạnh, cần cân nhắc kỹ khi điều chỉnh giá hoặc bỏ khuyến mãi.
- Chiết khấu thấp + doanh số ổn định → sản phẩm có **giá trị cảm nhận tốt**, có thể thử tăng giá hoặc giảm chiết khấu.
- Chiết khấu tăng mạnh mà doanh số không tăng tương ứng → chiến lược giảm giá đang **kém hiệu quả** với nhóm khách hàng này.

### Tâm lý mất mát (Loss Aversion)
Người mua sợ mất hơn muốn được lợi. Áp dụng khi đề xuất chiến lược:
- Thay vì "Giảm 20%", khuyến nghị frame là "Tiết kiệm X đồng cho đơn hàng này" — cụ thể hóa khoản tiết kiệm.
- Khi công nợ tăng (`newDebt`), nhắc nhở theo hướng "tránh mất" dễ tác động hơn "để được lợi".
- Khuyến mãi "flash sale có giới hạn thời gian" khai thác tâm lý này mạnh hơn giảm giá thường xuyên.

### Jobs to Be Done (Công việc khách hàng thuê sản phẩm làm)
Khách hàng không mua sản phẩm — họ "thuê" sản phẩm để hoàn thành một công việc:
- Functional: bản thân sản phẩm (ăn uống, tiêu dùng hằng ngày).
- Emotional: cảm giác sau khi mua (ngon, sang, tiện).
- Social: hình ảnh trước người khác (quà tặng, thương hiệu).
Khi phân tích top sản phẩm bán chạy, suy nghĩ loại "công việc" mà chúng đang được thuê làm — từ đó đề xuất kênh và nội dung marketing phù hợp.

### Nguyên tắc đảo ngược (Inversion)
Thay vì hỏi "Làm sao tăng doanh thu?", hỏi "Điều gì đang giết doanh thu?":
- Doanh thu giảm → tìm nguyên nhân dễ thấy trước (mùa vụ, hết hàng, giá thay đổi) trước khi quy cho nguyên nhân phức tạp.
- Khuyến mãi không hiệu quả → kiểm tra xem sản phẩm giảm giá có phải sản phẩm khách muốn hay không.

## Lưu ý văn phong

Khi áp dụng các mô hình này trong nhận định, diễn giải cho Ban Giám đốc hiểu được logic — không dùng thuật ngữ học thuật như "Pareto" hay "loss aversion" mà hãy giải thích bằng ngôn ngữ thực tế kinh doanh.
