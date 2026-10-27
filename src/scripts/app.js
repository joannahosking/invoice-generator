const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : v;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const hours = ["8", "8", "8", "8", "8", "", ""];
const exps = [{ l: "", a: "" }];

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};
const money = (n) => {
  const r = Math.round(n * 100) / 100;
  return "£" + (Number.isInteger(r) ? r : r.toFixed(2));
};
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const lastMonday = () => {
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7) - 7);
  return t;
};
const weekStart = () => {
  const v = $("#wk").value;
  return v ? new Date(v + "T12:00:00") : lastMonday();
};

/* Password gate: courtesy only, see README */
function unlock() {
  $("#gate").hidden = true;
  $("#app").hidden = false;
  store.set("inv_ok", "1");
  build();
}
$("#go").onclick = () => {
  const pw = $("#gate").dataset.pw.toLowerCase();
  if ($("#pw").value.trim().toLowerCase() === pw) unlock();
  else $("#err").textContent = "Wrong password. Try again.";
};
$("#pw").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#go").click();
});

/* Saved settings */
$("#nm").value = store.get("inv_name", "");
$("#loc").value = store.get("inv_loc", "");
$("#rate").value = store.get("inv_rate", "190");
$("#full").value = store.get("inv_full", "8");
$("#tax").value = store.get("inv_tax", "20");
$("#wk").value = iso(lastMonday());

/* Day rows */
const fullHrs = () => num($("#full").value) || 8;

function setHours(i, v) {
  hours[i] = v;
  build();
}
function renderDays() {
  const ws = weekStart();
  $("#days").innerHTML = DAYS.map((n, i) => {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    return `<div class="day" id="day${i}">
      <label class="switch"><input type="checkbox" aria-label="${n} worked" ${num(hours[i]) > 0 ? "checked" : ""}><i></i></label>
      <div class="txt"><b>${n}</b><span>${fmt(d)} <em class="amt" style="font-style:normal"></em></span></div>
      <button type="button" class="hrsbtn" aria-label="${n} hours, tap to switch between full and half day"></button>
    </div>`;
  }).join("");
  DAYS.forEach((_, i) => {
    const row = $(`#day${i}`);
    row.querySelector(".switch input").onchange = (e) =>
      setHours(i, e.target.checked ? String(fullHrs()) : "");
    row.querySelector(".hrsbtn").onclick = () =>
      setHours(
        i,
        num(hours[i]) >= fullHrs() ? String(fullHrs() / 2) : String(fullHrs()),
      );
  });
}

/* Expense rows */
function renderExp() {
  $("#exp").innerHTML = exps
    .map(
      (x, i) => `<div class="xrow">
    <input class="lbl" placeholder="What for (optional)" data-i="${i}" data-k="l" value="${esc(x.l)}" aria-label="Expense description">
    <input class="pr" inputmode="decimal" placeholder="£" data-i="${i}" data-k="a" value="${esc(x.a)}" aria-label="Expense amount">
    <button type="button" data-r="${i}" aria-label="Remove expense">×</button></div>`,
    )
    .join("");
  $("#exp")
    .querySelectorAll("input")
    .forEach((el) => {
      el.oninput = () => {
        exps[+el.dataset.i][el.dataset.k] = el.value;
        build();
      };
    });
  $("#exp")
    .querySelectorAll("button")
    .forEach((b) => {
      b.onclick = () => {
        exps.splice(+b.dataset.r, 1);
        if (!exps.length) exps.push({ l: "", a: "" });
        renderExp();
        build();
      };
    });
}
$("#addx").onclick = () => {
  exps.push({ l: "", a: "" });
  renderExp();
  const f = $("#exp").querySelectorAll(".lbl");
  f[f.length - 1].focus();
};

/* Build the invoice text */
function build() {
  const rate = num($("#rate").value);
  const full = num($("#full").value) || 8;
  const taxPct = num($("#tax").value);
  store.set("inv_name", $("#nm").value);
  store.set("inv_loc", $("#loc").value);
  store.set("inv_rate", $("#rate").value);
  store.set("inv_full", $("#full").value);
  store.set("inv_tax", $("#tax").value);

  const ws = weekStart();
  const count = num(hours[5]) > 0 || num(hours[6]) > 0 ? 7 : 5;
  const lines = [];
  let totalH = 0,
    worked = 0,
    total = 0;
  for (let i = 0; i < 7; i++) {
    const h = num(hours[i]);
    const amt = (h * rate) / full;
    const el = document.querySelector(`#day${i} .amt`);
    $(`#day${i}`).classList.toggle("off", h <= 0);
    const btn = $(`#day${i} .hrsbtn`);
    btn.textContent = h > 0 ? `${h}h` : "Off";
    btn.disabled = h <= 0;
    btn.classList.toggle("half", h > 0 && h < full);
    $(`#day${i} .switch input`).checked = h > 0;
    if (el) el.textContent = h > 0 ? "· " + money(amt) : "";
    if (i < count) {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      lines.push(`${DAYS[i]} ${fmt(d)} ${h}hrs ${money(amt)}`);
    }
    if (h > 0) worked++;
    totalH += h;
    total += amt;
  }
  const tax = (total * taxPct) / 100;
  const after = total - tax;
  const exItems = exps.filter((x) => num(x.a) > 0);
  const ex = exItems.reduce((s, x) => s + num(x.a), 0);
  const rule = "──────────────────";

  const out = [
    "Receipts attached.",
    "",
    "INVOICE",
    rule,
    `Date: ${fmt(new Date())}`,
    `Name: ${$("#nm").value.trim()}`,
    `Site: ${$("#loc").value.trim()}`,
    "",
    `WEEK COMMENCING ${fmt(ws)}`,
    rule,
    ...lines,
    rule,
    `Days worked: ${worked}`,
    `Total hours: ${totalH}`,
    "",
    `Gross: ${money(total)}`,
    `Tax (${taxPct}%): -${money(tax)}`,
    `After tax: ${money(after)}`,
    ...(ex > 0
      ? [
          "",
          "Expenses:",
          ...exItems.map(
            (x) => `  ${x.l.trim() || "Expense"}: ${money(num(x.a))}`,
          ),
          `Expenses total: ${money(ex)}`,
        ]
      : []),
    rule,
    `TOTAL TO PAY: ${money(after + ex)}`,
  ];
  $("#out").textContent = out.join("\n");
  $("#grand").textContent = money(after + ex);
}
$("#wk").oninput = () => {
  renderDays();
  build();
};
["#nm", "#loc", "#rate", "#full", "#tax"].forEach((s) => {
  $(s).oninput = build;
});

/* Copy */
$("#copy").onclick = () => {
  const t = $("#out").textContent,
    b = $("#copy");
  const done = () => {
    b.textContent = "Copied ✓";
    setTimeout(() => {
      b.textContent = "Copy invoice";
    }, 2000);
  };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {}
    ta.remove();
    done();
  };
  if (navigator.clipboard?.writeText)
    navigator.clipboard.writeText(t).then(done, fallback);
  else fallback();
};

renderDays();
renderExp();
build();
if (store.get("inv_ok", "") === "1") unlock();
