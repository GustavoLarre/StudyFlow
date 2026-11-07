export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ApiClientOptions {
  baseUrl: string
  getToken: () => Promise<string | null>
  onUnauthorized?: () => void
  fetchFn?: typeof fetch
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function createApiClient({ baseUrl, getToken, onUnauthorized, fetchFn }: ApiClientOptions) {
  const doFetch = fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args))

  async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const token = await getToken()
    if (!token) {
      onUnauthorized?.()
      throw new ApiError('Sessão expirada. Faça login novamente.', 401)
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    const init: RequestInit = { method, headers }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }

    let response: Response
    try {
      response = await doFetch(`${baseUrl}${path}`, init)
    } catch {
      throw new ApiError('Não foi possível conectar ao servidor.', 0)
    }

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.()
      throw new ApiError(
        data?.error ?? `Erro inesperado (${response.status}).`,
        response.status,
        data?.code,
      )
    }

    return data as T
  }

  return {
    get: <T = unknown>(path: string) => request<T>('GET', path),
    post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
    put: <T = unknown>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
    patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
    delete: <T = unknown>(path: string) => request<T>('DELETE', path),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>