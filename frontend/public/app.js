// URL of your Cloud Run backend (already deployed)
const API_BASE = "https://offense-backend-616432051288.us-central1.run.app";

// Call the backend
async function submitOffense(payload) {
  const res = await fetch(`${API_BASE}/similarity/offense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} ${txt ? `- ${txt}` : ""}`);
  }

  return res.json();
}

// Handle the form submit
async function handleSubmit(event) {
  event.preventDefault();

  const form = document.getElementById("f");
  const resultEl = document.getElementById("out");

  const payload = {
    passing_yards_pg: Number(form.passing_yards_pg.value),
    passing_tds_pg: Number(form.passing_tds_pg.value),
    ints_pg:          Number(form.ints_pg.value),
    rushing_yards_pg: Number(form.rushing_yards_pg.value),
    rushing_tds_pg:   Number(form.rushing_tds_pg.value),
    receiving_yards_pg: Number(form.receiving_yards_pg.value),
    k: Number(form.k.value),
  };

  resultEl.textContent = "Loading...";

  try {
    const data = await submitOffense(payload);
    resultEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    resultEl.textContent = `Error: ${err.message}`;
  }
}

// Attach the handler once the DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("f");
  form.addEventListener("submit", handleSubmit);
});
