# Thư viện giáo trình BEVA

Trang GitHub Pages cho các tài liệu giáo trình và bản dịch HTML.

## Xem nhanh

Sau khi bật GitHub Pages, trang chính sẽ mở ở:

```text
https://<github-user>.github.io/<repo-name>/
```

Các tài liệu hiện có:

```text
Harrer_Math_Lessons_vi.html
Giao_trinh_homeschooling_he_2_thang_5-7_va_10-12.html
```

## Nội dung chính

- `Giao_trinh_homeschooling_he_2_thang_5-7_va_10-12.md`: bản giáo trình Markdown.
- `Giao_trinh_homeschooling_he_2_thang_5-7_va_10-12.html`: bản HTML hoàn chỉnh, có logo BEVA, sidebar mục lục, tìm kiếm, nút in/PDF.
- `Harrer_Math_Lessons_vi.html`: bản HTML tiếng Việt của *Math Lessons for Elementary Grades*.
- `generate_homeschool_html.js`: script sinh lại HTML từ Markdown.
- `logo.jpg`: logo dùng cho thiết kế HTML.
- `Tai_lieu_bang_phuong_phap_giao_duc_Montessori_Steiner_Reggio_Dewey.docx`: tài liệu tham khảo ban đầu.

## Cập nhật HTML khi sửa Markdown

Yêu cầu có Node.js.

```bash
node generate_homeschool_html.js
```

Sau đó commit lại file `.md`, `.html` và script nếu có thay đổi.

## GitHub Pages

Repo có sẵn workflow tại:

```text
.github/workflows/pages.yml
```

Khi push lên nhánh `main`, GitHub Actions sẽ upload toàn bộ thư mục hiện tại và deploy thành GitHub Pages.

Nếu GitHub yêu cầu bật Pages thủ công, vào:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

## Kiểm tra local

Có thể mở trực tiếp file HTML trong trình duyệt, hoặc chạy server local:

```bash
python3 -m http.server 8765
```

Rồi mở:

```text
http://127.0.0.1:8765/
```
