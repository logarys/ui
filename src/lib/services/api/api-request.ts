import { HttpClient, type ApiResponse, type RequestParameters } from './http-client';
import { apiUrl } from './api-endpoints';

export interface ApiAttemptError {
  endpoint: string;
  status: number;
  body: string;
}

export class ApiEndpointNotFoundError extends Error {
  constructor(
    public readonly action: string,
    public readonly attempts: ApiAttemptError[]
  ) {
    super(
      `${action} failed on all known endpoints:\n` +
        attempts.map((attempt) => `${attempt.endpoint} -> HTTP ${attempt.status}: ${attempt.body}`).join('\n')
    );
  }
}

function shouldTryNextEndpoint(response: ApiResponse<unknown>): boolean {
  return response.status === 404 || response.status === 405;
}

export async function firstSuccessfulGet<T>(
  httpClient: HttpClient,
  action: string,
  paths: readonly string[],
  parameters: RequestParameters = {}
): Promise<ApiResponse<T>> {
  const attempts: ApiAttemptError[] = [];

  for (const path of paths) {
    const endpoint = apiUrl(path);
    const response = await httpClient.get<T>(endpoint, parameters);

    if (response.isOk()) {
      return response;
    }

    attempts.push({ endpoint, status: response.status, body: response.body });

    if (!shouldTryNextEndpoint(response)) {
      break;
    }
  }

  throw new ApiEndpointNotFoundError(action, attempts);
}

export async function firstSuccessfulPost<T>(
  httpClient: HttpClient,
  action: string,
  paths: readonly string[],
  body: unknown
): Promise<ApiResponse<T>> {
  const attempts: ApiAttemptError[] = [];

  for (const path of paths) {
    const endpoint = apiUrl(path);
    const response = await httpClient.post<T>(endpoint, body);

    if (response.isOk()) {
      return response;
    }

    attempts.push({ endpoint, status: response.status, body: response.body });

    if (!shouldTryNextEndpoint(response)) {
      break;
    }
  }

  throw new ApiEndpointNotFoundError(action, attempts);
}
