# Fisioterapia Costa del Sol

Web de la clínica Fisioterapia Costa del Sol (Benalmádena, Málaga). Hecha con HTML, CSS y JavaScript, sin herramientas de compilación.

## Enlaces

| Sitio | URL | Para qué |
| --- | --- | --- |
| **Web oficial** | <https://fisioterapiacostadelsol.com> | La web pública, en el servidor de la clínica |
| **GitHub Pages** | <https://borilio.github.io/fisio/> | Copia para probar y compartir durante el desarrollo, y como respaldo |

## Despliegue en la web oficial (SFTP)

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica la web en el servidor de fisioterapiacostadelsol.com:

1. Se ejecuta con cada `push` a la rama `main`, o a mano desde **Actions** → *Desplegar web por SFTP* → **Run workflow**.
2. Sube los archivos por SFTP a la carpeta de la web en el servidor.
3. El servidor queda igual que el repositorio: lo que se borra en el repositorio también se borra en el servidor. No se suben `.git`, `.vscode` ni este `README.md`.

Los datos de conexión se guardan como *secrets* del repositorio: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASS` y `SFTP_DIR`.

> **Estado actual: desactivado.** Ya está probado y funciona. Para activarlo: **Actions** → *Desplegar web por SFTP* → **Enable workflow**. Desde ese momento, cada `push` a `main` se publicará en la web oficial.
