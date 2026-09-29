import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const distDirectory = resolve(root, 'dist');
const port = Number(process.env.PORT || 8787);
// Use a stable, low-latency text model for dashboard briefings. Override via
// GEMINI_MODEL if the deployment has a different approved model.
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const maxBodySize = 32 * 1024;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > maxBodySize) throw new Error('Request body is too large.');
  }
  return JSON.parse(raw || '{}');
}

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function createPrompt(evidence) {
  const result = evidence?.result || {};
  const analogues = Array.isArray(evidence?.analogues) ? evidence.analogues.slice(0, 5) : [];
  const region = typeof evidence?.region === 'string' ? evidence.region.slice(0, 80) : 'Unknown region';
  const day = asNumber(evidence?.day);

  if (day === null || asNumber(result.bustProbability) === null || asNumber(result.forecastValue) === null || !analogues.length) {
    throw new Error('Incomplete analytical evidence.');
  }

  const safeAnalogues = analogues.map((item) => ({
    eventType: String(item.eventType || '').slice(0, 100),
    date: String(item.date || '').slice(0, 30),
    similarity: asNumber(item.similarity),
    forecastError: asNumber(item.forecastError),
    bustStatus: String(item.bustStatus || '').slice(0, 30),
  }));

  return `You are writing a concise meteorological analyst briefing for a forecast-bust dashboard.\n\n` +
    `Use ONLY the evidence below. Do not calculate, change, endorse, or invent a probability. ` +
    `Do not claim these synthetic local demo records are real observations or operational data. ` +
    `Mention that this is a local demonstration when appropriate. Explain uncertainty in plain language, in 85-125 words, as one paragraph.\n\n` +
    `Evidence:\n${JSON.stringify({
      region,
      forecastDay: day,
      rainfallForecastMm: result.forecastValue,
      bustProbabilityPercent: result.bustProbability,
      confidence: result.confidence,
      historicalMaeMm: result.historicalMeanError,
      historicalBustFrequencyPercent: result.historicalBustFrequency,
      p90ThresholdAndReasons: result.keyReasons,
      closestAnalogues: safeAnalogues,
    })}`;
}

async function generateExplanation(evidence) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: createPrompt(evidence) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 260 },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  const payload = await geminiResponse.json().catch(() => ({}));
  if (!geminiResponse.ok) {
    const error = new Error(payload?.error?.message || `Gemini API error ${geminiResponse.status}.`);
    error.status = geminiResponse.status === 401 || geminiResponse.status === 403 ? 502 : 503;
    throw error;
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!text) {
    const error = new Error('Gemini returned no text for this request.');
    error.status = 502;
    throw error;
  }
  return text;
}

function serveStatic(requestPath, response) {
  const requested = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = resolve(distDirectory, normalize(requested));
  const safePath = filePath.startsWith(distDirectory) ? filePath : join(distDirectory, 'index.html');
  const fallback = join(distDirectory, 'index.html');
  const target = existsSync(safePath) ? safePath : fallback;

  if (!existsSync(target)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Build the frontend first with npm run build.');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[extname(target)] || 'application/octet-stream' });
  createReadStream(target).pipe(response);
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'POST' && url.pathname === '/api/gemini/explanation') {
    try {
      const body = await readJson(request);
      const explanation = await generateExplanation(body.evidence);
      sendJson(response, 200, { explanation });
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message || 'Unable to generate briefing.' });
    }
    return;
  }
  if (request.method === 'GET') return serveStatic(url.pathname, response);
  sendJson(response, 405, { error: 'Method not allowed.' });
}).listen(port, () => {
  console.log(`Forecast Bust server listening at http://localhost:${port}`);
});
