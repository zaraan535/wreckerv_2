/* =====================================================================
   wrecker — site script (used by every page)
   Every block checks that its elements exist, so one file serves all pages.
===================================================================== */
(function () {
  "use strict";
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  // SOLD OUT: when new stock arrives, change this to true.
  // Badges, status line, buttons, announcement bar and mobile bar all switch automatically.
  var OPEN = false;
  var STOCK_TEXT = OPEN ? "Preorders open now" : "Sold out \u2014 new stock coming soon";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- stock wording anywhere on the site ---------- */
  $$("[data-stock]").forEach(function (el) { el.textContent = STOCK_TEXT; });

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- mobile menu ---------- */
  (function () {
    var btn = $(".menu-btn");
    var menu = $(".mobile-menu");
    if (!btn || !menu) return;
    function set(open) {
      doc.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector(".lbl").textContent = open ? "Close" : "Menu";
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    btn.addEventListener("click", function () { set(!doc.body.classList.contains("menu-open")); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 760) set(false); });
  })();

  /* ---------- scroll reveal ---------- */
  (function () {
    try {
      var groups = [
        { sel: ".po-gallery", step: 0, base: 0 },
        { sel: ".po-info > *", step: 60, base: 80 },
        { sel: ".two-col > *", step: 130, base: 0 },
        { sel: ".section-head", step: 0, base: 0 },
        { sel: ".spec li", step: 80, base: 0 },
        { sel: ".values li", step: 110, base: 0 },
        { sel: "[data-reveal]", step: 90, base: 0 }
      ];
      var els = [];
      groups.forEach(function (g) {
        $$(g.sel).forEach(function (el, i) {
          if (el.classList.contains("reveal")) return;
          el.classList.add("reveal");
          el.style.setProperty("--rd", Math.min(g.base + i * g.step, 420) + "ms");
          els.push(el);
        });
      });
      $$("[data-reveal-img]").forEach(function (el) { el.classList.add("reveal-img"); els.push(el); });

      if (reduce || !("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("in"); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (el) { io.observe(el); });
    } catch (e) {
      doc.documentElement.classList.remove("js");
    }
  })();

  /* ---------- header hairline + hero drift ---------- */
  (function () {
    var header = $(".site-header");
    var hero = $(".hero-inner");
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || 0;
      if (header) header.classList.toggle("scrolled", y > 8);
      if (hero && !reduce && y < window.innerHeight * 1.2) {
        hero.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
        hero.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.8)).toFixed(3);
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------- product gallery: front / back, arrows, keys, hover zoom ---------- */
  (function () {
    var main = $("#po-main");
    if (!main) return;
    var img = $("#po-img");
    var src = $("#po-src");
    var pic = main.querySelector("picture");
    var cap = $("#po-cap");
    var count = $("#po-count");
    var thumbs = $$(".po-thumb");
    var order = ["front", "back"];
    var photos = {
      front: { webp: "hoodie-front.webp", png: "hoodie-front.png", alt: "Front view of the navy Wreck hoodie", cap: "Front" },
      back: { webp: "hoodie-back.webp", png: "hoodie-back.png", alt: "Back view of the navy Wreck hoodie", cap: "Back" }
    };
    var view = "front";
    new Image().src = photos.back.webp; // preload so the switch is instant

    function show(v) {
      if (v === view) return;
      view = v;
      thumbs.forEach(function (t) {
        var on = t.getAttribute("data-view") === v;
        t.classList.toggle("active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (src) src.srcset = photos[v].webp;
      img.src = photos[v].png;
      img.alt = photos[v].alt;
      cap.textContent = photos[v].cap;
      if (count) count.textContent = "0" + (order.indexOf(v) + 1) + " / 0" + order.length;
      img.classList.remove("fade"); cap.classList.remove("fade");
      void img.offsetWidth;
      img.classList.add("fade"); cap.classList.add("fade");
    }
    function step(d) {
      var i = (order.indexOf(view) + d + order.length) % order.length;
      show(order[i]);
    }
    thumbs.forEach(function (t) { t.addEventListener("click", function () { show(t.getAttribute("data-view")); }); });
    $$(".po-arrow").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); step(+b.getAttribute("data-step")); });
    });
    main.addEventListener("click", function () { step(1); });
    main.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
      if (e.key === "Enter" || e.key === " ") { step(1); e.preventDefault(); }
    });

    // hover zoom (mouse only)
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine && !reduce && pic) {
      main.addEventListener("mousemove", function (e) {
        var r = main.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        main.classList.add("zoomed");
        pic.style.transformOrigin = x + "% " + y + "%";
        pic.style.transform = "scale(1.6)";
      });
      main.addEventListener("mouseleave", function () {
        main.classList.remove("zoomed");
        pic.style.transform = "";
      });
    }
  })();

  /* ---------- size chart link + highlight the chosen size column ---------- */
  (function () {
    var chart = $("#size-chart");
    if (!chart) return;
    function openChart() {
      chart.open = true;
      chart.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
    $$("[data-open-chart]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); openChart(); }); });
    if (location.hash === "#size-chart") openChart();

    var sizes = ["S", "M", "L", "XL", "2XL"];
    $$('input[name="size"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var col = sizes.indexOf(r.value) + 1; // +1 for the label column
        $$(".size-table tr").forEach(function (tr) {
          Array.prototype.forEach.call(tr.children, function (c, i) { c.classList.toggle("hl", i === col); });
        });
      });
    });
  })();

  /* ---------- preorder (currently SOLD OUT) ---------- */
  (function () {
    var form = $("#order-form");
    if (!form) return;

    var ACCESS_KEY = "5a62ca45-7e0e-4b4b-ae82-9c03e3412729"; // Web3Forms access key

    var PRODUCT = "Navy “Wreck” Hoodie";
    var PRICE = "৳1,500";

    var submit = $("#order-submit");
    var summary = $("#order-summary");
    var msg = $("#order-msg");
    var status = $("#po-status");
    var statusText = status && status.querySelector("span:last-child");
    var gallery = $(".po-gallery");
    var soldTag = $(".po-soldout");
    var picked = $("#size-picked");
    var bbBtn = $("#bb-btn");
    var size = "";
    var sending = false;

    function render() {
      if (status) status.classList.toggle("open", OPEN);
      if (gallery) gallery.classList.toggle("soldout", !OPEN);
      if (soldTag) soldTag.hidden = OPEN;
      if (statusText) statusText.textContent = OPEN ? "Preorders are open" : STOCK_TEXT;
      if (picked) picked.textContent = size || "—";
      if (size) {
        summary.classList.remove("empty");
        summary.innerHTML = "<span>" + PRODUCT + " · Size " + size + "</span><span class=\"sum-price\">" + PRICE + "</span>";
      } else {
        summary.classList.add("empty");
        summary.textContent = "Pick your size above to start your preorder.";
      }
      submit.disabled = sending || !(OPEN && size);
      if (!sending) submit.innerHTML = OPEN ? "Place preorder <span class=\"arrow\" aria-hidden=\"true\">→</span>" : "Sold out";
      if (bbBtn) {
        if (OPEN) { bbBtn.textContent = "Preorder"; bbBtn.href = "#order"; bbBtn.removeAttribute("target"); }
        else { bbBtn.textContent = "Get notified"; bbBtn.href = "https://ig.me/m/wrecker.co"; bbBtn.target = "_blank"; bbBtn.rel = "noopener"; }
      }
    }

    $$('input[name="size"]').forEach(function (r) {
      r.addEventListener("change", function () { size = r.value; render(); });
      if (r.checked) size = r.value;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!size || !OPEN || sending) return;
      var f = new FormData(form);
      var data = {
        access_key: ACCESS_KEY,
        subject: "New preorder: Navy WRECK Hoodie, size " + size,
        from_name: "wrecker website",
        product: "Navy WRECK Hoodie",
        size: size,
        price: "BDT 1,500",
        first_name: f.get("first_name"),
        last_name: f.get("last_name"),
        email: f.get("email"),
        phone: f.get("phone"),
        address: f.get("address"),
        botcheck: f.get("botcheck") ? "yes" : ""
      };
      sending = true;
      submit.disabled = true;
      submit.textContent = "Sending…";
      msg.className = "";
      msg.textContent = "";
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.success) throw new Error(j.message || "failed");
          var done = doc.createElement("div");
          done.id = "order-done";
          done.setAttribute("role", "status");
          done.innerHTML = "<strong>Your preorder is in.</strong><p>Thank you. We have your order for size " + size +
            " and will contact you to confirm. Questions? Message us on <a class=\"link\" href=\"https://www.instagram.com/wrecker.co/\" target=\"_blank\" rel=\"noopener\">Instagram</a>.</p>";
          form.parentNode.replaceChild(done, form);
        })
        .catch(function (err) {
          try { console.error("Order failed:", err); } catch (x) {}
          sending = false;
          render();
          msg.className = "err";
          msg.innerHTML = "Something went wrong, so your order was not sent (" + String((err && err.message) || "network error").replace(/</g, "") +
            "). Please try again, or message us on <a class=\"link\" href=\"https://ig.me/m/wrecker.co\" target=\"_blank\" rel=\"noopener\">Instagram</a>.";
        });
    });

    render();
  })();

  /* ---------- mobile buy bar: shows after the hero, hides at the order form ---------- */
  (function () {
    var bar = $(".buybar");
    var hero = $(".hero");
    var info = $("#order");
    if (!bar || !hero || !("IntersectionObserver" in window)) return;
    var pastHero = false, atForm = false;
    function upd() { bar.classList.toggle("show", pastHero && !atForm); }
    new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting; upd(); }).observe(hero);
    if (info) new IntersectionObserver(function (en) { atForm = en[0].isIntersecting; upd(); }, { rootMargin: "0px 0px -10% 0px" }).observe(info);
  })();
})();
