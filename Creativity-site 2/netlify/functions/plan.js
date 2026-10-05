/* netlify/functions/plan.js — genera el plan de ideación breve + el prompt
   para LLM a partir de la idea del usuario, llamando de verdad a la API de
   Claude (la clave vive en la variable de entorno ANTHROPIC_API_KEY de
   Netlify, nunca en el código del sitio).

   Si esta función falla por lo que sea (red, límite, refusal, Netlify
   caído), el front (scripts/hero-plan.js) cae de vuelta al plan armado con
   lógica local — por eso acá alcanza con fallar limpio, sin reintentos ni
   fallback de modelo: ya hay una red de seguridad del lado del cliente. */
const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');

const PHASE_STEP = z.object({
  technique: z.string().describe('Nombre de una técnica de ideación concreta para esta fase.'),
  exercise: z.string().describe('Una frase: la acción específica a hacer en esta fase, aplicada a la idea del usuario (no genérica).'),
});

const PlanSchema = z.object({
  preparacion: PHASE_STEP,
  incubacion: PHASE_STEP,
  iluminacion: PHASE_STEP,
  implementacion: PHASE_STEP,
  llmPrompt: z.string().describe('Prompt en español, de tú, listo para pegar en un chat con un LLM y seguir la ideación fase por fase.'),
});

const SYSTEM_PROMPT =
  'Eres un facilitador de ideación creativa que sigue las 4 fases del modelo de Graham Wallas: ' +
  'Preparación, Incubación, Iluminación, Implementación. Para el reto o idea que te da el usuario, ' +
  'sugiere una técnica de ideación concreta por fase (puede ser una técnica conocida o una variación ' +
  'tuya) y una acción breve y específica para esa fase, tal como se aplicaría a esa idea en particular, ' +
  'no una recomendación genérica. Escribe también un prompt lo bastante largo para guiar una conversación ' +
  'completa, en español y de tú (no de vos), listo para que el usuario lo copie y lo pegue en un chat con ' +
  'un LLM y profundice fase por fase.';

const client = new Anthropic();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  let idea;
  try {
    idea = JSON.parse(event.body || '{}').idea;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) };
  }
  if (typeof idea !== 'string' || !idea.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing_idea' }) };
  }
  idea = idea.trim().slice(0, 400); // tope simple contra abuso y costo en un endpoint público

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 1536,
      output_config: { effort: 'low', format: zodOutputFormat(PlanSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: idea }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return { statusCode: 502, body: JSON.stringify({ error: 'no_plan' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.parsed_output),
    };
  } catch (err) {
    console.error('plan function error:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'upstream_error' }) };
  }
};
