# 🎨 BỘ QUY TẮC CHUẨN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX STANDARDS)
> **Dự án:** GAMO — Nền tảng Trò chơi Giáo dục Tiếng Anh Tương tác cho Lớp học Việt Nam  
> **Kiến trúc:** Monorepo (`packages/ui`, `packages/engine`, `packages/content`, `games/*`, `portal`)  
> **Vai trò:** Senior UI/UX Designer & Frontend Architect  
> **Phạm vi áp dụng:** BẮT BUỘC TUÂN THỦ 100% đối với mọi AI Agent và lập trình viên khi phát triển, sửa đổi hoặc thêm mới giao diện trong toàn bộ workspace.

---

## 1. THÔNG SỐ CỐT LÕI (CORE SPECIFICATIONS)

- **Công nghệ nền tảng:** HTML5 Semantic, Modern Vanilla JavaScript (ES Modules), Vanilla CSS Architecture dựa trên CSS Custom Properties (Variables) tập trung tại `@gamo/ui`, Canvas 2D API cho game loop, Vite Dev Server & Bundler.
- **Phong cách thiết kế (Design Aesthetic):** **Tactile 3D EdTech** (Ảnh hưởng từ phong cách hiện đại của Duolingo, Blooket, Apple Education và Linear). Giao diện tươi sáng, thân thiện học sinh, có chiều sâu vật lý (3D tactile shadow), tương phản cao để nhìn rõ trên máy chiếu/màn hình tương tác phòng học.
- **Bộ font chữ tiêu chuẩn:**
  1. **UI & Hệ thống:** `'Plus Jakarta Sans', sans-serif` (Trực quan, dễ đọc, hỗ trợ dấu tiếng Việt hoàn hảo).
  2. **Tiêu đề Display / Brand:** `'Fredoka', 'Fredoka One', sans-serif` (Bo tròn, thân thiện, tràn đầy năng lượng giáo dục).
  3. **Từ vựng & Mẫu câu Game:** `'Lexend', sans-serif` (Font chữ chuẩn sư phạm quốc tế, tối ưu hóa khả năng nhận diện ký tự cho người học tiếng Anh).
  4. **Code / Syntax / Phân tích:** `'JetBrains Mono', Consolas, monospace`.
- **Hệ thống bo góc (Border Radius):**
  - Card & Container chính: `var(--r-lg)` = `20px` (Mềm mại, an toàn, chuẩn hiện đại).
  - Button & Form Input: `var(--r-md)` = `14px` (hoặc `12px`).
  - Badge, Pill, Chip & Tag: `var(--r-full)` = `9999px`.
  - Modal & Dialog: `var(--r-xl)` = `28px`.

---

## 2. HỆ THỐNG DESIGN TOKENS (CSS CUSTOM PROPERTIES)

Mọi giao diện phải sử dụng trực tiếp các biến CSS được khai báo trong `@gamo/ui/styles/tokens.css` và `main.css`.

### 2.1. Bảng màu chuẩn (Color Palette)

| Phân loại | Tên biến CSS | Mã HEX | Mục đích sử dụng |
|-----------|--------------|--------|------------------|
| **Primary (Chủ đạo)** | `--gamo-primary` | `#2563EB` | Nút bấm chính, tiêu đề nhấn mạnh, trạng thái active |
| | `--gamo-primary-hover` | `#1D4ED8` | Hover trên primary button |
| | `--gamo-primary-subtle` | `#EFF6FF` | Nền nhẹ (background tint) cho thẻ được chọn |
| | `--gamo-primary-border` | `#BFDBFE` | Viền của thẻ primary |
| | `--gamo-primary-shadow` | `#1E40AF` | Đổ bóng 3D chân nút bấm chính |
| **Success (Thành công / Đúng)** | `--gamo-success` | `#16A34A` | Trả lời đúng, điểm thưởng, Game Mẫu câu, trạng thái ready |
| | `--gamo-success-subtle` | `#F0FDF4` | Nền thông báo đúng, thẻ thành công |
| | `--gamo-success-border` | `#BBF7D0` | Viền thẻ thành công |
| | `--gamo-success-shadow` | `#166534` | Đổ bóng 3D chân nút thành công |
| **Accent (Năng động)** | `--gamo-accent` | `#0284C7` | Nút phụ, icon, tiến trình |
| **Warning (Chú ý / Điểm thưởng)** | `--gamo-warning` | `#F59E0B` | Điểm số, cúp vàng, chuỗi thắng streak, combo |
| **Destructive / Danger (Lỗi / Thử lại)** | `--gamo-danger` | `#EF4444` | Trả lời sai, mất mạng, nút xóa bài, cảnh báo |
| | `--gamo-danger-subtle` | `#FEF2F2` | Nền cảnh báo lỗi |
| **Purple (Ngữ pháp nâng cao)** | `--gamo-purple` | `#7C3AED` | Nhãn ngữ pháp, bài học mẫu câu chuyên sâu |
| **Background (Nền)** | `--gamo-bg` | `#F8FAFC` | Nền toàn trang (Slate 50 ấm áp, dịu mắt) |
| | `--gamo-bg-canvas` | `#F1F5F9` | Nền khung làm việc, canvas nền |
| | `--gamo-bg-card` | `#FFFFFF` | Nền thẻ bài học, panel, popup |
| **Borders (Đường viền)** | `--gamo-border` | `#E2E8F0` | Đường viền ngăn cách nhẹ |
| | `--gamo-border-strong` | `#CBD5E1` | Đường viền thẻ, ô nhập liệu |
| | `--gamo-border-focus` | `#3B82F6` | Viền khi focus vào ô nhập liệu |
| **Text (Văn bản - Tương phản cao)** | `--gamo-text` | `#0F172A` | Tiêu đề, chữ chính (Slate 900 đậm rõ) |
| | `--gamo-text-secondary` | `#334155` | Nội dung câu hỏi, phụ đề (Slate 700) |
| | `--gamo-text-muted` | `#64748B` | Chú thích, số lượng, nhãn phụ (Slate 500) |
| | `--gamo-text-dim` | `#94A3B8` | Placeholder, nhãn mờ |

### 2.2. Hệ thống Typography Hierarchy

```css
/* Display & Branding */
--font-display: 'Fredoka', 'Plus Jakarta Sans', sans-serif;
/* UI & Navigation */
--font-ui:      'Plus Jakarta Sans', -apple-system, sans-serif;
/* Game Vocabulary & Sentence Content */
--font-game:    'Lexend', 'Plus Jakarta Sans', sans-serif;
```

- **H1 (Page Header):** `font-size: 26px - 32px; font-weight: 700; line-height: 1.25;` (Dùng Fredoka hoặc Plus Jakarta Sans)
- **H2 (Section Header):** `font-size: 20px - 22px; font-weight: 700; line-height: 1.3;`
- **H3 (Card / Panel Header):** `font-size: 16px - 18px; font-weight: 700; line-height: 1.35;`
- **H4 (Sub-heading):** `font-size: 14px - 15px; font-weight: 700;`
- **Body Regular:** `font-size: 14px - 15px; font-weight: 500; line-height: 1.5; color: var(--gamo-text-secondary);`
- **Caption / Helper:** `font-size: 12px - 13px; font-weight: 500; color: var(--gamo-text-muted);`
- **Badge / Tag:** `font-size: 11px - 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;`

### 2.3. Quy tắc Khoảng cách (Spacing Scale — 4px / 8px Grid)

Bắt buộc sử dụng hệ thống Spacing scale chuẩn, không tùy tiện dùng số lẻ:
- `--s-1`: `4px` (Micro gap giữa icon và chữ nhỏ)
- `--s-2`: `8px` (Gap chuẩn giữa các chip, button icon)
- `--s-3`: `12px` (Padding bên trong input, gap giữa các trường form)
- `--s-4`: `16px` (Padding card chuẩn, margin giữa các khối nhỏ)
- `--s-5`: `24px` (Padding panel, khoảng cách giữa các cột layout)
- `--s-6`: `32px` (Khoảng cách giữa các section chính)
- `--s-7`: `48px` (Khoảng cách lớn ở footer / header hero)

---

## 3. QUY TẮC THIẾT KẾ COMPONENT (COMPONENT GUIDELINES)

Tất cả các màn hình (Hub, Dashboard, Gameplay Arena, Kết quả) phải tái sử dụng cấu trúc và CSS từ `@gamo/ui`:

### 3.1. Nút bấm (Tactile 3D Buttons)
- **Nguyên lý 3D Tactile:** Nút bấm EdTech luôn có lớp đổ bóng dày bên dưới (`box-shadow: 0 4px 0 [shadow-color]`). Khi người dùng nhấn chuột (`:active`), nút phải lún xuống (`transform: translateY(2px)`) và giảm độ dày bóng chân.
- **Nút Chính (Primary Button):** Dùng `.edu-btn-primary` hoặc `.btn-big-launch`. Màu nền `--gamo-primary`, chữ trắng, bóng chân `--btn-3d-primary`.
- **Nút Thành Công (Success Button):** Màu nền `--gamo-success`, bóng chân `--btn-3d-success`.
- **Nút Phụ (Secondary / Ghost):** Dùng `.btn-secondary` hoặc `.setting-btn`. Nền trắng, viền `1.5px solid var(--gamo-border-strong)`, bóng chân `0 2px 0 var(--gamo-border)`.
- **Nút Về GAMO Hub (Navigation Pill):** Luôn có icon `🏠`, viền bo tròn `9999px`, màu xanh dịu, nổi bật ở mọi màn hình con để giáo viên quay về trung tâm trong 1 click.

### 3.2. Thẻ hiển thị (Cards & Panels)
- Nền trắng `var(--gamo-bg-card)`, viền bo `20px` (`var(--r-lg)`), viền kẻ `1.5px` hoặc `2px solid var(--gamo-border)`.
- Có viền bóng xúc giác bên dưới `box-shadow: 0 4px 0 var(--gamo-border), 0 8px 24px rgba(15, 23, 42, 0.04)`.
- Khi hover: Nâng nhẹ `transform: translateY(-2px)` và bóng chân đậm hơn.

### 3.3. Ô nhập liệu (Input & Textarea)
- Nền trắng `#FFFFFF`, viền `1.5px solid var(--gamo-border-strong)`, bo góc `12px` - `14px`.
- Font chữ rõ ràng, cỡ tối thiểu `14px` để không bị thu phóng trên thiết bị cảm ứng.
- Khi focus: Viền đổi sang `--gamo-primary` và có vòng sáng `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`.
- Ô dán từ vựng / mẫu câu: Luôn dùng font monospace (`JetBrains Mono`) với dòng hướng dẫn rõ ràng.

### 3.4. Nút bấm chuyển trạng thái (Segmented Controls)
- Các nút chọn Độ khó, Thời gian, Số đội: Sử dụng định dạng hàng nút bấm trực quan (chips / pills).
- Nút đang được chọn (`.active`): Màu nền nổi bật (`--gamo-primary-subtle`), viền màu `--gamo-primary`, chữ đậm, bóng chân nổi rõ.

### 3.5. Modal & Màn hình Tạm dừng / Kết quả (Overlays)
- Nền mờ (Backdrop): `background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px);`.
- Thẻ thông báo trung tâm: Bo góc `28px` (`var(--r-xl)`), căn giữa màn hình, hiệu ứng nảy nhẹ (`transform: scale(1)` với bezier `cubic-bezier(0.34, 1.56, 0.64, 1)`).

---

## 4. RESPONSIVE & QUY TẮC CÁC TRẠNG THÁI (RESPONSIVE & STATES)

### 4.1. Khả năng đáp ứng (Responsive Breakpoints)
- **Desktop / TV / Màn hình Tương tác (> 1024px):** Bố cục 2 cột rõ ràng (Cột trái: Thiết lập/Cấu hình; Cột phải: Xem trước/Khởi động).
- **Tablet phòng học (768px - 1024px):** Co giãn vừa vặn, cỡ chữ và tap target giữ tối thiểu 44x44px.
- **Mobile (< 768px):** Bố cục xếp chồng 1 cột tự nhiên, các nút full-width, menu cuộn ngang mượt mà.

### 4.2. Bắt buộc đủ 5 trạng thái cho mọi phần tử tương tác:
1. **Default:** Trạng thái nghỉ rõ ràng, có độ tương phản đạt chuẩn WCAG AA.
2. **Hover:** Tăng độ sáng (filter: brightness(1.05)), đổi màu viền, nâng nút nhẹ.
3. **Active / Pressed:** Lún xuống 2px (`transform: translateY(2px)`), âm thanh phản hồi nhẹ nếu là nút game.
4. **Focus-Visible:** Vòng outline `3px solid rgba(37, 99, 235, 0.4)` cho người dùng sử dụng phím Tab.
5. **Disabled:** Độ mờ `opacity: 0.5`, con trỏ `cursor: not-allowed`, loại bỏ hiệu ứng hover/active.

---

## 5. ĐIỀU CẤM KỴ TUYỆT ĐỐI (STRICT PROHIBITIONS / NEGATIVE RULES)

AI Agent và lập trình viên **TUYỆT ĐỐI KHÔNG ĐƯỢC VI PHẠM** các điều sau:

1. 🚫 **CẤM HARDCODE MÃ MÀU HEX BẤT KỲ ĐÂU TRONG COMPONENT HOẶC STYLE RIÊNG LẺ.**
   - *Sai:* `color: #2563EB; background: #f8fafc;`
   - *Đúng:* `color: var(--gamo-primary); background: var(--gamo-bg);`
   - Bắt buộc dùng toàn bộ biến từ `--gamo-*` trong `@gamo/ui`.

2. 🚫 **CẤM VIẾT INLINE CSS BỪA BÃI (`style="..."` hoặc `style={{...}}`) CHO BỐ CỤC CHÍNH.**
   - Mọi quy tắc layout, margin, padding, typography phải được định nghĩa trong file CSS hoặc qua Utility classes của `@gamo/ui`. Chỉ chấp nhận inline style cho các giá trị động do JS tính toán (như tọa độ Canvas, tỷ lệ phần trăm thanh tiến trình dynamic `%`).

3. 🚫 **CẤM TỰ Ý TẠO COMPONENT MỚI KHI ĐÃ CÓ COMPONENT TƯƠNG ĐƯƠNG.**
   - Không tự ý dựng lại Toast, Header, Button, Modal nếu trong `@gamo/ui` hoặc cấu trúc chuẩn của hệ thống đã có. Nếu cần mở rộng, hãy bổ sung thuộc tính hoặc kế thừa CSS class sẵn có.

4. 🚫 **CẤM GIAO DIỆN THIẾU KHOẢNG THỞ (WHITE-SPACE) HOẶC LỆCH LỀ.**
   - Không chèn ép chữ sát viền thẻ (padding thẻ card luôn tối thiểu `16px - 24px`).
   - Khoảng cách giữa các khối luôn tuân thủ thang đo bội số 4px/8px (`--s-3`, `--s-4`, `--s-5`).

5. 🚫 **CẤM THIẾT KẾ ĐƠN ĐIỆU, PHẲNG LÌ (FLAT MINIMALISM NHÀM CHÁN).**
   - GAMO là nền tảng game giáo dục cho học sinh & lớp học. Giao diện phẳng lì, u tối, xám xịt hoặc đơn sắc kiểu tài chính/crypto là **HOÀN TOÀN SAI LỆCH**. Thiết kế bắt buộc phải vui tươi, có chiều sâu 3D xúc giác, có micro-animation pop/bounce sinh động.

6. 🚫 **CẤM PHÁ VỠ LUỒNG ĐIỀU KHIỂN GAMO HUB.**
   - Bất kỳ game nào được thêm mới đều phải hỗ trợ nhận tham số URL `autoplay`, `difficulty`, `timeLimit`, `count`, `teams` từ Hub (`portal`) và phải có nút quay trở lại `http://localhost:5173` trên màn hình chơi.

---

## 6. QUY TRÌNH TỰ KIỂM TRA BẮT BUỘC (SELF-VERIFICATION PROTOCOL)

Trước khi báo cáo hoàn thành bất kỳ tác vụ frontend nào, AI Agent **BẮT BUỘC** phải tự kiểm tra 6 tiêu chí sau:

- [ ] **1. Token Check:** Đã thay thế toàn bộ mã màu cứng, font cứng bằng các biến `var(--gamo-*)` chưa?
- [ ] **2. Tactile 3D Check:** Các nút bấm chính và thẻ tương tác có đủ hiệu ứng 3D shadow và độ lún khi click (`:active`) chưa?
- [ ] **3. Typography Check:** Tiêu đề có dùng đúng font (`Fredoka`/`Plus Jakarta Sans`) và nội dung học tập có dùng đúng font chuẩn sư phạm (`Lexend`) không?
- [ ] **4. Responsive & White-space Check:** Đã kiểm tra khoảng thở padding/gap chưa? Bố cục trên máy chiếu và màn hình nhỏ có bị tràn viền hay đè chữ không?
- [ ] **5. Navigation Flow Check:** Màn hình con có nút quay về GAMO Hub (`🏠`) rõ ràng, hoạt động chuẩn xác không?
- [ ] **6. Build Verification Check:** Đã chạy lệnh `npm run build` thành công với mã thoát 0 (exit code 0), không còn lỗi syntax hay biến thiếu không?

---
*Tài liệu này là quy chuẩn kỹ thuật chính thức của GAMO. Mọi tác vụ phát triển giao diện đều phải lấy tài liệu này làm kim chỉ nam tối thượng.*
