import { apiClient } from '@/api/client'

export const wardService = {
  getAdmittedPatients: () => apiClient.get('/consultation/inpatient/admissions'),
  getAdmissionDetails: (id: string) => apiClient.get(`/consultation/inpatient/admissions/${id}`),
  getInpatientOrders: (id: string) => apiClient.get(`/consultation/inpatient/admissions/${id}/orders`),
  issueInpatientOrder: (id: string, data: any) => apiClient.post(`/consultation/inpatient/admissions/${id}/orders`, data),
  updateOrderStatus: (orderId: string, status: string) => apiClient.put(`/consultation/inpatient/orders/${orderId}/status`, { status }),
  dischargePatient: (id: string, data: any) => apiClient.post(`/consultation/inpatient/admissions/${id}/discharge`, data),
}


