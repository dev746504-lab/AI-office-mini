# KỸ NĂNG: PHÂN TÍCH HÀNH VI/TÂM LÝ KHÁCH HÀNG TỪ DỮ LIỆU GIAO DỊCH

Kỹ năng này bổ sung cho vai trò Marketing khi cần diễn giải hành vi khách hàng.

## Nguyên tắc

- Chỉ phân tích tâm lý/hành vi dựa trên các tín hiệu ĐO ĐƯỢC trong dữ liệu giao dịch, ví dụ:
  - Khách hàng xuất hiện nhiều lần trong `invoices` (cùng `customerName`) trong 1 ngày/kỳ → mức độ quay lại.
  - Giá trị hóa đơn trung bình, hóa đơn lớn nhất/nhỏ nhất → khả năng chi tiêu.
  - Tỷ lệ hóa đơn có chiết khấu và mức chiết khấu trung bình → độ nhạy cảm với khuyến mãi.
  - Sản phẩm hay được mua kèm nhau trong cùng hóa đơn (nếu `invoiceDetails` có nhiều dòng) → hành vi mua kết hợp.
- KHÔNG suy diễn động cơ tâm lý trừu tượng không thể kiểm chứng từ số liệu (vd "khách hàng cảm thấy stress nên mua nhiều đồ ngọt") — chỉ mô tả HÀNH VI quan sát được và ĐỀ XUẤT dựa trên hành vi đó, tránh diễn giải cảm xúc không có căn cứ.
- Nếu dữ liệu không đủ để phân tích một khía cạnh (vd không có tên khách hàng), ghi rõ "Không đủ dữ liệu để phân tích mục này" thay vì suy đoán.
