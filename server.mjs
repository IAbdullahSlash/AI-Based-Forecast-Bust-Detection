import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// The analysis engine is shared with the dashboard; Node >= 22.18 runs the
// TypeScript sources directly via type stripping.
import {
  DAYS, IMD_NOTE, IMD_SOURCE, IMD_YEARS, SCENARIO, getAnalogueData, getConfidenceByDay, getErrorProneRegions,
  getExplanation, getLeadErrorCurve, getModelMetrics, getRealVerification, getRegionData, monsoonAverages, observedSummary,
} from './src/analysis/forecastEngine.ts';
import { STATE_POSITIONS } from './src/data/regions.ts';
import { CASES, getCaseBasinSystems, getCaseDay, getCaseEvaluation } from './src/analysis/caseStudy.ts';
import { getRealModel, getRealTempModel } from './src/analysis/realModel.ts';
import { getTempVerification } from './src/analysis/tempVerification.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const distDirectory = resolve(root, 'dist');
const datasetDirectory = resolve(root, 'dataset');
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
  const variable = result.variable === 'temperature' ? 'temperature' : 'rainfall';
  const unit = variable === 'temperature' ? 'degC' : 'mm';

  return `You are writing a concise meteorological analyst briefing for a forecast-bust dashboard.\n\n` +
    `Use ONLY the evidence below. Do not calculate, change, endorse, or invent a probability. ` +
    `Do not claim these synthetic local demo records are real observations or operational data. ` +
    `Mention that this is a local demonstration when appropriate. Explain uncertainty in plain language, in 85-125 words, as one paragraph.\n\n` +
    `Evidence:\n${JSON.stringify({
      region,
      forecastDay: day,
      variable,
      [`forecast_${unit}`]: result.forecastValue,
      bustProbabilityPercent: result.bustProbability,
      mlModelProbabilityPercent: asNumber(result.mlProbability),
      analogueProbabilityPercent: asNumber(result.analogueProbability),
      confidence: result.confidence,
      [`historicalMaeAtThisLead_${unit}`]: result.historicalMeanError,
      historicalBustFrequencyPercent: result.historicalBustFrequency,
      meteorologicalReasons: Array.isArray(result.keyReasons) ? result.keyReasons.slice(0, 8).map((reason) => String(reason).slice(0, 300)) : [],
      closestAnalogues: safeAnalogues,
    })}`;
}

/** Builds the case-study prompt from the server's own engine output, never from client text. */
function createCasePrompt({ caseId, day, region, variable }) {
  const definition = CASES.find((item) => item.id === caseId);
  if (!definition) throw new Error('Unknown case.');
  if (!Number.isInteger(day) || day < 1 || day > 10) throw new Error('day must be an integer from 1 to 10.');
  if (!REGION_NAMES.has(region)) throw new Error('Unknown region.');
  if (!EVALUATED_VARIABLES.includes(variable)) throw new Error('variable must be rainfall or temperature.');
  const cell = getCaseDay(caseId, day, variable).find((item) => item.region === region);
  if (!cell) throw new Error('No data for this state and day.');
  if (cell.forecast === null) throw new Error('There is no forecast for this lead time, so there is nothing to brief.');

  const verification = variable === 'temperature' ? getTempVerification() : getRealVerification();
  const stateRecord = verification.byRegion.find((item) => item.region === region);
  const riskLabel = { low: 'high risk', medium: 'elevated risk', high: 'low risk' }[cell.risk];

  const evidence = {
    case: definition.label,
    state: region,
    validDate: cell.date,
    dayOfForecast: day,
    variable,
    unit: cell.unit,
    forecast: cell.forecast,
    observed: cell.observed,
    errorForecastMinusObserved: cell.error,
    bustThresholdAbsError: verification.bustThreshold,
    outcome: cell.outcome,
    predictedBustProbabilityPercent: cell.probability,
    predictedRisk: riskLabel,
    modelDriversRaisingRisk: cell.drivers.map((driver) => driver.feature),
    ruleFlagsKnownAtForecastTime: cell.flags.map((flag) => flag.label),
    forecastSignals: cell.signals.filter((signal) => signal.kind === 'forecast' || signal.label === 'Forecast heat').map((signal) => `${signal.label}: ${signal.detail}`),
    whatActuallyHappenedPerReanalysis: cell.signals.filter((signal) => signal.kind !== 'forecast' && signal.label !== 'Forecast heat').map((signal) => `${signal.label}: ${signal.detail}`),
    stateRecordAcrossAllRuns: stateRecord ? { pairs: stateRecord.pairs, meanAbsError: stateRecord.mae, bias: stateRecord.bias, busts: stateRecord.busts } : null,
    temperatureMethodNote: variable === 'temperature'
      ? 'Forecast temperature is the S2S 925 hPa temperature corrected to surface Tmax with MOS fitted on other runs.'
      : null,
  };

  return `You are writing a concise post-event briefing for an operational forecaster reviewing a past forecast (hindcast).\n\n` +
    `Use ONLY the evidence below. Do not calculate, change or invent any number or probability. ` +
    `These are real archived data (NCMRWF S2S hindcast forecasts, IMD gridded observations, IMDAA reanalysis), so do not call them synthetic or a demo. ` +
    `In 90–130 words, as one paragraph: say what was forecast versus observed and whether it was a bust; ` +
    `say whether the predicted risk anticipated it and which drivers or flags pointed to it (or that the risk was low if it was missed); ` +
    `and, if reanalysis evidence is given, explain the weather that actually occurred. If a temperature method note is given, mention it briefly.\n\n` +
    `Evidence:\n${JSON.stringify(evidence)}`;
}

async function callGemini(prompt) {
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
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // Gemini 3 models "think" before answering and those tokens count
        // against maxOutputTokens, so the budget must cover both. Length is
        // controlled by the prompt (85–125 words), not by this cap.
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: 'low' } },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const payload = await geminiResponse.json().catch(() => ({}));
  if (!geminiResponse.ok) {
    const error = new Error(payload?.error?.message || `Gemini API error ${geminiResponse.status}.`);
    error.status = geminiResponse.status === 401 || geminiResponse.status === 403 ? 502 : 503;
    throw error;
  }

  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text || '')
    .join('')
    .trim();
  if (candidate?.finishReason === 'MAX_TOKENS') {
    const error = new Error('Gemini ran out of output tokens before finishing the briefing.');
    error.status = 502;
    throw error;
  }
  if (!text) {
    const error = new Error('Gemini returned no text for this request.');
    error.status = 502;
    throw error;
  }
  return text;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function serveStatic(requestPath, response) {
  const requested = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = resolve(distDirectory, normalize(requested));
  const fallback = join(distDirectory, 'index.html');
  // Directories (e.g. /assets) must fall back too: streaming one throws EISDIR and kills the process.
  const inside = filePath === distDirectory || filePath.startsWith(distDirectory + sep);
  const target = inside && isFile(filePath) ? filePath : fallback;

  if (!isFile(target)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Build the frontend first with npm run build.');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[extname(target)] || 'application/octet-stream' });
  createReadStream(target)
    .on('error', () => response.destroy())
    .pipe(response);
}

const EVALUATED_VARIABLES = ['rainfall', 'temperature'];
const REGION_NAMES = new Set(STATE_POSITIONS.map((state) => state.name));

function queryOptions(url) {
  const day = Number(url.searchParams.get('day') ?? 5);
  const variable = url.searchParams.get('variable') ?? 'rainfall';
  if (!Number.isInteger(day) || !DAYS.includes(day)) throw new Error('day must be an integer from 1 to 10.');
  if (!EVALUATED_VARIABLES.includes(variable)) throw new Error(`variable must be one of: ${EVALUATED_VARIABLES.join(', ')}.`);
  return { day, variable };
}

function regionSummary(region, day, variable) {
  const data = getRegionData(region, day, variable);
  return {
    region,
    confidence: data.confidence,
    bustProbability: data.bustProbability,
    mlProbability: data.mlProbability,
    analogueProbability: data.analogueProbability,
    forecastValue: data.forecastValue,
    unit: data.unit,
    weatherSystem: data.fingerprint.systemName,
    regime: data.fingerprint.eventType,
    reasons: data.keyReasons,
  };
}

/** Read-only JSON API over the analysis engine. Returns null for unknown paths. */
function handleAnalysisApi(url) {
  switch (url.pathname) {
    case '/api/confidence': {
      const { day, variable } = queryOptions(url);
      return {
        scenario: SCENARIO,
        day,
        variable,
        regions: STATE_POSITIONS.map((state) => regionSummary(state.name, day, variable)),
      };
    }
    case '/api/region': {
      const { day, variable } = queryOptions(url);
      const name = url.searchParams.get('name') ?? '';
      if (!REGION_NAMES.has(name)) throw new Error(`Unknown region. Use one of: ${[...REGION_NAMES].join(', ')}.`);
      return {
        scenario: SCENARIO,
        result: getRegionData(name, day, variable),
        analogues: getAnalogueData(name, day, variable),
        leadErrorCurve: getLeadErrorCurve(name, variable),
        explanation: getExplanation(name, day, variable),
      };
    }
    case '/api/heatmap': {
      const { variable } = queryOptions(url);
      return { scenario: SCENARIO, variable, byDay: getConfidenceByDay(variable) };
    }
    case '/api/error-prone': {
      const { variable } = queryOptions(url);
      return { scenario: SCENARIO, variable, regions: getErrorProneRegions(variable) };
    }
    case '/api/nwp': {
      const file = resolve(root, 'src/data/nwpForecasts.json');
      if (!existsSync(file)) throw new Error('No extracted NWP data. Run npm run extract:nwp first.');
      return JSON.parse(readFileSync(file, 'utf8'));
    }
    case '/api/verification': {
      const { pairs, ...summary } = getRealVerification();
      return url.searchParams.get('pairs') === 'true' ? { ...summary, pairs } : { ...summary, pairCount: pairs.length };
    }
    case '/api/case': {
      const id = url.searchParams.get('id') ?? CASES[0]?.id;
      const definition = CASES.find((item) => item.id === id);
      if (!definition) throw new Error(`id must be one of: ${CASES.map((item) => item.id).join(', ')}.`);
      const { day, variable } = queryOptions(url);
      return {
        case: definition,
        day,
        variable,
        cells: getCaseDay(definition.id, day, variable),
        basinSystems: getCaseBasinSystems(definition.id),
        evaluation: getCaseEvaluation(definition.id, variable),
      };
    }
    case '/api/real-model': {
      const variable = url.searchParams.get('variable') === 'temperature' ? 'temperature' : 'rainfall';
      const { outOfFold, ...summary } = variable === 'temperature' ? getRealTempModel() : getRealModel();
      return summary;
    }
    case '/api/temperature-verification': {
      const { pairs, ...summary } = getTempVerification();
      return url.searchParams.get('pairs') === 'true' ? { ...summary, pairs } : { ...summary, pairCount: pairs.length };
    }
    case '/api/imd':
      return {
        source: IMD_SOURCE,
        note: IMD_NOTE,
        years: IMD_YEARS,
        regions: Object.fromEntries(STATE_POSITIONS.map((state) => [
          state.name, { ...observedSummary(state.name), monsoonAverages: monsoonAverages(state.name) },
        ])),
      };
    case '/api/model':
      return { rainfall: getModelMetrics('rainfall'), temperature: getModelMetrics('temperature') };
    default:
      return null;
  }
}

function getDatasetStatus() {
  if (!existsSync(datasetDirectory)) {
    return {
      available: false,
      fileCount: 0,
      initializations: [],
      forecastDays: [],
      variables: [],
      observationDataAvailable: false,
      readyForBustEvaluation: false,
    };
  }

  const matches = readdirSync(datasetDirectory)
    .map((file) => file.match(/^([A-Za-z0-9-]+)_IC(\d{8})_day(\d{2})\.nc$/))
    .filter(Boolean);
  const initializations = [...new Set(matches.map((match) => match[2]))]
    .sort()
    .map((date) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  const forecastDays = [...new Set(matches.map((match) => Number(match[3])))].sort((a, b) => a - b);
  const variables = [...new Set(matches.map((match) => match[1]))];

  return {
    available: matches.length > 0,
    fileCount: matches.length,
    initializations,
    forecastDays,
    variables,
    observationDataAvailable: false,
    readyForBustEvaluation: false,
  };
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'POST' && url.pathname === '/api/gemini/case-briefing') {
    try {
      const body = await readJson(request);
      const explanation = await callGemini(createCasePrompt({
        caseId: String(body.caseId ?? ''), day: Number(body.day), region: String(body.region ?? ''), variable: String(body.variable ?? 'rainfall'),
      }));
      sendJson(response, 200, { explanation });
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message || 'Unable to generate briefing.' });
    }
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/gemini/explanation') {
    try {
      const body = await readJson(request);
      const explanation = await callGemini(createPrompt(body.evidence));
      sendJson(response, 200, { explanation });
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message || 'Unable to generate briefing.' });
    }
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/dataset/status') {
    sendJson(response, 200, getDatasetStatus());
    return;
  }
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    try {
      const body = handleAnalysisApi(url);
      if (body) sendJson(response, 200, body);
      else sendJson(response, 404, { error: 'Unknown API endpoint.' });
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Invalid request.' });
    }
    return;
  }
  if (request.method === 'GET') return serveStatic(url.pathname, response);
  sendJson(response, 405, { error: 'Method not allowed.' });
}).listen(port, () => {
  console.log(`Forecast Bust server listening at http://localhost:${port}`);
});
