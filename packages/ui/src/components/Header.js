/**
 * ========================================================
 * @gamo/ui — Shared Classroom Header Component
 * ========================================================
 */

export function createEducationalHeader({
  title = 'GAMO Education',
  subtitle = 'Nền tảng Trò chơi Học Tiếng Anh Tương Tác',
  showHubLink = true,
  hubUrl = 'http://localhost:5173',
  tagText = 'Lớp học tương tác',
} = {}) {
  const header = document.createElement('header');
  header.className = 'gamo-edu-header';
  header.style.cssText = `
    background: #FFFFFF;
    border-bottom: 2px solid #E2E8F0;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.03);
  `;

  const hubBtn = showHubLink
    ? `<a href="${hubUrl}" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; background: #EFF6FF; color: #2563EB; border: 1.5px solid #BFDBFE; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; transition: all 0.15s ease;">
        <span>🏠</span>
        <span>Về GAMO Hub</span>
      </a>`
    : '';

  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 44px; height: 44px; background: #2563EB; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 3px 0 #1D4ED8;">
        🎓
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <h1 style="font-family: 'Fredoka', 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #0F172A; margin: 0;">${title}</h1>
          <span style="font-size: 11px; font-weight: 800; background: #DCFCE7; color: #166534; padding: 2px 8px; border-radius: 999px; border: 1px solid #BBF7D0;">EDU</span>
        </div>
        <p style="font-size: 12px; color: #64748B; margin: 0;">${subtitle}</p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      ${hubBtn}
      <span style="font-size: 12px; font-weight: 600; background: #F1F5F9; color: #475569; padding: 6px 12px; border-radius: 999px;">${tagText}</span>
    </div>
  `;

  return header;
}
