import os
from typing import List

from error import BasicError
from services.cert import PKey, Cert


class ConfigServiceError(BasicError):
    pass


class ConfigService:
    @staticmethod
    def build_server_config(base_config_path: str, additional_lines: List[str] = None):
        if not base_config_path:
            raise ConfigServiceError('base config path is required')
        if not os.path.exists(base_config_path):
            raise ConfigServiceError('base config does not exist')

        with open(base_config_path) as f:
            base_config = f.read()

        full_config = base_config
        if additional_lines:
            full_config = '%s\n%s' % (full_config, '\n'.join(additional_lines))
        return full_config

    @staticmethod
    def build_client_config(base_config_path: str, ca_cert: Cert, client_cert: Cert, client_pkey: PKey,
                            tls_auth_key_path: str, additional_lines: List[str] = None):
        if not base_config_path:
            raise ConfigServiceError('base config path is required')
        if not os.path.exists(base_config_path):
            raise ConfigServiceError('base config does not exist')
        if ca_cert is None:
            raise ConfigServiceError('CA cert is required')
        if client_cert is None:
            raise ConfigServiceError('client cert is required')
        if client_pkey is None:
            raise ConfigServiceError('client pkey is required')
        if not tls_auth_key_path:
            raise ConfigServiceError('tls auth key path is required')
        if not os.path.exists(tls_auth_key_path):
            raise ConfigServiceError('tls auth key does not exist')

        with open(base_config_path) as f:
            base_config = f.read()

        with open(tls_auth_key_path) as f:
            tls_auth_key = f.read()

        full_config = base_config
        if additional_lines:
            full_config = '%s\n%s' % (full_config, '\n'.join(additional_lines))
        full_config = '%s\n<ca>\n%s</ca>\n<cert>\n%s</cert>\n<key>\n%s</key>\n<tls-auth>\n%s</tls-auth>\n' % (
            full_config,
            ca_cert.dump(),
            client_cert.dump(),
            client_pkey.dump(),
            tls_auth_key
        )
        return full_config
