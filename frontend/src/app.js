// Elements
const f = document.getElementById('f');                 // the single form
const out = document.getElementById('out');             // <pre id="out"></pre>
const modeSel = document.getElementById('mode');        // <select id="mode">
const offenseFields = document.getElementById('offense-fields');
const defenseFields = document.getElementById('defense-fields'); // optional section

// Hardcode API for now (simplest). Remove the textbox-driven base to avoid confusion.
const API_BASE = "https://offense-backend-616432051288.us-central1.run.app";



// Hide defense UI for now (since backend isn't ready)
if (defenseFields) defenseFields.style.display = 'none';
if (modeSel) {
  modeSel.value = 'offense';
  modeSel.addEventListener('change', () => {
    const m = modeSel.value;
    if (offenseFields) offenseFields.style.display = (m === 'offense') ? '' : 'none';
    if (defenseFields) defenseFields.style.display = (m === 'defense') ? '' : 'none';
    // keep offense required
    [...offenseFields.querySelectorAll('input')].forEach(i => i.required = (m === 'offense'));
    if (defenseFields) [...defenseFields.querySelectorAll('input')].forEach(i => i.required = (m === 'defense'));
  });
}

async function submitOffense(payload) {
  const res = await fetch(`${API_BASE}/similarity/offense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`);
  }
  return res.json();
}

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  out.textContent = "Running…";

  // Pull values by name from the single form
  const fd = new FormData(f);
  const n = (k) => {
    const v = fd.get(k);
    return v === null || v === "" ? undefined : Number(v);
  };

  // Build payload; leave fields undefined if empty so backend can validate
  const payload = {
    passing_yards_pg:   n("passing_yards_pg"),
    passing_tds_pg:     n("passing_tds_pg"),
    ints_pg:            n("ints_pg"),
    rushing_yards_pg:   n("rushing_yards_pg"),
    rushing_tds_pg:     n("rushing_tds_pg"),
    receiving_yards_pg: n("receiving_yards_pg"),
    k:                  Number(fd.get("k") || 5),
  };

  try {
    const data = await submitOffense(payload);
    // Show just the results array if present
    out.textContent = JSON.stringify(data.results ?? data, null, 2);
  } catch (err) {
    out.textContent = String(err.message || err);
  }
});
