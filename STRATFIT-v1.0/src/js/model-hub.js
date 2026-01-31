document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("#model-table tbody");
  const models = [];

  const upload = document.getElementById("upload-model");
  upload.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const model = JSON.parse(reader.result);
        models.push(model);
        render();
      } catch (err) {
        alert("Invalid JSON model file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  });

  function render() {
    table.innerHTML = "";

    models.forEach((m, i) => {
      const alpha = m?.blended?.alpha;
      const conf = m?.blended?.confidence;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.name || "—"}</td>
        <td>${m.version || "—"}</td>
        <td>${Number.isFinite(alpha) ? alpha.toFixed(2) + "%" : "—"}</td>
        <td>${Number.isFinite(conf) ? conf.toFixed(2) + "%" : "—"}</td>
        <td>${m.createdBy || "—"}</td>
        <td>${m.status || "Draft"}</td>
        <td>
          ${m.lock ? "🔒 Locked" : `<button class="btn" data-final="${i}">Lock Final</button>`}
        </td>
      `;
      table.appendChild(tr);
    });

    document.querySelectorAll("button[data-final]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = +btn.dataset.final;
        if (window.currentUser?.role !== "committee") {
          alert("Only committee can lock a model.");
          return;
        }
        models[idx].status = "Final";
        models[idx].lock = true;
        render();
      });
    });
  }
});


