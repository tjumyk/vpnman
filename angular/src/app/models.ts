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

export type DN = {[key: string]: string };

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


