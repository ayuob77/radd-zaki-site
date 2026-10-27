(() => {
  const $ = (s) => document.querySelector(s);
  const m = location.pathname.match(/^\/d\/([a-z0-9-]{2,60})\/?$/);
  const slug = m ? m[1] : (new URLSearchParams(location.search).get("b") || "").toLowerCase();
  const body = $("#chat-body"), chips = $("#chips"), form = $("#composer"), input = $("#msg");
  const sendBtn = form.querySelector(".send");
  const h = []; let busy = false, D = null;
  // ---- orders & bookings (order.raddzaki.com engine)
  const OPS = "https://order.raddzaki.com/api/ops/";
  let sb = localStorage.getItem("radd_sb") || "";
  if (!/^[a-z0-9]{16}$/.test(sb)) { const a = "abcdefghijkmnpqrstuvwxyz23456789"; sb = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => a[x % a.length]).join(""); localStorage.setItem("radd_sb", sb); }
  let BZ = null, inFlow = false, lastMsg = +(localStorage.getItem("radd_last_" + slug) || 0), polling = null;
  const ownerUrl = () => "https://order.raddzaki.com/owner/" + slug + "#sb=" + sb;
  function qr(buttons) {
    const box = document.createElement("div"); box.className = "qr";
    (buttons || []).flat().forEach((b) => {
      const el = document.createElement(b.url ? "a" : "button");
      el.className = "qr-b" + (b.url ? " qr-u" : ""); el.textContent = b.t;
      if (b.url) { el.href = b.url; el.target = "_blank"; el.rel = "noopener"; } else { el.type = "button"; el.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => x.disabled = true); el.classList.add("on"); opsStep({ v: b.v }, b.t); }); }
      box.appendChild(el);
    });
    body.appendChild(box); body.scrollTop = body.scrollHeight;
  }
  async function opsStep(input, echo) {
    if (busy) return; busy = true; sendBtn.disabled = true;
    if (echo) bubble(echo, "user");
    typing(true);
    let r = null;
    try { r = await fetch(OPS + "flow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, sb, input }) }).then((x) => x.json()); } catch (e) {}
    typing(false); busy = false; sendBtn.disabled = false;
    if (!r || !r.ok) { bubble("الخدمة مشغولة لحظة، جرّب مرة ثانية 🙏", "bot"); return null; }
    if (r.pass) { inFlow = false; return r; }
    bubble(r.text, "bot");
    const btns = r.buttons || [];
    if (r.done) btns.splice(btns.length - 1, 0, [{ t: "🧑‍💼 شوف الطلب كصاحب المحل", url: ownerUrl() }]);
    qr(btns);
    inFlow = !!btns.flat().some((b) => b.v === "x");
    if (r.done) startPolling();
    return r;
  }
  function startPolling() {
    if (polling) return;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(OPS + "updates?slug=" + slug + "&sb=" + sb + "&after=" + lastMsg).then((x) => x.json());
        if (r.ok && r.msgs.length) {
          const fresh = lastMsg > 0; lastMsg = r.last; localStorage.setItem("radd_last_" + slug, String(lastMsg));
          if (fresh) r.msgs.filter((m) => !/^(🆕|⏳ وصل)/.test(m.text)).forEach((m) => bubble("🔔 " + m.text, "bot"));
        }
      } catch (e) {}
    };
    tick(); polling = setInterval(tick, 15000);
  }
  const ORDER_RE = /(اطلب|أطلب|ابغى|أبغى|ابي|أبي|ودي|طلب|توصيل|اشتري|أشتري|order|deliver)/i;
  const BOOK_RE = /(احجز|أحجز|حجز|موعد|معاين|طاولة|book|appointment|reserv)/i;
  function bubble(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + (who === "user" ? "me" : "bot");
    el.textContent = text;
    const t = document.createElement("span");
    t.className = "time";
    t.textContent = new Date().toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" });
    el.appendChild(t); body.appendChild(el); body.scrollTop = body.scrollHeight; return el;
  }
  function typing(on) {
    let el = $("#typing");
    if (on && !el) {
      el = document.createElement("div"); el.id = "typing"; el.className = "msg bot typing";
      el.setAttribute("aria-label", "يكتب الآن"); el.innerHTML = "<i></i><i></i><i></i>";
      body.appendChild(el); body.scrollTop = body.scrollHeight; $("#chat-status").textContent = "يكتب الآن…";
    } else if (!on && el) { el.remove(); $("#chat-status").textContent = "متصل الآن • يرد فوراً"; }
  }
  async function send(text) {
    text = (text || "").trim();
    if (!text || busy || !D) return;
    if (inFlow && BZ) { input.value = ""; const r = await opsStep({ text }, text); if (!r || !r.pass) return; send._echoed = text; }
    const echoed = send._echoed === text; send._echoed = null;
    busy = true; sendBtn.disabled = true; input.value = "";
    h.push({ role: "user", content: text }); if (!echoed) bubble(text, "user"); typing(true);
    let reply = "";
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ biz: "d:" + slug, messages: h.slice(-14) }), signal: ctrl.signal });
      clearTimeout(timer);
      const j = await r.json().catch(() => ({}));
      reply = j.reply || "";
      if (r.ok && reply) h.push({ role: "assistant", content: reply });
      else { h.pop(); if (!reply) reply = "المساعد مشغول لحظة، جرّب مرة ثانية 🙏"; }
    } catch (e) { h.pop(); reply = "المساعد مشغول لحظة، جرّب مرة ثانية 🙏"; }
    typing(false); bubble(reply, "bot");
    busy = false; sendBtn.disabled = false;
    if (BZ) {
      const f = BZ.features || {};
      if (f.bookings && BOOK_RE.test(text)) qr([[{ t: "📅 احجز الحين", v: "b" }]]);
      else if (f.orders && ORDER_RE.test(text)) qr([[{ t: "🛒 سجّل طلبي الحين", v: "o" }]]);
    }
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  function missing() {
    $("#demo").innerHTML = '<div class="dz-missing"><h1 class="dz-title">الرابط غير صحيح</h1><p>ما لقينا هذا العرض التجريبي. جرّب العرض العام في <a href="/">الصفحة الرئيسية</a>.</p></div>';
  }
  if (!slug) return missing();
  fetch("/demos/" + slug + ".json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).then((d) => {
    if (!d || !d.name) return missing();
    D = d;
    document.title = "تجربة «رد ذكي» لـ" + d.name;
    $("#dz-name").textContent = d.short || d.name;
    $("#chat-name").textContent = d.name;
    $("#chat-avatar").textContent = d.icon || "💬";
    bubble(d.hello, "bot");
    (d.chips || []).forEach((c) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = c;
      b.addEventListener("click", () => send(c)); chips.appendChild(b);
    });
    const ul = $("#dz-facts-list");
    (d.facts || []).forEach((f) => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
    if (d.source) $("#dz-src").textContent = d.source;
    fetch(OPS + "biz/" + slug + "?sb=" + sb).then((r) => r.ok ? r.json() : null).then((j) => {
      if (!j || !j.ok) return; BZ = j.biz; const f = BZ.features || {};
      const acts = [];
      if (f.orders) acts.push({ t: "🛒 اطلب الآن", v: "o" });
      if (f.bookings) acts.push({ t: BZ.type === "restaurant" ? "📅 احجز طاولة" : BZ.type === "realestate" ? "📅 احجز معاينة" : "📅 احجز موعد", v: "b" });
      acts.push({ t: "📦 تابع طلباتي", v: "trk" });
      const bar = $("#ops-bar");
      if (bar) { bar.innerHTML = ""; acts.forEach((a) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip chip-ops"; b.textContent = a.t; b.addEventListener("click", () => opsStep({ v: a.v }, a.t)); bar.appendChild(b); }); bar.hidden = false; }
      const ow = $("#ops-owner"); if (ow) ow.href = ownerUrl();
      const nw = $("#ops-new"); if (nw) { nw.hidden = false; $("#ops-new-txt").textContent = f.orders && f.bookings ? "المساعد يستقبل الطلبات ويحجز المواعيد بنفسه، ويوصل إشعار لصاحب المحل، ويرسل للزبون تحديث طلبه وتذكير قبل موعده." : f.orders ? "المساعد يستقبل الطلبات بنفسه (الأصناف، الكمية، العنوان)، ويوصل إشعار لصاحب المحل، ويرسل للزبون تحديث طلبه أول بأول." : "المساعد يحجز المواعيد بنفسه من الأوقات اللي يحددها صاحب النشاط، بدون تعارض، ويرسل للزبون التأكيد وتذكير قبل الموعد."; }
      if (lastMsg) startPolling();
    }).catch(() => {});
  }).catch(missing);
})();
