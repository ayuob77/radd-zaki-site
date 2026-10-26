(() => {
  const $ = (s) => document.querySelector(s);
  const m = location.pathname.match(/^\/d\/([a-z0-9-]{2,60})\/?$/);
  const slug = m ? m[1] : (new URLSearchParams(location.search).get("b") || "").toLowerCase();
  const body = $("#chat-body"), chips = $("#chips"), form = $("#composer"), input = $("#msg");
  const sendBtn = form.querySelector(".send");
  const h = []; let busy = false, D = null;
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
    busy = true; sendBtn.disabled = true; input.value = "";
    h.push({ role: "user", content: text }); bubble(text, "user"); typing(true);
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
    const wa = "https://wa.me/12512765320?text=" + encodeURIComponent("مرحباً، أنا من " + d.name + " وجربت نموذج رد ذكي الخاص بنا (رمز: " + slug + ") وأبغى أعرف التفاصيل والأسعار");
    document.querySelectorAll('a[data-contact="wa"]').forEach((a) => { a.href = wa; });
  }).catch(missing);
})();
