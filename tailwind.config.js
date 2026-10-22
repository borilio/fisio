/* =====================================================
   TAILWIND: QUÉ ES ESTO Y CÓMO SE USA (léelo si vuelves dentro de unos meses)

   La web usa algunas clases de Tailwind en el HTML (flex, gap-4, px-6, lg:text-6xl…).
   En lugar de cargar Tailwind entero en el navegador (un script de 400 KB que generaba
   los estilos en cada visita), se genera UNA VEZ un CSS pequeño con solo las clases que
   se usan: css/tailwind.css (se enlaza en el <head> de index.html, como Bootstrap).

   ¿Cuándo hay que regenerarlo?
   - Solo si se añade al HTML (o a un .js) una clase de Tailwind que no se usara antes.
     Si no se regenera, esa clase nueva simplemente no tendrá efecto.
   - Las clases propias (css/styles.css) y las de Bootstrap NO necesitan nada.

   ¿Cómo se regenera? Desde la carpeta del proyecto, en una terminal:
       tools\tailwindcss.exe -c tailwind.config.js -o css/tailwind.css --minify

   - tools/tailwindcss.exe es el ejecutable oficial de Tailwind v3.4.17 (un solo archivo,
     sin Node ni instalaciones). Pesa ~40 MB, por eso NO está en el repositorio (.gitignore)
     ni se sube al servidor. Si no lo tienes, descárgalo de:
     https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.17
     (archivo tailwindcss-windows-x64.exe, renombrado a tailwindcss.exe dentro de tools/)
   ===================================================== */
module.exports = {
  // Dónde busca las clases que se usan
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf6",
          100: "#d9f4eb",
          600: "#1f6f64",
          700: "#175a50",
          800: "#123f39"
        },
        accent: {
          500: "#e08e3e",
          600: "#cf7a26"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 45px rgba(17, 24, 39, 0.08)"
      }
    }
  }
};
