import { apiClient } from '@/api/client'
import type { AuthUser } from '@/store/authStore'

export interface UserUpdatePayload {
  username?: string
  email?: string
  full_name?: string
}

export interface PasswordChangePayload {
  current_password: string
  new_password: string
}

export const usersService = {
  getMe: () => apiClient.get<AuthUser>('/me').then((r) => r.data),
  
  updateMe: (data: UserUpdatePayload) => 
    apiClient.put<{ detail: string }>('/me', data).then((r) => r.data),

  changePassword: (data: PasswordChangePayload) =>
    apiClient.post<{ detail: string }>('/me/password', data).then((r) => r.data),
}
