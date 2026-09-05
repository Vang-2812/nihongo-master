# Thiết Kế Kiến Trúc: Bảng Màu Nhật Bản Tinh Tế (Muted Japanese Aesthetic) & Phân Cấp Thị Giác Nhẹ Nhàng

- **Ngày ban hành:** 05/09/2026
- **Trạng thái:** Bản thảo đề xuất (Đã thống nhất qua Brainstorming)
- **Phạm vi tác động:** Toàn bộ hệ thống Design Tokens, Tailwind CSS, và các Component trên 6 phân hệ của Nihongo Master.

---

## 1. Bối Cảnh & Mục Tiêu Thiết Kế

### 1.1 Vấn Đề Hiện Tại
- Giao diện sau khi đại tu đơn sắc chỉ có 2 màu đen (`#000000`) và trắng (`#FFFFFF`) với đường viền đen đậm `border-2` và `border-4`.
- Việc hoàn toàn thiếu vắng màu sắc khiến mắt người học khó phân cấp thông tin nhanh chóng (mọi khối thẻ, nút bấm, phản hồi Đúng/Sai đều trông giống nhau).
- Tương phản đen/trắng thuần quá gắt trên nền trắng chói gây mỏi mắt khi học tập lâu dài.

### 1.2 Mục Tiêu Thiết Kế
1. **Bổ sung màu sắc có tiết chế (Restrained & Muted Colors)**: Áp dụng bảng màu lấy cảm hứng từ mỹ học Nhật Bản (Wabi-Sabi): các tone pastel nhạt, êm dịu, không dùng màu neon chói lọi.
2. **Làm dịu tương phản & Độ dày viền (Refined Borders & Warm Paper)**:
   - Chuyển nền trang từ trắng chói `#FFFFFF` sang màu giấy kem ấm `#FAFAF9` (Stone-50).
   - Chuyển chữ đen tuyền sang màu đen mực mài Sumi mềm mại `#1C1917` (Stone-900).
   - Chuyển các đường viền dày `2px/4px` thành viền thanh mảnh `1px` (`border-stone-200` hoặc `border-neutral-900`), giữ cho cấu trúc gọn gàng nhưng không thô nặng.
3. **Phân cấp thị giác theo ngữ nghĩa học tập (Semantic Color Mapping)**:
   - Màu sắc hỗ trợ não bộ nhận biết trạng thái học (Chưa học, Đang học, Đã thuộc) và kết quả Quiz (Đúng / Sai / Mức độ SM-2) ngay trong tích tắc mà không cần đọc chữ.
4. **Bảo tồn tính thẩm mỹ biên tập (Editorial Elegance)**:
   - Giữ nguyên cấu trúc typography tối ưu: `Playfair Display` cho tiêu đề lớn, `Inter` cho văn bản nội dung tiếng Việt sắc nét, và `JetBrains Mono` cho nhãn mã.
   - Giữ nguyên bố cục không bo góc (`rounded-none`) hoặc bo góc siêu nhẹ 2px tự nhiên.

---

## 2. Hệ Thống Design Tokens & Bảng Màu Ngữ Nghĩa

### 2.1 Bảng Màu Cốt Lõi (Core Surface & Text)
* **Background (`--background`)**: `#FAFAF9` (Warm Paper White / Stone-50) — Nền giấy kem ấm, bảo vệ mắt.
* **Foreground (`--foreground`)**: `#1C1917` (Sumi Ink / Stone-900) — Màu chữ mực đen mềm mại.
* **Card Surface (`--card`)**: `#FFFFFF` — Nền thẻ trắng ngọc, nổi bật nhẹ nhàng trên nền giấy.
* **Muted Surface (`--muted`)**: `#F5F5F4` (Stone-100) — Nền các khối phụ trợ / ô ghi chú.
* **Muted Text (`--muted-foreground`)**: `#78716C` (Stone-500) — Văn bản gợi ý, phụ đề, phiên âm.
* **Subtle Border (`--border-subtle`)**: `#E7E5E4` (Stone-200) — Viền thẻ, vách ngăn danh sách.
* **Strong Border (`--border-strong`)**: `#1C1917` (Stone-900, 1px) — Viền nhấn mạnh của nút bấm, ô nhập liệu.

### 2.2 Bảng Màu Ngữ Nghĩa (Semantic Japanese Muted Palette)

| Phân Loại | Màu Sắc | Mã Màu (Nền / Chữ / Viền) | Ứng Dụng |
|---|---|---|---|
| **Thành công / Đã thuộc / Dễ** | Sage Matcha (Xanh lá xô thơm) | `bg-emerald-50 text-emerald-800 border-emerald-200` | Trạng thái "ĐÃ THUỘC", Quiz "CHÍNH XÁC ✓", SM-2 Rating 4 "DỄ", Tiến độ 100% |
| **Cần ôn / Sai / Học lại** | Sakura Coral (Hồng gốm / San hô) | `bg-rose-50 text-rose-800 border-rose-200` | Quiz "CHƯA ĐÚNG ✕", SM-2 Rating 1 "HỌC LẠI", Cảnh báo xóa dữ liệu |
| **Đang học / SRS Active / Nhớ** | Muted Aoi (Lam chàm Nhật) | `bg-indigo-50 text-indigo-800 border-indigo-200` | Trạng thái "ĐANG HỌC", nút "+ SRS" / "SRS ✓", SM-2 Rating 3 "NHỚ", Thẻ đang chọn |
| **Streak / XP / Khó** | Warm Ochre (Vàng hổ phách bơ) | `bg-amber-50 text-amber-800 border-amber-200` | Chuỗi Streak, Điểm XP, SM-2 Rating 2 "KHÓ", JLPT N3 |
| **JLPT N5** | Soft Leaf Green (Xanh mầm) | `bg-emerald-50 text-emerald-700 border-emerald-200` | Tab & Badge cấp độ JLPT N5 |
| **JLPT N4** | Soft Sky (Xanh lam trời) | `bg-sky-50 text-sky-700 border-sky-200` | Tab & Badge cấp độ JLPT N4 |
| **JLPT N3** | Soft Amber (Vàng hổ phách) | `bg-amber-50 text-amber-800 border-amber-200` | Tab & Badge cấp độ JLPT N3 |
| **JLPT N2** | Soft Lavender (Tím hoa oải hương) | `bg-purple-50 text-purple-700 border-purple-200` | Tab & Badge cấp độ JLPT N2 |
| **JLPT N1** | Soft Crimson (Đỏ hoa trà) | `bg-rose-50 text-rose-700 border-rose-200` | Tab & Badge cấp độ JLPT N1 |

---

## 3. Quy Cách Thiết Kế Chi Tiết Từng Phân Hệ

### 3.1 Thanh Điều Hướng (Navbar)
* Nền: `bg-white/95 backdrop-blur-sm border-b border-stone-200`.
* Logo: "NIHONGO MASTER" trong `font-serif text-stone-900 font-extrabold`.
* Badge "ARCHIVE": `bg-stone-100 text-stone-700 border border-stone-300 font-mono text-[10px]`.
* Links: `font-sans text-xs uppercase tracking-wider font-semibold`.
  * Active: `bg-stone-900 text-white px-3 py-1.5`.
  * Inactive: `text-stone-600 hover:text-stone-900 hover:bg-stone-100`.

### 3.2 Trang Chủ Dashboard (`/`)
* **Hero Title**: Playfair Display serif với sắc đen Sumi mềm mại.
* **Thanh thống kê (Stats Grid)**:
  * Nền thẻ: `bg-white border border-stone-200`.
  * Chữ số: Serif lớn `4xl-6xl`.
  * Huy hiệu đính kèm: Streak có icon lửa cam ấm, XP có icon vàng hổ phách, Thẻ SRS có icon chàm.
* **Khối Ôn Tập Chính (Daily Due Card)**:
  * Khi có thẻ đến hạn ôn tập: Thay vì solid black, dùng nền `bg-indigo-50/60 border border-indigo-200 text-stone-900` với nút ôn tập chính màu xanh chàm (`bg-indigo-900 text-white hover:bg-indigo-800`).

### 3.3 Kho Hán Tự (`/kanji` & `/kanji/[character]`)
* **Thẻ KanjiCard**:
  * Nền: `bg-white border border-stone-200 hover:border-stone-400 transition-colors`.
  * Chữ Hán: `font-serif text-5xl text-stone-900`.
  * Âm Hán Việt: `font-sans font-bold text-stone-800`.
  * Badge trạng thái:
    * `ĐÃ THUỘC`: `bg-emerald-50 text-emerald-800 border border-emerald-200`.
    * `ĐANG HỌC`: `bg-indigo-50 text-indigo-800 border border-indigo-200`.
    * `CHƯA HỌC`: `bg-stone-100 text-stone-600 border border-stone-200`.
  * Nút "+ SRS": viền mảnh `border-stone-300 hover:bg-stone-100`. Khi đã thêm chuyển sang `bg-indigo-50 text-indigo-800 border-indigo-200`.
* **HanziWriter Canvas**:
  * Nền: `#FFFFFF border border-stone-300`.
  * Đường lưới mễ tự mờ `#E7E5E4`.
  * Nét mực đen Sumi tự nhiên `#1C1917`.

### 3.4 Kho Từ Vựng Giáo Trình (`/tango` & `/tango/[lessonId]`)
* **Bìa Giáo Trình**:
  * Thiết kế monograph thanh lịch với viền `1px border-stone-200`.
  * Huy hiệu cấp độ JLPT hiển thị đúng tone pastel (Minna N5 xanh lá, Minna N4 xanh trời, Mimikara/Somatome N3 vàng hổ phách).
* **Thẻ VocabCard**:
  * Nghĩa tiếng Việt hiển thị bằng font `Inter` sắc nét.
  * Hộp ví dụ: Nền `bg-stone-50 border-l-2 border-stone-400`.
  * Nút trạng thái và SRS mang màu sắc ngữ nghĩa dịu nhẹ.

### 3.5 Flashcard SRS & Đánh Giá SM-2 (`/review`)
* **Thẻ 3D Flip Card**:
  * Mặt trước & sau: `bg-white border border-stone-200 p-8`.
  * Japanese text: `font-serif text-5xl text-stone-900`.
* **4 Nút Đánh Giá SM-2 (RatingButtons)**:
  * `1 · HỌC LẠI`: `bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100`.
  * `2 · KHÓ`: `bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100`.
  * `3 · NHỚ`: `bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100`.
  * `4 · DỄ`: `bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100`.
  * Nhãn phím nóng `1 - 4` và dự báo khoảng cách ngày (`+1 NGÀY`, `+6 NGÀY`) hiển thị rõ nét trên nền nút.

### 3.6 Bộ Quizlet Bổ Trợ & Bài Tập AI (`/review/quiz/*`)
* **MultipleChoiceQuiz & AIClozeQuizModal**:
  * Đáp án người dùng chọn đúng: `bg-emerald-50 text-emerald-900 border-2 border-emerald-500` + nhãn `CHÍNH XÁC ✓`.
  * Đáp án người dùng chọn sai: `bg-rose-50 text-rose-900 border-2 border-rose-400 line-through` + nhãn `CHƯA ĐÚNG ✕`.
  * Đáp án đúng thực tế (khi người dùng chọn sai): tự động sáng lên với `bg-emerald-50 text-emerald-900 border-2 border-emerald-500`.
* **MatchingGame**:
  * Thẻ đang chọn: `bg-indigo-50 border-2 border-indigo-500 text-indigo-900 ring-2 ring-indigo-100`.
  * Cặp ghép đúng: `bg-emerald-50 border border-emerald-300 text-emerald-800 opacity-60`.
  * Cặp ghép sai: `bg-rose-50 border border-rose-300 text-rose-800 animate-shake`.
* **WordBuilderQuiz**:
  * Khối ký tự trong ngân hàng: `bg-white border border-stone-300 text-stone-900 hover:bg-stone-100`.
  * Khi hoàn thành từ vựng chính xác: Hộp từ chuyển sang `bg-emerald-50 border-emerald-400 text-emerald-900`.

### 3.7 Cài Đặt & Sao Lưu (`/settings`)
* **Vùng Nguy Hiểm (Danger Zone)**:
  * Đổi từ khung đen tuyền sang khung cảnh báo nhẹ nhàng: `bg-rose-50/40 border border-rose-200`.
  * Tiêu đề: `text-rose-900`.
  * Nút "Xóa Toàn Bộ Dữ Liệu": `bg-rose-600 text-white hover:bg-rose-700 border border-rose-700`.

---

## 4. Kế Hoạch Xác Minh & Kiểm Thử (Verification Strategy)

1. **Kiểm tra tương phản màu sắc (WCAG AA Compliance)**:
   * Tất cả các văn bản chữ màu trên nền màu pastel đều phải đạt tỷ lệ tương phản tối thiểu 4.5:1 (ví dụ: chữ `emerald-800` trên nền `emerald-50`, `rose-800` trên nền `rose-50`).
2. **Kiểm thử tự động (Unit Tests)**:
   * Chạy `npm test` đảm bảo toàn bộ 62/62 test case tiếp tục vượt qua 100%.
3. **Biên dịch xuất tĩnh (Static Export Verification)**:
   * Chạy `npm run build` để xác minh tất cả 2,184 trang tĩnh (`out/`) biên dịch mượt mà không có lỗi CSS hay syntax.
4. **Kiểm tra trực quan người dùng**:
   * Xác minh trực tiếp trên các màn hình chính để đảm bảo màu sắc dịu nhẹ, sang trọng, không bị chói hoặc xung đột thị giác.
