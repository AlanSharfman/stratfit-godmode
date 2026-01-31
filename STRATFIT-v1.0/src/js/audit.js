export function logAction(action, meta = {}) {
  const log = JSON.parse(localStorage.getItem("audit") || "[]");
  log.push({
    user: window.currentUser?.username,
    role: window.currentUser?.role,
    action,
    meta,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("audit", JSON.stringify(log));
}


