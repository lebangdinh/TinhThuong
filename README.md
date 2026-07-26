# Công cụ tính thưởng Target QL / Trưởng ca

Web tĩnh chạy hoàn toàn trên trình duyệt, có thể triển khai miễn phí bằng GitHub Pages.

## Tính năng

- Nhập doanh thu, vùng, số lượng siêu thị, tỷ lệ hoàn thành doanh thu/LNTT.
- Tính hệ số K1, K2 và quỹ thưởng Quản lý/Trưởng ca.
- Phân bổ thưởng theo giờ công từng người.
- Lưu dữ liệu trên trình duyệt bằng `localStorage`.
- Xuất JSON, CSV và in/xuất PDF.
- Tương thích máy tính và điện thoại.

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub, ví dụ `cong-cu-tinh-thuong`.
2. Tải toàn bộ các file `index.html`, `styles.css`, `app.js`, `README.md` lên thư mục gốc của repository.
3. Vào **Settings → Pages**.
4. Tại **Build and deployment**, chọn **Deploy from a branch**.
5. Chọn branch `main`, thư mục `/ (root)`, rồi bấm **Save**.
6. Sau vài phút, website sẽ có địa chỉ dạng:

   `https://TEN-TAI-KHOAN.github.io/cong-cu-tinh-thuong/`

## Lưu ý dữ liệu

Dữ liệu được lưu riêng trên trình duyệt của từng người dùng, không tự đồng bộ giữa các thiết bị. Muốn lưu tập trung cho nhiều người cần bổ sung backend hoặc Google Sheets/Firebase/Supabase.
