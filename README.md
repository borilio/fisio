# Fisioterapia Costa del Sol

Web de la clínica Fisioterapia Costa del Sol (Benalmádena, Málaga). Hecha con HTML, CSS y JavaScript, sin herramientas de compilación.

## Enlaces

| Sitio | URL | Para qué |
| --- | --- | --- |
| **Web oficial** | <https://fisioterapiacostadelsol.com> | La web pública, en el servidor de la clínica |
| **GitHub Pages** | <https://borilio.github.io/fisio/> | Copia para probar y compartir durante el desarrollo, y como respaldo |
| **Netlify** | <https://fisio-provisional.netlify.app> | Versión provisional para enseñar al cliente (sin rastro de GitHub) |

## Editar contenidos: `config.js`

[`js/config.js`](js/config.js) reúne en un solo archivo la información de la web que puede cambiar con el tiempo, para editarla fácilmente sin tocar el HTML. Al guardar los cambios, la web los muestra automáticamente.

✏️ **[Editar `config.js` en GitHub](https://github.com/borilio/fisio/edit/main/js/config.js)**: al confirmar el cambio (*Commit changes*) en `main`, se publica en los sitios que tengan el despliegue automático activado.

> [!NOTE]
> Cada elemento de `config.js` está explicado en detalle en los comentarios del propio archivo (qué hace, qué valores admite y ejemplos). Al editar, respeta las comillas `"..."` y las comas al final de cada línea.

| Apartado | Qué contiene |
| --- | --- |
| **Web** | Versión de la web (se muestra en el pie) y dirección oficial |
| **Aviso** | Aviso eventual al principio de la web (cierres, novedades…), con fechas de inicio y fin |
| **Temporadas** | Efectos de temporada (nieve en Navidad, emojis en Halloween y San Valentín), con sus fechas |
| **Contacto** | Teléfono, email y dirección (también la dirección desglosada para Google) |
| **Legal** | Datos de la titular que aparecen en el aviso legal |
| **Horario y festivos** | Horario de apertura y festivos, usados para el aviso "Abierto / Cerrado ahora" |
| **Convenios** | Entidades con convenio: tarjetas destacadas y pestañas (compañías sanitarias, accidentes de tráfico, mutuas, federaciones), con sus logos |
| **Mapa** | Enlaces del mapa de Google y de "Cómo llegar" |

### Convenios: añadir, quitar o cambiar una entidad

Cada entidad es una línea dentro de su pestaña (`categorias`) en `config.js`:

```js
{ nombre: "Mapfre", logo: "img/logos/mapfre.svg" },
```

- **`logo`:** ruta al logo, en `img/logos/`. Mejor en **SVG**, o **WebP** con fondo transparente. Si se deja vacío (`""`), se muestra el nombre escrito.
- En **modo oscuro** los logos se pintan en blanco automáticamente. Si alguno no se entiende en blanco (por ejemplo, letras blancas dentro de un recuadro de color), se le añade `placa: true` y se mostrará a color sobre una placa clara.
- Se muestran en el orden de `config.js` (alfabético, salvo UNESPA y Beiman, que van primero en sus pestañas).
- Las pestañas y las tarjetas destacadas admiten una `nota` opcional (texto encima de los logos o debajo de la lista).

## Iconos: `iconos.js`

Los iconos de la web están en [`js/iconos.js`](js/iconos.js), no dentro del HTML. En el HTML se usan así:

```html
<span data-icon="telefono" class="phone-ring"></span>
```

Al cargar la página, cada `<span data-icon>` se sustituye por su dibujo (conservando las clases, que dan las animaciones). Para añadir un icono nuevo, se crea una entrada en `iconos.js` con su nombre y el contenido de su `<svg>`.

## Tailwind: `css/tailwind.css`

Las clases de Tailwind que usa la web (`flex`, `gap-4`, `lg:text-6xl`…) están en un CSS generado, [`css/tailwind.css`](css/tailwind.css), en lugar de cargar Tailwind entero en el navegador. **Solo hay que regenerarlo si se añade una clase de Tailwind nueva** que no se usara antes; las clases propias y las de Bootstrap no necesitan nada. Cómo hacerlo está explicado al principio de [`tailwind.config.js`](tailwind.config.js).

## Despliegue en Netlify

Netlify está conectado al repositorio y publica la web automáticamente con cada `push` a `main`. Es la URL que se comparte con el cliente para revisar los cambios, externo a cualquier enlace a GitHub.

> [!WARNING]
> **Estado actual: desactivado.** Para reactivarlo, en el panel de Netlify del sitio *fisio-provisional*, vuelve a activar las publicaciones automáticas.

## Despliegue en la web oficial (SFTP)

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica la web en el servidor de fisioterapiacostadelsol.com:

1. Se ejecuta con cada `push` a la rama `main`, o a mano desde **Actions** → *Desplegar web por SFTP* → **Run workflow**.
2. Sube los archivos por SFTP a la carpeta de la web en el servidor.
3. El servidor queda igual que el repositorio: lo que se borra en el repositorio también se borra en el servidor. No se suben `.git`, `.vscode`, este `README.md`, `_headers` (que es solo para Netlify), `tools/` ni `tailwind.config.js`.

Los datos de conexión se guardan como *secrets* del repositorio: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASS` y `SFTP_DIR`.

> [!WARNING]
> **Estado actual: desactivado.** Ya está probado y funciona. Para activarlo: **Actions** → *Desplegar web por SFTP* → **Enable workflow**. Desde ese momento, cada `push` a `main` se publicará en la web oficial.
