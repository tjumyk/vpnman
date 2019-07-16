export interface BasicError {
  msg: string;
  detail?: string;
  redirect_url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  nickname?: string;

  groups: Group[];
}

export interface Group {
  id: number;
  name: string;
  description: string;
}

export interface Client {
  id: number;
  user_id: number;
  name: string;

  email: string;

  created_at: string;
  modified_at: string;

  user?: User;
  credentials?: ClientCredential[];
}

export interface ClientCredential {
  id: number;
  client_id: number;

  is_revoked: boolean;
  revoked_at: string;

  is_imported: boolean;

  created_at: string;
  modified_at: string;

  client?: Client;
  cert?: Cert;
  pkey?: PKey;
}

export type DN = { [key: string]: string };

export interface Cert {
  version: number;
  subject: DN;
  issuer: DN;
  serial_number: string;
  validity_start: string;
  validity_end: string;
  signature_algorithm: string;
  extensions: CertExtension[];
  public_key: PKey;
}

export interface CertExtension {
  name: string;
  is_critical: boolean;
  text: string;
}

export interface PKey {
  type: string;
  bits: number;
}


/* OpenVPN Management Interface */

export interface OpenVPNVersion {
  management: string;
  openvpn: string;
}

export interface OpenVPNStatus {
  client_list?: OpenVPNClient[];
  global_stats: OpenVPNGlobalStats;
  routing_table?: OpenVPNRoute[];
}

export interface OpenVPNClient {
  bytes_received: number;
  bytes_sent: number;
  client_id: number;
  common_name: string;
  connected_since: number;
  peer_id: number;
  real_address: string;
  username: null;
  virtual_address: string;
  virtual_ipv6_address: string;
}

export type OpenVPNGlobalStats = string[];

export interface OpenVPNRoute {
  common_name: string;
  last_ref: number;
  real_address: string;
  virtual_address: string;
}

export interface OpenVPNState {
  description: string;
  local_ip: string;
  remote_ip: string;
  state: string;
  time: number;
}

export interface OpenVPNLogLine {
  flags: string;
  message: string;
  time: number;
}

export interface OpenVPNLoadStats {
  bytesin: number;
  bytesout: number;
  nclients: number;
}

export interface OpenVPNInfo {
  load_stats: OpenVPNLoadStats;
  state?: OpenVPNState;
  status: OpenVPNStatus;
  version: OpenVPNVersion;
}

/* Server Config */

export interface RouteRule {
  id: number;
  ip: string;
  mask: string;
  description?: string;

  created_at: string;
  modified_at: string;
}
