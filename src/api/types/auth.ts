export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope?: string
  tenant_id?: string | null
}

export interface SignupRequest {
  hospital_name: string
  admin_username: string
  admin_password: string
  admin_email: string
  admin_full_name?: string
}

export interface SignupResponse extends TokenResponse {
  tenant_id: string
  hospital_name: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  new_password: string
}

export interface ImpersonateRequest {
  target_tenant_id: string
}

export interface ImpersonateResponse {
  access_token: string
  expires_in: number
  target_tenant_id: string
}
