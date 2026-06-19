import { apiClient } from '@/api/client'
import type {
  ImpersonateRequest,
  ImpersonateResponse,
  LoginResponse,
  LoginRequest,
  MFALoginVerifyRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  RefreshRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
} from '@/api/types/auth'

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  loginSuperAdmin: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/superadmin/login', data).then((r) => r.data),

  signup: (data: SignupRequest) =>
    apiClient.post<SignupResponse>('/auth/signup', data).then((r) => r.data),

  refresh: (data: RefreshRequest) =>
    apiClient.post<TokenResponse>('/auth/refresh', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken }),

  logoutAll: () => apiClient.post('/auth/logout-all'),

  requestPasswordReset: (data: PasswordResetRequest) =>
    apiClient.post('/auth/password-reset', data),

  confirmPasswordReset: (data: PasswordResetConfirm) =>
    apiClient.post('/auth/password-reset/confirm', data),

  setupMfa: () => apiClient.post<{ secret: string; qr_code_url: string }>('/auth/mfa/setup').then((r) => r.data),

  verifyMfa: (code: string) =>
    apiClient.post('/auth/mfa/verify', { totp_code: code }),

  verifyMfaLogin: (data: MFALoginVerifyRequest) =>
    apiClient.post<TokenResponse>('/auth/mfa/verify-login', data).then((r) => r.data),

  impersonate: (data: ImpersonateRequest) =>
    apiClient.post<ImpersonateResponse>('/auth/impersonate', data).then((r) => r.data),
}
