/* netlify/functions/ideas.js — genera ideas rápidas a partir de la idea o
   reto del usuario, llamando de verdad a la API de Claude (la clave vive en
   la variable de entorno ANTHROPIC_API_KEY de Netlify, nunca en el código
   del sitio).

   El plan de 4 fases (Graham Wallas) se arma del lado del cliente con
   lógica local (scripts/hero-plan.js, localPlan()) — esta función sólo
   cubre la pestaña "Ideas rápidas". Si falla por lo que sea (red, límite,
   refusal, Netlify caído), el front muestra un estado de error con botón
   de reintentar en esa pestaña nada más; el resto de la experiencia sigue
   intacta. */
const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');

const QuickIdea = z.object({
  title: z.string().describe('Título corto y directo de la idea (máx. ~6 palabras).'),
  pitch: z.string().describe('1-2 frases: en qué consiste esta idea concreta, aplicada al reto del usuario.'),
});

const IdeasSchema = z.object({
  ideas: z.array(QuickIdea).min(4).max(6).describe('Entre 4 y 6 ideas rápidas, variadas entre sí (ángulos distintos: público, formato, restricción, escala), concretas y accionables, nada genérico.'),
});

const SYSTEM_PROMPT =
  'Eres un facilitador de brainstorming. A partir del reto o idea que te da el usuario, propón entre ' +
  '4 y 6 ideas rápidas y concretas, cada una desde un ángulo distinto (puede variar el público al que ' +
  'apunta, el formato, una restricción deliberada, la escala o el modelo). Nada de ideas genéricas o ' +
  'intercambiables entre sí: cada una debe ser una variación realmente distinta aplicada a lo que te ' +
  'contó el usuario. Escribe en español, de tú (no de vos).';

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
      max_tokens: 2048,
      output_config: { effort: 'low', format: zodOutputFormat(IdeasSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: idea }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return { statusCode: 502, body: JSON.stringify({ error: 'no_ideas' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.parsed_output),
    };
  } catch (err) {
    console.error('ideas function error:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'upstream_error' }) };
  }
};
