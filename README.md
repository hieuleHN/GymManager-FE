# GymManager-FE

# 🏋️ ZenFitness - Hệ thống quản lý phòng gym

Ứng dụng web quản lý phòng gym toàn diện với 2 hệ thống: Admin và Member Dashboard.

## 📦 Cài đặt nhanh

```bash
# 1. Clone hoặc download dự án
# 2. Cài đặt dependencies
pnpm install

# 3. Chạy development server
pnpm dev

# 4. Build production
pnpm build
```

## 🚀 Công nghệ sử dụng

- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS v4
- 🧭 React Router v7
- 📊 Recharts
- 🎭 Material-UI
- ✨ Motion (Framer Motion)
- 📱 Responsive Design

## 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── components/      # Components dùng chung
│   ├── pages/          # Tất cả các trang
│   │   ├── admin/      # 25+ trang quản trị
│   │   └── dashboard/  # Trang member
│   ├── context/        # React Context (Auth, etc)
│   └── routes.tsx      # Cấu hình routing
├── imports/            # Assets từ Figma
└── styles/             # CSS files
```

## 🔐 Tài khoản demo

### Admin
- Email: `admin@zenfitness.com`
- Password: `admin123`

### Member
- Email: `member@zenfitness.com`
- Password: `member123`

## ✨ Tính năng chính

### Hệ thống Admin (25+ trang)
✅ Dashboard & Thống kê
✅ Quản lý khách hàng
✅ Quản lý thiết bị
✅ Quản lý gói tập & hợp đồng
✅ Quản lý nhân viên & phân quyền
✅ Quản lý dịch vụ & sản phẩm
✅ Điểm danh & lịch tập
✅ Thanh toán (QR + chuyển khoản)
✅ Tuyển dụng & chi phí
✅ Cộng đồng & tin nhắn
✅ Thông báo realtime
✅ Quản lý giao diện trang chủ

### Hệ thống Member
✅ Dashboard cá nhân
✅ Quản lý gói tập
✅ Đặt lịch tập & PT
✅ Theo dõi tiến độ
✅ Cộng đồng & tin nhắn
✅ Lịch sử giao dịch

### Trang công khai
✅ Landing page
✅ Chi tiết câu lạc bộ
✅ Danh sách gói tập
✅ Thanh toán online

## 🛠️ Scripts

```bash
pnpm dev      # Chạy dev server (port 5173)
pnpm build    # Build production
pnpm preview  # Preview build
```

## 📝 Lưu ý

- Dự án sử dụng **pnpm** (khuyến nghị) hoặc npm/yarn
- Port mặc định: `5173`
- Build output: `dist/`

## 🐛 Troubleshooting

### Module not found
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Port đã sử dụng
Thay đổi port trong `vite.config.ts`

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team.

---

Made with ❤️ by ZenFitness Team
