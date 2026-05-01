import { environment } from '$lib/config/environment';
import type {
  PipelineConfig,
  PipelineConfigObject,
  PipelineCreatePayload,
  PipelineInputType,
  PipelineParserConfig,
  PipelineSearchParams,
  PipelineUpdatePayload
} from '$entities/pipeline-config';
import { HttpClient, type ApiResponse } from './http-client';
import { createApiRequestError } from './api-error';
import { normalizeListResponse } from './response-normalizer';

type StoragePipelinePayload = {
  id?: string;
  source: string;
  enabled: boolean;
  parser: PipelineParserConfig;
  defaults?: PipelineConfigObject;
  publish?: PipelineConfigObject;
  security?: PipelineConfigObject;
};

export class PipelineApi {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<PipelineConfig[]> {
    return this.search();
  }

  async search(params: PipelineSearchParams = {}): Promise<PipelineConfig[]> {
    const response = await this.httpClient.get<unknown>(
      `${environment.apiUrl}/pipelines`,
      {
        query: params.query,
        inputType: params.inputType,
        enabled: params.enabled
      }
    );

    if (!response.isOk()) {
      throw createApiRequestError(response, 'Unable to load pipelines');
    }

    return normalizeListResponse<PipelineConfig>(response.data).map(normalizePipeline);
  }

  async get(id: string): Promise<PipelineConfig> {
    const response = await this.httpClient.get<PipelineConfig>(
      `${environment.apiUrl}/pipelines/${encodeURIComponent(id)}`
    );

    if (!response.isOk() || !response.data) {
      throw createApiRequestError(response, 'Unable to load pipeline');
    }

    return normalizePipeline(response.data);
  }

  async create(payload: PipelineCreatePayload): Promise<PipelineConfig> {
    const response = await this.httpClient.post<PipelineConfig>(
      `${environment.apiUrl}/pipelines`,
      toStoragePipelinePayload(payload)
    );

    if (!response.isOk() || !response.data) {
      throw createApiRequestError(response, 'Unable to create pipeline');
    }

    return normalizePipeline(response.data);
  }

  async update(id: string, payload: PipelineUpdatePayload): Promise<PipelineConfig> {
    const encodedId = encodeURIComponent(id);
    const storagePayload = toStoragePipelinePayload(payload);
    const endpoints = [
      { method: 'put', url: `${environment.apiUrl}/pipelines/${encodedId}` },
      { method: 'patch', url: `${environment.apiUrl}/pipelines/${encodedId}` },
      { method: 'put', url: `${environment.apiUrl}/configs/pipelines/${encodedId}` },
      { method: 'patch', url: `${environment.apiUrl}/configs/pipelines/${encodedId}` }
    ] as const;

    let lastResponse: ApiResponse<PipelineConfig> | null = null;

    for (const endpoint of endpoints) {
      const response = endpoint.method === 'put'
        ? await this.httpClient.put<PipelineConfig>(endpoint.url, storagePayload)
        : await this.httpClient.patch<PipelineConfig>(endpoint.url, storagePayload);

      if (response.isOk()) {
        return normalizePipeline(response.data ?? { ...storagePayload, id });
      }

      lastResponse = response;

      if (response.status !== 404 && response.status !== 405) {
        break;
      }
    }

    if (!lastResponse) {
      throw new Error('Unable to update pipeline');
    }

    throw createApiRequestError(lastResponse, 'Unable to update pipeline');
  }

  async save(payload: PipelineCreatePayload): Promise<PipelineConfig> {
    return this.create(payload);
  }
}

export function normalizePipeline(pipeline: PipelineConfig): PipelineConfig {
  const parser = isRecord(pipeline.parser) ? pipeline.parser : undefined;
  const config = buildPipelineConfigJson(pipeline);
  const source = String(pipeline.source ?? pipeline.defaults?.source ?? '');
  const format = String(pipeline.format ?? parser?.type ?? 'json');
  const inputType = normalizeInputType(pipeline.inputType ?? pipeline.input ?? 'http');
  const id = String(pipeline.id ?? pipeline.source ?? pipeline._id ?? '');

  return {
    ...pipeline,
    id,
    name: pipeline.name ?? id,
    inputType,
    source,
    format,
    config
  };
}

function buildPipelineConfigJson(pipeline: PipelineConfig): PipelineConfigObject {
  if (isRecord(pipeline.config) && Object.keys(pipeline.config).length > 0) {
    return pipeline.config;
  }

  const config: PipelineConfigObject = {};

  if (isRecord(pipeline.parser)) {
    config.parser = pipeline.parser;
  }

  if (isRecord(pipeline.defaults)) {
    config.defaults = pipeline.defaults;
  }

  if (isRecord(pipeline.publish)) {
    config.publish = pipeline.publish;
  }

  if (isRecord(pipeline.security)) {
    config.security = pipeline.security;
  }

  return config;
}

function toStoragePipelinePayload(payload: PipelineCreatePayload | PipelineUpdatePayload): StoragePipelinePayload {
  const config = isRecord(payload.config) ? payload.config : {};
  const parserConfig = isRecord(config.parser) ? config.parser : {};
  const defaults = isRecord(config.defaults) ? config.defaults : undefined;
  const publish = isRecord(config.publish) ? config.publish : undefined;
  const security = isRecord(config.security) ? config.security : undefined;
  const parserType = String(parserConfig.type ?? payload.format ?? 'json');
  const parser: PipelineParserConfig = {
    ...parserConfig,
    type: parserType
  };

  if (parser.regex && !parser.pattern) {
    parser.pattern = String(parser.regex);
    delete parser.regex;
  }

  return removeUndefined({
    id: payload.id,
    source: payload.source,
    enabled: payload.enabled,
    parser,
    defaults,
    publish,
    security
  }) as StoragePipelinePayload;
}

function normalizeInputType(value: unknown): PipelineInputType {
  if (value === 'syslog' || value === 'file' || value === 'nats') {
    return value;
  }

  return 'http';
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  if (!isRecord(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) {
      result[key] = removeUndefined(item);
    }
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
