import { environment } from '$lib/config/environment';
import type {
  PipelineConfig,
  PipelineCreatePayload,
  PipelineSearchParams,
  PipelineUpdatePayload
} from '$entities/pipeline-config';
import { HttpClient, type ApiResponse } from './http-client';
import { createApiRequestError } from './api-error';
import { normalizeListResponse } from './response-normalizer';

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

    return normalizeListResponse<PipelineConfig>(response.data);
  }

  async get(id: string): Promise<PipelineConfig> {
    const response = await this.httpClient.get<PipelineConfig>(
      `${environment.apiUrl}/pipelines/${encodeURIComponent(id)}`
    );

    if (!response.isOk() || !response.data) {
      throw createApiRequestError(response, 'Unable to load pipeline');
    }

    return response.data;
  }

  async create(payload: PipelineCreatePayload): Promise<PipelineConfig> {
    const response = await this.httpClient.post<PipelineConfig>(
      `${environment.apiUrl}/pipelines`,
      payload
    );

    if (!response.isOk() || !response.data) {
      throw createApiRequestError(response, 'Unable to create pipeline');
    }

    return response.data;
  }

  async update(id: string, payload: PipelineUpdatePayload): Promise<PipelineConfig> {
    const encodedId = encodeURIComponent(id);
    const endpoints = [
      { method: 'put', url: `${environment.apiUrl}/pipelines/${encodedId}` },
      { method: 'patch', url: `${environment.apiUrl}/pipelines/${encodedId}` },
      { method: 'put', url: `${environment.apiUrl}/configs/pipelines/${encodedId}` },
      { method: 'patch', url: `${environment.apiUrl}/configs/pipelines/${encodedId}` }
    ] as const;

    let lastResponse: ApiResponse<PipelineConfig> | null = null;

    for (const endpoint of endpoints) {
      const response = endpoint.method === 'put'
        ? await this.httpClient.put<PipelineConfig>(endpoint.url, payload)
        : await this.httpClient.patch<PipelineConfig>(endpoint.url, payload);

      if (response.isOk()) {
        return response.data ?? { ...payload, id };
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
