import os
import unittest

from services.cert import CertService
from services.config import ConfigService

data_folder = '/home/kelvin/openvpn-certs'


class TestConfigService(unittest.TestCase):
    def test_build_server_config(self):
        cfg = ConfigService.build_server_config(os.path.join(data_folder, 'server.conf'), [
            '# Test adding more lines',
            '# Test adding more lines',
            '# Test adding more lines'
        ])
        print(cfg)

    def test_build_client_config(self):
        ca_cert = CertService.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))

        cert = CertService.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ymiao.crt'))
        pkey = CertService.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ymiao.key'))
        tls_path = os.path.join(data_folder, 'openvpn-ca/keys/ta.key')

        cfg = ConfigService.build_client_config(
            os.path.join(data_folder, 'client-configs/base.conf'),
            ca_cert, cert, pkey, tls_path,
            [
                '# Test adding more lines',
                '# Test adding more lines',
                '# Test adding more lines'
            ])
        print(cfg)
