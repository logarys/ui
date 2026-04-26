import { environment } from '$lib/config/environment';
import type { CurrentUser } from '$services/auth/auth.store';
import { HttpClient } from './http-client';
import { createApiRequestError } from './api-error';

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

export class AuthApi {
  constructor(private readonly httpClient: HttpClient) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.httpClient.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      email,
      password
    });

    if (!response.isOk() || !response.data) {
      throw createApiRequestError(response, 'Invalid credentials');
    }

    return response.data;
  }
}
