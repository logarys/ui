import type { ApiResponse } from './http-client';

export interface ApiErrorOptions {
  status?: number;
  detail?: string;
  query?: string;
  rawBody?: string;
}

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly detail?: string;
  readonly query?: string;
  readonly rawBody?: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status;
    this.detail = options.detail;
    this.query = options.query;
    this.rawBody = options.rawBody;
  }
}

export function createApiRequestError(
  response: ApiResponse<unknown>,
  fallbackMessage: string
): ApiRequestError {
  const payload = normalizeErrorPayload(response.data, response.body);

  const message =
    normalizeMessage(payload?.message) ??
    normalizeMessage(payload?.error) ??
    fallbackMessage;

  const detail =
    normalizeMessage(payload?.details) ??
    normalizeMessage(payload?.detail) ??
    normalizeMessage(payload?.reason);

  const query = normalizeMessage(payload?.query);

  return new ApiRequestError(message, {
    status: Number(response.status),
    detail: detail && detail !== message ? detail : undefined,
    query,
    rawBody: response.body
  });
}

export interface UiErrorMessage {
  message: string;
  detail?: string;
  query?: string;
  status?: number;
}

export function toUiError(error: unknown, fallbackMessage: string): UiErrorMessage {
  if (error instanceof ApiRequestError) {
    return {
      message: error.message || fallbackMessage,
      detail: error.detail,
      query: error.query,
      status: error.status
    };
  }

  if (error instanceof Error) {
    const payload = normalizeErrorPayload(null, error.message);

    if (payload) {
      const message = normalizeMessage(payload.message) ?? fallbackMessage;
      const detail =
        normalizeMessage(payload.details) ??
        normalizeMessage(payload.detail) ??
        normalizeMessage(payload.reason);

      return {
        message,
        detail: detail && detail !== message ? detail : undefined,
        query: normalizeMessage(payload.query),
        status: typeof payload.statusCode === 'number' ? payload.statusCode : undefined
      };
    }

    return {
      message: error.message || fallbackMessage
    };
  }

  return {
    message: fallbackMessage
  };
}

function normalizeErrorPayload(data: unknown, body: string): Record<string, unknown> | null {
  if (isRecord(data)) {
    return data;
  }

  if (!body.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => normalizeMessage(item))
      .filter((item): item is string => Boolean(item));

    return messages.length > 0 ? messages.join('\n') : undefined;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
