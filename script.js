// Approximate on-demand prices (USD). For learning purposes only.
const PRICING = {
  aws:   { name: "AWS",   color: "#ff9900",
           vm: { small: 0.096, medium: 0.192, large: 0.384 },
           storage: 0.023, egress: 0.09, freeEgress: 100, db: 0.068 },
  azure: { name: "Azure", color: "#0078d4",
           vm: { small: 0.096, medium: 0.192, large: 0.384 },
           storage: 0.0184, egress: 0.087, freeEgress: 100, db: 0.075 },
  gcp:   { name: "GCP",   color: "#34a853",
           vm: { small: 0.067, medium: 0.134, large: 0.268 },
           storage: 0.020, egress: 0.12, freeEgress: 100, db: 0.065 }
};

const DB_HOURS = 730; // database assumed always on

function calculate(provider, input) {
  const p = PRICING[provider];
  const compute = p.vm[input.size] * input.hours * input.count;
  const storage = p.storage * input.storage;
  const billableTransfer = Math.max(0, input.transfer - p.freeEgress);
  const network = billableTransfer * p.egress;
  const database = input.db ? p.db * DB_HOURS : 0;
  return {
    compute, storage, network, database,
    total: compute + storage + network + database
  };
}

function readInput() {
  return {
    size: document.getElementById("size").value,
    count: Math.max(1, Number(document.getElementById("count").value) || 1),
    hours: Math.min(730, Math.max(1, Number(document.getElementById("hours").value) || 730)),
    storage: Math.max(0, Number(document.getElementById("storage").value) || 0),
    transfer: Math.max(0, Number(document.getElementById("transfer").value) || 0),
    db: document.getElementById("db").checked,
    rate: Math.max(1, Number(document.getElementById("rate").value) || 88)
  };
}

const usd = (n) => "$" + n.toFixed(2);
const inr = (n, rate) => "\u20B9" + Math.round(n * rate).toLocaleString("en-IN");

function render() {
  const input = readInput();
  const keys = Object.keys(PRICING);
  const res = {};
  keys.forEach((k) => (res[k] = calculate(k, input)));

  const max = Math.max(...keys.map((k) => res[k].total));
  const bars = document.getElementById("bars");
  bars.innerHTML = "";

  keys.forEach((k) => {
    const width = max > 0 ? (res[k].total / max) * 100 : 0;
    bars.innerHTML += `
      <div class="bar-row">
        <div class="bar-name">${PRICING[k].name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%;background:${PRICING[k].color}"></div>
        </div>
        <div class="bar-val">${usd(res[k].total)} (${inr(res[k].total, input.rate)})</div>
      </div>`;
  });

  const sorted = [...keys].sort((a, b) => res[a].total - res[b].total);
  const cheapest = sorted[0];
  const saving = res[sorted[sorted.length - 1]].total - res[cheapest].total;
  document.getElementById("best").innerHTML =
    `<strong>Cheapest: ${PRICING[cheapest].name}</strong> at ${usd(res[cheapest].total)} per month.
     You save up to ${usd(saving)} (${inr(saving, input.rate)}) compared with the most expensive option.`;

  const rows = [
    ["Compute (VMs)", "compute"],
    ["Storage", "storage"],
    ["Data transfer", "network"],
    ["Database", "database"]
  ];
  let html = "";
  rows.forEach(([label, key]) => {
    html += `<tr><td>${label}</td>` +
      keys.map((k) => `<td>${usd(res[k][key])}</td>`).join("") + "</tr>";
  });
  html += `<tr class="total"><td>Total / month</td>` +
    keys.map((k) => `<td>${usd(res[k].total)}</td>`).join("") + "</tr>";
  html += `<tr class="total"><td>Total / year</td>` +
    keys.map((k) => `<td>${usd(res[k].total * 12)}</td>`).join("") + "</tr>";
  document.getElementById("tbody").innerHTML = html;

  document.getElementById("results").hidden = false;
}

document.getElementById("calc").addEventListener("click", render);
