import { Navigate } from 'react-router-dom'

/** Legacy route — results entry is now scoped to a test request. */
export function LabResultsPage() {
  return <Navigate to="/laboratory/requests" replace />
}
