import http from 'node:http';
import { URL } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const host = process.env.APP_HOST ?? '0.0.0.0';
const port = Number(process.env.APP_PORT ?? 3000);
const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URL ?? 'mongodb://mongodb:27017';
const dbName = process.env.MONGODB_DATABASE ?? process.env.MONGO_DB ?? process.env.DB_NAME ?? 'logarys';
const logCollections = (process.env.LOGARYS_LOG_COLLECTIONS ?? 'logs,log_entries,records')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db(dbName);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, status = 204) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  response.end();
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function normalizePipeline(document) {
  const id = document.id ?? document._id?.toString();
  return {
    id,
    _id: document._id?.toString(),
    name: document.name ?? id ?? 'Unnamed pipeline',
    enabled: document.enabled ?? true,
    inputType: document.inputType ?? document.type ?? 'http',
    description: document.description ?? '',
    config: document.config ?? {},
    createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
    updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : document.updatedAt
  };
}

function normalizeLog(document) {
  const id = document.id ?? document._id?.toString();
  const timestamp = document.timestamp ?? document.date ?? document.createdAt ?? document.time ?? new Date();
  const message = document.message ?? document.msg ?? document.text ?? document.raw?.message ?? JSON.stringify(document.raw ?? document.context ?? document);

  return {
    id,
    _id: document._id?.toString(),
    pipelineId: document.pipelineId ?? document.pipeline ?? document.pipeline_id ?? 'unknown',
    level: document.level ?? document.severity ?? 'info',
    message,
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    source: document.source ?? document.host ?? document.service ?? '',
    context: document.context ?? document.metadata ?? document.raw ?? {}
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getStringParam(url, name) {
  const value = url.searchParams.get(name);
  return value && value.trim() !== '' ? value.trim() : null;
}

function getLimit(url) {
  const rawLimit = Number(url.searchParams.get('limit') ?? 100);
  if (!Number.isFinite(rawLimit)) {
    return 100;
  }
  return Math.max(1, Math.min(rawLimit, 1000));
}

async function listPipelines(url) {
  const query = getStringParam(url, 'query') ?? getStringParam(url, 'name');
  const inputType = getStringParam(url, 'inputType');
  const enabled = getStringParam(url, 'enabled');
  const filter = {};

  if (query) {
    const regex = new RegExp(escapeRegExp(query), 'i');
    filter.$or = [{ name: regex }, { id: regex }, { description: regex }];
  }

  if (inputType) {
    filter.inputType = inputType;
  }

  if (enabled === 'true') {
    filter.enabled = true;
  } else if (enabled === 'false') {
    filter.enabled = false;
  }

  const items = await db.collection('pipelines').find(filter).sort({ name: 1 }).limit(200).toArray();
  return items.map(normalizePipeline);
}

async function createPipeline(request) {
  const body = await readJson(request);
  const now = new Date();
  const id = body.id ?? body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? `pipeline-${now.getTime()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : now;
  const { createdAt: _ignoredCreatedAt, _id: _ignoredId, ...updatableBody } = body;
  const pipeline = {
    ...updatableBody,
    id,
    name: body.name ?? id,
    inputType: body.inputType ?? 'http',
    enabled: body.enabled ?? true,
    config: body.config ?? {},
    updatedAt: now
  };

  const result = await db.collection('pipelines').findOneAndUpdate(
    { id },
    { $set: pipeline, $setOnInsert: { _id: new ObjectId(), createdAt } },
    { upsert: true, returnDocument: 'after' }
  );

  return normalizePipeline(result);
}

async function listLogs(url) {
  const pipelineId = getStringParam(url, 'pipelineId');
  const level = getStringParam(url, 'level');
  const query = getStringParam(url, 'query') ?? getStringParam(url, 'q') ?? getStringParam(url, 'search');
  const limit = getLimit(url);
  const filter = {};

  if (pipelineId) {
    filter.$or = [{ pipelineId }, { pipeline: pipelineId }, { pipeline_id: pipelineId }];
  }

  if (level) {
    filter.level = level;
  }

  if (query) {
    const regex = new RegExp(escapeRegExp(query), 'i');
    const searchFilter = {
      $or: [{ message: regex }, { msg: regex }, { text: regex }, { source: regex }, { service: regex }, { host: regex }]
    };

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, searchFilter];
      delete filter.$or;
    } else {
      Object.assign(filter, searchFilter);
    }
  }

  const all = [];
  for (const collectionName of logCollections) {
    const items = await db
      .collection(collectionName)
      .find(filter)
      .sort({ timestamp: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    all.push(...items.map((item) => ({ ...normalizeLog(item), collection: collectionName })));
  }

  all.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return all.slice(0, limit);
}

async function route(request, response) {
  if (request.method === 'OPTIONS') {
    sendEmpty(response);
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  try {
    if (request.method === 'GET' && (path === '/' || path === '/health')) {
      sendJson(response, 200, { status: 'ok', service: 'logarys-ui-api' });
      return;
    }

    if (request.method === 'GET' && (path === '/pipelines' || path === '/api/pipelines')) {
      sendJson(response, 200, await listPipelines(url));
      return;
    }

    if (request.method === 'POST' && (path === '/pipelines' || path === '/api/pipelines')) {
      sendJson(response, 201, await createPipeline(request));
      return;
    }

    if (request.method === 'GET' && (path === '/logs' || path === '/api/logs')) {
      sendJson(response, 200, await listLogs(url));
      return;
    }

    sendJson(response, 404, {
      message: `Cannot ${request.method} ${path}`,
      error: 'Not Found',
      statusCode: 404
    });
  } catch (error) {
    sendJson(response, 500, {
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'Internal Server Error',
      statusCode: 500
    });
  }
}

const server = http.createServer((request, response) => {
  void route(request, response);
});

server.listen(port, host, () => {
  console.log(`logarys-ui-api listening on http://${host}:${port}`);
});

process.on('SIGTERM', async () => {
  server.close();
  await client.close();
  process.exit(0);
});
