# Tài Liệu Đặc Tả Thiết Kế: Phong Cách "Minimalist Monochrome" (Editorial / High Fashion)

- **Ngày tạo:** 2026-09-05
- **Dự án:** Nihongo Master
- **Tác giả:** AI Assistant & User Pair Programming
- **Trạng thái:** Chờ User duyệt thiết kế (Under Review)

---

## 1. Tinh Thần & Định Hướng Thiết Kế (Design Philosophy)

Chuyển đổi toàn bộ hệ thống giao diện website hiện tại sang phong cách **"Minimalist Monochrome"** (phong cách tối giản đơn sắc kiểu editorial cao cấp mang hơi hướng Vogue, Bottega Veneta, bảo tàng nghệ thuật và sách kiến trúc).

Thiết kế thể hiện sự khắc khổ, uy quyền, sang trọng và tự tin tuyệt đối nhờ vào:
1. **Độ tương phản cực hạn:** Đen tuyền `#000000` và trắng tinh khiết `#FFFFFF`.
2. **Tỷ lệ kịch tính:** Tiêu đề lớn (7xl–9xl) biến chữ viết thành yếu tố đồ họa; các con số thống kê phóng đại đối lập với nhãn metadata cực nhỏ.
3. **Khoảng trắng chủ động (Active White Space):** Khoảng đệm rộng rãi (`py-24` đến `py-36`), không lấp đầy, để nội dung tự tỏa sáng.
4. **Cấu trúc hình học & đường kẻ:** 100% góc vuông 90° (`rounded-none`), phân chia không gian bằng đường kẻ đen dày (4px) và hairline (1px), triệt tiêu hoàn toàn đổ bóng (shadow) và gradient.

### Các Quy Tắc Bắt Buộc (Strict Constraints):
- **Bảng màu:** Duy nhất 6 mã màu:
  - `background`: `#FFFFFF`
  - `foreground`: `#000000`
  - `muted`: `#F5F5F5`
  - `mutedForeground`: `#525252`
  - `border`: `#000000`
  - `borderLight`: `#E5E5E5`
  - `accent`: `#000000` (đen CHÍNH LÀ accent color).
- **Tuyệt đối cấm:**
  - Không màu sắc (xanh, đỏ, vàng, tím, v.v.).
  - Không gradient.
  - Không bo góc (border-radius = 0 ở mọi phần tử).
  - Không đổ bóng (box-shadow = none ở mọi phần tử).
  - Không font sans-serif cho heading.
  - Không animation mượt, bouncy, easing dài (mọi tương tác diễn ra tức thì 0–100ms).

---

## 2. Kiến Trúc Design Tokens & Typography

### 2.1 Hệ Thống Typography (`next/font/google`)
Tích hợp 3 họ font tiêu chuẩn:
1. **Heading / Display:** `Playfair Display` (serif, nét tương phản cao, phong cách bìa tạp chí danh tiếng).
   - Áp dụng: Tiêu đề trang, tên bài học, chữ Kanji nghệ thuật, số liệu thống kê lớn.
   - Cỡ chữ: `text-4xl`, `text-6xl`, `text-8xl`, `text-9xl`. Tracking: `tracking-tight` hoặc `tracking-tighter`.
2. **Body:** `Source Serif 4` (serif dễ đọc, nhịp điệu trang nhã).
   - Áp dụng: Câu văn tiếng Nhật, giải nghĩa từ vựng, phần giải thích ngữ cảnh, nội dung bài đọc.
3. **Label / Metadata / Code:** `JetBrains Mono` (monospace hiện đại, sắc sảo).
   - Áp dụng: Cấp độ JLPT `[ N5 ]`, nút bấm, số trang, ngày tháng, trạng thái, phím tắt.
   - Kiểu chữ: In hoa toàn bộ (`uppercase`), khoảng cách chữ rộng (`tracking-widest`), cỡ nhỏ (`text-xs`).

### 2.2 Texture Giấy In Cao Cấp (Paper Texture)
Thêm lớp phủ SVG pattern vi mô rất mờ trên nền `body` (`opacity: 0.02`, `pointer-events: none`) để tạo chất liệu giấy mỹ thuật/in ấn cao cấp, chống cảm giác phẳng lì nhân tạo:
```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* Fine grain noise */
  opacity: 0.02;
  pointer-events: none;
  z-index: 9999;
}
```

---

## 3. Quy Chuẩn Thành Phần Giao Diện (Core Components)

### 3.1 Nút Bấm (Buttons)
- **Hình dáng:** Hình chữ nhật góc vuông 90° (`rounded-none`).
- **Typography:** `JetBrains Mono`, `uppercase`, `tracking-widest`, `text-xs` hoặc `text-sm`.
- **Primary Button:**
  - Mặc định: Nền đen tuyền `#000000`, chữ trắng `#FFFFFF`, viền đen `border border-black`.
  - Hover (100ms): Đảo màu (invert) thành nền trắng `#FFFFFF`, chữ đen `#000000`.
- **Secondary / Outline Button:**
  - Mặc định: Nền trắng `#FFFFFF`, chữ đen `#000000`, viền đen `border border-black`.
  - Hover: Đảo màu thành nền đen chữ trắng.
- **Focus State:** Outline đen dày 3px cách 2px (`focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`).

### 3.2 Thẻ (Cards)
- **Mặc định:** `border border-black bg-white p-6 sm:p-8 rounded-none`, không bóng đổ.
- **Thẻ Nhấn mạnh (Featured / Inverted):** `bg-black text-white border border-black p-6 sm:p-8`.
- **Thẻ Muted:** `bg-[#F5F5F5] border border-[#E5E5E5] p-6`.

### 3.3 Ô Nhập Liệu (Inputs)
- Viền đen `border-2 border-black` hoặc viền dưới `border-b-2 border-black`, nền trong suốt, font mono.
- Focus: Viền chuyển sang 3px–4px đen đặc, không dùng ring màu hay glow.

### 3.4 Đường Phân Cách (Rules)
- **Hairline:** `border-b border-[#E5E5E5]` (phân tách hàng, bảng danh mục).
- **Standard Border:** `border-b border-black` hoặc `border-b-2 border-black`.
- **Section Rule:** Đường kẻ đen dày `h-1 bg-black` hoặc `border-b-4 border-black` để phân tách các khu vực lớn trên trang.

### 3.5 Phản Hồi Đúng / Sai trong Quiz & Bài Tập AI
Vì tuyệt đối không dùng màu xanh/đỏ:
- **Đúng (Correct):**
  - Thẻ/Nút lựa chọn lập tức đảo màu sang **Nền đen tuyền `#000000`, chữ trắng `#FFFFFF`**.
  - Hiển thị nhãn mono in đậm `[ CORRECT ] ✓`.
- **Sai (Incorrect):**
  - Thẻ hiển thị **Viền đen đôi hoặc viền 4px `border-4 border-black` kèm chữ gạch ngang `line-through`**.
  - Hiển thị nhãn mono `[ INCORRECT ] ✕`.
  - Đồng thời đáp án đúng bên cạnh sẽ tự động đảo màu sang nền đen chữ trắng để người học nhận diện ngay.

---

## 4. Chi Tiết Từng Màn Hình

### 4.1 Thanh Điều Hướng (Navbar)
- Nền trắng `#FFFFFF`, viền dưới `border-b-2 border-black`.
- Logo "NIHONGO MASTER" font `Playfair Display` serif kèm nhãn nhỏ `[ ARCHIVE ]`.
- Các mục menu (Kanji, Từ Vựng, Ôn Tập, Quiz, Cài Đặt) bằng font `JetBrains Mono` uppercase. Mục active được highlight bằng nền đen chữ trắng `bg-black text-white px-3 py-1.5`.
- Loại bỏ hoàn toàn Dark Mode Toggle.

### 4.2 Trang Chủ / Tổng Quan (Dashboard `/`)
- **Editorial Hero Section:** Tiêu đề kịch tính `text-7xl sm:text-9xl font-serif font-normal tracking-tighter` với đại tự "日本語" và phụ đề mono in hoa sang trọng.
- Phân cách bằng rule đen 4px.
- **Bảng Thống kê Tỷ lệ Lớn:** Các số liệu thống kê (Due cards, Streak, XP, Total) hiển thị với font Serif `text-6xl sm:text-8xl` tương phản cao, nhãn mono `[ CARDS IN SRS ]`, `[ DAY STREAK ]`.
- **Quick Links:** 4 khối hình chữ nhật lớn viền đen sắc cạnh, hover đảo màu tức thì 100ms.

### 4.3 Kho Kanji (`/kanji` & `/kanji/[character]`)
- **Bộ lọc Cấp độ:** Các nút chữ nhật `[ ALL ]`, `[ N5 ]`, `[ N4 ]`, `[ N3 ]`, `[ N2 ]`, `[ N1 ]` font mono.
- **Kanji Grid:** Bảng lưới kiến trúc chia ô sắc nét (`border border-black divide-x divide-y divide-black`). Chữ Kanji màu đen nổi bật, hover lập tức đảo màu nguyên ô sang đen chữ trắng.
- **Trang Chi Tiết Kanji:** Chữ Kanji cỡ lớn (140px) đặt trong khung tranh tối giản; nét viết Stroke Order hiển thị nét đen trên nền trắng; On/Kun readings trình bày dạng cột ấn phẩm.

### 4.4 Kho Từ Vựng (`/tango` & `/tango/[lessonId]`)
- Thẻ giáo trình thiết kế như bìa sách nghệ thuật bìa cứng.
- Danh sách từ vựng dạng bảng editorial tối giản, phân cách bằng các đường hairline `1px solid #E5E5E5`.
- Nút phát âm audio thiết kế phẳng, icon loa outline đen mảnh 1px.
- Tích hợp nút `[ AI EXERCISES ]`, `[ QUIZLET ]`, `[ ADD TO SRS ]` hình chữ nhật góc vuông chuẩn mực.

### 4.5 Ôn Tập Thẻ Flashcard SRS (`/review`)
- Thẻ 3D Flip Card hình chữ nhật góc vuông 90°, viền đen 2px, khoảng trắng rộng rãi.
- 4 nút đánh giá kết quả: `[ 1 · AGAIN ]`, `[ 2 · HARD ]`, `[ 3 · GOOD ]`, `[ 4 · EASY ]` font mono, hover đảo màu dứt khoát.

### 4.6 Chế Độ Quizlet & Bài Tập AI (`AIClozeQuizModal`)
- Đề bài câu tiếng Nhật chữ to, chỗ trống dạng `[ _____ ]`.
- Nút bật/tắt bản dịch tiếng Việt bằng nút mono `[ TRANSLATE: ON / OFF ]`.
- 4 nút đáp án trắc nghiệm A, B, C, D hình chữ nhật to dễ bấm, cơ chế đảo màu đen/trắng khi chọn đáp án đúng/sai.

### 4.7 Trang Cài Đặt (`/settings`)
- Các khối section phân tách bằng đường kẻ đen 2px.
- Các ô input API Key, Endpoint có viền đen 2px, khi focus viền dày 4px.
- Nút sao lưu/khôi phục JSON và đồng bộ SQLite dạng nút chữ nhật đơn sắc chuẩn editorial.

---

## 5. Kế Hoạch Kiểm Thử & Xác Minh

1. **Kiểm tra Giao diện (Visual Verification):**
   - Không còn bất kỳ góc bo tròn (`border-radius > 0`) nào trên toàn bộ trang web.
   - Không còn bất kỳ đổ bóng (`box-shadow`) nào.
   - Không còn bất kỳ màu sắc nào ngoài 6 mã màu quy định (#FFFFFF, #000000, #F5F5F5, #525252, #E5E5E5).
   - Kiểm tra hiển thị font Playfair Display cho heading và JetBrains Mono cho nhãn.
   - Kiểm tra hiệu ứng hover đảo màu tức thì (~100ms) trên nút và thẻ.
2. **Kiểm tra Tính năng & Logic (Feature Integrity):**
   - Chức năng học SRS SM-2, tính toán XP, streak hoạt động bình thường.
   - Kho Kanji và Stroke Order vẽ nét chính xác.
   - Chế độ Quiz và Bài tập AI điền từ hoạt động trơn tru.
   - Đồng bộ SQLite Turso và sao lưu JSON hoạt động bình thường.
3. **Kiểm thử Tự động:**
   - Toàn bộ 62 unit tests trong `npm test` đều phải PASS.
   - Quá trình `npm run build` thành công 100% với 0 lỗi compile TypeScript.
