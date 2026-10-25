(() => {
  const BIZ = {
    restaurant: {
      name: "مطعم ومطبخ السعيدة", icon: "🍽️",
      hello: "يا هلا ومرحبا 👋 معك مساعد مطعم السعيدة. اسألني عن المنيو والأسعار والتوصيل، أو اطلب طلبك مباشرة.",
      chips: ["وش عندكم في المنيو؟", "توصلون الحوبان؟", "أبغى أطلب مندي دجاج", "متى تفتحون يوم الجمعة؟"]
    },
    clinic: {
      name: "مجمع الابتسامة لطب الأسنان", icon: "🦷",
      hello: "أهلاً وسهلاً 🌷 معك مساعد مجمع الابتسامة لطب الأسنان. أقدر أساعدك في المواعيد والأسعار والأطباء.",
      chips: ["كم سعر تنظيف الأسنان؟", "ضرسي يوجعني، متى أقدر أجي؟", "أبغى أحجز موعد لطفلي", "تقبلون تأمين؟"]
    },
    store: {
      name: "محل أناقة للأزياء", icon: "👗",
      hello: "حياك الله ✨ معك مساعد محل أناقة للأزياء. اسأل عن العبايات والفساتين والأسعار والتوصيل.",
      chips: ["كم سعر العباية المطرزة؟", "عندكم عروض؟", "توصلون عدن؟", "أبغى أطلب ثوب رجالي"]
    }
  };
  const $ = (s) => document.querySelector(s);
  const body = $("#chat-body"), chips = $("#chips"), form = $("#composer"), input = $("#msg");
  const sendBtn = form.querySelector(".send");
  let biz = "restaurant";
  const histories = { restaurant: [], clinic: [], store: [] };
  let busy = false;

  function bubble(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + (who === "user" ? "me" : "bot");
    el.textContent = text;
    const t = document.createElement("span");
    t.className = "time";
    t.textContent = new Date().toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" });
    el.appendChild(t);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }
  function typing(on) {
    let el = $("#typing");
    if (on && !el) {
      el = document.createElement("div");
      el.id = "typing"; el.className = "msg bot typing";
      el.setAttribute("aria-label", "يكتب الآن");
      el.innerHTML = "<i></i><i></i><i></i>";
      body.appendChild(el); body.scrollTop = body.scrollHeight;
      $("#chat-status").textContent = "يكتب الآن…";
    } else if (!on && el) { el.remove(); $("#chat-status").textContent = "متصل الآن • يرد فوراً"; }
  }
  function renderChips() {
    chips.innerHTML = "";
    BIZ[biz].chips.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c;
      b.addEventListener("click", () => send(c));
      chips.appendChild(b);
    });
  }
  function render() {
    const b = BIZ[biz];
    $("#chat-name").textContent = b.name;
    $("#chat-avatar").textContent = b.icon;
    body.innerHTML = "";
    bubble(b.hello, "bot");
    histories[biz].forEach((m) => bubble(m.content, m.role === "user" ? "user" : "bot"));
    renderChips();
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    if (busy) return;
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", "false"));
    t.setAttribute("aria-selected", "true");
    biz = t.dataset.biz; render();
  }));

  async function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = "";
    const h = histories[biz], forBiz = biz;
    h.push({ role: "user", content: text });
    bubble(text, "user");
    typing(true);
    let reply = "";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ biz: forBiz, messages: h.slice(-14) }), signal: ctrl.signal
      });
      clearTimeout(timer);
      const j = await r.json().catch(() => ({}));
      reply = j.reply || "";
      if (r.ok && reply) h.push({ role: "assistant", content: reply });
      else { h.pop(); if (!reply) reply = "المساعد مشغول لحظة، جرّب مرة ثانية 🙏"; }
    } catch (e) {
      h.pop();
      reply = "المساعد مشغول لحظة، جرّب مرة ثانية 🙏";
    }
    typing(false);
    if (forBiz === biz) bubble(reply, "bot");
    busy = false; sendBtn.disabled = false;
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  render();
})();
