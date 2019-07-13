# References:
# - https://github.com/openwisp/django-x509/blob/0.4.1/django_x509/base/models.py
# - https://www.pyopenssl.org/en/stable/api/crypto.html
# - https://www.openssl.org/docs/manmaster/man5/x509v3_config.html
# - https://www.digitalocean.com/community/tutorials/how-to-set-up-an-openvpn-server-on-ubuntu-16-04
# - https://tools.ietf.org/html/rfc5280#section-6.3.2

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple, Iterable

from OpenSSL import crypto

from error import BasicError

_timestamp_format = '%Y%m%d%H%M%SZ'

_key_type_to_str = {
    crypto.TYPE_DH: 'DH',
    crypto.TYPE_DSA: 'DSA',
    crypto.TYPE_EC: 'EC',
    crypto.TYPE_RSA: 'RSA'
}


def _parse_timestamp(timestamp: str) -> datetime:
    return datetime.strptime(timestamp, _timestamp_format)


def _format_timestamp(time: datetime) -> str:
    return datetime.strftime(time, _timestamp_format)


class CertToolError(BasicError):
    pass


class Cert:
    def __init__(self, x509: crypto.X509):
        self._x509 = x509

    def __repr__(self):
        return '<Cert "%s" [%d] %s [%s]-[%s]>' % \
               (self.common_name or 'Unknown',
                self.serial_number,
                self.signature_algorithm,
                self.validity_start, self.validity_end)

    @property
    def x509(self) -> crypto.X509:
        return self._x509

    @property
    def version(self) -> int:
        return self._x509.get_version()

    @property
    def signature_algorithm(self) -> str:
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

    def dump(self) -> bytes:
        return crypto.dump_certificate(crypto.FILETYPE_PEM, self._x509)

    def dump_text(self) -> str:
        return crypto.dump_certificate(crypto.FILETYPE_TEXT, self._x509).decode()

    def to_dict(self) -> dict:
        cert = self._x509
        public_key = cert.get_pubkey()

        ext_list = []
        for i in range(cert.get_extension_count()):
            ext = cert.get_extension(i)
            ext_list.append(
                dict(name=ext.get_short_name().decode(), is_critical=bool(ext.get_critical()), text=str(ext)))

        return {
            'version': self.version,
            'subject': {k.decode(): v.decode() for k, v in cert.get_subject().get_components()},
            'issuer': {k.decode(): v.decode() for k, v in cert.get_issuer().get_components()},
            'serial_number': hex(self.serial_number)[2:],
            'validity_start': self.validity_start,
            'validity_end': self.validity_end,
            'signature_algorithm': self.signature_algorithm,
            'extensions': ext_list,
            'public_key': {
                'type': _key_type_to_str[public_key.type()],
                'bits': public_key.bits()
            }
        }


class PKey:
    def __init__(self, pkey: crypto.PKey):
        self._pkey = pkey

    def __repr__(self):
        return '<PrivateKey (%d bits)>' % self._pkey.bits()

    @property
    def pkey(self) -> crypto.PKey:
        return self._pkey

    def dump(self) -> bytes:
        return crypto.dump_privatekey(crypto.FILETYPE_PEM, self._pkey)

    def dump_text(self) -> str:
        return crypto.dump_privatekey(crypto.FILETYPE_TEXT, self._pkey).decode()

    def to_dict(self) -> dict:
        pkey = self._pkey
        return {
            'type': _key_type_to_str[pkey.type()],
            'bits': pkey.bits()
        }


class CRL:
    def __init__(self, crl: crypto.CRL):
        self._crl = crl

    @property
    def crl(self) -> crypto.CRL:
        return self._crl

    def dump(self) -> bytes:
        return crypto.dump_crl(crypto.FILETYPE_PEM, self._crl)

    def dump_text(self) -> str:
        return crypto.dump_crl(crypto.FILETYPE_TEXT, self._crl).decode()


class BuildCertParams:
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


class CertTool:
    default_digest = 'sha256'

    @staticmethod
    def load_cert(cert_data: bytes) -> Cert:
        if not cert_data:
            raise CertToolError('cert data must not be empty')
        try:
            x509 = crypto.load_certificate(crypto.FILETYPE_PEM, cert_data)
            return Cert(x509)
        except crypto.Error as e:
            raise CertToolError('cert load failed', e.args[0])

    @staticmethod
    def load_pkey(pkey_data: bytes, passphrase=None) -> PKey:
        if not pkey_data:
            raise CertToolError('pkey data must not be empty')

        try:
            pkey = crypto.load_privatekey(crypto.FILETYPE_PEM, pkey_data, passphrase)
            return PKey(pkey)
        except crypto.Error as e:
            raise CertToolError('pkey load failed', e.args[0])

    @staticmethod
    def load_crl(crl_data: bytes) -> CRL:
        if not crl_data:
            raise CertToolError('crl data must not be empty')

        try:
            crl = crypto.load_crl(crypto.FILETYPE_PEM, crl_data)
            return CRL(crl)
        except crypto.Error as e:
            raise CertToolError('crl load failed', e.args[0])

    @classmethod
    def load_cert_file(cls, cert_path: str) -> Cert:
        if not cert_path:
            raise CertToolError('cert path is required')
        if not os.path.exists(cert_path):
            raise CertToolError('cert file does not exist')

        with open(cert_path, 'rb') as f:
            buffer = f.read()

        return cls.load_cert(buffer)

    @classmethod
    def load_pkey_file(cls, pkey_path: str, passphrase=None) -> PKey:
        if not pkey_path:
            raise CertToolError('pkey path is required')
        if not os.path.exists(pkey_path):
            raise CertToolError('pkey does not exist')

        with open(pkey_path, 'rb') as f:
            buffer = f.read()

        return cls.load_pkey(buffer, passphrase)

    @classmethod
    def load_crl_file(cls, crl_path: str) -> CRL:
        if not crl_path:
            raise CertToolError('crl path is required')
        if not os.path.exists(crl_path):
            raise CertToolError('crl does not exist')

        with open(crl_path, 'rb') as f:
            buffer = f.read()

        return cls.load_crl(buffer)

    @staticmethod
    def verify_cert_ca(cert: Cert, ca_cert: Cert):
        store = crypto.X509Store()
        store.add_cert(ca_cert.x509)
        store_ctx = crypto.X509StoreContext(store, cert.x509)
        try:
            store_ctx.verify_certificate()
        except crypto.X509StoreContextError as e:
            raise CertToolError('CA does not match', e.args[0])

    @staticmethod
    def verify_cert_crl(cert: Cert, ca_cert: Cert, crl: CRL):
        store = crypto.X509Store()
        store.add_cert(ca_cert.x509)
        store.add_crl(crl.crl)
        store.set_flags(crypto.X509StoreFlags.CRL_CHECK)
        store_ctx = crypto.X509StoreContext(store, cert.x509)
        try:
            store_ctx.verify_certificate()
        except crypto.X509StoreContextError as e:
            raise CertToolError('CRL check failed', e.args[0])

    @classmethod
    def verify_cert_pkey(cls, cert: Cert, pkey: PKey):
        if cert is None:
            raise CertToolError('cert is required')
        if pkey is None:
            raise CertToolError('pkey is required')

        data = b'Test data for cert-pkey verification.'
        digest = cls.default_digest

        try:
            signature = crypto.sign(pkey.pkey, data, digest)
            crypto.verify(cert.x509, signature, data, digest)
        except crypto.Error as e:
            raise CertToolError('pkey does not match', e.args[0])

    @staticmethod
    def _build_pkey(params: BuildPKeyParams) -> crypto.PKey:
        key = crypto.PKey()
        key.generate_key(crypto.TYPE_RSA, params.key_length)
        return key

    @staticmethod
    def _build_cert(params: BuildCertParams) -> crypto.X509:
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
    def build_ca(cls, pkey_params: BuildPKeyParams, cert_params: BuildCertParams) -> Tuple[PKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_cert(cert_params)
        cert.set_pubkey(key)  # key is a key pair

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
        return PKey(key), Cert(cert)

    @classmethod
    def build_server(cls, pkey_params: BuildPKeyParams, cert_params: BuildCertParams,
                     ca_cert: Cert, ca_pkey: PKey) -> Tuple[PKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_cert(cert_params)
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
        return PKey(key), Cert(cert)

    @classmethod
    def build_client(cls, pkey_params: BuildPKeyParams, cert_params: BuildCertParams,
                     ca_cert: Cert, ca_pkey: PKey) -> Tuple[PKey, Cert]:
        key = cls._build_pkey(pkey_params)
        cert = cls._build_cert(cert_params)
        cert.set_pubkey(key)  # key is a key pair

        # use CA as issuer
        cert.set_issuer(ca_cert.x509.get_subject())

        # have to add extensions in multiple steps
        cert.add_extensions([
            crypto.X509Extension(b'basicConstraints', False, b'CA:FALSE'),
            crypto.X509Extension(b'nsComment', False, b'Python Generated Client Certificate'),
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
        return PKey(key), Cert(cert)

    @classmethod
    def build_crl(cls, cert_revoke_list: Iterable[Tuple[Cert, datetime]], ca_cert: Cert, ca_pkey: PKey,
                  validity_days: int):
        crl = crypto.CRL()
        crl.set_version(0x0)

        # The set_nextUpdate() method fails because the pointer to the nextUpdate date object inside of this call is
        # NULL. So we have to use the ugly export() function instead of sign() to overcome this bug without accessing
        # the internal functions of the crypto module.
        #
        # crl.set_lastUpdate(_format_timestamp(validity_start).encode())
        # crl.set_nextUpdate(_format_timestamp(validity_end).encode())

        for cert, revoke_time in cert_revoke_list:
            revoked = crypto.Revoked()
            revoked.set_serial(hex(cert.serial_number)[2:].encode())
            revoked.set_reason(None)  # can be one of revoked.all_reasons()
            revoked.set_rev_date(_format_timestamp(revoke_time).encode())
            crl.add_revoked(revoked)

        # Replacement of crl.sign(). Ignore the export result.
        crl.export(ca_cert.x509, ca_pkey.pkey, crypto.FILETYPE_PEM, validity_days, cls.default_digest.encode())
        return CRL(crl)

# TODO check all the encodings. Use the default, UTF-8 or something else like 'charmap', 'ascii'?
