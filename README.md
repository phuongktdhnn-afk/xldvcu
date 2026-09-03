# XLDV 2026 - Free Long-Term Edition

Bản triển khai ưu tiên miễn phí lâu dài: Cloudflare Pages + Pages Functions + D1.
Không dùng Render PostgreSQL Free và không lưu database trên filesystem.

## Chạy local
Cần Node.js và Wrangler:

```bash
npm install
npx wrangler pages dev public --d1=XLDV_DB
```

## Deploy Cloudflare Pages
1. Đưa toàn bộ thư mục lên GitHub.
2. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
3. Build command: `exit 0`
4. Output directory: `public`
5. Tạo D1 database tên `XLDV_DB`.
6. Chạy migration trong `migrations/0001_init.sql`.
7. Trong Pages project, Settings -> Functions -> D1 database bindings, binding name `XLDV_DB`.
8. Deploy lại.

## Lưu ý về miễn phí
Không có nhà cung cấp nào cam kết dịch vụ Internet miễn phí vĩnh viễn. Bản này loại bỏ Render PostgreSQL Free 30 ngày và dùng D1/Pages theo hạn mức Free hiện hành; hạn mức/chính sách có thể thay đổi.

## Tài khoản demo
- admin / admin123
- bgh / bgh123
- dhspkt / dhspkt123

Đổi mật khẩu trước khi dùng thật.

## Excel
Excel được đọc ở trình duyệt bằng SheetJS CDN, sau đó gửi dữ liệu vào D1. Sheet nguồn: NHAP_DANH_SACH và KQ_PA1. Theo bộ dữ liệu hiện tại, KQ_PA1 được ánh xạ tạm sang PA3 do tên sheet/ý nghĩa văn bản chưa thống nhất. PA1 chứng chỉ cần chốt schema chính thức trước khi tự động hóa.
