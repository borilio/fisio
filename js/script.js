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
     - Usa siempre la hora de España (no la del dispositivo).
     - En festivos no dice "Cerrado": avisa de que PUEDE estar cerrado.
     - data-open-status="long" (tarjeta) o "short" (botón Llamar).
     - Si algo falla, el aviso sigue oculto (mejor nada que algo erróneo).
     ----------------------------------------------------- */
  const statusEls = document.querySelectorAll("[data-open-status]");

  function madridNow() {
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

  if (legalModal && openLegal) {
    function toggleModal(show) {
      legalModal.hidden = !show;
      document.body.style.overflow = show ? "hidden" : "";
    }

    openLegal.addEventListener("click", () => toggleModal(true));
    legalModal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => toggleModal(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !legalModal.hidden) toggleModal(false);
    });
  }

  /* -----------------------------------------------------
     Aviso de cookies
     ----------------------------------------------------- */
  const cookieBanner = document.getElementById("cookie-banner");
  const cookieAccept = document.getElementById("cookie-accept");
  const openCookies = document.getElementById("open-cookies");
  const COOKIE_KEY = "fcds_aviso_cerrado";

  function showCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function hideCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.hidden = true;
    document.body.style.overflow = "";
  }

  if (cookieBanner && cookieAccept) {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) {
        cookieBanner.hidden = false;
      } else {
        cookieBanner.hidden = true;
      }
    } catch (err) {
      cookieBanner.hidden = false;
    }

    cookieAccept.addEventListener("click", () => {
      hideCookieBanner();
      try {
        localStorage.setItem(COOKIE_KEY, "1");
      } catch (err) {
        /* noop */
      }
    });
  }

  if (openCookies) {
    openCookies.addEventListener("click", () => {
      try {
        localStorage.removeItem(COOKIE_KEY);
      } catch (err) {
        /* noop */
      }
      showCookieBanner();
    });
  }

  /* -----------------------------------------------------
     Mapa de Google: se carga solo al pulsar "Ver mapa"
     ----------------------------------------------------- */
  const mapContainer = document.getElementById("map-container");
  const loadMap = document.getElementById("load-map");

  if (mapContainer && loadMap && getConfig("mapa.embed")) {
    loadMap.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.title = "Ubicación de la clínica en el mapa";
      iframe.src = getConfig("mapa.embed");
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      iframe.className = "contact-map__iframe";
      mapContainer.replaceChildren(iframe);
    });
  }

  /* -----------------------------------------------------
     Año en el footer
     ----------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
