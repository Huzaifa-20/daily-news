export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type FetchJson = <T>(url: string, init?: RequestInit) => Promise<T>

type QueryValue = string | number | undefined

/** Builds `path?query`, dropping empty values so providers can pass optional filters as-is. */
export function buildUrl(path: string, params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

/** Pulls a human-readable message out of the error bodies the supported APIs return. */
function describeFailure(status: number, body: unknown): string {
  if (status === 429) return 'Rate limit reached. Please try again in a minute.'
  if (status === 401 || status === 403) return 'The API key was rejected.'

  const candidate = body as {
    message?: unknown
    response?: { message?: unknown }
    fault?: { faultstring?: unknown }
  } | null
  const message =
    candidate?.message ?? candidate?.response?.message ?? candidate?.fault?.faultstring
  return typeof message === 'string' && message ? message : `Request failed (${status}).`
}

export const fetchJson: FetchJson = async <T>(url: string, init?: RequestInit) => {
  let response: Response
  try {
    response = await fetch(url, { ...init, headers: { Accept: 'application/json', ...init?.headers } })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Network error. Check your connection and try again.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(describeFailure(response.status, body), response.status)
  return body as T
}
