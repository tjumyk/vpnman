import { apiClient } from '@/api/client'
import {
  clientCredentialSchema,
  clientSchema,
  openVPNInfoSchema,
  openVPNLogLineSchema,
  openVPNServerStatusSchema,
  routeRuleSchema,
  userSchema,
  versionSchema,
} from '@/api/schemas'

export type RouteForm = {
  ip: string
  mask: string
  description?: string
}

export function isAdminUser(user: { groups: { name: string }[] }): boolean {
  return user.groups.some((group) => group.name === 'admin')
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/api/me')
  return userSchema.parse(response.data)
}

export async function fetchVersion() {
  const response = await apiClient.get('/api/version')
  return versionSchema.parse(response.data)
}

export async function fetchMyClient(details: boolean) {
  const response = await apiClient.get('/api/my-client', { params: details ? { details: 'true' } : undefined })
  return clientSchema.parse(response.data)
}

export async function fetchServerStatus() {
  const response = await apiClient.get('/api/server/status')
  return openVPNServerStatusSchema.parse(response.data)
}

export async function fetchAdminClients() {
  const response = await apiClient.get('/api/admin/clients')
  return clientSchema.array().parse(response.data)
}

export async function fetchAdminClient(clientId: number) {
  const response = await apiClient.get(`/api/admin/clients/${clientId}`)
  return clientSchema.parse(response.data)
}

export async function importAdminClient(userId: number) {
  const response = await apiClient.get(`/api/admin/import-client/${userId}`)
  return clientSchema.parse(response.data)
}

export async function generateCredential(clientId: number) {
  const response = await apiClient.get(`/api/admin/clients/${clientId}/generate-credential`)
  return clientCredentialSchema.parse(response.data)
}

export async function revokeCredential(credentialId: number) {
  const response = await apiClient.put(`/api/admin/credentials/${credentialId}/revoke`, null)
  return clientCredentialSchema.parse(response.data)
}

export async function unrevokeCredential(credentialId: number) {
  const response = await apiClient.delete(`/api/admin/credentials/${credentialId}/revoke`)
  return clientCredentialSchema.parse(response.data)
}

export async function fetchManagementInfo() {
  const response = await apiClient.get('/api/admin/manage/info')
  return openVPNInfoSchema.parse(response.data)
}

export async function fetchManagementLog() {
  const response = await apiClient.get('/api/admin/manage/log')
  return openVPNLogLineSchema.array().parse(response.data)
}

export async function killManagementClient(clientId: number) {
  await apiClient.get(`/api/admin/manage/client-kill/${clientId}`)
}

export async function managementSoftRestart() {
  await apiClient.get('/api/admin/manage/soft-restart')
}

export async function managementHardRestart() {
  await apiClient.get('/api/admin/manage/hard-restart')
}

export async function managementShutdown() {
  await apiClient.get('/api/admin/manage/shutdown')
}

export async function fetchRoutes() {
  const response = await apiClient.get('/api/admin/server/routes')
  return routeRuleSchema.array().parse(response.data)
}

export async function addRoute(form: RouteForm) {
  const response = await apiClient.post('/api/admin/server/routes', form)
  return routeRuleSchema.parse(response.data)
}

export async function updateRoute(routeId: number, form: RouteForm) {
  const response = await apiClient.put(`/api/admin/server/routes/${routeId}`, form)
  return routeRuleSchema.parse(response.data)
}

export async function deleteRoute(routeId: number) {
  await apiClient.delete(`/api/admin/server/routes/${routeId}`)
}
