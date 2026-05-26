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
gasto limitado, pero **no es seguro para producción**. Para un despliegue real,
mueve la llamada a la API a un backend o función serverless (por ejemplo, Cloudflare
Workers, Vercel Functions, AWS Lambda) que guarde la clave como variable de entorno
del servidor, y haz que la página llame a ese backend en lugar de a Anthropic
directamente. Recomendaciones adicionales: restringe el gasto de la clave en la
consola de Anthropic y rótala periódicamente.

## Estructura del proyecto

```
mediakit-website/
├── index.html   # Toda la app: HTML + CSS + JS en un solo archivo
└── README.md    # Este archivo
```

---

Powered by ACTIOM · [actiom.eco](https://actiom.eco)
