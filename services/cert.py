# References:
# - https://github.com/openwisp/django-x509/blob/0.4.1/django_x509/base/models.py
# - https://www.pyopenssl.org/en/stable/api/crypto.html
# - https://www.openssl.org/docs/manmaster/man5/x509v3_config.html
# - https://www.digitalocean.com/community/tutorials/how-to-set-up-an-openvpn-server-on-ubuntu-16-04

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

from OpenSSL import crypto

from error import BasicError

_timestamp_format = '%Y%m%d%H%M%SZ'


def _parse_timestamp(timestamp: str) -> datetime:
    return datetime.strptime(timestamp, _timestamp_format)


def _format_timestamp(time: datetime) -> str:
    return datetime.strftime(time, _timestamp_format)


class CertServiceError(BasicError):
    pass


class Cert:
    def __init__(self, x509: crypto.X509):
        self._x509 = x509

    def __repr__(self):
        return '<Cert "%s" [%d] %s [%s]-[%s]>' % \
               (self.common_name or 'Unknown',
                self.serial_number,
                self.algorithm,
                self.validity_start, self.validity_end)

    @property
    def x509(self) -> crypto.X509:
        return self._x509

    @property
    def key_length(self) -> int:
        return self._x509.get_pubkey().bits()

    @property
    def algorithm(self) -> str:
        return self._x509.get_signature_algorithm().decode()

    @property
    def validity_start(self) -> datetime:
        return _parse_timestamp(self._x509.get_notBefore().decode())

    @property
    def validity_end(self) -> datetime:
        return _parse_timestamp(self._x509.get_notAfter().decode())

    @property
    def common_name(self) -> Optional[str]:
        return self._x509.get_subject().commonName

    @property
    def serial_number(self) -> int:
        return self._x509.get_serial_number()

    def dump(self) -> str:
        return crypto.dump_certificate(crypto.FILETYPE_PEM, self._x509).decode()

    def dump_text(self) -> str:
        return crypto.dump_certificate(crypto.FILETYPE_TEXT, self._x509).decode()


class PrivateKey:
    def __init__(self, pkey: crypto.PKey):
        self._pkey = pkey

    def __repr__(self):
        return '<PrivateKey (%d bits)>' % self.key_length

    @property
    def pkey(self) -> crypto.PKey:
        return self._pkey

    @property
    def key_length(self) -> int:
        return self._pkey.bits()

    def dump(self) -> str:
        return crypto.dump_privatekey(crypto.FILETYPE_PEM, self._pkey).decode()

    def dump_text(self) -> str:
        return crypto.dump_privatekey(crypto.FILETYPE_TEXT, self._pkey).decode()


class BuildX509Params:
    def __init__(self,
                 serial_number: int = None,
                 validity_start: datetime = None,
                 validity_end: datetime = None,
                 subject_components: dict = None):
        if serial_number is None:
            serial_number = uuid.uuid4().int
        if validity_start is None:
            validity_start = datetime.utcnow()
        if validity_end is None:
            validity_end = validity_start + timedelta(days=365)
        if subject_components is None:
            subject_components = {'commonName': 'MyCommonName'}  # commonName is compulsory

        self.serial_number = serial_number
        self.validity_start = validity_start
        self.validity_end = validity_end
        self.subject_components = subject_components


class BuildPKeyParams:
    def __init__(self, key_length: int = 2048):
        self.key_length = key_length


class CertService:
    default_digest = 'sha256'

    @staticmethod
    def load_cert(cert_data: bytes) -> Cert:
        if not cert_data:
            raise CertServiceError('cert data must not be empty')
        try:
            x509 = crypto.load_certificate(crypto.FILETYPE_PEM, cert_data)
            return Cert(x509)
        except crypto.Error as e:
            raise CertServiceError('cert load failed', e.args[0])

    @staticmethod
    def load_pkey(pkey_data: bytes, passphrase=None) -> PrivateKey:
        if not pkey_data:
            raise CertServiceError('pkey data must not be empty')

        try:
            pkey = crypto.load_privatekey(crypto.FILETYPE_PEM, pkey_data, passphrase)
            return PrivateKey(pkey)
        except crypto.Error as e:
            raise CertServiceError('pkey load failed', e.args[0])

    @classmethod
    def load_cert_file(cls, cert_path: str) -> Cert:
        if not cert_path:
            raise CertServiceError('cert path is required')
        if not os.path.exists(cert_path):
            raise CertServiceError('cert file does not exist')

        with open(cert_path, 'rb') as f:
            buffer = f.read()

        return cls.load_cert(buffer)

    @classmethod
    def load_pkey_file(cls, pkey_path: str, passphrase=None) -> PrivateKey:
        if not pkey_path:
            raise CertServiceError('pkey path is required')
        if not os.path.exists(pkey_path):
            raise CertServiceError('pkey does not exist')

        with open(pkey_path, 'rb') as f:
            buffer = f.read()

        return cls.load_pkey(buffer, passphrase)

    @staticmethod
    def verify_cert_ca(cert: Cert, ca_cert: Cert):
        store = crypto.X509Store()
        store.add_cert(ca_cert.x509)
        store_ctx = crypto.X509StoreContext(store, cert.x509)
        try:
            store_ctx.verify_certificate()
        except crypto.X509StoreContextError as e:
            raise CertServiceError('CA does not match', e.args[0])

    @classmethod
    def verify_cert_pkey(cls, cert: Cert, pkey: PrivateKey):
        if cert is None:
            raise CertServiceError('cert is required')
        if pkey is None:
            raise CertServiceError('pkey is required')

        data = b'Test data for cert-pkey verification.'
        digest = cls.default_digest

        try:
            signature = crypto.sign(pkey.pkey, data, digest)
            crypto.verify(cert.x509, signature, data, digest)
        except crypto.Error as e:
            raise CertServiceError('pkey does not match', e.args[0])

    @staticmethod
    def _build_pkey(params: BuildPKeyParams) -> crypto.PKey:
        key = crypto.PKey()
        key.generate_key(crypto.TYPE_RSA, params.key_length)
        return key

    @staticmethod
    def _build_x509(params: BuildX509Params) -> crypto.X509:
        cert = crypto.X509()
        cert.set_version(0x2)
        cert.set_serial_number(params.serial_number)
        cert.set_notBefore(_format_timestamp(params.validity_start).encode())
        cert.set_notAfter(_format_timestamp(params.validity_end).encode())
        subject = cert.get_subject()
        for k, v in params.subject_components.items():
            setattr(subject, k, v)
        return cert

    @classmethod
    def build_ca(cls, pkey_params: BuildPKeyParams, x509_params: BuildX509Params) -> Tuple[PrivateKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_x509(x509_params)
        cert.set_pubkey(key) # key is a key pair

        # use self as issuer
        cert.set_issuer(cert.get_subject())

        # have to add extensions in multiple steps
        cert.add_extensions([
            crypto.X509Extension(b'subjectKeyIdentifier', False, b'hash', subject=cert)
        ])
        cert.add_extensions([
            # use self as authority/issuer
            crypto.X509Extension(b'authorityKeyIdentifier', False, b'keyid:always,issuer:always', issuer=cert)
        ])
        cert.add_extensions([
            crypto.X509Extension(b'basicConstraints', False, b'CA:TRUE')
            # TODO add "keyUsage"?
            # The old OpenVPN EasyRSA produced a CA certificate with no 'keyUsage' extension.
        ])

        # noinspection PyTypeChecker
        # sign() function has wrong type annotation for 'digest'
        # use own key to sign
        cert.sign(key, cls.default_digest)
        return PrivateKey(key), Cert(cert)

    @classmethod
    def build_server(cls, pkey_params: BuildPKeyParams, x509_params: BuildX509Params,
                     ca_cert: Cert, ca_pkey: PrivateKey) -> Tuple[PrivateKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_x509(x509_params)
        cert.set_pubkey(key)  # key is a key pair

        # use CA as issuer
        cert.set_issuer(ca_cert.x509.get_subject())

        # have to add extensions in multiple steps
        cert.add_extensions([
            crypto.X509Extension(b'basicConstraints', False, b'CA:FALSE'),
            crypto.X509Extension(b'nsCertType', False, b'server'),
            crypto.X509Extension(b'nsComment', False, b'Python Generated Server Certificate'),
            crypto.X509Extension(b'subjectKeyIdentifier', False, b'hash', subject=cert)
        ])
        cert.add_extensions([
            # use CA as authority/issuer
            crypto.X509Extension(b'authorityKeyIdentifier', False, b'keyid:always,issuer:always', issuer=ca_cert.x509)
        ])
        subject_alt_name = 'DNS:%s' % cert.get_subject().commonName
        cert.add_extensions([
            crypto.X509Extension(b'extendedKeyUsage', False, b'serverAuth'),
            crypto.X509Extension(b'keyUsage', False, b'digitalSignature,keyEncipherment'),
            crypto.X509Extension(b'subjectAltName', False, subject_alt_name.encode())
        ])

        # noinspection PyTypeChecker
        # sign() function has wrong type annotation for 'digest'
        # use CA key to sign
        cert.sign(ca_pkey.pkey, cls.default_digest)
        return PrivateKey(key), Cert(cert)

    @classmethod
    def build_client(cls, pkey_params: BuildPKeyParams, x509_params: BuildX509Params,
                     ca_cert: Cert, ca_pkey: PrivateKey) -> Tuple[PrivateKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_x509(x509_params)
        cert.set_pubkey(key)  # key is a key pair

        # use CA as issuer
        cert.set_issuer(ca_cert.x509.get_subject())

        # have to add extensions in multiple steps
        cert.add_extensions([
            crypto.X509Extension(b'basicConstraints', False, b'CA:FALSE'),
            crypto.X509Extension(b'nsComment', False, b'Python Generated Server Certificate'),
            crypto.X509Extension(b'subjectKeyIdentifier', False, b'hash', subject=cert)
        ])
        cert.add_extensions([
            # use CA as authority/issuer
            crypto.X509Extension(b'authorityKeyIdentifier', False, b'keyid:always,issuer:always', issuer=ca_cert.x509)
        ])
        subject_alt_name = 'DNS:%s' % cert.get_subject().commonName
        cert.add_extensions([
            crypto.X509Extension(b'extendedKeyUsage', False, b'clientAuth'),
            crypto.X509Extension(b'keyUsage', False, b'digitalSignature'),
            crypto.X509Extension(b'subjectAltName', False, subject_alt_name.encode())
        ])

        # noinspection PyTypeChecker
        # sign() function has wrong type annotation for 'digest'
        # use CA key to sign
        cert.sign(ca_pkey.pkey, cls.default_digest)
        return PrivateKey(key), Cert(cert)
