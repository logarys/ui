import { environment } from '$lib/config/environment';
import type { LogEntry, LogSearchParams } from '$entities/log-entry';
import { HttpClient } from './http-client';
import { createApiRequestError } from './api-error';
import { normalizeListResponse } from './response-normalizer';

export class LogsApi {
  constructor(private readonly httpClient: HttpClient) {}

  async search(params: LogSearchParams = {}): Promise<LogEntry[]> {
    const response = await this.httpClient.get<unknown>(`${environment.apiUrl}/logs`, {
      pipelineId: params.pipelineId,
      level: params.level,
      filter: params.query,
      limit: params.limit ?? 100
    });

    if (!response.isOk()) {
      throw createApiRequestError(response, 'Unable to load logs');
    }

    return normalizeListResponse<LogEntry>(response.data);
  }
}
