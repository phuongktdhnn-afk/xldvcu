# XLDV 2026 — Web hoàn chỉnh

Web quản lý/xử lý xếp lớp đầu vào tiếng Anh: đăng nhập, phân quyền Admin/CSGDĐHTV/BGH, dữ liệu PostgreSQL, Excel import, đối soát PA1/PA2/PA3, cảnh báo, biểu đồ, audit log, xuất báo cáo và cập nhật thời gian thực bằng SSE.

## Chạy nhanh bằng Docker
1. Cài Docker Desktop.
2. Mở terminal tại thư mục này.
3. Chạy `docker compose up --build`.
4. Mở http://localhost:4000.

## Tài khoản demo
- Admin: `admin` / `admin123`
- BGH: `bgh` / `bgh123`
- ĐHSPKT: `dhspkt` / `dhspkt123`
- ĐHSP: `dhsp` / `dhsp123`
- ĐHKT: `dhkt` / `dhkt123`
- ĐHBK: `dhbk` / `dhbk123`
- ĐH CNTT: `dhcntt` / `dhcntt123`

Đổi mật khẩu/tài khoản trong production.

## Nguồn dữ liệu
File `data/Bo_bieu_mau_du_lieu_XLDV_DHNN.xlsx` được nạp lần đầu khi database rỗng. Sheet `NHAP_DANH_SACH` là nguồn danh sách; `KQ_PA1` được giữ nguyên tên sheet nguồn nhưng trong hệ thống mới được ánh xạ tạm thời thành PA3 (kiểm tra xếp lớp đầu vào), vì văn bản 3265/DHDN-DTĐBCL mô tả PA1 là chứng chỉ, PA2 là điểm THPT, PA3 là kiểm tra xếp lớp. Đây là điểm cần chốt lại bằng data dictionary chính thức trước khi vận hành nghiệp vụ.

PA2 theo văn bản: 6.5–10 = B1.1; 4.75–<6.5 = A2.2; <4.75 = A2.1. PA3: 83–100 = B1.1; 63–82 = A2.2; <63 = A2.1. Nếu không tham gia một trong ba phương thức thì A2.1.

PA1 chứng chỉ: workbook hiện tại chưa có sheet dữ liệu chứng chỉ độc lập; hệ thống có sẵn các trường PA1 để nhập/import khi có cấu trúc chính thức.

## Tính năng
- JWT login + role-based access.
- CSGD chỉ thấy dữ liệu trường mình; BGH xem toàn hệ thống; Admin có import/audit.
- Dashboard KPI + biểu đồ mức xếp lớp/phương án.
- Bộ lọc CSGD, khóa, ngành, mức, phương án, trạng thái/cảnh báo, tìm kiếm MSSV.
- Đối soát PA1/PA2/PA3: chọn mức cao nhất hợp lệ; hiển thị lý do và cảnh báo mâu thuẫn.
- Excel Import: preview → validate → ghi dữ liệu trong transaction → phát sự kiện realtime.
- Xuất Excel theo bộ lọc.
- Audit log: đăng nhập, đăng xuất, xem dữ liệu, import, export, xem log.
- Realtime: SSE; mọi client tự nhận sự kiện khi có import hoặc cập nhật.
- PostgreSQL làm nguồn vận hành; Excel là nguồn nhập liệu, không phải database runtime.

## Production hardening
Bật HTTPS/reverse proxy, secret manager, backup PostgreSQL, MFA/SSO OIDC/SAML, giới hạn upload, antivirus/scan file, CSRF/CORS policy, rate limiting, account lockout, rotate JWT secret, phân quyền DB, staging/rollback import và giám sát.

## Render

Có sẵn `render.yaml` để triển khai Node.js + PostgreSQL trên Render. Xem `README_RENDER.md`.
