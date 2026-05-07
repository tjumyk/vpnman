import { z } from 'zod'

export const basicErrorSchema = z.object({
  msg: z.string(),
  detail: z.union([z.string(), z.null()]).optional().transform((v) => (v === null ? undefined : v)),
  redirect_url: z.union([z.string(), z.null()]).optional().transform((v) => (v === null ? undefined : v)),
})

export const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
})

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  groups: z.array(groupSchema),
})

export const dnSchema = z.record(z.string(), z.string())

export const pKeySchema = z.object({
  type: z.string(),
  bits: z.number(),
})

export const certExtensionSchema = z.object({
  name: z.string(),
  is_critical: z.boolean(),
  text: z.string(),
})

export const certSchema = z.object({
  version: z.number(),
  subject: dnSchema,
  issuer: dnSchema,
  serial_number: z.string(),
  validity_start: z.string(),
  validity_end: z.string(),
  signature_algorithm: z.string(),
  extensions: z.array(certExtensionSchema),
  public_key: pKeySchema,
})

export const clientCredentialSchema = z.object({
  id: z.number(),
  client_id: z.number(),
  is_revoked: z.boolean(),
  revoked_at: z.string().nullable().transform((v) => v ?? ''),
  is_imported: z.boolean(),
  created_at: z.string(),
  modified_at: z.string(),
  cert: certSchema.optional(),
  pkey: pKeySchema.optional(),
})

export const clientSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  email: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
  user: userSchema.optional(),
  credentials: z.array(clientCredentialSchema).default([]),
})

export const openVPNVersionSchema = z.object({
  management: z.string(),
  openvpn: z.string(),
})

export const openVPNClientSchema = z
  .object({
    bytes_received: z.number(),
    bytes_sent: z.number(),
    client_id: z.number(),
    common_name: z.string(),
    connected_since: z.number(),
    peer_id: z.number(),
    real_address: z.string(),
    username: z.union([z.string(), z.null()]),
    virtual_address: z.string(),
    virtual_ipv6_address: z.string(),
  })
  .passthrough()

export const openVPNStatusSchema = z.object({
  client_list: z.array(openVPNClientSchema).optional(),
  global_stats: z.array(z.string()),
  routing_table: z.array(z.object({})).optional(),
})

export const openVPNStateSchema = z.object({
  description: z.string(),
  local_ip: z.string(),
  remote_ip: z.string(),
  state: z.string(),
  time: z.number(),
})

export const openVPNLoadStatsSchema = z.object({
  bytesin: z.number(),
  bytesout: z.number(),
  nclients: z.number(),
})

export const openVPNInfoSchema = z.object({
  load_stats: openVPNLoadStatsSchema,
  state: openVPNStateSchema.optional(),
  status: openVPNStatusSchema,
  version: openVPNVersionSchema,
})

export const openVPNServerStatusSchema = z.object({
  online: z.boolean(),
})

export const openVPNLogLineSchema = z.object({
  flags: z.string(),
  message: z.string(),
  time: z.number(),
})

export const routeRuleSchema = z.object({
  id: z.number(),
  ip: z.string(),
  mask: z.string(),
  description: z.string().optional(),
  created_at: z.string(),
  modified_at: z.string(),
})

export const versionSchema = z.object({
  version: z.string(),
})

export type BasicError = z.infer<typeof basicErrorSchema>
export type User = z.infer<typeof userSchema>
export type Client = z.infer<typeof clientSchema>
export type ClientCredential = z.infer<typeof clientCredentialSchema>
export type OpenVPNInfo = z.infer<typeof openVPNInfoSchema>
export type OpenVPNServerStatus = z.infer<typeof openVPNServerStatusSchema>
export type OpenVPNLogLine = z.infer<typeof openVPNLogLineSchema>
export type RouteRule = z.infer<typeof routeRuleSchema>
