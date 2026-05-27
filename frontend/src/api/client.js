function getToken() {
  return localStorage.getItem('enbus_token')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`/api${path}`, { ...options, headers })

  let data
  try { data = await res.json() } catch { data = null }

  if (!res.ok) {
    throw new Error(data?.statusMessage || `Error ${res.status}`)
  }

  return data
}

export const apiGet  = (path)       => request(path, { method: 'GET' })
export const apiPost = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })
