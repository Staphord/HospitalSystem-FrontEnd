export interface HospitalUser {
  keycloak_sub: string
  username: string
  email: string
  full_name?: string | null
  role: string
  hospital_id: string
}

export interface HospitalUserCreate {
  username: string
  password: string
  email: string
  full_name?: string
  role: string
}

export interface HospitalUserUpdate {
  email?: string
  full_name?: string
  role?: string
}
