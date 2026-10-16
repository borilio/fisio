(() => {
  "use strict";

  /* -----------------------------------------------------
     Datos de la clínica (js/config.js)
     - data-config="campo"       → texto del elemento
     - data-config-html="campo"  → HTML (listas: una línea por elemento)
     - data-config-href="campo"  → enlace (tel y mailto se generan solos)
     Si falta config.js o un campo, se mantiene lo escrito en el HTML.
     ----------------------------------------------------- */
  const config = window.SITE_CONFIG || {};

  function getConfig(path) {
    return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), config);
  }

  const links = {};
  if (config.telefono) {
    const digits = config.telefono.replace(/[^\d+]/g, "");
    links.tel = "tel:" + (digits.startsWith("+") ? digits : "+34" + digits);
  }
  if (config.email) {
    links.mailto = "mailto:" + config.email +
      (config.asuntoEmail ? "?subject=" + encodeURIComponent(config.asuntoEmail) : "");
  }

  /* -----------------------------------------------------
     Horario: el texto se genera a partir de config.horarioSemanal
     (agrupa los días seguidos con el mismo horario).
     ----------------------------------------------------- */
  const DAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  const formatTime = (t) => t.replace(/^0/, "");           // "09:30" → "9:30"
  const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function buildHorarioLines(week) {
    const groups = [];
    [1, 2, 3, 4, 5, 6, 0].forEach((dow) => {             // de lunes a domingo
      const ranges = week[DAY_KEYS[dow]] || [];
      const key = JSON.stringify(ranges);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.days.push(dow);
      else groups.push({ key, ranges, days: [dow] });
    });

    const lines = [];
    groups.forEach(({ ranges, days }) => {
      const first = capitalize(DAY_NAMES[days[0]]);
      const lastName = DAY_NAMES[days[days.length - 1]];
      const name = days.length === 1 ? first
        : days.length === 2 ? `${first} y ${lastName}`
        : `${first} a ${lastName}`;

      if (ranges.length) {
        lines.push(name);
        lines.push(ranges.map(([a, b]) => `<strong>${formatTime(a)} – ${formatTime(b)}</strong>`).join(" y "));
      } else {
        lines.push(`${name}: cerrado`);
      }
    });
    return lines;
  }

  if (config.horarioSemanal) {
    config.horario = buildHorarioLines(config.horarioSemanal);
  }

  document.querySelectorAll("[data-config]").forEach((el) => {
    const value = getConfig(el.dataset.config);
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll("[data-config-html]").forEach((el) => {
    const value = getConfig(el.dataset.configHtml);
    if (value != null) el.innerHTML = Array.isArray(value) ? value.join("<br>") : value;
  });

  document.querySelectorAll("[data-config-href]").forEach((el) => {
    const key = el.dataset.configHref;
    const value = links[key] || getConfig(key);
    if (value) el.href = value;
  });

  /* -----------------------------------------------------
     Aviso "Abierto ahora / Cerrado ahora" ([data-open-status])
     - Toma el reloj del dispositivo y lo convierte a la hora de España
       (así no influye la zona horaria del visitante; si su reloj
       está mal puesto, el aviso también lo estará).
     - En festivos no dice "Cerrado": avisa de que PUEDE estar cerrado.
     - data-open-status="long" (tarjeta) o "short" (botón Llamar).
     - Si algo falla, el aviso sigue oculto (mejor nada que algo erróneo).
     ----------------------------------------------------- */
  const statusEls = document.querySelectorAll("[data-open-status]");

  function madridNow() {
    // PRUEBA: martes 13-oct-2026, 10:00 (si quisiera poner las 13:35, pondría minutes: 13 * 60 + 35)
    // return { y: 2026, m: 10, d: 13, minutes: 10 * 60 + 0 };   
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { y: get("year"), m: get("month"), d: get("day"), minutes: get("hour") * 60 + get("minute") };
  }

  function infoFromUTC(ms) {
    const date = new Date(ms);
    const iso = date.toISOString().slice(0, 10);              // "AAAA-MM-DD"
    return { ms, dow: date.getUTCDay(), iso, mmdd: iso.slice(5), year: date.getUTCFullYear() };
  }

  function dayInfo(now, offset) {
    return infoFromUTC(Date.UTC(now.y, now.m - 1, now.d + offset));
  }

  // Domingo de Pascua (algoritmo de Meeus/Jones/Butcher)
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(y, month - 1, day);
  }

  function isFestivoDate(info) {
    const f = config.festivos || {};
    if ((f.fijos || []).includes(info.mmdd)) return true;
    if ((f.otros || []).includes(info.iso)) return true;
    if (f.semanaSanta) {
      const easter = easterSunday(info.year);
      const holy = [3, 2].map((n) => new Date(easter - n * 86400000).toISOString().slice(0, 10));
      if (holy.includes(info.iso)) return true;                // Jueves y Viernes Santo
    }
    return false;
  }

  function isFestivo(info) {
    if (isFestivoDate(info)) return true;
    // Lunes después de un festivo en domingo (suele trasladarse)
    const f = config.festivos || {};
    return Boolean(f.lunesTrasDomingoFestivo && info.dow === 1 &&
      isFestivoDate(infoFromUTC(info.ms - 86400000)));
  }

  function computeStatus() {
    const week = config.horarioSemanal;
    const now = madridNow();
    const today = dayInfo(now, 0);
    const todayRanges = week[DAY_KEYS[today.dow]] || [];

    if (todayRanges.length && isFestivo(today)) {
      return { state: "holiday", long: "Hoy es festivo · Puede que estemos cerrados", short: "Festivo: puede estar cerrado" };
    }

    const current = todayRanges.find(([a, b]) => toMinutes(a) <= now.minutes && now.minutes < toMinutes(b));
    if (current) {
      return { state: "open", long: `Abierto ahora · Cierra a las ${formatTime(current[1])}`, short: "Abierto ahora" };
    }

    for (let offset = 0; offset <= 7; offset++) {
      const info = dayInfo(now, offset);
      const next = (week[DAY_KEYS[info.dow]] || [])
        .find(([a]) => offset > 0 || toMinutes(a) > now.minutes);
      if (next) {
        const when = offset === 0 ? "hoy" : offset === 1 ? "mañana" : `el ${DAY_NAMES[info.dow]}`;
        const note = isFestivo(info) ? " (festivo: puede variar)" : "";
        return {
          state: "closed",
          long: `Cerrado ahora · Abre ${when} a las ${formatTime(next[0])}${note}`,
          short: `Cerrado · abre ${when} a las ${formatTime(next[0])}`
        };
      }
    }
    return { state: "closed", long: "Cerrado ahora", short: "Cerrado ahora" };
  }

  function renderStatus() {
    try {
      const status = computeStatus();
      statusEls.forEach((el) => {
        el.dataset.state = status.state;
        el.querySelector(".open-status__text").textContent =
          el.dataset.openStatus === "short" ? status.short : status.long;
        el.hidden = false;
      });
    } catch (err) {
      statusEls.forEach((el) => { el.hidden = true; });
    }
  }

  if (statusEls.length && config.horarioSemanal) {
    renderStatus();
    setInterval(renderStatus, 60000);                          // se actualiza cada minuto
  }

  /* -----------------------------------------------------
     Aviso importante eventual (config.aviso)
     - Solo se muestra si mostrar === true y hoy está entre "desde" y "hasta"
       (ambas incluidas; vacías = sin límite; usa la hora de España).
     - Al cerrarlo no se recuerda: vuelve a salir en la siguiente visita.
     ----------------------------------------------------- */
  const notice = document.getElementById("site-notice");
  const aviso = config.aviso;

  function avisoVigente() {
    if (!aviso || aviso.mostrar !== true) return false;
    if (!aviso.desde && !aviso.hasta) return true;
    try {
      const now = madridNow();
      const today = `${now.y}-${String(now.m).padStart(2, "0")}-${String(now.d).padStart(2, "0")}`;
      // "AAAA-MM-DD" se puede comparar como texto
      if (aviso.desde && today < aviso.desde) return false;   // aún no ha empezado
      if (aviso.hasta && today > aviso.hasta) return false;   // ya ha terminado
      return true;
    } catch (err) {
      return true;
    }
  }

  if (notice && avisoVigente()) {
    // Tipo: "info" (azul, informativo) o "urgente" (rojo, por defecto si falta o no se reconoce)
    const esInfo = aviso.tipo === "info";
    notice.classList.toggle("site-notice--info", esInfo);
    notice.querySelector(".site-notice__title").textContent =
      aviso.titulo || (esInfo ? "Información" : "Aviso importante");
    notice.querySelector(".site-notice__text").innerHTML = aviso.texto || "";
    notice.hidden = false;
    // Al cerrar: se desvanece (.is-closing) y luego se elimina.
    // El setTimeout lo elimina igualmente si no hay animación (p. ej. "reducir movimiento").
    notice.querySelector(".site-notice__close").addEventListener("click", () => {
      notice.classList.add("is-closing");
      notice.addEventListener("transitionend", () => notice.remove(), { once: true });
      setTimeout(() => notice.remove(), 400);
    });
  }

  /* -----------------------------------------------------
     Modo oscuro / claro
     - El tema inicial ya lo aplica el script del <head> (evita parpadeo).
     - Sin elección manual, se sigue siempre la preferencia del sistema.
     - Solo se guarda el tema cuando el usuario pulsa un conmutador.
     - Hay dos conmutadores [data-theme-toggle] (barra en ordenador,
       menú en móvil); se mantienen sincronizados.
     ----------------------------------------------------- */
  const root = document.documentElement;
  const themeToggles = document.querySelectorAll("[data-theme-toggle]");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const THEME_KEY = "fcds_theme";

  function applyTheme(isDark) {
    const dark = Boolean(isDark);
    root.setAttribute("data-theme", dark ? "dark" : "light");

    themeToggles.forEach((toggle) => {
      toggle.setAttribute("aria-checked", String(dark));
      toggle.title = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    });
  }

  let manualOverride = false;

  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      manualOverride = true;
      applyTheme(savedTheme === "dark");
    } else {
      applyTheme(media.matches);
    }
  } catch (err) {
    applyTheme(media.matches);
  }

  media.addEventListener("change", (e) => {
    if (!manualOverride) applyTheme(e.matches);
  });

  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      manualOverride = true;
      const isDark = root.getAttribute("data-theme") === "dark";
      applyTheme(!isDark);
      try {
        localStorage.setItem(THEME_KEY, isDark ? "light" : "dark");
      } catch (err) {
        /* noop */
      }
    });
  });

  /* -----------------------------------------------------
     Menú móvil
     ----------------------------------------------------- */
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -----------------------------------------------------
     Modal de aviso legal
     ----------------------------------------------------- */
  const legalModal = document.getElementById("legal-modal");
  const openLegal = document.getElementById("open-legal");

  // sectionId (opcional): apartado al que desplazarse al abrir, p. ej. "politica-cookies"
  function toggleModal(show, sectionId) {
    if (!legalModal) return;
    legalModal.hidden = !show;
    document.body.style.overflow = show ? "hidden" : "";
    if (!show) return;
    const body = legalModal.querySelector(".site-modal__body");
    const section = sectionId && document.getElementById(sectionId);
    if (body) body.scrollTop = section ? section.offsetTop - 16 : 0;
    const closeButton = legalModal.querySelector(".site-modal__close");
    if (closeButton) closeButton.focus();
  }

  if (legalModal) {
    if (openLegal) openLegal.addEventListener("click", () => toggleModal(true));
    legalModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => toggleModal(false));
    });
    // Cerrar al pulsar fuera de la ventana (en el fondo oscuro o en el margen del modal)
    legalModal.addEventListener("click", (e) => {
      if (!e.target.closest(".site-modal__panel")) toggleModal(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !legalModal.hidden) toggleModal(false);
    });
  }

  // Aviso legal: resalta los datos que siguen como "PENDIENTE" en config.js
  document.querySelectorAll(".legal-field").forEach((el) => {
    el.classList.toggle("legal-field--pending", el.textContent.trim().toUpperCase() === "PENDIENTE");
  });

  // Enlaces "Más información" → aviso legal, apartado de cookies
  document.querySelectorAll("[data-open-cookie-info]").forEach((el) => {
    el.addEventListener("click", () => toggleModal(true, "politica-cookies"));
  });

  /* -----------------------------------------------------
     Consentimiento de cookies (guía de cookies de la AEPD)
     - Lo único que instala cookies es el mapa de Google Maps.
     - La elección (aceptar / rechazar) se guarda con su fecha y
       caduca a los 24 meses: entonces se vuelve a preguntar.
     - Aceptar desde el banner o desde el aviso del mapa es lo mismo.
     ----------------------------------------------------- */
  const CONSENT_KEY = "fcds_cookies";
  const CONSENT_MONTHS = 24;
  const cookieBanner = document.getElementById("cookie-banner");
  const openCookies = document.getElementById("open-cookies");

  try {
    localStorage.removeItem("fcds_aviso_cerrado");          // clave del aviso antiguo
  } catch (err) {
    /* noop */
  }

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!saved || (saved.choice !== "accepted" && saved.choice !== "rejected")) return null;
      const expires = new Date(saved.date);
      expires.setMonth(expires.getMonth() + CONSENT_MONTHS);
      if (isNaN(expires) || new Date() > expires) {
        localStorage.removeItem(CONSENT_KEY);                 // caducada: volver a preguntar
        return null;
      }
      return saved.choice;
    } catch (err) {
      return null;
    }
  }

  // Se guarda también en memoria por si el navegador bloquea localStorage
  let consent = readConsent();

  function setConsent(choice) {
    consent = choice;
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    } catch (err) {
      /* noop */
    }
    hideCookieBanner();
    renderMap();
  }

  let bannerHideTimer = null;

  function showCookieBanner() {
    if (!cookieBanner) return;
    clearTimeout(bannerHideTimer);                             // por si se estaba cerrando
    cookieBanner.classList.remove("is-closing");
    cookieBanner.hidden = false;
  }

  // Se desvanece (.is-closing) y después se oculta
  function hideCookieBanner() {
    if (!cookieBanner || cookieBanner.hidden) return;
    cookieBanner.classList.add("is-closing");
    clearTimeout(bannerHideTimer);
    bannerHideTimer = setTimeout(() => {
      cookieBanner.hidden = true;
      cookieBanner.classList.remove("is-closing");
    }, 350);
  }

  document.querySelectorAll("[data-cookie-accept]").forEach((el) => {
    el.addEventListener("click", () => setConsent("accepted"));
  });
  document.querySelectorAll("[data-cookie-reject]").forEach((el) => {
    el.addEventListener("click", () => setConsent("rejected"));
  });

  if (openCookies) {
    openCookies.addEventListener("click", () => {
      showCookieBanner();
      const firstButton = cookieBanner && cookieBanner.querySelector("[data-cookie-reject]");
      if (firstButton) firstButton.focus();
    });
  }

  if (consent === null) showCookieBanner();

  /* -----------------------------------------------------
     Mapa de Google
     - Sin consentimiento: NO se crea el iframe (ni oculto ni en diferido)
       y se muestra el aviso #map-notice.
     - Con consentimiento: se crea el iframe y se oculta el aviso.
     - Si se retira el consentimiento, se elimina el iframe.
     ----------------------------------------------------- */
  const mapFrame = document.getElementById("map-frame");
  const mapNotice = document.getElementById("map-notice");

  function renderMap() {
    if (!mapFrame || !mapNotice) return;
    let iframe = mapFrame.querySelector("iframe");

    if (consent === "accepted" && getConfig("mapa.embed")) {
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.title = "Ubicación de la clínica en el mapa";
        iframe.src = getConfig("mapa.embed");
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        iframe.className = "contact-map__iframe";
        mapFrame.appendChild(iframe);
      }
      mapNotice.hidden = true;
    } else {
      if (iframe) iframe.remove();
      mapNotice.hidden = false;
    }
  }

  renderMap();

  /* -----------------------------------------------------
     Año en el footer
     ----------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
