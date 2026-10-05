/* netlify/functions/generate.js — a partir del reto o idea del usuario, pide
   de verdad a la API de Claude, en una sola llamada:
   - "plan": un plan de ideación de 4 fases (Graham Wallas), con una técnica
     + ejercicio concreto por fase y un prompt largo para seguir la
     ideación con un LLM (lo que antes armaba sólo con lógica local).
   - "ideas": entre 4 y 6 ideas rápidas, variaciones concretas de la idea.
   La clave vive en la variable de entorno ANTHROPIC_API_KEY de Netlify,
   nunca en el código del sitio.

   Si esta función falla por lo que sea (red, límite, refusal, Netlify
   caído), el front (scripts/hero-plan.js) cae de vuelta al plan armado con
   lógica local para la pestaña "Plan", y muestra un estado de error con
   reintentar en la pestaña "Ideas rápidas" — por eso acá alcanza con
   fallar limpio, sin reintentos ni fallback de modelo: ya hay una red de
   seguridad del lado del cliente. */
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

const QuickIdea = z.object({
  title: z.string().describe('Título corto y directo de la idea (máx. ~6 palabras).'),
  pitch: z.string().describe('1-2 frases: en qué consiste esta idea concreta, aplicada al reto del usuario.'),
});

const GenerateSchema = z.object({
  plan: PlanSchema,
  ideas: z.array(QuickIdea).min(4).max(6).describe('Entre 4 y 6 ideas rápidas, variadas entre sí (ángulos distintos: público, formato, restricción, escala), concretas y accionables, nada genérico.'),
});

const SYSTEM_PROMPT =
  'Eres un facilitador de ideación creativa. Para el reto o idea que te da el usuario, generás dos cosas:\n\n' +
  '1. Un plan de ideación en las 4 fases del modelo de Graham Wallas (Preparación, Incubación, Iluminación, ' +
  'Implementación): una técnica concreta por fase (puede ser una técnica conocida o una variación tuya) y una ' +
  'acción breve y específica para esa fase, tal como se aplicaría a esa idea en particular, no una ' +
  'recomendación genérica. También un prompt lo bastante largo para guiar una conversación completa fase por ' +
  'fase, listo para que el usuario lo copie y lo pegue en un chat con un LLM.\n\n' +
  '2. Entre 4 y 6 ideas rápidas: variaciones concretas de la idea, cada una desde un ángulo distinto (puede ' +
  'variar el público, el formato, una restricción deliberada, la escala o el modelo). Nada de ideas genéricas o ' +
  'intercambiables entre sí.\n\n' +
  'Escribe todo en español, de tú (no de vos).';

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
      max_tokens: 4096,
      output_config: { effort: 'low', format: zodOutputFormat(GenerateSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: idea }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return { statusCode: 502, body: JSON.stringify({ error: 'no_result' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.parsed_output),
    };
  } catch (err) {
    console.error('generate function error:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'upstream_error' }) };
  }
};
