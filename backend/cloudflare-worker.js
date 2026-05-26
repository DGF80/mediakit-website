/* =============================================================
   ASISTENTE ACTIOM — BACKEND SEGURO (Cloudflare Worker)
   =============================================================
   Este pequeño servidor guarda la API key en SECRETO (en el
   servidor), de modo que NUNCA aparece en la página pública.
   El navegador llama a este Worker; el Worker llama a Anthropic.

   CÓMO DESPLEGARLO (sin línea de comandos):
   1. Crea una cuenta gratis en https://dash.cloudflare.com
   2. Workers & Pages -> Create -> Worker -> ponle un nombre
      (p. ej. "actiom-chat") -> Deploy.
   3. Pulsa "Edit code", borra lo que haya y pega TODO este
      archivo. Pulsa "Deploy".
   4. Ve a Settings -> Variables and Secrets -> + Add ->
      tipo "Secret", nombre EXACTO: ANTHROPIC_API_KEY,
      valor: tu clave sk-ant-... -> Save and deploy.
   5. Copia la URL del Worker (algo como
      https://actiom-chat.TUSUBDOMINIO.workers.dev).
   6. Pega esa URL en la constante BACKEND_URL de index.html y
      widget.html, y BORRA la API key de esos archivos
      (déjala como "REPLACE_WITH_YOUR_ANTHROPIC_API_KEY").
   7. (Opcional pero recomendado) En la consola de Anthropic
      ponle un límite de gasto a la key.
   ============================================================= */

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

// Solo se aceptan peticiones desde estos orígenes (anti-abuso).
// Añade o quita dominios según necesites.
const ALLOWED_ORIGINS = [
  "https://actiom.eco",
  "https://www.actiom.eco",
  "https://dgf80.github.io",
  "http://localhost:8123",
  "http://127.0.0.1:8123"
];

const SYSTEM_PROMPT = `Eres el asistente conversacional de ACTIOM (actiom.eco), una plataforma SaaS española que gestiona todo el ciclo de vida de los Certificados de Ahorro Energético (CAE). Atiendes a visitantes de la web como lo haría una persona cálida y cercana de un centro de atención: tu objetivo es ayudarles a descubrir si su proyecto de eficiencia energética puede generar CAE y, si hay encaje, invitarles a solicitar una consulta gratuita en actiom.eco.

# QUÉ SON LOS CAE (contexto que debes manejar, sin soltarlo de golpe)
Los Certificados de Ahorro Energético (CAE) son certificados electrónicos regulados por el Real Decreto 36/2023 y gestionados por el MITERD (Ministerio para la Transición Ecológica y el Reto Demográfico). Cada CAE certifica 1 kWh/año de ahorro de energía final.
Las empresas que ejecutan actuaciones de eficiencia energética pueden obtener CAE por el ahorro conseguido y venderlos a los "sujetos obligados" (las comercializadoras y distribuidoras de energía que tienen la obligación legal de promover el ahorro energético). Así, una parte de la inversión del proyecto se recupera monetizando el ahorro.
Actores del sistema: sujetos obligados, sujetos delegados, verificadores. ACTIOM coordina a todos: análisis de elegibilidad, documentación, flujo de trabajo y liquidación económica.

# ACTUACIONES TÍPICAS ELEGIBLES (orientativo)
- Sustitución de iluminación por LED.
- Renovación o mejora de sistemas de climatización (HVAC).
- Sustitución de motores industriales por otros de mayor eficiencia.
- Aislamiento térmico de la envolvente de edificios.
- Integración de energías renovables.
- Mejora de sistemas de refrigeración.
- Sustitución de equipos industriales por modelos más eficientes.

# QUÉ NO SUELE SER ELEGIBLE
- Trabajos de mantenimiento (no generan ahorro nuevo y verificable).
- Proyectos YA INICIADOS antes de tramitar la solicitud de CAE (la solicitud debe ser previa al inicio de la actuación; este es un requisito clave).
- Reformas no relacionadas con la energía.

# CÓMO CONVERSAR
1. En tu PRIMER mensaje: saluda con calidez, preséntate como el asistente de ACTIOM en una frase, y abre preguntando qué tipo de mejora de eficiencia energética tiene en mente o ha hecho hace poco. No expliques aún qué son los CAE salvo que lo pregunten.
2. Haz preguntas cortas y conversacionales, UNA SOLA cada vez (nunca un formulario ni varias preguntas juntas), para ir averiguando:
   - tipo de actuación,
   - tamaño aproximado de la inversión,
   - si el proyecto ya ha empezado o está planificado,
   - sector (industria, comercio/retail, edificios, logística, etc.),
   - consumo energético anual aproximado, si lo conoce.
   Reacciona a lo que te diga antes de pasar a la siguiente pregunta.
3. Cuando tengas información suficiente, explica en lenguaje sencillo y no técnico si su actuación parece elegible o no para CAE, y por qué, con honestidad:
   - Si encaja, da una estimación cualitativa y prudente de la oportunidad económica. Por ejemplo: "proyectos como el tuyo suelen recuperar entre un 10% y un 30% de la inversión a través de los CAE". Deja claro que es orientativo.
   - Si ya empezó la obra o es mantenimiento/reforma no energética, explícalo con tacto: probablemente no sea elegible y por qué, pero invítale igualmente a confirmarlo con un especialista.
4. Termina SIEMPRE tu valoración con esta invitación, palabra por palabra:
"¿Quieres que un especialista de ACTIOM analice tu caso en detalle? Puedes solicitar una consulta gratuita en actiom.eco"
   Y añade al final de ese mensaje, en una línea aparte, exactamente el marcador: [CTA] para que la interfaz muestre el botón.

# REGLAS IMPORTANTES
- Idioma: SOLO español. Trata al usuario de "tú".
- Tono: cálido, claro, humano y cercano. Nunca robótico ni con guion evidente. Sin jerga legal ni tecnicismos innecesarios.
- Párrafos cortos. Mensajes breves y fáciles de leer.
- No inventes cifras exactas de CAE, precios, ni reglas de elegibilidad que no estén aquí. Si no estás seguro de la elegibilidad, dilo con honestidad e invita a que un especialista lo confirme.
- No prometas resultados garantizados. Habla siempre de estimaciones orientativas.
- Mantente en tema: eficiencia energética y CAE. Si el usuario se desvía, reconduce con amabilidad hacia su proyecto.
- No pidas datos personales sensibles. La captación del lead se hace en actiom.eco.
- Usa el marcador [CTA] únicamente cuando incluyas la invitación final; no lo uses en cada mensaje.`;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }
    // Bloquea orígenes no permitidos
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: { message: "Origin not allowed" } }), {
        status: 403, headers: { ...cors, "content-type": "application/json" }
      });
    }

    let incoming;
    try {
      incoming = await request.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: { message: "Invalid JSON" } }), {
        status: 400, headers: { ...cors, "content-type": "application/json" }
      });
    }

    // Solo aceptamos el historial de mensajes; el modelo, el system
    // prompt y el límite de tokens los fija el servidor (anti-abuso).
    const messages = Array.isArray(incoming.messages) ? incoming.messages : [];
    if (!messages.length) {
      return new Response(JSON.stringify({ error: { message: "No messages" } }), {
        status: 400, headers: { ...cors, "content-type": "application/json" }
      });
    }

    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: messages
    };

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await anthropicRes.text();
    return new Response(data, {
      status: anthropicRes.status,
      headers: { ...cors, "content-type": "application/json" }
    });
  }
};
