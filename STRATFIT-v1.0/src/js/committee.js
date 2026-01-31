const defaultRunId = "SIM-2026-X9";

const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get("run") || defaultRunId;

const user = {
  email: window.currentUser?.username || "unknown",
  role: window.currentUser?.role || "analyst",
};

document.addEventListener("DOMContentLoaded", () => {
  const runEl = document.getElementById("committee-runid");
  if (runEl) runEl.textContent = runId;

  const userEl = document.getElementById("committee-user");
  if (userEl) userEl.textContent = `${user.email} (Role: ${String(user.role).toUpperCase()})`;

  const approveBtn = document.getElementById("btn-approve");
  const rejectBtn = document.getElementById("btn-reject");

  if (approveBtn) approveBtn.addEventListener("click", () => vote("approve"));
  if (rejectBtn) rejectBtn.addEventListener("click", () => vote("reject"));

  renderVotes();
});

export function vote(decision) {
  const comment = document.getElementById("comment")?.value || "";

  const record = {
    runId,
    user: user.email,
    role: user.role,
    vote: String(decision).toUpperCase(),
    comment,
    timestamp: new Date().toISOString(),
  };

  const log = JSON.parse(localStorage.getItem("committeeVotes") || "[]");
  log.push(record);
  localStorage.setItem("committeeVotes", JSON.stringify(log));

  renderVotes();
  checkQuorum(log);
}

function renderVotes() {
  const log = JSON.parse(localStorage.getItem("committeeVotes") || "[]");
  const filtered = log.filter((r) => r.runId === runId);

  const html = filtered
    .map(
      (v) => `
    <p><strong>${v.user}</strong> voted <b>${v.vote}</b><br>
    <em>${v.comment || ""}</em> <small>(${v.timestamp})</small></p>
  `
    )
    .join("");

  const el = document.getElementById("vote-log");
  if (el) el.innerHTML = html || "<p>No votes yet.</p>";
}

function checkQuorum(votes) {
  const votesForRun = votes.filter((v) => v.runId === runId);
  const approvals = votesForRun.filter((v) => v.vote === "APPROVE");

  if (approvals.length >= 2) {
    lockDecision();
  }
}

function lockDecision() {
  alert("✅ Quorum reached. Decision locked and signed.");
  const locked = {
    runId,
    lockedAt: new Date().toISOString(),
    lockedBy: "committee",
    quorum: 2,
  };
  localStorage.setItem(`locked-${runId}`, JSON.stringify(locked));
}


