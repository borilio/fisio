/* =====================================================
   DATOS DE LA CLÍNICA
   Edita aquí y se actualiza toda la web.
   - Respeta las comillas "..." y las comas al final de cada línea.
   - Del aviso legal, aquí solo están los datos del titular (bloque "legal");
     el texto en sí se edita en index.html.
   ===================================================== */
window.SITE_CONFIG = {

  // Versión de la web: se muestra en el pie, junto al copyright
  version: "1.0.0",

  // AVISO IMPORTANTE (eventual): aparece al principio de la portada y se puede cerrar.
  // - mostrar: true para mostrarlo, false para ignorarlo por completo.
  // - desde / hasta: se muestra entre esas dos fechas, ambas incluidas ("AAAA-MM-DD").
  //     desde "" = desde ya;  hasta "" = sin fecha de fin (siempre que mostrar sea true).
  // - tipo: "urgente" (rojo, con icono de advertencia) o "info" (azul, nota informativa).
  // - texto: admite <strong>...</strong> para negrita y <br> para salto de línea.
  aviso: {
    mostrar: false,
    tipo: "info",
    titulo: "¡¡ Estrenamos WEB !!",
    texto: "Estamos dando un masaje a nuestra web: algunas secciones aún están en rehabilitación 💪.",
    desde: "",
    hasta: ""
  },

  // TEMPORADAS: efectos visuales en toda la web en ciertas épocas del año.
  // - id: qué efecto se usa. Disponibles:
  //     "navidad"   → nieve cayendo
  //     "halloween"   → emojis flotando hacia arriba que aparecen y desaparecen
  //     "sanvalentin" → emojis flotando hacia arriba que además laten como un corazón
  // - emojis: lista de emojis. En los efectos de emojis se mezclan al azar.
  //     El PRIMERO de la lista se muestra en el pie, junto a la versión, mientras la temporada esté activa.
  // - mostrar: interruptor general. false = la temporada se ignora por completo.
  // - desde / hasta: fechas SIN año ("MM-DD"), se repiten cada año, ambas incluidas.
  //     Pueden cruzar el cambio de año (p. ej. "12-01" → "01-06").
  // - forzar: true = se muestra siempre, sin mirar las fechas (útil para probar).
  //     Necesita mostrar: true.
  // (Si el usuario tiene activado "reducir movimiento" en su sistema, no se muestran efectos.)
  temporadas: [
    {
      id: "navidad",
      mostrar: true,
      forzar: false,
      desde: "12-01",
      hasta: "01-06",
      emojis: ["🎄", "❄️", "⛄",  "🎁"]                         // la nieve no los usa; solo el primero para el pie
    },
    {
      id: "halloween",
      mostrar: false,
      forzar: false,
      desde: "10-20",
      hasta: "10-31",
      emojis: ["🎃", "🎃", "👻", "👻", "🦇", "", "🕷️", "🍬", "🍭"]
    },
    {
      id: "sanvalentin",
      mostrar: true,
      forzar: false,
      desde: "02-10",
      hasta: "02-14",
      emojis: ["❤️", "❤️", "💕", "💖", "💗", "💘","🏹","💚","🧡"]
    }
  ],

  // Datos de contacto
  // Teléfono tal y como se muestra. El enlace para llamar se genera solo
  // (si no empieza por +, se añade el prefijo +34).
  telefono: "952 44 66 55",

  // Email y asunto que aparece al pulsar "Enviar email".
  email: "info@fisioterapiacostadelsol.com",
  asuntoEmail: "Consulta Web",

  direccion: "Avd. Salvador Vicente, Conjunto Parquemiel, 6, Arroyo de la Miel, Benalmádena — 29631 Málaga",

  // Para Google (no se ve en la web): dirección de la web y dirección postal desglosada.
  // Se usa para la "ficha" invisible que lee Google (búsquedas locales).
  // Conviene que coincida con la ficha de Google Maps de la clínica.
  web: "https://fisioterapiacostadelsol.com/",
  direccionPostal: {
    calle: "Avd. Salvador Vicente, Conjunto Parquemiel, 6, Arroyo de la Miel",
    localidad: "Benalmádena",
    codigoPostal: "29631",
    provincia: "Málaga"
  },

  // Datos del titular para el aviso legal.
  // (Dirección, teléfono y email del aviso legal se toman de los campos de arriba.)
  // Lo que esté como "PENDIENTE" se resalta en rojo en el aviso legal.
  legal: {
    titular: "María José Luzón Rodríguez",
    nombreComercial: "Fisioterapia Costa del Sol",
    nif: "25708121D",
    colegioProfesional: "Ilustre Colegio Profesional de Fisioterapeutas de Andalucía",
    numeroColegiada: "29-0051",
    titulo: "Diplomada en Fisioterapia"
  },

  // Horario de apertura (hora de España). Formato "HH:MM".
  // Cada día admite varios tramos; [] = cerrado.
  // A partir de aquí se genera el texto del horario y el aviso "Abierto/Cerrado ahora".
  horarioSemanal: {
    lunes:     [["09:00", "13:30"], ["16:00", "19:30"]],
    martes:    [["09:00", "13:30"], ["16:00", "19:30"]],
    miercoles: [["09:00", "13:30"], ["16:00", "19:30"]],
    jueves:    [["09:00", "13:30"], ["16:00", "19:30"]],
    viernes:   [["09:00", "13:30"], ["16:00", "19:30"]],
    sabado:    [],
    domingo:   []
  },

  // Festivos: ese día no se dice "Cerrado", sino que se avisa de que PUEDE estar cerrado.
  festivos: {
    // Se repiten cada año (formato "MM-DD"): nacionales + Andalucía (28-02) + local (24-06, San Juan).
    fijos: ["01-01", "01-06", "02-28", "05-01", "06-24", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"],
    // Jueves y Viernes Santo se calculan solos cada año.
    semanaSanta: true,
    // Si un festivo cae en domingo, el lunes siguiente también muestra el aviso de festivo
    // (a menudo se traslada al lunes).
    lunesTrasDomingoFestivo: true,
    // Otros días concretos (formato "AAAA-MM-DD"): festivos locales, vacaciones...
    otros: []
  },

  mapa: {
    // Google Maps > tu ficha > Compartir > Insertar un mapa > copiar solo lo que va en src="..."
    embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3203.0333642337337!2d-4.5353024222942!3d36.6015054788715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd72fc9adf00f32b%3A0x5ba100d9b97b64e7!2sFisioterapia%20Costa%20del%20Sol!5e0!3m2!1ses!2ses!4v1791539616490!5m2!1ses!2ses",
    // Enlace "Abrir en Google Maps" (ficha de la clínica)
    ficha: "https://maps.google.com/?cid=6602559463821632743",
    // Botón "Cómo llegar" (ruta desde la ubicación del usuario)
    ruta: "https://www.google.com/maps/dir/?api=1&destination=Fisioterapia+Costa+del+Sol,+Benalm%C3%A1dena"
  }

};
