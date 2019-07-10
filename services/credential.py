import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from error import BasicError
from models import ClientCredential, Client, db
from tools.cert import CertTool, BuildPKeyParams, BuildCertParams, PKey, Cert


class CredentialServiceError(BasicError):
    pass


class CredentialService:
    _cert_valid_days = 365
    _cert_subject_default_fields = {}

    @classmethod
    def init(cls, config: dict):
        cls._cert_valid_days = config.get('cert_valid_days', cls._cert_valid_days)
        cls._cert_subject_default_fields = config.get('cert_subject_default_fields', cls._cert_subject_default_fields)

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
    def generate_for_client(cls, client: Client, ca_cert: Cert, ca_pkey: PKey) -> ClientCredential:
        if client is None:
            raise CredentialServiceError('client is required')

        # revoke all old credentials
        for old_cred in client.credentials:
            if not old_cred.is_revoked:
                cls.revoke(old_cred)

        # generate pkey and cert
        now = datetime.utcnow()
        subject = dict(cls._cert_subject_default_fields)  # make a copy first
        subject['commonName'] = client.name
        if client.email:
            subject['emailAddress'] = client.email

        pkey, cert = CertTool.build_client(
            BuildPKeyParams(2048),
            BuildCertParams(
                uuid.uuid4().int,
                now,
                now + timedelta(days=cls._cert_valid_days),
                subject
            ),
            ca_cert, ca_pkey
        )

        return cls._add(client, cert.dump(), pkey.dump())

    @classmethod
    def import_for_client(cls, client: Client, cert_data: bytes, pkey_data: bytes,
                          is_revoked: bool = False, revoked_at: datetime = None) -> ClientCredential:
        return cls._add(client, cert_data, pkey_data, is_revoked, revoked_at, is_imported=True)
