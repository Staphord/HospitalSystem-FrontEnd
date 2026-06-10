import { apiClient } from '@/api/client'
import type { AuthUser } from '@/store/authStore'

export const usersService = {
  getMe: () => apiClient.get<AuthUser>('/me').then((r) => r.data),
}
