# Lumi Travel — Website + Trang quản trị

Website **demo** cho công ty du lịch (chuyên tour Trung Quốc), kèm trang quản trị để tự quản lý tour, đơn đặt và nội dung.
"Lumi Travel" là tên thương hiệu giả dùng để trình diễn. Tên, logo chữ, hotline, Zalo, địa chỉ đều đổi được trong *Admin → Cài đặt*.
Không cần cài thêm thư viện, chỉ cần **Node.js 18 trở lên**.

## Chạy thử trên máy

```bash
npm start
```

- Website: http://localhost:3000
- Quản trị: http://localhost:3000/admin
- Mật khẩu quản trị lần đầu: `lumi@2026`. **Đổi ngay** trong *Cài đặt → Đổi mật khẩu quản trị*.

Có thể đặt mật khẩu ban đầu khác bằng biến môi trường `ADMIN_PASSWORD`, áp dụng khi chưa có file `data/db.json`.
Đổi cổng chạy bằng biến `PORT`.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `server.js` | Máy chủ web + API + đăng nhập quản trị |
| `data/seed.js` | Dữ liệu mẫu, chỉ dùng khi chạy lần đầu |
| `data/db.json` | **Toàn bộ dữ liệu thật** (tour, đơn, cài đặt…). Nhớ sao lưu định kỳ |
| `public/uploads/` | Ảnh tải lên từ trang quản trị |
| `public/` | Giao diện: trang chủ, danh sách tour, chi tiết tour, cẩm nang |
| `public/admin/` | Trang quản trị |

## Trang quản trị làm được gì

- **Tổng quan**: số đơn mới, đơn đã chốt, doanh thu tạm tính, biểu đồ đơn 14 ngày, tour được đặt nhiều.
- **Đơn đặt tour**: xem đơn từ website, đổi trạng thái (Mới / Đã liên hệ / Đã chốt / Đã hủy), ghi chú nội bộ, gọi/Zalo nhanh, xuất file CSV mở bằng Excel.
- **Tour**: thêm, sửa, nhân bản, ẩn/hiện, đánh dấu nổi bật. Có tải ảnh (tự nén), lịch trình theo ngày, bảng lịch khởi hành & giá (tạo nhanh lịch hàng tuần), mục bao gồm/không bao gồm/trẻ em/lưu ý.
- **Điểm đến**, **Cẩm nang**, **Đánh giá**, **Đăng ký nhận tin**.
- **Cài đặt**: hotline, Zalo, địa chỉ văn phòng, giấy phép, ảnh nền trang chủ, số liệu nổi bật, đổi mật khẩu.

## Bản demo trên GitHub Pages

Mỗi lần push lên nhánh `main`, GitHub Actions chạy `scripts/build-static.js` và đăng bản **tĩnh** lên GitHub Pages.
Bản này hiển thị đầy đủ tour và cẩm nang theo dữ liệu mẫu, nhưng **không có trang quản trị** và **không lưu đơn**: form đặt tour sẽ sao chép thông tin và mở Zalo của Lumi Travel.
Để có admin và nhận đơn thật, chạy bản Node như hướng dẫn bên dưới.

## Đưa lên mạng (bản đầy đủ có admin)

Cần một máy chủ chạy được Node.js và có ổ đĩa lưu lâu dài, vì dữ liệu nằm trong `data/db.json` và `public/uploads/`.
Ví dụ: VPS (Ubuntu + PM2 + Nginx), Railway hoặc Render (gắn thêm persistent disk).

```bash
PORT=3000 ADMIN_PASSWORD='mật-khẩu-mạnh' node server.js
```

Nên chạy sau HTTPS (Nginx/Cloudflare) để mật khẩu quản trị được mã hóa khi gửi.

## Cần làm trước khi ra mắt

- Thay giá tour, lịch khởi hành và ảnh mẫu bằng dữ liệu thật của khách (ảnh mẫu đang lấy từ Unsplash).
- Thay các đánh giá mẫu bằng đánh giá thật của khách.
- Kiểm tra lại số liệu (12.000+ khách, 98% đậu visa…) trong *Cài đặt*.
- Điền giấy phép kinh doanh / giấy phép lữ hành trong *Cài đặt*.
