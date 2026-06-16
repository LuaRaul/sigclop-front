import { api } from './api'

export async function listResource(endpoint) {
  const { data } = await api.get(endpoint)
  return Array.isArray(data) ? data : data.data || []
}

export async function getResource(endpoint) {
  const { data } = await api.get(endpoint)
  return data
}

export async function createResource(endpoint, payload) {
  const { data } = await api.post(endpoint, payload)
  return data
}

export async function updateResource(endpoint, id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload)
  return data
}

export async function deleteResource(endpoint, id) {
  await api.delete(`${endpoint}/${id}`)
}
