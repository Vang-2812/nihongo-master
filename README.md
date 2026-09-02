# Nihongo Master (日本語マスター)
> **Ứng dụng Web Học Từ Vựng & Hán Tự Tiếng Nhật Độc Lập (Local-First, Zero Backend)**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-40%20passed-success?style=flat)](https://nodejs.org/api/test.html)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Giới thiệu (Overview)

**Nihongo Master** là nền tảng học tiếng Nhật toàn diện (Từ vựng, Hán tự Kanji, Flashcard SRS và Luyện tập Mini-games) được thiết kế theo kiến trúc **Local-First / Frontend-Only**. 

Ứng dụng **không yêu cầu bất kỳ máy chủ backend hay cơ sở dữ liệu bên ngoài nào**, toàn bộ 2.018 chữ Kanji và hơn 150 bài học từ vựng giáo trình chuẩn được nhúng trực tiếp và sinh ra dưới dạng trang tĩnh (Static Export). Mọi tiến độ học tập, thông số thuật toán ngắt quãng, điểm kinh nghiệm (XP) và chuỗi học tập (Streak) được lưu trữ an toàn ngay trên trình duyệt người dùng và dễ dàng xuất/nhập sao lưu dạng tệp JSON.

---

## ✨ Tính năng Nổi bật (Key Features)

### 1. 🈸 Kho Hán Tự Toàn Diện (Kanji Hub - 2.018 Chữ N5 -> N1)
- Đầy đủ 2.018 chữ Hán Tự từ N5 đến N1 với phân cấp trình độ chuẩn JLPT.
- **Mô phỏng quy tắc viết bút thuận SVG (HanziWriter)**: Xem chuyển động vẽ từng nét sinh động, kèm chế độ luyện viết tương tác.
- **Tra cứu chuyên sâu**: Âm Hán-Việt in hoa, ý nghĩa tiếng Việt, danh sách âm On (On'yomi), âm Kun (Kun'yomi), số nét và bộ thủ chi tiết.
- **Từ ghép Kanji (Compounds)**: Tự động trích xuất các từ vựng thực tế trong giáo trình có chứa chữ Hán đang học.

### 2. 📚 Kho Từ Vựng Giáo Trình (Vocabulary Hub - 150 Bài Học)
- Tổng hợp hơn 150 bài học từ vựng theo các bộ giáo trình nổi tiếng:
  - **Minna no Nihongo Sơ cấp 1 (N5)**: 25 bài.
  - **Minna no Nihongo Sơ cấp 2 (N4)**: 25 bài.
  - **Mimikara Oboeru Trung cấp (N3)**: 12 chương (50 bài chuyên đề).
  - **Shinkanzen / Soumatome Trung cấp (N3)**: 6 tuần học (50 bài).
- Tra cứu nhanh từ vựng tức thì (Instant Search) theo Kanji, Hiragana/Katakana, Romaji hoặc nghĩa tiếng Việt.
- Tích hợp phát âm Audio chuẩn (Web Speech API Nhật Bản).
- Thêm trực tiếp từng từ hoặc cả bài học vào Hàng đợi Ôn tập SRS chỉ với 1 click.

### 3. 🧠 Trung tâm Ôn tập Thông minh (SRS Flashcards - Thuật toán SM-2)
- Ứng dụng thuật toán **SuperMemo-2 (SM-2)** chuẩn Anki: Tự động tính toán chu kỳ lặp lại (Interval) và hệ số dễ dàng (Ease Factor) dựa trên phản hồi của bạn.
- Hỗ trợ đầy đủ phím tắt bàn phím tốc độ cao:
  - <kbd>Space</kbd>: Lật thẻ xem đáp án & giải nghĩa.
  - <kbd>1</kbd>: **Lại (Again)** - Chưa nhớ, ôn lại ngay.
  - <kbd>2</kbd>: **Khó (Hard)** - Nhớ nhưng còn do dự.
  - <kbd>3</kbd>: **Tốt (Good)** - Nhớ đúng chuẩn.
  - <kbd>4</kbd>: **Dễ (Easy)** - Đã thuộc lòng.
- **Gamification & Trải nghiệm sống động**:
  - Hệ thống điểm kinh nghiệm XP và thanh Level tăng tiến.
  - Chuỗi ngày học liên tục (Streak Counter) cùng biểu tượng ngọn lửa.
  - Âm thanh phản hồi (Sound FX) bằng Web Audio API (không cần tải file ngoài).
  - Hiệu ứng pháo hoa chúc mừng (Confetti) khi hoàn thành buổi ôn tập.

### 4. 🎮 Chế độ Luyện tập Mini-Games (Quizlet-style Mini Games)
- **Trắc nghiệm 4 Lựa chọn (Multiple Choice)**: Luyện phản xạ nhanh chọn nghĩa đúng.
- **Ghép thẻ Tốc độ (Speed Matching Cards)**: Nối cặp từ vựng và nghĩa tiếng Việt với tính giờ và combo.
- **Ghép ký tự tạo từ (Word Builder)**: Luyện nhớ thứ tự chữ cái Kana/Kanji để tạo thành từ hoàn chỉnh.

### 5. 💾 Quản lý Dữ liệu Cá nhân & Sao lưu (Backup & Data Freedom)
- Toàn bộ dữ liệu được quản lý qua Zustand Store và đồng bộ tự động vào `LocalStorage`.
- Tính năng **Sao lưu (Export JSON)**: Tải file `jp_study_backup.json` về máy.
- Tính năng **Khôi phục (Import JSON)**: Nhập lại dữ liệu trên bất kỳ thiết bị nào (PC, Laptop, Mobile) mà không lo mất tiến độ.
- Tính năng **Đặt lại dữ liệu (Reset)**: Xóa trắng dữ liệu cá nhân an toàn khi muốn bắt đầu lại từ đầu.

---

## 📁 Cấu trúc Thư mục (Project Structure)

```
nihongo-master/
├── out/                      # Thư mục mã nguồn tĩnh xuất bản (2.180 static HTML pages)
├── public/                   # Tài nguyên tĩnh, favicon, icons
├── src/
│   ├── app/                  # Next.js App Router (Static SSG Routes)
│   │   ├── kanji/            # Trang danh sách Kanji & chi tiết [character]
│   │   ├── tango/            # Trang danh sách giáo trình & chi tiết [lessonId]
│   │   ├── review/           # Trung tâm SRS Flashcard & Mini-games Quizlet
│   │   ├── settings/         # Trang Cài đặt, sao lưu & phục hồi JSON
│   │   ├── layout.tsx        # Layout chính với Navbar điều hướng
│   │   └── page.tsx          # Trang chủ Dashboard tổng quan tiến độ & thống kê
│   ├── components/           # UI Components tái sử dụng
│   │   ├── kanji/            # KanjiCard, StrokeOrder (HanziWriter), KanjiFilter
│   │   ├── tango/            # VocabCard, LessonCard, AudioButton
│   │   ├── review/           # Flashcard, QuizChoice, MatchingGame, WordBuilder
│   │   └── common/           # Navbar, Toast, ProgressModal, StatCard
│   ├── data/                 # Cơ sở dữ liệu JSON tĩnh đóng gói sẵn
│   │   ├── kanji/            # n5.json, n4.json, n3.json, n2.json, n1.json, radicals.json
│   │   └── vocab/            # minna.json, mimikara_n3.json, somatome_n3.json, etc.
│   ├── lib/                  # Helpers & thuật toán
│   │   ├── sm2.ts            # Thuật toán lặp lại ngắt quãng SuperMemo-2
│   │   ├── kanjiData.ts      # Indexer & tra cứu Hán tự, bộ thủ, từ ghép
│   │   ├── vocabData.ts      # Indexer & tra cứu từ vựng, giáo trình
│   │   ├── cardResolver.ts   # Resolver nội dung thẻ học SRS
│   │   ├── sound.ts          # Bộ phát âm thanh Web Audio API độc lập
│   │   ├── storage.ts        # Quản lý Import/Export JSON và kiểm tra tính toàn vẹn
│   │   └── __tests__/        # Unit tests cho các modules nghiệp vụ
│   └── stores/               # Zustand Stores (srsStore, kanjiStore, vocabStore, toastStore)
├── package.json              # Scripts & dependencies
├── next.config.mjs           # Cấu hình Next.js Static Export (`output: 'export'`)
├── tailwind.config.js        # Cấu hình Tailwind CSS giao diện & bảng màu
└── tsconfig.json             # Cấu hình TypeScript
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy cục bộ (Local Development)

### Yêu cầu môi trường:
- **Node.js**: Phiên bản 18.17.0 trở lên (khuyên dùng Node.js 20 LTS).
- **npm** hoặc **yarn** / **pnpm**.

### Các bước thực hiện:

1. **Di chuyển vào thư mục dự án**:
   ```bash
   cd nihongo-master
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Khởi chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt và truy cập: **`http://localhost:3000`**

4. **Chạy kiểm thử toàn diện (Unit Tests)**:
   ```bash
   npm test
   ```
   *(Toàn bộ 40 unit test kiểm thử thuật toán SM-2, Data Indexer, Stores và Storage Validation sẽ chạy qua Node.js Native Test Runner)*

5. **Kiểm tra kiểu dữ liệu TypeScript (Type Check)**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📦 Đóng gói Tĩnh (Static Build)

Để đóng gói ứng dụng thành một bộ mã nguồn thuần HTML/CSS/JavaScript tĩnh có thể chạy trên bất kỳ Web Server nào:

```bash
npm run build
```

Quá trình này sẽ thực hiện Static Site Generation (SSG) cho:
- `out/index.html` (Trang chủ Dashboard)
- `out/kanji.html` (Danh bạ 2.018 Hán Tự)
- `out/kanji/[character].html` (2.018 trang chi tiết từng chữ Hán)
- `out/tango.html` (Danh bạ giáo trình)
- `out/tango/[lessonId].html` (150 trang bài học từ vựng)
- `out/review.html` (Trung tâm ôn tập Flashcard)
- `out/review/quiz.html` & các chế độ game (`builder.html`, `choice.html`, `matching.html`)
- `out/settings.html` (Trang Cài đặt & Sao lưu)

Toàn bộ sản phẩm đầu ra nằm trọn vẹn trong thư mục **`out/`**.

---

## 🌐 Hướng dẫn Triển khai (Deployment Guide)

Vì là ứng dụng tĩnh 100%, bạn có thể lưu trữ và triển khai hoàn toàn miễn phí trên nhiều nền tảng:

### 1. Vercel
1. Đẩy mã nguồn lên kho chứa GitHub / GitLab.
2. Truy cập [vercel.com](https://vercel.com/) -> Chọn **Add New Project** -> Import repository.
3. Framework Preset: **Next.js** (Vercel tự động nhận diện cấu hình).
4. Nhấn **Deploy**.

### 2. Cloudflare Pages
1. Truy cập Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages**.
2. Kết nối với Git repository.
3. Thiết lập thông số build:
   - **Framework preset**: `None` hoặc `Next.js (Static HTML Export)`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
4. Nhấn **Save and Deploy**.

### 3. GitHub Pages
1. Chạy lệnh build tĩnh: `npm run build`.
2. Tạo tệp `.nojekyll` trong thư mục `out/` để tránh lỗi lọc file gạch dưới của GitHub:
   ```bash
   touch out/.nojekyll
   ```
3. Đẩy nội dung thư mục `out/` lên nhánh `gh-pages` của repository.
4. Trong Settings repository -> **Pages** -> Chọn nguồn nhánh `gh-pages` -> Lưu.

### 4. Máy chủ Tĩnh Cá nhân (Nginx / Apache / S3 / Netlify)
Chỉ cần sao chép toàn bộ nội dung trong thư mục **`out/`** vào thư mục gốc của Web Server (ví dụ: `/var/www/html` trên Nginx hoặc thư mục Publish của Netlify).

---

## 🔄 Hướng dẫn Sao lưu & Đồng bộ Dữ liệu (Backup & Sync Guide)

Mọi dữ liệu học tập (thẻ SRS, tiến độ thuộc bài, điểm XP, chuỗi ngày streak) được lưu trữ ngay trên thiết bị của bạn. Để chuyển đổi giữa các thiết bị mà không mất dữ liệu:

1. **Xuất bản sao lưu (Export)**:
   - Truy cập vào menu **Cài đặt** (`/settings`).
   - Tìm mục **Sao lưu & Dữ liệu**.
   - Nhấn **Xuất dữ liệu (.json)**.
   - Trình duyệt sẽ tự động tải về tệp tin `jp_study_backup.json` chứa toàn bộ tiến độ của bạn.

2. **Nhập bản sao lưu trên thiết bị mới (Import)**:
   - Mở ứng dụng Nihongo Master trên thiết bị mới (điện thoại, máy tính mới,...).
   - Truy cập vào trang **Cài đặt** (`/settings`).
   - Nhấn **Nhập dữ liệu (.json)** và chọn tệp `jp_study_backup.json` đã lưu.
   - Ứng dụng sẽ tự động khôi phục nguyên vẹn 100% tất cả các thẻ học, chuỗi ngày và thông số ôn tập.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

- **Framework**: Next.js 14 (App Router, Static Export).
- **Core UI**: React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **State Management**: Zustand với `persist` middleware.
- **Animation & Canvas**: HanziWriter (Quy tắc viết Hán tự SVG), Canvas-Confetti.
- **Audio & Sound**: Web Speech API (Phát âm tiếng Nhật) & Web Audio API (Sound FX tổng hợp).
- **Testing**: Node.js Native Test Runner (`tsx --test`).

---

## 📄 Bản quyền (License)

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**.
