export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export class HttpClientError extends Error {
  constructor(
    public readonly body: string = '',
    public readonly status: HttpStatus | number = HttpStatus.BAD_REQUEST
  ) {
    super(body);
  }
}

export class ApiResponse<T> {
  constructor(
    public readonly status: HttpStatus | number,
    public readonly body: string,
    public readonly data: T | null
  ) {}

  isOk(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export type RequestParameters = Record<string, string | number | boolean | null | undefined>;

export class HttpClient {
  async request<T>(
    method: string,
    url: string,
    options: {
      parameters?: RequestParameters;
      body?: unknown;
      headers?: HeadersInit;
      timeoutMs?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      parameters = {},
      body = null,
      headers = {},
      timeoutMs = 10000
    } = options;

    const query = this.buildQueryString(parameters);
    const fullUrl = query ? `${url}?${query}` : url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const requestHeaders: HeadersInit = {
      Accept: 'application/json',
      ...(body !== null ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    };

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        signal: controller.signal,
        body: body !== null ? JSON.stringify(body) : undefined
      });

      const text = await response.text();
      const data = this.parseJson<T>(text);

      return new ApiResponse<T>(response.status, text, data);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpClientError('Request timeout', 0);
      }

      throw new HttpClientError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(url: string, parameters: RequestParameters = {}) {
    return this.request<T>('GET', url, { parameters });
  }

  post<T>(url: string, body: unknown = null) {
    return this.request<T>('POST', url, { body });
  }

  put<T>(url: string, body: unknown = null) {
    return this.request<T>('PUT', url, { body });
  }

  patch<T>(url: string, body: unknown = null) {
    return this.request<T>('PATCH', url, { body });
  }

  delete<T>(url: string) {
    return this.request<T>('DELETE', url);
  }

  private buildQueryString(parameters: RequestParameters): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(parameters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      query.set(key, String(value));
    }

    return query.toString();
  }

  private parseJson<T>(text: string): T | null {
    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
}
