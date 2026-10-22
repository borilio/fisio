/* =====================================================
   ICONOS
   Biblioteca de iconos SVG de la web, para no repetir su código en el HTML.

   Uso en el HTML:
     <span data-icon="telefono" class="phone-ring"></span>
   Al cargar la página, cada [data-icon] se sustituye por su <svg> completo,
   que conserva las clases del <span> (las animaciones de styles.css siguen funcionando).

   - Todos usan viewBox 0 0 24 24, sin relleno y el color del texto (currentColor),
     así que cambian solos con el modo oscuro y los colores de cada sitio.
   - "extra": atributos adicionales del <svg> (p. ej. puntas redondeadas).
   - "attrs": en lugar de "extra", TODOS los atributos del <svg>, para los iconos que no siguen
     el estilo común (p. ej. la luna rellena o la ✓ de trazo grueso).
   - Las clases DENTRO del dibujo (p. ej. mail-send__flap) son piezas que se animan por separado.
   - Para añadir un icono: copia el contenido de su <svg> (lo de dentro) en una entrada nueva.
   - Desde otro script: window.svgIcono("nombre", "clase") devuelve el <svg> como texto
     (lo usa script.js para los iconos de Convenios, que se generan desde config.js).
   ===================================================== */
(() => {
  "use strict";

  const ICONOS = {
    // Teléfono (botón Llamar, ficha de contacto)
    telefono: {
      extra: '',
      svg: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.2Z"/>'
    },

    // Flecha de navegación (Cómo llegar)
    brujula: {
      extra: '',
      svg: '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>'
    },

    // Sobre con solapa y líneas de velocidad (animación mail-send)
    sobre: {
      extra: '',
      svg: '<g class="mail-send__lines" stroke-width="1.6" stroke-linecap="round"><path d="M-7 8.5h5.5M-10 12h8.5M-6 15.5h4.5"/></g><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path class="mail-send__flap" d="m3.5 7.5 7.4 5.2a1.9 1.9 0 0 0 2.2 0l7.4-5.2" stroke-linecap="round" stroke-linejoin="round"/>'
    },

    // Marcador de mapa (dirección)
    marcador: {
      extra: '',
      svg: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
    },

    // Reloj con agujas separadas (animación clock-spin)
    reloj: {
      extra: 'stroke-linecap="round"',
      svg: '<circle cx="12" cy="12" r="9"/><path class="clock-spin__minute" d="M12 7v5"/><path class="clock-spin__hour" d="M12 12l3 2"/>'
    },

    // Sol (interruptor de tema)
    sol: {
      attrs: 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"',
      svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
    },

    // Luna rellena (interruptor de tema)
    luna: {
      attrs: 'viewBox="0 0 24 24" fill="currentColor" stroke="none"',
      svg: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>'
    },

    // Menú hamburguesa (móvil)
    menu: {
      extra: '',
      svg: '<path d="M4 6h16M4 12h16M4 18h16"/>'
    },

    // Triángulo de advertencia (aviso urgente)
    'aviso-urgente': {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'
    },

    // Círculo de información (aviso informativo)
    'aviso-info': {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.5h.01"/>'
    },

    // Marca ✓ gruesa (lista de la portada)
    check: {
      attrs: 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"',
      svg: '<path d="M20 6 9 17l-5-5"/>'
    },

    // Lámpara de infrarrojos (bombilla y rayos animables)
    lampara: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M12 1.5V4"/><path d="M4 12a8 8 0 0 1 16 0Z"/><path class="equip-ico__bulb" d="M9.5 12a2.5 2.5 0 0 0 5 0" fill="currentColor" fill-opacity=".35"/><path class="equip-ico__ray" d="M7 17l-1.2 2.8"/><path class="equip-ico__ray" d="M12 17.5v3"/><path class="equip-ico__ray" d="M17 17l1.2 2.8"/>'
    },

    // Copo de nieve simétrico (crioterapia)
    copo: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M12 2L12 22M3.34 7L20.66 17M3.34 17L20.66 7"/><path d="M9.88 3.88L12 6L14.12 3.88M3.91 9.78L6.8 9L6.03 6.1M6.03 17.9L6.8 15L3.91 14.22M14.12 20.12L12 18L9.88 20.12M20.09 14.22L17.2 15L17.97 17.9M17.97 6.1L17.2 9L20.09 9.78"/>'
    },

    // Ondas desde un punto (microondas)
    microondas: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><path d="M9 8.5a5 5 0 0 1 0 7"/><path d="M13 5.5a9.5 9.5 0 0 1 0 13"/><path d="M17 2.5a14 14 0 0 1 0 19"/>'
    },

    // Ondas a ambos lados (ultrasonidos)
    ultrasonidos: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="12" cy="12" r="2.5"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9"/><path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/>'
    },

    // Aparato láser con rayo y destello animables
    laser: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<rect x="1.5" y="9.5" width="6.5" height="5" rx="1.2"/><path class="equip-ico__beam" d="M8 12h7.5"/><path class="equip-ico__burst" d="M18.5 7.3v1.9M18.5 14.8v1.9M23 12h-1.9M21.7 8.8l-1.3 1.3M21.7 15.2l-1.3-1.3"/>'
    },

    // Imán con líneas de campo animables (magnetoterapia)
    iman: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M5 10.5h4v4a3 3 0 0 0 6 0v-4h4v4a7 7 0 0 1-14 0Z"/><path d="M5 13.5h4M15 13.5h4"/><path class="equip-ico__field" d="M7 7.5a5 3 0 0 1 10 0" stroke-width="1.6" stroke-dasharray="1.8 2"/><path class="equip-ico__field" d="M4 5a8 4 0 0 1 16 0" stroke-width="1.6" stroke-dasharray="1.8 2"/>'
    },

    // Rayo (corrientes eléctricas)
    rayo: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z"/>'
    },

    // Documento con ✓ (sin papeleos)
    documento: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z"/><path d="M14 2.5V8h5.5"/><path d="m9 14.5 2 2 4-4"/>'
    },

    // Fonendoscopio (médico especialista)
    fonendo: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M5 3v5a4 4 0 0 0 8 0V3"/><path d="M4 3h2M12 3h2"/><path d="M9 12v2.5a5.5 5.5 0 0 0 11 0V13"/><circle cx="20" cy="11" r="2"/>'
    },

    // Mano (fisioterapia manual)
    mano: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>'
    },

    // Coche (conductores)
    coche: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M5 11.5 7 6.5h10l2 5"/><path d="M3.5 11.5h17v5h-17Z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>'
    },

    // Dos personas (acompañantes)
    personas: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9" r="2.5"/><path d="M15.5 14.1A5 5 0 0 1 21 19"/>'
    },

    // Moto (motoristas)
    moto: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="5" cy="16.5" r="3"/><circle cx="19" cy="16.5" r="3"/><path d="M8 16.5h6l2.5-4.5H9.5L8 10H4.5"/><path d="M19 16.5 15.5 7.5H18"/><path d="M12 12v4.5"/>'
    },

    // Bicicleta (ciclistas)
    bici: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 10h7l2.5 6.5"/><path d="m9 10 3 6.5 4-6.5"/><path d="M15 6.5h2l-1 3.5"/><path d="M7.5 7.5h3"/>'
    },

    // Autobús (transporte público)
    autobus: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<rect x="4.5" y="3" width="15" height="15" rx="2.5"/><path d="M4.5 10.5h15"/><path d="M7.5 18v2.5M16.5 18v2.5"/><circle cx="8.5" cy="14.5" r=".8" fill="currentColor"/><circle cx="15.5" cy="14.5" r=".8" fill="currentColor"/>'
    },

    // Peatón (peatones)
    peaton: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="13" cy="4" r="2"/><path d="m9.5 21 2.5-6.5 3 3V21"/><path d="M12 14.5 12.5 8.5 8 11v3"/><path d="m12.5 8.5 2.5 3.5 3 1"/>'
    },

    // Hueso (tratamientos: traumatología y ortopedia)
    hueso: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path transform="rotate(-45 12 12)" d="M7.5 10.75H16.5A2.5 2.5 0 1 1 19.25 12A2.5 2.5 0 1 1 16.5 13.25H7.5A2.5 2.5 0 1 1 4.75 12A2.5 2.5 0 1 1 7.5 10.75Z"/>'
    },

    // Pesa (tratamientos: deportivas)
    pesa: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'
    },

    // Maletín (tratamientos: laborales)
    maletin: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M3 12.5h18"/><path d="M12 11.5v2"/>'
    },

    // Cerebro (tratamientos: patologías neurológicas)
    cerebro: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M12 5a3 3 0 0 0-5.6-1.4A3 3 0 0 0 4 8.5a3 3 0 0 0 .5 5.4A3.5 3.5 0 0 0 9 19.5a3 3 0 0 0 3-1.5Z"/><path d="M12 5a3 3 0 0 1 5.6-1.4A3 3 0 0 1 20 8.5a3 3 0 0 1-.5 5.4A3.5 3.5 0 0 1 15 19.5a3 3 0 0 1-3-1.5Z"/><path d="M12 5v13"/><path d="M8 9.5a2 2 0 0 1 2 2M16 9.5a2 2 0 0 0-2 2"/>'
    },

    // Círculo con + (tratamientos: otros)
    mas: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'
    },

    // Escudo con cruz (convenios: compañías sanitarias)
    'escudo-salud': {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.4 7.5 10 4.3-1.6 7.5-5.4 7.5-10v-6Z"/><path d="M12 8.5v6M9 11.5h6"/>'
    },

    // Trofeo (convenios: federaciones deportivas)
    trofeo: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<path d="M7 3.5h10v5.5a5 5 0 0 1-10 0Z"/><path d="M7 5.5H4.5a3 3 0 0 0 3 4.5M17 5.5h2.5a3 3 0 0 1-3 4.5"/><path d="M12 14v4"/><path d="M8 21h8M9.5 18h5"/>'
    },

    // Círculo con interrogación (convenios: aviso "¿No encuentras tu compañía?")
    pregunta: {
      extra: 'stroke-linecap="round" stroke-linejoin="round"',
      svg: '<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.6-2.8 2.6"/><path d="M12 16.8h.01"/>'
    },

    // Logotipo de WhatsApp, relleno (botón flotante de WhatsApp)
    whatsapp: {
      attrs: 'viewBox="0 0 24 24" fill="currentColor"',
      svg: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>'
    }
  };

  const BASE = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"';

  // Devuelve el <svg> de un icono como texto ("" si no existe)
  function svgIcono(nombre, clase) {
    const icono = ICONOS[nombre];
    if (!icono) {
      console.warn("Icono desconocido:", nombre);
      return "";
    }
    const atributos = icono.attrs || BASE + (icono.extra ? " " + icono.extra : "");
    return `<svg ${atributos}${clase ? ` class="${clase}"` : ""} aria-hidden="true">${icono.svg}</svg>`;
  }

  // Para el contenido que se genera después con JavaScript (p. ej. Convenios en script.js)
  window.svgIcono = svgIcono;

  document.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = svgIcono(el.dataset.icon, el.getAttribute("class"));
    if (svg) el.outerHTML = svg;
  });
})();
