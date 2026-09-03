# XLDV 2026 - Render Deployment

Bản này chạy trực tiếp trên Render bằng Node.js + PostgreSQL, không cần Docker.

## Deploy nhanh bằng GitHub + Render

1. Tạo repository GitHub mới.
2. Upload toàn bộ thư mục này vào repository.
3. Vào Render và chọn **New > Blueprint**.
4. Chọn repository GitHub.
5. Render đọc file `render.yaml` và tạo:
   - Web Service `xldv-2026`
   - PostgreSQL `xldv-2026-db`
6. Chờ build hoàn tất.
7. Mở URL dạng `https://xldv-2026.onrender.com`.

## Tài khoản demo

- admin / admin123
- bgh / bgh123
- dhspkt / dhspkt123
- dhsp / dhsp123
- dhkt / dhkt123
- dhbk / dhbk123
- dhcntt / dhcntt123

## Dữ liệu

Lần khởi tạo đầu tiên, hệ thống tự đọc file:
`data/Bo_bieu_mau_du_lieu_XLDV_DHNN.xlsx`

MSSV là khóa đối soát chính.

## Lưu ý Render

- Render Web Service miễn phí có thể sleep khi không có truy cập; khi mở lại sẽ có độ trễ khởi động.
- PostgreSQL `basic-256mb` là database có tính phí theo gói Render hiện hành.
- Không dùng tài khoản demo trong vận hành chính thức. Đổi cơ chế xác thực và mật khẩu.
- SSO ĐHĐN trong giao diện hiện là nút chờ tích hợp; muốn dùng SSO thật cần cấu hình OIDC/SAML của ĐHĐN.
- Để dữ liệu realtime giữa nhiều instance, nên dùng Redis/pub-sub thay vì bộ nhớ tiến trình hiện tại.
