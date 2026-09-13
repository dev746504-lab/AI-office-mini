# KỸ NĂNG: ĐỌC TÍN HIỆU HÀNH VI KHÁCH HÀNG TỪ DỮ LIỆU GIAO DỊCH

Kỹ năng này giúp vai trò Marketing khai thác tối đa dữ liệu KiotViet để suy ra các tín hiệu hành vi khách hàng — không cần khảo sát, không cần phỏng vấn.

## Giới hạn áp dụng

Mọi suy luận phải bắt nguồn từ dữ liệu thực tế trong JSON payload. Không được suy diễn xa hơn những gì dữ liệu có thể ủng hộ. Ghi rõ "suy luận từ dữ liệu nội bộ" khi trình bày.

## Framework phân tích tín hiệu giao dịch

### 1. Tín hiệu về sức mua

**Quy mô đơn hàng trung bình** (total / invoiceCount):
- Tăng → khách hàng mua nhiều hơn mỗi lần, hoặc cơ cấu sản phẩm đang dịch lên cao hơn.
- Giảm → giỏ hàng nhỏ lại, có thể do khách mua thăm dò, hoặc sản phẩm rẻ hơn đang thắng.

**Tần suất giao dịch so với kỳ trước** (nếu có dữ liệu nhiều ngày):
- Nhiều hóa đơn hơn + tổng doanh thu tương đương → khách hàng mua thường xuyên hơn nhưng ít hơn mỗi lần.
- Ít hóa đơn hơn + doanh thu tương đương → khách hàng mua ít lần hơn nhưng mỗi lần nhiều hơn (mua tích trữ?).

### 2. Tín hiệu về nhóm sản phẩm ưa thích

Từ `topProducts` — xem xét:
- **Sản phẩm số 1 cách xa sản phẩm số 2** → có "sao dẫn đầu" rõ ràng; đầu tư marketing vào sản phẩm này có ROI cao nhất.
- **Top 5 tương đương nhau** → không có sản phẩm nổi bật, nên thử nghiệm bundle hoặc cross-sell.
- **Sản phẩm bất thường xuất hiện** (chưa từng ở top) → có thể do đợt khuyến mãi, mùa vụ, hoặc sản phẩm mới đang được thị trường đón nhận tốt — điểm cần theo dõi.

### 3. Tín hiệu về chiết khấu và hành vi mua

Từ `discount` và tỷ lệ discount/total:
- **Tỷ lệ chiết khấu > 15%** → khách hàng đang được kéo bằng giá, không phải bằng giá trị sản phẩm.
- **Chiết khấu tăng mà doanh thu không tăng tương ứng** → chiết khấu đang bị "ăn" vào margin mà không tạo ra khách mới.
- **Chiết khấu thấp + doanh thu ổn** → sản phẩm có sức kéo riêng; đây là nhóm sản phẩm nên ưu tiên quảng bá với giá full.

### 4. Tín hiệu về thời điểm mua (nếu có `dailyBreakdown`)

- **Mua dồn cuối tuần** → khách hàng là người đi làm, mua kết hợp cuối tuần; nên phủ quảng cáo Thứ 5–Thứ 6 để gợi ý trước.
- **Mua đều trong tuần** → khách hàng đa dạng hoặc nhu cầu thiết yếu hàng ngày; quảng bá liên tục hiệu quả hơn chiến dịch theo đợt.
- **Doanh thu thứ Hai thấp** → phổ biến cho nhiều ngành; không cần diễn giải quá mức trừ khi giảm bất thường.

### 5. Tín hiệu về công nợ và độ tin cậy khách hàng

Từ `newDebt`:
- **Công nợ mới cao** → một phần khách hàng đang mua chịu; cần theo dõi khả năng thu hồi trước khi mở rộng bán chịu thêm.
- **Công nợ tăng liên tục qua các kỳ** → rủi ro tích lũy; đề xuất siết chính sách bán chịu hoặc tăng cường nhắc nợ.

## Cách trình bày suy luận

Khi đưa ra nhận định dựa trên các tín hiệu trên:
1. Nêu tín hiệu cụ thể từ dữ liệu (con số nào, trường nào).
2. Suy luận hành vi có thể giải thích tín hiệu đó.
3. Đề xuất hành động marketing cụ thể (1-2 dòng, ngắn gọn).
4. Nếu không chắc chắn, ghi "Cần thêm dữ liệu X kỳ để xác nhận".
