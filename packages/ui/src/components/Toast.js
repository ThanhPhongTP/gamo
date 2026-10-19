/**
 * ========================================================
 * @gamo/ui — Toast Notification Component
 * ========================================================
 * Thân thiện, nổi bật trên máy chiếu lớp học.
 */

export function showToast(msg, type = 'success', duration = 2500) {
  const existing = document.getElementById('gamo-toast');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#16A34A', border: '#15803D', text: '#FFFFFF', icon: '🎉' },
    warn:    { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF', icon: '💡' },
    error:   { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF', icon: '⚠️' },
    info:    { bg: '#2563EB', border: '#1D4ED8', text: '#FFFFFF', icon: 'ℹ️' },
  };

  const style = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.id = 'gamo-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: ${style.bg};
    border: 2px solid ${style.border};
    color: ${style.text};
    padding: 12px 24px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 15px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    z-index: 99999;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 3px 0 ${style.border};
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  `;

  toast.innerHTML = `<span>${style.icon}</span><span>${msg}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
