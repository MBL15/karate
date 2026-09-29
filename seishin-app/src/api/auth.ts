import type { AuthResponse, UserRole } from './types'
import { apiFetch } from './client'

export const authApi = {
  register: (payload: { firstName: string; lastName: string; phone: string; role: UserRole }) =>
    apiFetch<{ message: string; expiresInMinutes: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requestOtp: (phone: string, role: UserRole) =>
    apiFetch<{ message: string; expiresInMinutes: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    }),

  verifyOtp: (phone: string, code: string, role: UserRole) =>
    apiFetch<AuthResponse>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, role }),
    }),

  linkChild: (code: string) =>
    apiFetch<{ message: string; studentId: number; studentName: string }>('/api/auth/invite/link', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
}
