# ZenFitness - Hướng dẫn Setup

## 📦 Cài đặt

### 1. Clone hoặc Download dự án

```bash
# Nếu có Git
git clone <repository-url>
cd zenfitness

# Hoặc download và giải nén file zip/tar.gz
```

### 2. Cài đặt dependencies

```bash
# Sử dụng pnpm (khuyến nghị)
pnpm install

# Hoặc npm
npm install

# Hoặc yarn
yarn install
```

### 3. Chạy development server

```bash
pnpm dev
# hoặc
npm run dev
```

Truy cập: http://localhost:5173

## 🏗️ Cấu trúc dự án

```
zenfitness/
├── src/
│   ├── app/
│   │   ├── components/        # Components dùng chung
│   │   │   ├── AdminLayout.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/            # Tất cả các trang
│   │   │   ├── admin/        # Trang admin
│   │   │   └── dashboard/    # Trang member
│   │   ├── context/          # React Context
│   │   ├── routes.tsx        # Cấu hình routes
│   │   └── App.tsx
│   ├── imports/              # Assets từ Figma
│   └── styles/               # CSS files
├── package.json
├── vite.config.ts
└── pnpm-lock.yaml
```

## 🔑 Tài khoản demo

### Admin
- Email: `admin@zenfitness.com`
- Password: `admin123`

### Member
- Email: `member@zenfitness.com`  
- Password: `member123`

## 📋 Danh sách tính năng

### Hệ thống Admin
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý khách hàng
- ✅ Quản lý thiết bị
- ✅ Quản lý gói tập & hợp đồng
- ✅ Quản lý dịch vụ
- ✅ Quản lý điểm danh
- ✅ Quản lý sản phẩm
- ✅ Quản lý nhân viên & phân quyền
- ✅ Quản lý công việc
- ✅ Quản lý thống kê (6 biểu đồ)
- ✅ Quản lý cơ sở, bộ môn, chính sách
- ✅ Quản lý giao diện trang chủ (7 tabs)
- ✅ Quản lý thanh toán (chuyển khoản + QR)
- ✅ Quản lý tuyển dụng (CV)
- ✅ Quản lý chi phí
- ✅ Hồ sơ huấn luyện viên
- ✅ Lịch tập & chuyển lịch
- ✅ Đánh giá hội viên
- ✅ Cộng đồng & bài viết
- ✅ Tin nhắn
- ✅ Quản lý tủ đồ
- ✅ Xác nhận lịch tập
- ✅ Hệ thống thông báo

### Hệ thống Member
- ✅ Dashboard cá nhân
- ✅ Quản lý gói tập
- ✅ Lịch sử giao dịch
- ✅ Lịch tập cá nhân
- ✅ Đặt lịch tập
- ✅ Đặt lịch với PT
- ✅ Theo dõi tiến độ
- ✅ Cộng đồng
- ✅ Tin nhắn
- ✅ Dịch vụ
- ✅ Cài đặt tài khoản

### Trang công khai
- ✅ Trang chủ với slider
- ✅ Chi tiết câu lạc bộ
- ✅ Chi tiết bộ môn
- ✅ Danh sách gói tập
- ✅ Đăng ký/Đăng nhập
- ✅ Thanh toán online

## 🛠️ Build production

```bash
pnpm build
# Output trong thư mục dist/
```

## 📝 Notes

- Dự án sử dụng **React Router** cho routing
- **Tailwind CSS v4** cho styling  
- **Material-UI** cho một số components
- **Motion/Framer Motion** cho animations
- **Recharts** cho biểu đồ
- **React Slick** cho carousel

## 🐛 Troubleshooting

### Lỗi module not found
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Port đã được sử dụng
Thay đổi port trong `vite.config.ts`:
```ts
server: {
  port: 3000 // Đổi sang port khác
}
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**Made with ❤️ by ZenFitness Development Team**
