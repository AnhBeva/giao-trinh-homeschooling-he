const fs = require("fs");
const path = require("path");

const input = path.join(__dirname, "Giao_trinh_homeschooling_he_2_thang_5-7_va_10-12.md");
const output = path.join(__dirname, "Giao_trinh_homeschooling_he_2_thang_5-7_va_10-12.html");
const md = fs.readFileSync(input, "utf8").replace(/\r\n/g, "\n");

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugCounts = new Map();
const slugify = (text) => {
  const base =
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
};

const inline = (value) => {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
};

const toc = [];
const lines = md.split("\n");
let html = "";
let listStack = [];
let inTable = false;

const closeLists = (targetIndent = -1) => {
  while (listStack.length && listStack[listStack.length - 1].indent > targetIndent) {
    const last = listStack.pop();
    html += `</${last.type}>\n`;
  }
};

const closeTable = () => {
  if (inTable) {
    html += "</tbody></table></div>\n";
    inTable = false;
  }
};

const parseCells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => inline(cell.trim()));

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  const trimmed = line.trim();

  if (!trimmed) {
    closeTable();
    closeLists();
    continue;
  }

  const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    closeTable();
    closeLists();
    const level = heading[1].length;
    const text = heading[2].trim();
    const id = slugify(text);
    toc.push({ level, text, id });
    const className =
      level === 1
        ? "title"
        : level === 2
          ? "section-title"
          : level === 3 && /^Tuần\s+\d+/i.test(text)
            ? "week-title"
            : level === 3
              ? "subsection-title"
              : "day-title";
    html += `<h${level} id="${id}" class="${className}">${inline(text)}</h${level}>\n`;
    continue;
  }

  if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim())) {
    closeLists();
    const headers = parseCells(trimmed);
    html += '<div class="table-wrap"><table><thead><tr>';
    html += headers.map((cell) => `<th>${cell}</th>`).join("");
    html += "</tr></thead><tbody>\n";
    inTable = true;
    i += 1;
    continue;
  }

  if (inTable && /^\|.+\|$/.test(trimmed)) {
    const cells = parseCells(trimmed);
    html += "<tr>";
    html += cells.map((cell) => `<td>${cell}</td>`).join("");
    html += "</tr>\n";
    continue;
  }

  closeTable();

  const unordered = line.match(/^(\s*)-\s+(.+)$/);
  const ordered = line.match(/^(\s*)\d+\.\s+(.+)$/);
  if (unordered || ordered) {
    const match = unordered || ordered;
    const indent = match[1].length;
    const type = unordered ? "ul" : "ol";
    if (!listStack.length || indent > listStack[listStack.length - 1].indent) {
      html += `<${type}>\n`;
      listStack.push({ type, indent });
    } else {
      closeLists(indent);
      if (!listStack.length || listStack[listStack.length - 1].type !== type) {
        html += `<${type}>\n`;
        listStack.push({ type, indent });
      }
    }
    html += `<li>${inline(match[2].trim())}</li>\n`;
    continue;
  }

  closeLists();
  html += `<p>${inline(trimmed)}</p>\n`;
}

closeTable();
closeLists();

const tocHtml = toc
  .filter((item) => item.level <= 4)
  .map((item) => {
    const label = escapeHtml(item.text);
    return `<a href="#${item.id}" class="toc-link toc-l${item.level}" data-title="${label.toLowerCase()}">${label}</a>`;
  })
  .join("\n");

const htmlDoc = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Giáo trình homeschooling hè 2 tháng cho trẻ 5-7 tuổi và 10-12 tuổi, có lịch từng ngày từng giờ, checklist và rubric.">
  <title>Giáo trình homeschooling hè 2 tháng</title>
  <link rel="icon" href="logo.jpg">
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fb;
      --paper: rgba(255, 255, 255, 0.92);
      --paper-solid: #ffffff;
      --text: #1d1d1f;
      --muted: #74777d;
      --line: rgba(0, 0, 0, 0.08);
      --line-strong: rgba(0, 0, 0, 0.14);
      --brand-blue: #116ad8;
      --brand-blue-dark: #0759bc;
      --brand-blue-soft: #eaf3ff;
      --brand-gray: #7a7d82;
      --brand-gray-soft: #eef1f5;
      --blue: var(--brand-blue);
      --blue-soft: var(--brand-blue-soft);
      --green: #1d8f5f;
      --amber: #b25b00;
      --shadow: 0 18px 60px rgba(17, 106, 216, 0.08), 0 1px 1px rgba(0, 0, 0, 0.04);
      --radius: 8px;
      --content: 980px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 20rem, var(--bg) 100%);
      color: var(--text);
      font-size: 16px;
      line-height: 1.62;
    }

    a { color: inherit; }

    .app-shell {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 22px;
      border-right: 1px solid var(--line);
      background: rgba(247, 249, 252, 0.86);
      -webkit-backdrop-filter: saturate(180%) blur(22px);
      backdrop-filter: saturate(180%) blur(22px);
      overflow: auto;
    }

    .brand {
      padding: 10px 8px 18px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 16px;
    }

    .brand-mark {
      display: grid;
      grid-template-columns: 78px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .brand-logo {
      display: block;
      width: 78px;
      height: 72px;
      object-fit: contain;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 8px;
      box-shadow: 0 8px 26px rgba(17, 106, 216, 0.08);
    }

    .brand-name {
      min-width: 0;
      color: var(--brand-blue);
      font-size: 28px;
      line-height: 1;
      font-weight: 820;
      letter-spacing: 0;
    }

    .brand-tagline {
      margin-top: 4px;
      color: var(--brand-gray);
      font-size: 12px;
      line-height: 1.3;
      font-weight: 560;
    }

    .brand-kicker {
      color: var(--brand-blue);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .brand-title {
      margin: 8px 0 6px;
      font-size: 22px;
      line-height: 1.12;
      font-weight: 760;
      letter-spacing: 0;
    }

    .brand-subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .search-panel {
      position: sticky;
      top: 0;
      z-index: 3;
      padding: 0 0 14px;
      background: linear-gradient(180deg, rgba(247, 249, 252, 0.98), rgba(247, 249, 252, 0.84));
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 42px;
      padding: 0 13px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, 0 6px 24px rgba(17,106,216,0.04);
    }

    .search-box svg {
      flex: 0 0 auto;
      color: var(--muted);
    }

    .search-box input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      font: inherit;
      font-size: 14px;
      color: var(--text);
    }

    .search-meta {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 10px;
      color: var(--muted);
      font-size: 12px;
    }

    .toc {
      display: grid;
      gap: 2px;
      padding-bottom: 28px;
    }

    .toc-link {
      display: block;
      border-radius: var(--radius);
      color: #424245;
      font-size: 13px;
      line-height: 1.32;
      text-decoration: none;
      padding: 8px 10px;
    }

    .toc-link:hover,
    .toc-link.is-active {
      background: rgba(17, 106, 216, 0.09);
      color: var(--brand-blue);
    }

    .toc-l1 { display: none; }
    .toc-l2 { font-weight: 720; margin-top: 8px; }
    .toc-l3 { padding-left: 20px; font-weight: 620; }
    .toc-l4 { padding-left: 34px; color: var(--muted); font-size: 12px; }

    .content-wrap {
      min-width: 0;
      padding: 34px 38px 80px;
    }

    .hero {
      max-width: var(--content);
      margin: 0 auto 22px;
      padding: 42px 0 28px;
      border-bottom: 1px solid rgba(17, 106, 216, 0.14);
    }

    .hero-eyebrow {
      margin: 0 0 10px;
      color: var(--brand-blue);
      font-size: 13px;
      font-weight: 760;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .hero h1 {
      max-width: 820px;
      margin: 0;
      font-size: clamp(36px, 5vw, 68px);
      line-height: 0.98;
      font-weight: 820;
      letter-spacing: 0;
    }

    .hero p {
      max-width: 760px;
      margin: 18px 0 0;
      color: #424245;
      font-size: 19px;
      line-height: 1.48;
    }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }

    .stat {
      min-height: 94px;
      padding: 16px;
      border: 1px solid rgba(17, 106, 216, 0.12);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(250,253,255,0.88));
    }

    .stat strong {
      display: block;
      font-size: 28px;
      line-height: 1;
      letter-spacing: 0;
    }

    .stat span {
      display: block;
      margin-top: 8px;
      color: var(--brand-gray);
      font-size: 13px;
      line-height: 1.32;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      max-width: var(--content);
      margin: 0 auto 22px;
    }

    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255,255,255,0.8);
      color: #1d1d1f;
      font-size: 14px;
      font-weight: 620;
      text-decoration: none;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .action-button:hover { border-color: rgba(17,106,216,0.35); color: var(--brand-blue); }

    main.document {
      max-width: var(--content);
      margin: 0 auto;
      padding: 28px 42px 56px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92));
      box-shadow: var(--shadow);
    }

    .title {
      display: none;
    }

    h2, h3, h4 {
      scroll-margin-top: 24px;
      letter-spacing: 0;
    }

    h2 {
      margin: 54px 0 16px;
      padding-top: 8px;
      font-size: 34px;
      line-height: 1.12;
      font-weight: 800;
    }

    h2:first-child { margin-top: 12px; }

    h3 {
      margin: 36px 0 12px;
      font-size: 24px;
      line-height: 1.2;
      font-weight: 760;
    }

    h4 {
      margin: 28px 0 12px;
      padding: 14px 16px;
      border: 1px solid rgba(17, 106, 216, 0.15);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(234, 243, 255, 0.94), rgba(255, 255, 255, 0.76));
      color: #0a4f9c;
      font-size: 18px;
      line-height: 1.28;
      font-weight: 740;
    }

    p {
      margin: 12px 0;
      color: #2b2b2d;
    }

    strong { font-weight: 740; }

    ul, ol {
      margin: 12px 0 18px;
      padding-left: 1.3rem;
    }

    li {
      margin: 7px 0;
      padding-left: 2px;
    }

    code {
      padding: 2px 6px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #f5f5f7;
      font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      font-size: 0.9em;
    }

    .table-wrap {
      width: 100%;
      margin: 18px 0 26px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      overflow: auto;
      background: var(--paper-solid);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.04);
    }

    table {
      width: 100%;
      min-width: 720px;
      border-collapse: collapse;
      font-size: 14px;
      line-height: 1.45;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #fbfbfd;
      color: #1d1d1f;
      font-weight: 740;
      text-align: left;
      border-bottom: 1px solid var(--line-strong);
    }

    th, td {
      padding: 12px 14px;
      vertical-align: top;
      border-right: 1px solid var(--line);
    }

    th:last-child, td:last-child { border-right: 0; }

    tr + tr td { border-top: 1px solid var(--line); }
    tbody tr:nth-child(even) td { background: rgba(245, 245, 247, 0.48); }

    .section-title + .week-title,
    .week-title + p {
      margin-top: 12px;
    }

    .week-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 13px;
      border: 1px solid rgba(17, 106, 216, 0.16);
      border-radius: var(--radius);
      background: rgba(234, 243, 255, 0.82);
      color: var(--brand-blue-dark);
      font-size: 20px;
    }

    .subsection-title {
      color: #1d1d1f;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
    }

    mark.search-hit {
      padding: 0 3px;
      border-radius: 5px;
      background: #fff2a8;
      color: inherit;
    }

    .mobile-topbar {
      display: none;
      position: sticky;
      top: 0;
      z-index: 10;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 58px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--line);
      background: rgba(247, 249, 252, 0.88);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
    }

    .mobile-topbar button,
    .print-button {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.86);
      color: var(--text);
      font: inherit;
      font-size: 13px;
      font-weight: 650;
      padding: 9px 13px;
      cursor: pointer;
    }

    .empty-state {
      display: none;
      padding: 12px;
      color: var(--muted);
      font-size: 13px;
    }

    @media (max-width: 1080px) {
      .app-shell { grid-template-columns: 1fr; }
      .mobile-topbar { display: flex; }
      .sidebar {
        position: fixed;
        inset: 58px auto 0 0;
        z-index: 20;
        width: min(88vw, 340px);
        transform: translateX(-104%);
        transition: transform 180ms ease;
        box-shadow: 20px 0 60px rgba(0,0,0,0.18);
      }
      body.nav-open .sidebar { transform: translateX(0); }
      .content-wrap { padding: 18px 16px 56px; }
      .hero { padding: 28px 0 22px; }
      .hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      main.document { padding: 22px 20px 42px; border-radius: var(--radius); }
      h2 { font-size: 28px; }
      h3 { font-size: 22px; }
    }

    @media (max-width: 620px) {
      body { font-size: 15px; }
      .hero { padding: 24px 20px; }
      .hero h1 { font-size: 38px; }
      .hero p { font-size: 16px; }
      .hero-stats { grid-template-columns: 1fr; }
      .stat { min-height: 78px; }
      .quick-actions { gap: 8px; }
      .action-button { width: 100%; justify-content: center; }
      table { min-width: 780px; font-size: 13px; }
      th, td { padding: 10px 11px; }
    }

    @media print {
      body {
        background: #fff;
        color: #000;
      }
      .sidebar, .mobile-topbar, .quick-actions { display: none !important; }
      .app-shell { display: block; }
      .content-wrap { padding: 0; }
      .hero, main.document {
        max-width: none;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: #fff;
      }
      .hero { margin-bottom: 24px; }
      .title { display: block; }
      h2, h3, h4 { break-after: avoid; }
      .table-wrap {
        overflow: visible;
        break-inside: avoid;
        box-shadow: none;
      }
      table { min-width: 0; font-size: 10px; }
      th { position: static; }
    }
  </style>
</head>
<body>
  <div class="mobile-topbar">
    <button type="button" id="navToggle" aria-label="Mở mục lục">Mục lục</button>
    <strong>Giáo trình hè</strong>
    <button type="button" class="print-button" onclick="window.print()">In/PDF</button>
  </div>

  <div class="app-shell">
    <aside class="sidebar" aria-label="Mục lục">
      <div class="brand">
        <div class="brand-mark">
          <img class="brand-logo" src="logo.jpg" alt="BEVA logo">
          <div>
            <div class="brand-name">BEVA</div>
            <div class="brand-tagline">better mind, better life</div>
          </div>
        </div>
        <div class="brand-kicker">Homeschooling mùa hè</div>
        <div class="brand-title">Giáo trình 2 tháng</div>
        <p class="brand-subtitle">56 ngày học tại nhà cho trẻ 5-7 và 10-12 tuổi, theo tinh thần Montessori, Steiner, Reggio, Dewey và Socrates.</p>
      </div>
      <div class="search-panel">
        <label class="search-box" for="searchInput">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input id="searchInput" type="search" placeholder="Tìm tuần, ngày, hoạt động..." autocomplete="off">
        </label>
        <div class="search-meta">
          <span id="resultCount">Nhập để lọc mục lục</span>
          <span>⌘/Ctrl + F</span>
        </div>
      </div>
      <nav class="toc" id="toc">${tocHtml}</nav>
      <div class="empty-state" id="emptyState">Không tìm thấy mục phù hợp.</div>
    </aside>

    <div class="content-wrap">
      <section class="hero" aria-labelledby="heroTitle">
        <p class="hero-eyebrow">Bản HTML chuyên nghiệp</p>
        <h1 id="heroTitle">Giáo trình homeschooling hè 2 tháng</h1>
        <p>Dễ đọc, dễ tìm, dễ in và đủ chi tiết để phụ huynh triển khai từng ngày từng giờ cho hai nhóm tuổi.</p>
        <div class="hero-stats">
          <div class="stat"><strong>8</strong><span>tuần chủ đề rõ ràng</span></div>
          <div class="stat"><strong>56</strong><span>ngày có lịch cụ thể</span></div>
          <div class="stat"><strong>2</strong><span>nhóm tuổi 5-7 và 10-12</span></div>
          <div class="stat"><strong>5</strong><span>lăng kính giáo dục tích hợp</span></div>
        </div>
      </section>

      <div class="quick-actions" aria-label="Lối tắt">
        <a class="action-button" href="#4-lo-trinh-8-tuan">Lộ trình 8 tuần</a>
        <a class="action-button" href="#5-giao-trinh-tung-ngay-tung-gio">Từng ngày từng giờ</a>
        <a class="action-button" href="#6-checklist-quan-sat-hang-ngay">Checklist</a>
        <a class="action-button" href="#7-rubric-dau-ra-theo-nhom-tuoi">Rubric</a>
        <button type="button" class="print-button" onclick="window.print()">In hoặc lưu PDF</button>
      </div>

      <main class="document" id="document">
${html}
      </main>
    </div>
  </div>

  <script>
    const navToggle = document.getElementById("navToggle");
    const searchInput = document.getElementById("searchInput");
    const links = Array.from(document.querySelectorAll(".toc-link"));
    const resultCount = document.getElementById("resultCount");
    const emptyState = document.getElementById("emptyState");

    navToggle?.addEventListener("click", () => {
      document.body.classList.toggle("nav-open");
    });

    links.forEach((link) => {
      link.addEventListener("click", () => document.body.classList.remove("nav-open"));
    });

    const normalize = (value) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/đ/g, "d");

    searchInput.addEventListener("input", () => {
      const query = normalize(searchInput.value.trim());
      let visible = 0;
      links.forEach((link) => {
        const match = !query || normalize(link.textContent).includes(query);
        link.style.display = match ? "" : "none";
        if (match) visible += 1;
      });
      resultCount.textContent = query ? visible + " mục phù hợp" : "Nhập để lọc mục lục";
      emptyState.style.display = visible ? "none" : "block";
    });

    const sections = links
      .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + visible.target.id);
      });
    }, { rootMargin: "-18% 0px -74% 0px", threshold: 0.01 });

    sections.forEach((section) => observer.observe(section));
  </script>
</body>
</html>`;

fs.writeFileSync(output, htmlDoc, "utf8");
console.log(output);
