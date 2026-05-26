# mediakit-website — Asistente conversacional CAE de ACTIOM

Una página web independiente (un único archivo `index.html`, sin dependencias ni
paso de build) con un asistente de chat conversacional que ayuda a los visitantes
a descubrir si su proyecto de eficiencia energética puede generar **Certificados
de Ahorro Energético (CAE)** en España, y les redirige a [actiom.eco](https://actiom.eco)
para solicitar una consulta gratuita.

El asistente está impulsado por la **API de Claude (Anthropic)**, modelo
`claude-sonnet-4-20250514`, y habla únicamente en español con un tono cálido y humano.

## Qué hace

- Saluda al visitante y le pregunta por su mejora de eficiencia energética.
- Hace preguntas cortas, de una en una (nunca un formulario), para entender:
  tipo de actuación, tamaño de inversión, si el proyecto ya empezó, sector y
  consumo energético aproximado.
- Explica en lenguaje sencillo si la actuación parece elegible para CAE y da una
  estimación orientativa de la oportunidad económica.
- Termina invitando a solicitar una consulta gratuita, con un botón que abre
  `actiom.eco` en una pestaña nueva.

## Cómo configurar la clave de API

1. Abre `index.html` en un editor de texto.
2. Localiza, cerca del inicio del bloque `<script>`, la constante marcada con el
   comentario `// REPLACE WITH YOUR ANTHROPIC API KEY`:

   ```js
   const ANTHROPIC_API_KEY = "REPLACE_WITH_YOUR_ANTHROPIC_API_KEY";
   ```

3. Sustituye el valor por tu clave de API de Anthropic (empieza por `sk-ant-...`).
   La puedes crear en <https://console.anthropic.com/>.
4. Guarda el archivo. Si la clave no está configurada, la interfaz muestra un
   aviso y el chat permanece desactivado.

## Cómo probarlo en local

Al ser un único archivo estático, basta con abrir `index.html` en el navegador.
Si tu navegador bloquea la petición por CORS al abrirlo como `file://`, sírvelo
desde un servidor local sencillo:

```bash
# Python 3
python -m http.server 8000
# luego abre http://localhost:8000
```

## Cómo activar GitHub Pages

1. Sube este repositorio a GitHub (rama `main`).
2. En GitHub: **Settings → Pages**.
3. En **Build and deployment → Source**, elige **Deploy from a branch**.
4. Selecciona la rama `main` y la carpeta `/ (root)`. Guarda.
5. En 1–2 minutos, la web estará publicada en:
   `https://<tu-usuario>.github.io/mediakit-website/`

## ⚠️ Aviso de seguridad importante

Esta aplicación llama a la API de Anthropic **directamente desde el navegador**,
lo que requiere incluir la clave de API en el código JavaScript del lado del
cliente. **Cualquier persona que visite la página publicada puede leer y reutilizar
esa clave.** Si publicas este sitio con una clave real en GitHub Pages, esa clave
queda expuesta públicamente y puede generar consumo y costes no autorizados.

Esto es aceptable para una **demo, prototipo o prueba interna** con una clave de
gasto limitado, pero **no es seguro para producción**. La solución está incluida en
este repo: el **modo seguro con backend** (ver abajo).

## Modo seguro con backend (producción)

Para producción, la clave NO debe ir en el navegador. La carpeta `backend/`
incluye un **Cloudflare Worker** (`cloudflare-worker.js`) que guarda la clave como
secreto del servidor, fija el modelo y el system prompt, limita los tokens y solo
acepta peticiones desde tus dominios.

Pasos resumidos (instrucciones detalladas dentro del propio archivo):
1. Crea una cuenta gratis en <https://dash.cloudflare.com> → **Workers & Pages → Create → Worker**.
2. Pega el contenido de `backend/cloudflare-worker.js` y pulsa **Deploy**.
3. En **Settings → Variables and Secrets**, añade un **Secret** llamado
   `ANTHROPIC_API_KEY` con tu clave `sk-ant-...`.
4. Copia la URL del Worker (`https://...workers.dev`).
5. En `index.html` y `widget.html`, pega esa URL en la constante `BACKEND_URL`
   y deja `ANTHROPIC_API_KEY` con el valor placeholder (la key deja de exponerse).
6. Sube los cambios. Listo: el chat funciona sin exponer la clave.

> Mientras `BACKEND_URL` esté vacío, la app usa el **modo directo** (la key del
> navegador) — práctico para demos. Con `BACKEND_URL` relleno, usa el **modo seguro**.

## Embeber en WordPress (burbuja flotante)

`widget.html` es una versión compacta del chat pensada para incrustarse. El archivo
`wordpress-embed.html` contiene un snippet que dibuja una **burbuja flotante** abajo
a la derecha: pégalo en el **pie (footer)** de WordPress (p. ej. con el plugin
gratuito *WPCode*) y aparecerá en todas las páginas.

## Estructura del proyecto

```
mediakit-website/
├── index.html              # Página completa del asistente (HTML+CSS+JS)
├── widget.html             # Versión compacta para incrustar (iframe)
├── wordpress-embed.html    # Snippet de burbuja flotante para WordPress
├── backend/
│   └── cloudflare-worker.js  # Backend seguro (guarda la API key en el servidor)
├── assets/                 # Logos e icono de marca Actiom
└── README.md               # Este archivo
```

---

Powered by ACTIOM · [actiom.eco](https://actiom.eco)
