# 📥 Hướng dẫn Download Dự án ZenFitness

## Vấn đề: "Failed to download code files"

Nếu bạn gặp lỗi này trong Figma Make, đây là các giải pháp:

## ✅ Giải pháp 1: Sử dụng Git (Khuyến nghị)

### Bước 1: Commit code
```bash
git add .
git commit -m "ZenFitness complete project"
```

### Bước 2: Push lên GitHub
```bash
# Tạo repository mới trên GitHub: https://github.com/new
# Sau đó:
git remote add origin https://github.com/YOUR_USERNAME/zenfitness.git
git branch -M main
git push -u origin main
```

### Bước 3: Clone về máy local
```bash
git clone https://github.com/YOUR_USERNAME/zenfitness.git
cd zenfitness
pnpm install
pnpm dev
```

## ✅ Giải pháp 2: Download từ Figma Make

1. Click vào menu **File** hoặc **⋯** (3 dots) ở góc trên
2. Chọn **"Export"** hoặc **"Download"**
3. Chọn format: **"Source Code"**
4. Click **"Download"**

## ✅ Giải pháp 3: Sync với GitHub (trong Figma Make)

1. Tìm nút **"Connect to GitHub"** hoặc **"Sync"**
2. Authorize GitHub
3. Chọn repository hoặc tạo mới
4. Click **"Push to GitHub"**
5. Clone về máy từ GitHub

## ✅ Giải pháp 4: Copy thủ công

Nếu tất cả đều fail, copy các file quan trọng:

### Files BẮT BUỘC:
- ✅ `src/` - Toàn bộ source code
- ✅ `package.json`
- ✅ `pnpm-lock.yaml`
- ✅ `vite.config.ts`
- ✅ `postcss.config.mjs`
- ✅ `index.html`
- ✅ `.gitignore`

### Files TÙY CHỌN:
- `README.md`
- `SETUP.md`
- `.npmrc`

### KHÔNG CẦN:
- ❌ `node_modules/` (sẽ cài lại)
- ❌ `dist/` (build output)
- ❌ `.git/` (nếu không dùng Git)

## 🔧 Sau khi download về máy

```bash
# Cài đặt dependencies
pnpm install

# Chạy dev server
pnpm dev

# Mở browser: http://localhost:5173
```

## 🐛 Nếu vẫn gặp lỗi

### Lỗi 1: Module not found
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Lỗi 2: Port đã sử dụng
```bash
# Thay đổi port trong vite.config.ts
# hoặc dùng:
pnpm dev --port 3000
```

### Lỗi 3: Build fails
```bash
pnpm build --debug
# Check console output
```

## 📞 Cần hỗ trợ?

Nếu vẫn không download được, có thể:
1. **Screenshot lỗi** và gửi cho support
2. Check **browser console** (F12) xem có lỗi gì
3. Thử **browser khác** (Chrome, Firefox, Edge)
4. **Clear cache** và thử lại

---

✨ **Tip**: Cách tốt nhất là dùng Git + GitHub để quản lý code!
