# Cod-Hestudio

Editor de código sencillo y personalizable que corre en tu navegador. Sin instalar nada, con plugins a tu medida y temas propios.

🔗 **Pruébalo:** https://viche-studios.github.io/Cod-Hestudio/

## ¿Qué es?

Cod-Hestudio es un editor de código para escribir y revisar proyectos web directamente desde Chrome o Edge. Abre carpetas de tu computadora, edita tus archivos y activa solo las funciones que necesitas.

Es una alternativa más ligera y personalizable a editores más pesados, pensada para quienes quieren algo sencillo y que se adapte a su forma de trabajar.

## Características

- **Tus archivos, en tu PC.** Trabaja directamente sobre las carpetas de tu computadora.
- **Plugins a tu medida.** Activa y desactiva funciones desde la tienda: búsqueda de archivos, notas, lista de tareas, vista previa, visores de imagen, video y audio, exportación a ZIP, sonidos ambientales y más.
- **Temas propios.** Wuu, Hybrid, Github Lover, Café Latte, Cuarzo Rosado, Oficina, Floral, En busca del tema perdido y Bizzaras Desventuras, cada uno con modo claro y oscuro.
- **Exportar a GitHub.** Sube tu proyecto a un repositorio tuyo con un token de grano fino, de forma manual o automática.
- **Sin cuentas ni servidores.** Tus proyectos y tu configuración se quedan en tu navegador.

## Requisitos

- **Google Chrome** o **Microsoft Edge** (versión reciente).
- Firefox y Safari no son compatibles, porque el editor usa la File System Access API para leer y escribir carpetas.

## Cómo usarlo

1. Abre la página o descarga este repositorio.
2. Si lo descargas, abre `index.html` desde un servidor local (por ejemplo, con la extensión *Live Server* de VS Code o `python -m http.server`).
3. Pulsa el botón **+** para crear un proyecto y elige una carpeta de tu PC.
4. Activa los plugins que quieras desde la **Tienda de plugins** (icono de tienda, arriba a la derecha).

## Estructura del proyecto

```
Cod-Hestudio/
├── index.html      ← Lobby de inicio
├── style.css       ← Estilos del lobby
├── menu.js         ← Lógica del lobby
├── sobre/          ← Página "Sobre nosotros" (créditos y licencias)
└── editor/         ← El editor
    ├── index.html
    ├── script.js   ← Núcleo del editor
    ├── style.css
    ├── jsplugins.js
    ├── favicon.svg
    └── plugins/    ← Un archivo .js por plugin
```

## Crear un plugin

Cada plugin es un archivo `.js` dentro de `editor/plugins/` que llama a `CodHestudio.register({...})`. Después se agrega su nombre a la lista `files` de `editor/jsplugins.js`. Revisa cualquier plugin existente como ejemplo.

## Créditos

Cod-Hestudio usa librerías y servicios de terceros, como Monaco Editor, Lucide, JSZip, marked, DOMPurify, Inter y JetBrains Mono. La lista completa, con sus licencias, está en la página **Sobre nosotros**.

## Licencia

Este proyecto se distribuye bajo la licencia **PolyForm Noncommercial 1.0.0**. Puedes usar, estudiar y modificar el código, y compartir tus modificaciones, siempre que **no sea con fines comerciales** y que mantengas el aviso de copyright y la licencia.

Cod-Hestudio es un proyecto de **VicHehe** (Victor Tilleria). Si lo usas o lo modificas, por favor menciona al autor original.

Para el texto completo de la licencia, consulta el archivo [`LICENSE`](LICENSE).

## Contacto

📧 VicHeSuport@gmail.com

---

Hecho con cariño, para que más personas puedan escribir código sin complicaciones. 💜
