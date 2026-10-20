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
| **Mapa** | Enlaces del mapa de Google y de "Cómo llegar" |

## Despliegue en Netlify

Netlify está conectado al repositorio y publica la web automáticamente con cada `push` a `main`. Es la URL que se comparte con el cliente para revisar los cambios, externo a cualquier enlace a GitHub.

> [!WARNING]
> **Estado actual: desactivado.** Para reactivarlo, en el panel de Netlify del sitio *fisio-provisional*, vuelve a activar las publicaciones automáticas.

## Despliegue en la web oficial (SFTP)

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica la web en el servidor de fisioterapiacostadelsol.com:

1. Se ejecuta con cada `push` a la rama `main`, o a mano desde **Actions** → *Desplegar web por SFTP* → **Run workflow**.
2. Sube los archivos por SFTP a la carpeta de la web en el servidor.
3. El servidor queda igual que el repositorio: lo que se borra en el repositorio también se borra en el servidor. No se suben `.git`, `.vscode` ni este `README.md`.

Los datos de conexión se guardan como *secrets* del repositorio: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASS` y `SFTP_DIR`.

> [!WARNING]
> **Estado actual: desactivado.** Ya está probado y funciona. Para activarlo: **Actions** → *Desplegar web por SFTP* → **Enable workflow**. Desde ese momento, cada `push` a `main` se publicará en la web oficial.
