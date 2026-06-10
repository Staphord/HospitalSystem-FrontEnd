export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
