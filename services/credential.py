import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from error import BasicError
from models import ClientCredential, Client, db
from tools.cert import CertTool, BuildPKeyParams, BuildCertParams
from tools.config import ConfigTool


class CredentialServiceError(BasicError):
    pass


class CredentialService:
    _ca_cert_path = '/etc/openvpn/ca.crt'
    _ca_pkey_path = '/etc/openvpn/ca.key'
    _crl_path = '/etc/openvpn/crl.pem'
    _cert_valid_days = 365
    _cert_subject_default_fields = {}
    _crl_valid_days = 30
    _tls_auth_key_path = '/etc/openvpn/ta.key'
    _client_base_config_path = '/etc/openvpn/client_base.conf'
    _linux_client_base_config_path = '/etc/openvpn/client_base_linux.conf'

    @classmethod
    def init(cls, config: dict):
        cls._ca_cert_path = config.get('ca_cert_path', cls._ca_cert_path)
        cls._ca_pkey_path = config.get('ca_pkey_path', cls._ca_pkey_path)
        cls._crl_path = config.get('crl_path', cls._crl_path)
        cls._cert_valid_days = config.get('cert_valid_days', cls._cert_valid_days)
        cls._cert_subject_default_fields = config.get('cert_subject_default_fields', cls._cert_subject_default_fields)
        cls._crl_valid_days = config.get('crl_valid_days', cls._crl_valid_days)
        cls._tls_auth_key_path = config.get('tls_auth_key_path', cls._tls_auth_key_path)
        cls._client_base_config_path = config.get('client_base_config_path', cls._client_base_config_path)
        cls._linux_client_base_config_path = config.get('linux_client_base_config_path',
                                                        cls._linux_client_base_config_path)

    @staticmethod
    def get(_id: int) -> Optional[ClientCredential]:
        if _id is None:
            raise CredentialServiceError('id is required')
        if type(_id) is not int:
            raise CredentialServiceError('id must be an integer')

        return ClientCredential.query.get(_id)

    @staticmethod
    def get_all_revoked() -> List[ClientCredential]:
        return ClientCredential.query.filter_by(is_revoked=True).all()

    @staticmethod
    def revoke(cred: ClientCredential):
        if cred is None:
            raise CredentialServiceError('credential is required')

        if cred.is_revoked:
            raise CredentialServiceError('credential is already revoked')

        cred.is_revoked = True
        cred.revoked_at = datetime.utcnow()

    @staticmethod
    def unrevoke(cred: ClientCredential):
        if cred is None:
            raise CredentialServiceError('credential is required')

        if not cred.is_revoked:
            raise CredentialServiceError('credential is not revoked')

        if any(not cred.is_revoked for cred in cred.client.credentials):
            raise CredentialServiceError('client already has active credentials')

        cred.is_revoked = False
        cred.revoked_at = None

    @staticmethod
    def _add(client: Client, cert_data: bytes, pkey_data: bytes, is_revoked: bool = False, revoked_at: datetime = None,
             is_imported: bool = False) -> ClientCredential:
        if client is None:
            raise CredentialServiceError('client is required')
        if not cert_data:
            raise CredentialServiceError('cert data is required')
        if not pkey_data:
            raise CredentialServiceError('pkey data is required')

        if is_revoked and revoked_at is None:
            raise CredentialServiceError('revoked_at is required when cert is revoked')

        # ensure each client has at most one active (non-revoked) credential
        if not is_revoked and any(not cred.is_revoked for cred in client.credentials):
            raise CredentialServiceError('client already has active credentials')

        cred = ClientCredential(client_id=client.id, cert=cert_data, pkey=pkey_data,
                                is_revoked=is_revoked, revoked_at=revoked_at, is_imported=is_imported)
        db.session.add(cred)
        return cred

    @classmethod
    def generate_for_client(cls, client: Client, revoke_old: bool = False) -> ClientCredential:
        if client is None:
            raise CredentialServiceError('client is required')

        for old_cred in client.credentials:
            if not old_cred.is_revoked:
                if revoke_old:
                    cls.revoke(old_cred)
                else:
                    raise CredentialServiceError('client already has active credentials')

        # prepare params
        now = datetime.utcnow()
        subject = dict(cls._cert_subject_default_fields)  # make a copy first
        subject['commonName'] = client.name
        if client.email:
            subject['emailAddress'] = client.email
        pkey_params = BuildPKeyParams(2048)
        cert_params = BuildCertParams(uuid.uuid4().int, now, now + timedelta(days=cls._cert_valid_days), subject)

        # load ca cert and ca pkey
        ca_cert = CertTool.load_cert_file(cls._ca_cert_path)
        ca_pkey = CertTool.load_pkey_file(cls._ca_pkey_path)

        # start build
        pkey, cert = CertTool.build_client(pkey_params, cert_params, ca_cert, ca_pkey)

        return cls._add(client, cert.dump(), pkey.dump())

    @classmethod
    def import_for_client(cls, client: Client, cert_path: str, pkey_path: str,
                          is_revoked: bool = False, revoked_at: datetime = None,
                          check_common_name: bool = True) -> ClientCredential:
        if client is None:
            raise CredentialServiceError('client is required')
        if not cert_path:
            raise CredentialServiceError('cert path is required')
        if not pkey_path:
            raise CredentialServiceError('pkey path is required')
        if not os.path.exists(cert_path):
            raise CredentialServiceError('cert file does not exist')
        if not os.path.exists(pkey_path):
            raise CredentialServiceError('pkey file does not exist')

        if not is_revoked and any(not cred.is_revoked for cred in client.credentials):
            raise CredentialServiceError('client already has active credentials')

        # load cert
        cert = CertTool.load_cert_file(cert_path)
        if check_common_name and cert.common_name != client.name:
            raise CredentialServiceError('cert common name does not match client name')

        # load pkey
        pkey = CertTool.load_pkey_file(pkey_path)

        # verify cert and pkey
        CertTool.verify_cert_pkey(cert, pkey)

        # load ca cert
        ca_cert = CertTool.load_cert_file(cls._ca_cert_path)

        # verify cert against ca
        CertTool.verify_cert_ca(cert, ca_cert)

        # Dumped data is stored. For certificates, the dumped data is not necessarily the same as the content in the
        # original files. Check the unit test for more details.
        return cls._add(client, cert.dump(), pkey.dump(), is_revoked, revoked_at, is_imported=True)

    @classmethod
    def update_crl(cls):
        # load revoked certs
        revoke_list = [(CertTool.load_cert(cred.cert), cred.revoked_at) for cred in cls.get_all_revoked()]

        # load ca cert and ca pkey
        ca_cert = CertTool.load_cert_file(cls._ca_cert_path)
        ca_pkey = CertTool.load_pkey_file(cls._ca_pkey_path)

        # start build
        crl = CertTool.build_crl(revoke_list, ca_cert, ca_pkey, cls._crl_valid_days)

        # update crl file
        with open(cls._crl_path, 'wb') as f:
            f.write(crl.dump())

    @classmethod
    def export_client_config(cls, cred: ClientCredential, is_linux: bool = False) -> str:
        if cred is None:
            raise CredentialServiceError('credential is required')

        # load ca cert
        ca_cert = CertTool.load_cert_file(cls._ca_cert_path)

        # load client credentials
        cert = CertTool.load_cert(cred.cert)
        pkey = CertTool.load_pkey(cred.pkey)

        if is_linux:
            base_config_path = cls._linux_client_base_config_path
        else:
            base_config_path = cls._client_base_config_path
        return ConfigTool.build_client_config(base_config_path, ca_cert, cert, pkey, cls._tls_auth_key_path)
