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

  const web = config.web || {};                              // { version, url }
  const contacto = config.contacto || {};                    // { telefono, email, asuntoEmail, direccion, direccionPostal }

  const links = {};
  if (contacto.telefono) {
    const digits = contacto.telefono.replace(/[^\d+]/g, "");
    links.tel = "tel:" + (digits.startsWith("+") ? digits : "+34" + digits);
  }
  if (contacto.email) {
    links.mailto = "mailto:" + contacto.email +
      (contacto.asuntoEmail ? "?subject=" + encodeURIComponent(contacto.asuntoEmail) : "");
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
        lines.push(`${name}: <strong>cerrado</strong>`);
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
     SEO: ficha de la clínica para Google (JSON-LD)
     Se genera a partir de config.js (nombre, teléfono, dirección,
     horario...) y se añade invisible en el <head>.
     ----------------------------------------------------- */
  if (web.url) {
    const url = web.url.replace(/\/?$/, "/");
    const legal = config.legal || {};
    const postal = contacto.direccionPostal;
    const SCHEMA_DAYS = {
      lunes: "Monday", martes: "Tuesday", miercoles: "Wednesday", jueves: "Thursday",
      viernes: "Friday", sabado: "Saturday", domingo: "Sunday"
    };

    const openingHours = [];
    Object.keys(SCHEMA_DAYS).forEach((key) => {
      ((config.horarioSemanal || {})[key] || []).forEach(([opens, closes]) => {
        openingHours.push({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[key], opens, closes });
      });
    });

    const ficha = config.mapa && config.mapa.ficha;
    const data = {
      "@context": "https://schema.org",
      "@type": "Physiotherapy",
      "@id": url + "#clinica",
      name: legal.nombreComercial || "Fisioterapia Costa del Sol",
      url,
      image: url + "img/og-imagen.jpg",
      logo: url + "img/logo_cuadrado.png",
      telephone: links.tel ? links.tel.slice(4) : undefined,      // "+34952446655"
      email: contacto.email,
      address: postal ? {
        "@type": "PostalAddress",
        streetAddress: postal.calle,
        addressLocality: postal.localidad,
        postalCode: postal.codigoPostal,
        addressRegion: postal.provincia,
        addressCountry: "ES"
      } : undefined,
      hasMap: ficha,
      sameAs: ficha ? [ficha] : undefined,
      openingHoursSpecification: openingHours.length ? openingHours : undefined
    };

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify(data);                 // los campos vacíos (undefined) no se incluyen
    document.head.appendChild(jsonLd);
  }

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
    // TESTING PRUEBA: martes 13-oct-2026, 10:00 (si quisiera poner las 13:35, pondría minutes: 13 * 60 + 35)
    // Sirve para probar los horarios generados, los estados abierto / cerrado y los efectos de temporada (halloween, navidad, etc)
    // return { y: 2026, m: 10, d: 31, minutes: 12 * 60 + 0 };   
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

    // Cada texto es [etiqueta, resto]: la etiqueta va en el color del estado
    // (verde / rojo / ámbar) y el resto en el color normal del texto.
    if (todayRanges.length && isFestivo(today)) {
      return {
        state: "holiday",
        long: ["Hoy es festivo", "Puede que estemos cerrados"],
        short: ["Festivo", "puede estar cerrado"]
      };
    }

    const current = todayRanges.find(([a, b]) => toMinutes(a) <= now.minutes && now.minutes < toMinutes(b));
    if (current) {
      return {
        state: "open",
        long: ["Abierto ahora", `Cierra a las ${formatTime(current[1])}`],
        short: ["Abierto ahora", ""]
      };
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
          long: ["Cerrado ahora", `Abre ${when} a las ${formatTime(next[0])}${note}`],
          short: ["Cerrado", `abre ${when} a las ${formatTime(next[0])}`]
        };
      }
    }
    return { state: "closed", long: ["Cerrado ahora", ""], short: ["Cerrado ahora", ""] };
  }

  function renderStatus() {
    try {
      const status = computeStatus();
      statusEls.forEach((el) => {
        el.dataset.state = status.state;
        const [label, rest] = el.dataset.openStatus === "short" ? status.short : status.long;
        const labelEl = document.createElement("span");
        labelEl.className = "open-status__label";
        labelEl.textContent = label;
        const parts = [labelEl];
        if (rest) {
          const restEl = document.createElement("span");
          restEl.className = "open-status__rest";
          restEl.textContent = ` · ${rest}`;
          parts.push(restEl);
        }
        el.querySelector(".open-status__text").replaceChildren(...parts);
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
     Temporadas (config.temporadas): efectos visuales por épocas
     - Se activa si mostrar === true y (forzar === true o hoy está
       entre "desde" y "hasta", formato "MM-DD", ambas incluidas).
     - Cada id tiene su efecto en EFECTOS_TEMPORADA.
     - No se muestran si el usuario prefiere "reducir movimiento".
     ----------------------------------------------------- */

  // Fecha usada para decidir las temporadas (hora de España).
  function fechaTemporadas() {
    // PRUEBA: descomenta la línea de abajo para simular otro día (mes y día).
    //return { m: 12, d: 25 };   // p. ej. 25 de diciembre
    const now = madridNow();
    return { m: now.m, d: now.d };
  }

  function temporadaActiva(t, hoy) {
    if (!t || t.mostrar !== true) return false;
    if (t.forzar === true) return true;
    if (!t.desde || !t.hasta) return false;
    const actual = `${String(hoy.m).padStart(2, "0")}-${String(hoy.d).padStart(2, "0")}`;
    return t.desde <= t.hasta
      ? actual >= t.desde && actual <= t.hasta                 // rango normal (p. ej. 03-01 → 03-31)
      : actual >= t.desde || actual <= t.hasta;                // cruza el año (p. ej. 12-01 → 01-06)
  }

  // Capa común a todos los efectos: un canvas sobre toda la página que no
  // bloquea los clics, se adapta al tamaño de la ventana y se pausa cuando
  // la pestaña no está visible (ahorra batería).
  //   onResize(width, height): ajustar la cantidad de elementos
  //   onFrame(ctx, width, height): mover y dibujar un fotograma
  // Capas de temporada creadas (para poder apagarlas y encenderlas al vuelo; ver más abajo)
  const capasTemporada = [];

  function crearCapaTemporada(onResize, onFrame) {
    const canvas = document.createElement("canvas");
    canvas.className = "season-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let frame = null;                                          // fotograma pendiente
    let pausada = false;                                       // apagada con el truco del emoji del pie

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize(width, height);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      onFrame(ctx, width, height);
      frame = requestAnimationFrame(draw);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = null;
      } else if (frame === null && !pausada) {
        frame = requestAnimationFrame(draw);
      }
    });
    window.addEventListener("resize", resize);

    resize();
    frame = requestAnimationFrame(draw);

    capasTemporada.push({
      pausar() {                                               // deja de dibujar y se oculta
        pausada = true;
        cancelAnimationFrame(frame);
        frame = null;
        canvas.style.display = "none";
      },
      reanudar() {
        pausada = false;
        canvas.style.display = "";
        if (frame === null && !document.hidden) frame = requestAnimationFrame(draw);
      }
    });
  }

  // Nieve: copos pequeños que caen con un ligero balanceo
  function efectoNieve() {
    const flakes = [];
    let w = 0;
    let h = 0;

    const newFlake = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -5,
      r: 1 + Math.random() * 2.5,                              // tamaño
      speed: 0.4 + Math.random() * 0.9,                        // caída
      phase: Math.random() * Math.PI * 2,                      // balanceo lateral
      sway: 0.2 + Math.random() * 0.5,
      alpha: 0.5 + Math.random() * 0.5
    });

    crearCapaTemporada(
      (width, height) => {
        w = width;
        h = height;
        const target = Math.min(120, Math.round(w / 12));      // menos copos en móvil
        while (flakes.length < target) flakes.push(newFlake(true));
        flakes.length = target;
      },
      (ctx) => {
        // Copos blancos en modo oscuro; azul grisáceo claro en modo claro (el blanco no se vería)
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        const rgb = dark ? "255, 255, 255" : "150, 185, 205";
        flakes.forEach((f, i) => {
          f.y += f.speed;
          f.phase += 0.01;
          f.x += Math.sin(f.phase) * f.sway;
          if (f.y > h + 5) flakes[i] = newFlake(false);
          if (f.x > w + 5) f.x = -5;
          if (f.x < -5) f.x = w + 5;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${f.alpha})`;
          ctx.fill();
        });
      }
    );
  }

  // Latido de corazón (doble golpe "pum-pum… pum-pum"): devuelve la escala para el tiempo t (segundos)
  function escalaLatido(t) {
    const period = 1.2;                                        // ~50 latidos por minuto, tranquilo
    const p = (t % period) / period;
    const golpe = (centro, ancho) => Math.exp(-(((p - centro) / ancho) ** 2));
    return 1 + 0.22 * (golpe(0.08, 0.045) + 0.6 * golpe(0.26, 0.045));
  }

  // Aparecer / desaparecer: devuelve la opacidad (0–1) para el tiempo t (segundos) en un ciclo de "periodo".
  // Ciclo: visible ("visible", por defecto 55 %) → se desvanece ("transicion", 10 %) → invisible (el resto)
  //        → reaparece ("transicion", 10 %)
  function opacidadDesvanecer(t, periodo, visible = 0.55, transicion = 0.1) {
    const p = (t % periodo) / periodo;
    const suave = (x) => x * x * (3 - 2 * x);                  // transición suave (sin saltos)
    if (p < visible) return 1;
    if (p < visible + transicion) return 1 - suave((p - visible) / transicion);
    if (p < 1 - transicion) return 0;
    return suave((p - (1 - transicion)) / transicion);
  }

  // Emojis flotantes: suben despacio desde abajo con balanceo y un leve giro.
  // Usa la lista "emojis" de la temporada en config.js (reutilizable: Halloween, San Valentín...).
  // opciones.latido: true → además laten como un corazón (cada uno a su ritmo).
  // opciones.desvanecer: true → por el camino desaparecen y reaparecen (cada uno a su ritmo).
  //   opciones.visible: parte del ciclo en que se ven (0–1, por defecto 0.55).
  //   opciones.transicion: parte del ciclo que dura desvanecerse (y lo mismo reaparecer) (por defecto 0.1).
  //   opciones.ciclo: [mín, máx] segundos de cada ciclo (por defecto [6, 10]).
  // opciones.cantidad: [mín, máx] emojis a la vez, según el ancho de pantalla (por defecto [3, 5]).
  // Además, "huyen" del ratón: si el cursor se acerca, se apartan y luego siguen su camino.
  function efectoEmojis(temporada, opciones = {}) {
    const lista = Array.isArray(temporada.emojis)
      ? temporada.emojis.filter((e) => typeof e === "string" && e.trim() !== "")   // ignora vacíos
      : [];
    const emojis = lista.length ? lista : ["✨"];
    const items = [];
    let w = 0;
    let h = 0;
    const [cantidadMin, cantidadMax] = opciones.cantidad || [3, 5];
    const [cicloMin, cicloMax] = opciones.ciclo || [6, 10];

    const newItem = (anywhere) => ({
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 40,
      size: 18 + Math.random() * 16,                           // 18–34 px
      speed: 0.25 + Math.random() * 0.45,                      // subida lenta
      phase: Math.random() * Math.PI * 2,
      sway: 0.3 + Math.random() * 0.5,
      alpha: 0.55 + Math.random() * 0.3,                       // semitransparentes
      beat: Math.random() * 1.2,                               // desfase del latido
      fadePeriod: cicloMin + Math.random() * (cicloMax - cicloMin),   // ciclo de aparecer/desaparecer
      fadeOffset: Math.random() * 30,                          // desfase (no desaparecen todos a la vez)
      vx: 0,                                                   // empujón al huir del ratón (se va frenando)
      vy: 0
    });

    // Posición del ratón (solo ratón: en el móvil el dedo sirve para desplazarse por la página)
    const RADIO_HUIDA = 120;                                   // distancia (px) a la que empiezan a apartarse
    let raton = null;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") raton = { x: e.clientX, y: e.clientY };
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { raton = null; });

    crearCapaTemporada(
      (width, height) => {
        w = width;
        h = height;
        const target = Math.max(cantidadMin, Math.min(cantidadMax, Math.round(w / 200)));   // pocos, según el ancho
        while (items.length < target) items.push(newItem(true));
        items.length = target;
      },
      (ctx) => {
        const now = performance.now() / 1000;
        items.forEach((it, i) => {
          // Huir del ratón: empujón en dirección contraria, más fuerte cuanto más cerca
          if (raton) {
            const dx = it.x - raton.x;
            const dy = it.y - raton.y;
            const d = Math.hypot(dx, dy);
            if (d < RADIO_HUIDA && d > 0.1) {
              const fuerza = (1 - d / RADIO_HUIDA) * 1.2;
              it.vx += (dx / d) * fuerza;
              it.vy += (dy / d) * fuerza;
            }
          }
          it.x += it.vx;
          it.y += it.vy;
          it.vx *= 0.92;                                       // el empujón se va frenando
          it.vy *= 0.92;

          it.y -= it.speed;
          it.phase += 0.012;
          it.x += Math.sin(it.phase) * it.sway;
          if (it.y < -40 || it.y > h + 80) items[i] = newItem(false);   // fuera de pantalla: uno nuevo abajo
          if (it.x > w + 40) it.x = -40;
          if (it.x < -40) it.x = w + 40;
          const fade = opciones.desvanecer
            ? opacidadDesvanecer(now + it.fadeOffset, it.fadePeriod, opciones.visible, opciones.transicion)
            : 1;
          if (fade <= 0) return;                               // invisible: no se dibuja (sigue moviéndose)
          ctx.save();
          ctx.globalAlpha = it.alpha * fade;
          ctx.translate(it.x, it.y);
          ctx.rotate(Math.sin(it.phase) * 0.25);               // leve giro de lado a lado
          if (opciones.latido) {
            const s = escalaLatido(now + it.beat);
            ctx.scale(s, s);
          }
          ctx.font = `${it.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(it.emoji, 0, 0);
          ctx.restore();
        });
      }
    );
  }

  // id de la temporada en config.js → efecto que se muestra
  const EFECTOS_TEMPORADA = {
    navidad: efectoNieve,
    // Halloween, esporádico: cada emoji se ve 2-3 s y no vuelve hasta pasados 15-19 s
    halloween: (t) => efectoEmojis(t, { desvanecer: true, cantidad: [2, 3], visible: 0.12, transicion: 0.04, ciclo: [19, 24] }),
    sanvalentin: (t) => efectoEmojis(t, { latido: true })
  };

  // Primer emoji (no vacío) de cada temporada cuyo efecto se está mostrando → para el pie
  const emojisTemporadasActivas = [];

  try {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const temporadas = Array.isArray(config.temporadas) ? config.temporadas : [];
    if (!reduceMotion && temporadas.length) {
      const hoy = fechaTemporadas();
      temporadas.forEach((t) => {
        const efecto = EFECTOS_TEMPORADA[t && t.id];
        if (efecto && temporadaActiva(t, hoy)) {
          efecto(t);
          const primero = (Array.isArray(t.emojis) ? t.emojis : [])
            .find((e) => typeof e === "string" && e.trim() !== "");
          if (primero) emojisTemporadasActivas.push(primero);
        }
      });
    }
  } catch (err) {
    /* un efecto decorativo nunca debe romper la web */
  }

  /* -----------------------------------------------------
     Versión en el pie (config.web.version) + emoji de las temporadas activas
     Ej.: "· v1.0.0 🎃"
     ----------------------------------------------------- */
  const versionEl = document.getElementById("site-version");
  if (versionEl) {
    if (web.version || emojisTemporadasActivas.length) {
      versionEl.textContent = "·" + (web.version ? ` v${web.version}` : "");
      versionEl.hidden = false;
    }

    // 🤫 Truco: 10 toques seguidos sobre el emoji de la temporada apagan/encienden su efecto.
    // No se guarda: al recargar, vuelve a lo que diga config.js.
    if (emojisTemporadasActivas.length) {
      const emojiPie = document.createElement("span");
      emojiPie.className = "site-footer__season";
      emojiPie.textContent = " " + emojisTemporadasActivas.join(" ");
      versionEl.appendChild(emojiPie);

      let temporadaApagada = false;
      alPulsarVecesSeguidas(emojiPie, 10, () => {
        temporadaApagada = !temporadaApagada;
        capasTemporada.forEach((capa) => (temporadaApagada ? capa.pausar() : capa.reanudar()));
        notificar(temporadaApagada ? "Efectos de temporada desactivados" : "Efectos de temporada activados",
          { icono: emojisTemporadasActivas[0] });
      });
    }
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
    const setMenu = (isOpen) => {
      navLinks.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    };

    navToggle.addEventListener("click", () => {
      setMenu(!navLinks.classList.contains("is-open"));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    // Escape cierra el menú y devuelve el foco al botón ☰
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !navLinks.classList.contains("is-open")) return;
      setMenu(false);
      navToggle.focus();
    });
  }

  /* -----------------------------------------------------
     Modal de aviso legal
     ----------------------------------------------------- */
  const legalModal = document.getElementById("legal-modal");
  const openLegal = document.getElementById("open-legal");

  let modalOpener = null;                                    // botón que abrió el modal (para devolverle el foco)

  // sectionId (opcional): apartado al que desplazarse al abrir, p. ej. "politica-cookies"
  function toggleModal(show, sectionId) {
    if (!legalModal) return;
    const wasOpen = !legalModal.hidden;
    legalModal.hidden = !show;
    document.body.style.overflow = show ? "hidden" : "";
    if (!show) {
      // Al cerrar, el foco vuelve al botón que lo abrió
      if (wasOpen && modalOpener && document.contains(modalOpener)) modalOpener.focus();
      modalOpener = null;
      return;
    }
    if (!wasOpen) modalOpener = document.activeElement;
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
    // Con el modal abierto, Tab / Mayús+Tab dan la vuelta dentro de él
    legalModal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(legalModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!legalModal.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
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
    const cambioDeOpinion = consent !== null;                  // la primera vez no hace falta: el banner se va y ya está
    consent = choice;
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    } catch (err) {
      /* noop */
    }
    hideCookieBanner();
    renderMap();
    if (cambioDeOpinion) {
      notificar(choice === "accepted" ? "Preferencias guardadas: cookies aceptadas" : "Preferencias guardadas: cookies rechazadas",
        { icono: "🍪" });
    }
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
     WhatsApp (config.whatsapp)
     - flotante: botón fijo en la esquina (sube si el aviso de cookies está visible)
     - enContacto: botón en Contacto, junto a Llamar / Cómo llegar / Email
     Sin número, no se crea ninguno.
     ----------------------------------------------------- */
  const whatsapp = config.whatsapp || {};
  const waNumero = String(whatsapp.numero || "").replace(/\D/g, "");
  const waUrl = waNumero
    ? "https://wa.me/" + (waNumero.startsWith("34") ? waNumero : "34" + waNumero) +
      (whatsapp.mensaje ? "?text=" + encodeURIComponent(whatsapp.mensaje) : "")
    : "";

  // Aviso legal: los textos sobre WhatsApp ([data-solo-whatsapp]) solo se muestran si está activado
  if (waUrl && (whatsapp.flotante || whatsapp.enContacto)) {
    document.querySelectorAll("[data-solo-whatsapp]").forEach((el) => { el.hidden = false; });
  }

  // Botón en la sección Contacto (segundo, justo después de Llamar)
  const contactActions = document.querySelector("[data-contact-actions]");
  if (waUrl && whatsapp.enContacto && contactActions) {
    const waAccion = document.createElement("a");
    waAccion.className = "contact-action";
    waAccion.href = waUrl;
    waAccion.target = "_blank";
    waAccion.rel = "noopener";
    waAccion.innerHTML =
      `<span class="contact-action__icon">${window.svgIcono ? window.svgIcono("whatsapp", "phone-ring") : ""}</span>` +
      `<span><span class="contact-action__title">WhatsApp</span><span class="contact-action__sub">Escríbenos un mensaje</span></span>`;
    const llamar = contactActions.firstElementChild;
    contactActions.insertBefore(waAccion, llamar ? llamar.nextElementSibling : null);
    contactActions.classList.add("has-four");               // 4 botones: 2×2 en tablet, 4 en fila en ordenador
  }

  // Línea en la ficha de contacto (justo debajo del teléfono)
  const fichaTelefono = document.querySelector('#ficha-contacto .contact-card__item[data-config-href="tel"]');
  if (waUrl && whatsapp.enContacto && fichaTelefono) {
    // 9 cifras → mismo formato que el teléfono ("666 11 22 33"); si no, tal cual está en config.js
    const waVisible = /^\d{9}$/.test(waNumero)
      ? waNumero.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4")
      : String(whatsapp.numero);
    const waFicha = document.createElement("a");
    waFicha.className = "contact-card__item";
    waFicha.href = waUrl;
    waFicha.target = "_blank";
    waFicha.rel = "noopener";
    waFicha.innerHTML =
      `<span class="contact-card__icon">${window.svgIcono ? window.svgIcono("whatsapp", "phone-ring") : ""}</span>` +
      `<span class="contact-card__text"><span class="contact-card__label">WhatsApp</span>` +
      `<span class="contact-card__value">${waVisible.replace(/[<>&]/g, "")}</span></span>`;
    fichaTelefono.after(waFicha);
  }

  // Botón flotante
  if (waUrl && whatsapp.flotante) {
    const waBoton = document.createElement("a");
    waBoton.className = "wa-float";
    waBoton.href = waUrl;
    waBoton.target = "_blank";
    waBoton.rel = "noopener";
    waBoton.setAttribute("aria-label", "Escríbenos por WhatsApp (se abre en otra pestaña)");
    waBoton.innerHTML =
      (window.svgIcono ? window.svgIcono("whatsapp", "wa-float__icon") : "") +
      (whatsapp.etiqueta ? `<span class="wa-float__label" aria-hidden="true">${String(whatsapp.etiqueta).replace(/[<>&]/g, "")}</span>` : "");
    document.body.appendChild(waBoton);

    // Al llegar al pie de página, el botón se oculta (para no tapar sus enlaces) y reaparece al subir
    const pie = document.querySelector(".site-footer");
    if (pie && "IntersectionObserver" in window) {
      new IntersectionObserver(([entrada]) => {
        waBoton.classList.toggle("is-hidden", entrada.isIntersecting);
      }).observe(pie);
    }

    // Aviso de cookies visible → el botón sube su altura (variable --wa-lift en styles.css)
    if (cookieBanner && "ResizeObserver" in window) {
      new ResizeObserver(() => {
        const alto = cookieBanner.hidden ? 0 : cookieBanner.offsetHeight;
        document.documentElement.style.setProperty("--wa-lift", alto ? alto + 16 + "px" : "0px");
      }).observe(cookieBanner);
    }
  }

  /* -----------------------------------------------------
     Convenios (config.convenios)
     - Cinta de logos en movimiento (decorativa)
     - Pestañas por tipo de entidad (accesibles con teclado: flechas, Inicio, Fin)
     - Tarjetas destacadas (Patronato, Clínica Arroyo)
     Cada entidad muestra su logo si lo tiene; si no, su nombre escrito.
     ----------------------------------------------------- */
  const convenios = config.convenios;
  const icono = (nombre, clase) => (window.svgIcono ? window.svgIcono(nombre, clase) : "");
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Logo (o nombre escrito si aún no hay logo)
  const convLogo = (e) =>
    e.logo
      ? `<img class="conv-logo__img" src="${escapeHtml(e.logo)}" alt="${escapeHtml(e.nombre)}" loading="lazy">`
      : `<span class="conv-logo__name">${escapeHtml(e.nombre)}</span>`;
  // Logos que en modo oscuro van a color sobre placa clara (config: placa: true)
  const placa = (e) => (e.placa && e.logo ? " conv-logo--placa" : "");

  /* Cinta de logos: se desplaza sola y se puede arrastrar (dedo: scroll nativo; ratón: arrastre).
     Es infinita: el contenido va dos veces y, al pasar de una copia, se salta a la otra sin que se note.
     Se para al pasar el ratón, al tocarla o arrastrarla, y se reanuda 1,5 s después de soltar.
     Con el ratón, al soltar el arrastre sigue deslizándose y frena poco a poco (inercia). */
  function iniciarCinta(cinta) {
    const track = cinta.querySelector(".conv-marquee__track");
    const VELOCIDAD = 30;                                   // píxeles por segundo (movimiento automático)
    const FRENADO = 0.95;                                   // inercia del ratón: cuanto más cerca de 1, más se desliza
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pos = 0;                                            // posición con decimales (scrollLeft redondea)
    let pausada = false;
    let reanudar = null;
    let ultimo = 0;
    let ratonDentro = false;
    let inercia = 0;                                        // velocidad al soltar el arrastre (px por ms)

    const mitad = () => (track.scrollWidth + parseFloat(getComputedStyle(track).columnGap || 0)) / 2;
    const ajustar = () => {                                 // bucle infinito en ambos sentidos
      const m = mitad();
      if (m <= 0) return;
      if (pos >= m) pos -= m;
      if (pos < 1) pos += m;                                // al llegar al principio, salta a la segunda copia
      cinta.scrollLeft = pos;
    };
    const pausar = () => { pausada = true; clearTimeout(reanudar); };
    const soltar = () => {                                  // reanuda a los 1,5 s (si el ratón no sigue encima)
      clearTimeout(reanudar);
      if (ratonDentro) return;
      reanudar = setTimeout(() => { pausada = false; }, 1500);
    };

    const paso = (t) => {
      const dt = ultimo ? Math.min(t - ultimo, 50) : 0;     // ms desde el fotograma anterior
      if (inercia) {
        // Tras soltar el arrastre: sigue deslizándose y frena poco a poco
        pos += inercia * dt;
        inercia *= Math.pow(FRENADO, dt / 16);
        if (Math.abs(inercia) < 0.02) {
          inercia = 0;
          soltar();
        }
        ajustar();
      } else if (dt && !pausada && !sinMovimiento) {
        pos += (VELOCIDAD * dt) / 1000;
        ajustar();
      }
      ultimo = t;
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);

    // Ratón por encima: pausa. (Solo ratón: en el móvil, tocar no cuenta como "estar encima")
    cinta.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      ratonDentro = true;
      pausar();
    });
    cinta.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      ratonDentro = false;
      if (!cinta.classList.contains("is-dragging") && !inercia) soltar();
    });

    // Dedo: el navegador hace el scroll (con su propia inercia); solo seguimos la posición
    cinta.addEventListener("touchstart", () => { inercia = 0; pausar(); }, { passive: true });
    cinta.addEventListener("touchend", soltar, { passive: true });
    cinta.addEventListener("scroll", () => {
      if (!pausada || inercia || cinta.classList.contains("is-dragging")) return;   // lo hemos movido nosotros
      pos = cinta.scrollLeft;
      const m = mitad();
      if (pos >= m || pos < 1) ajustar();                   // bucle infinito también al arrastrar
    }, { passive: true });

    // Ratón: arrastrar con clic (al soltar, sigue con inercia)
    let antX = 0;
    let antT = 0;
    let vel = 0;
    cinta.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pausar();
      inercia = 0;
      vel = 0;
      antX = e.clientX;
      antT = e.timeStamp;
      cinta.classList.add("is-dragging");
      try { cinta.setPointerCapture(e.pointerId); } catch (err) { /* sin captura, sigue funcionando */ }
    });
    cinta.addEventListener("pointermove", (e) => {
      if (!cinta.classList.contains("is-dragging")) return;
      const dx = e.clientX - antX;
      const dtMov = Math.max(e.timeStamp - antT, 1);
      pos -= dx;
      vel = 0.8 * (-dx / dtMov) + 0.2 * vel;                // velocidad suavizada (px por ms)
      antX = e.clientX;
      antT = e.timeStamp;
      ajustar();
    });
    const finArrastre = (e) => {
      if (!cinta.classList.contains("is-dragging")) return;
      cinta.classList.remove("is-dragging");
      // Si se soltó en movimiento (último movimiento hace menos de 100 ms), sigue con inercia
      inercia = e.timeStamp - antT < 100 ? Math.max(-4, Math.min(4, vel)) : 0;
      if (!inercia) soltar();
    };
    cinta.addEventListener("pointerup", finArrastre);
    cinta.addEventListener("pointercancel", finArrastre);
  }


  if (convenios) {
    const categorias = convenios.categorias || [];
    const destacados = convenios.destacados || [];

    // Cinta: todas las entidades, dos veces seguidas para que el bucle no tenga cortes
    const cinta = document.querySelector("[data-conv-marquee]");
    const todas = [...destacados, ...categorias.flatMap((c) => c.entidades || [])];
    if (cinta && todas.length) {
      const fila = todas.map((e) => `<span class="conv-logo${placa(e)}">${convLogo(e)}</span>`).join("");
      cinta.innerHTML = `<div class="conv-marquee__track">${fila}${fila}</div>`;
      iniciarCinta(cinta);
    }

    // Pestañas
    const tabsBox = document.querySelector("[data-conv-tabs]");
    if (tabsBox && categorias.length) {
      const tabs = categorias.map((c, i) => `
        <button type="button" class="conv-tab" role="tab" id="conv-tab-${i}" aria-controls="conv-panel-${i}"
                aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          ${icono(c.icono, "conv-tab__icon")}
          <span class="conv-tab__title">${escapeHtml(c.titulo)}</span>
        </button>`).join("");

      const panels = categorias.map((c, i) => `
        <div class="conv-panel" role="tabpanel" id="conv-panel-${i}" aria-labelledby="conv-tab-${i}" tabindex="0"${i === 0 ? "" : " hidden"}>
          ${c.nota ? `<p class="conv-panel__note">${c.nota}</p>` : ""}
          <ul class="conv-grid">
            ${(c.entidades || []).map((e) => `<li class="conv-logo conv-logo--tile${placa(e)}" title="${escapeHtml(e.nombre)}">${convLogo(e)}</li>`).join("")}
          </ul>
          ${c.enlace ? `<a class="conv-panel__link" href="${escapeHtml(c.enlace)}">Cómo funciona la atención por accidente de tráfico <span aria-hidden="true">→</span></a>` : ""}
        </div>`).join("");

      tabsBox.innerHTML = `<div class="conv-tablist" role="tablist" aria-label="Tipos de convenio">${tabs}</div>${panels}`;

      const tabEls = [...tabsBox.querySelectorAll(".conv-tab")];
      const select = (i, focus) => {
        tabEls.forEach((t, j) => {
          const on = j === i;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(`conv-panel-${j}`).hidden = !on;
        });
        if (focus) tabEls[i].focus();
      };
      tabEls.forEach((t, i) => {
        t.addEventListener("click", () => select(i, false));
        t.addEventListener("keydown", (e) => {
          const n = tabEls.length;
          const destino = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
          if (destino === undefined) return;
          e.preventDefault();
          select(destino, true);
        });
      });
    }

    // Destacados
    const destBox = document.querySelector("[data-conv-destacados]");
    if (destBox && destacados.length) {
      destBox.innerHTML = destacados.map((d) => `
        <article class="conv-feature">
          <div class="conv-feature__logo conv-logo${placa(d)}">${convLogo(d)}</div>
          <div class="conv-feature__body">
            <h3 class="conv-feature__name">${escapeHtml(d.nombre)}</h3>
            ${d.titulo ? `<p class="conv-feature__title">${escapeHtml(d.titulo)}</p>` : ""}
            ${(d.lista || []).length ? `<ul class="conv-feature__list">${d.lista.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
            ${d.nota ? `<p class="conv-feature__note">${d.nota}</p>` : ""}
          </div>
        </article>`).join("");
    }
  }

  /* -----------------------------------------------------
     Tratamientos: en móvil (< 768px) cada tarjeta se despliega
     al tocar su cabecera. En pantallas grandes se ven abiertas.
     ----------------------------------------------------- */
  const treatGrid = document.querySelector(".treat-grid");

  if (treatGrid) {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const treatHeads = treatGrid.querySelectorAll(".treat-card__head");

    const applyTreatMode = () => {
      const isMobile = mobileQuery.matches;
      treatGrid.classList.toggle("is-collapsible", isMobile);
      treatHeads.forEach((head) => {
        if (isMobile) {
          head.setAttribute("role", "button");
          head.tabIndex = 0;
          head.setAttribute("aria-expanded", String(head.parentElement.classList.contains("is-open")));
        } else {
          head.removeAttribute("role");
          head.removeAttribute("tabindex");
          head.removeAttribute("aria-expanded");
        }
      });
    };

    const toggleTreatCard = (head) => {
      if (!mobileQuery.matches) return;
      const isOpen = head.parentElement.classList.toggle("is-open");
      head.setAttribute("aria-expanded", String(isOpen));
    };

    treatHeads.forEach((head) => {
      head.addEventListener("click", () => toggleTreatCard(head));
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTreatCard(head);
        }
      });
    });

    applyTreatMode();
    mobileQuery.addEventListener("change", applyTreatMode);
    // La animación de despliegue se activa después de pintar (así no se ve plegarse al cargar)
    requestAnimationFrame(() => treatGrid.classList.add("is-ready"));
  }

  /* -----------------------------------------------------
     Reflejo en la tarjeta de UNESPA (Accidentes): .is-brillando mientras el panel está en pantalla.
     Al aparecer, el reflejo cruza la tarjeta; después se repite cada 4 s (ver styles.css).
     ----------------------------------------------------- */
  const panelUnespa = document.querySelector(".traffic-unespa");
  if (panelUnespa && "IntersectionObserver" in window) {
    new IntersectionObserver(([entrada]) => {
      panelUnespa.classList.toggle("is-brillando", entrada.isIntersecting);
    }, { threshold: 0.6 }).observe(panelUnespa);
  }

  /* -----------------------------------------------------
     Trama de puntos en la tarjeta del 0 € (Accidentes): solo con ratón,
     se desplaza hasta 10 px al contrario que el cursor (ver styles.css).
     En móvil y con "reducir movimiento" se queda quieta.
     ----------------------------------------------------- */
  const panelGratis = document.querySelector(".traffic-free");
  if (panelGratis
      && window.matchMedia("(hover: hover) and (pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const DESPLAZAMIENTO = 10;
    panelGratis.addEventListener("pointermove", (e) => {
      const r = panelGratis.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;     // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      panelGratis.style.setProperty("--trama-x", `${(-x * 2 * DESPLAZAMIENTO).toFixed(1)}px`);
      panelGratis.style.setProperty("--trama-y", `${(-y * 2 * DESPLAZAMIENTO).toFixed(1)}px`);
    });
    panelGratis.addEventListener("pointerleave", () => {
      panelGratis.style.removeProperty("--trama-x");
      panelGratis.style.removeProperty("--trama-y");
    });
  }

  /* -----------------------------------------------------
     🤓 Truco: colores por categoría en las tarjetas de Tratamientos
     - Ordenador: código Konami (↑ ↑ ↓ ↓ ← → ← → B A)
     - Móvil: tocar 10 veces seguidas el título "Tratamientos" (como el modo desarrollador de Android)
     Activa/desactiva .treat-colores en <html>. No se guarda: al recargar, vuelve al verde.
     ----------------------------------------------------- */
  const toggleTreatColors = () => {
    const activos = document.documentElement.classList.toggle("treat-colores");
    notificar(activos ? "¡Easter egg encontrado! Colores activados" : "Colores desactivados", { icono: "🎨" });
  };

  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let konamiPos = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    konamiPos = key === KONAMI[konamiPos] ? konamiPos + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konamiPos === KONAMI.length) {
      konamiPos = 0;
      toggleTreatColors();
    }
  });

  const treatTitle = document.querySelector("#tratamientos .section-title");
  if (treatTitle) alPulsarVecesSeguidas(treatTitle, 10, toggleTreatColors);

  /* -----------------------------------------------------
     Notificaciones emergentes ("toast"): una píldora arriba en el centro que se va sola.
       notificar("¡Easter egg encontrado!", { icono: "🥚" });
       notificar("Texto", { icono: "🎃", duracion: 2000 });   // duración en ms (por defecto 3000)
     - Si salen varias, se apilan. Al tocarla, se cierra antes.
     - Los lectores de pantalla la leen (aria-live), sin interrumpir.
     - También se puede usar desde la consola o desde otros scripts: window.notificar(...)
     ----------------------------------------------------- */
  let zonaNotificaciones = null;

  function notificar(texto, opciones = {}) {
    const { icono = "", duracion = 3000 } = opciones;
    if (!zonaNotificaciones) {
      zonaNotificaciones = document.createElement("div");
      zonaNotificaciones.className = "notif-zona";
      zonaNotificaciones.setAttribute("role", "status");
      zonaNotificaciones.setAttribute("aria-live", "polite");
      document.body.appendChild(zonaNotificaciones);
    }

    const toast = document.createElement("div");
    toast.className = "notif";
    if (icono) {
      const i = document.createElement("span");
      i.className = "notif__icono";
      i.setAttribute("aria-hidden", "true");
      i.textContent = icono;
      toast.appendChild(i);
    }
    const t = document.createElement("span");
    t.textContent = texto;
    toast.appendChild(t);
    zonaNotificaciones.appendChild(toast);

    let cerrada = false;
    const cerrar = () => {
      if (cerrada) return;
      cerrada = true;
      toast.classList.add("is-closing");
      setTimeout(() => toast.remove(), 300);                 // lo que dura la animación de salida
    };
    setTimeout(cerrar, duracion);
    toast.addEventListener("click", cerrar);
    return cerrar;                                           // por si se quiere cerrar antes desde el código
  }

  window.notificar = notificar;

  /* -----------------------------------------------------
     Utilidad para los trucos: ejecuta "accion" al pulsar "el" N veces seguidas
     (con menos de 1,5 s entre un toque y el siguiente; si te paras, vuelve a cero).
     Lo usan el truco de colores de Tratamientos y el del emoji de temporada del pie.
     ----------------------------------------------------- */
  function alPulsarVecesSeguidas(el, veces, accion) {
    let toques = 0;
    let temporizador = null;
    el.addEventListener("click", () => {
      toques += 1;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => { toques = 0; }, 1500);
      if (toques === veces) {
        toques = 0;
        accion();
      }
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
