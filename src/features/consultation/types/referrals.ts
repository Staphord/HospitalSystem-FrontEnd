export type ReferralType = 'internal' | 'external'

export type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

export type ReferralUrgency = 'routine' | 'urgent' | 'emergency'

export type ReferralCategory = 'general' | 'follow-up' | 'second-opinion' | 'lab-imaging'

export interface Referral {
  id: string
  patientId: string
  patientName: string
  patientNumber: string
  referredTo: string
  type: ReferralType
  referredAt: string
  reason: string
  status: ReferralStatus
  urgency: ReferralUrgency
  category: ReferralCategory
  department?: string
  preferredDoctor?: string
  hospitalName?: string
  externalDoctor?: string
  contactNumber?: string
  visitId?: string
  declineReason?: string
  respondedAt?: string
}

export interface NewReferralInput {
  patientId: string
  patientName: string
  patientNumber: string
  type: ReferralType
  referredTo: string
  reason: string
  urgency: ReferralUrgency
  category: ReferralCategory
  department?: string
  preferredDoctor?: string
  hospitalName?: string
  externalDoctor?: string
  contactNumber?: string
}
