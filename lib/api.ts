const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export function getApiUrl(path: string): string {
  return `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(getApiUrl(path), {
    ...init,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    let message = "Erro na requisição"
    try {
      const json = JSON.parse(body)
      message = json.message ?? json.error ?? message
    } catch {
      message = body || message
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}
