import os
import unittest

from tools.cert import CertTool
from tools.config import ConfigTool

data_folder = '/home/kelvin/openvpn-certs'


class TestConfigTool(unittest.TestCase):
    def test_build_server_config(self):
        cfg = ConfigTool.build_server_config(os.path.join(data_folder, 'server.conf'), [
            '# Test adding more lines',
            '# Test adding more lines',
            '# Test adding more lines'
        ])
        print(cfg)

    def test_build_client_config(self):
        ca_cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))

        cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ymiao.crt'))
        pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ymiao.key'))
        tls_path = os.path.join(data_folder, 'openvpn-ca/keys/ta.key')

        cfg = ConfigTool.build_client_config(
            os.path.join(data_folder, 'client-configs/base.conf'),
            ca_cert, cert, pkey, tls_path,
            [
                '# Test adding more lines',
                '# Test adding more lines',
                '# Test adding more lines'
            ])
        print(cfg)
