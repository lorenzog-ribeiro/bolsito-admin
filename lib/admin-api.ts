import { apiFetch, getApiUrl } from "./api"

export interface AuthUserAdmin {
  id: number
  username: string
  email: string
  name: string | null
  isStaff: boolean
  isSuperuser: boolean
  isActive: boolean
}

export interface AuthUserWithPermissions extends AuthUserAdmin {
  groups: string[]
  permissions: { name: string; codename: string }[]
}

export async function listAdminUsers(token: string): Promise<AuthUserAdmin[]> {
  return apiFetch<AuthUserAdmin[]>("/auth/admin/users", { token })
}

export async function getUserWithPermissions(
  userId: number,
  token: string
): Promise<AuthUserWithPermissions> {
  return apiFetch<AuthUserWithPermissions>(`/auth/admin/users/${userId}`, {
    token,
  })
}

export async function updateUserPermissions(
  userId: number,
  data: { isStaff?: boolean; isSuperuser?: boolean; isActive?: boolean },
  token: string
): Promise<AuthUserAdmin> {
  return apiFetch<AuthUserAdmin>(`/auth/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  })
}

export async function changeUserPassword(
  userId: number,
  newPassword: string,
  token: string
): Promise<void> {
  const url = getApiUrl(`/auth/admin/users/${userId}/change-password`)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
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
}

export async function deleteUser(
  userId: number,
  token: string
): Promise<void> {
  const url = getApiUrl(`/auth/admin/users/${userId}`)
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
}

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<void> {
  const url = getApiUrl("/auth/change-password")
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
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
}
