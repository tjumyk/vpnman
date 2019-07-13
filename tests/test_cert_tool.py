import glob
import os
import re
import unittest
import uuid
from datetime import datetime, timedelta

from flask import json

from tools.cert import CertTool, BuildPKeyParams, BuildCertParams

data_folder = '/home/kelvin/openvpn-certs'


class TestCertTool(unittest.TestCase):
    def test_load_certs(self):
        print('=== CA ===')
        ca_cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        print(ca_cert.dump_text())
        ca_pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))
        print(ca_pkey)
        CertTool.verify_cert_pkey(ca_cert, ca_pkey)

        print('=== Clients ===')
        for cert_path in glob.glob(os.path.join(data_folder, 'openvpn-ca/keys/*.crt')):
            if cert_path.endswith('/ca.crt'):  # skip ca
                continue
            cert = CertTool.load_cert_file(cert_path)
            print(cert.dump_text())
            CertTool.verify_cert_ca(cert, ca_cert)

            pkey_path = cert_path[:-4] + '.key'
            pkey = CertTool.load_pkey_file(pkey_path)
            print(pkey)
            CertTool.verify_cert_pkey(cert, pkey)

    def test_dump(self):
        regex_begin_certificate = re.compile(r'^-+BEGIN CERTIFICATE-+$', re.IGNORECASE)

        for path in ['openvpn-ca/keys/ca.crt', 'openvpn-ca/keys/server.crt', 'openvpn-ca/keys/ymiao.crt']:
            cert_path = os.path.join(data_folder, path)
            with open(cert_path, 'rb') as f:
                cert_data = f.read()

            # it is possible that the cert file prepends the text format data before the PEM content
            if cert_data and cert_data[0] != '-':  # remove text data before comparison
                lines = cert_data.decode().split('\n')
                begin_line = None
                for i, line in enumerate(lines):
                    if regex_begin_certificate.match(line):
                        begin_line = i
                        break
                cert_data = '\n'.join(lines[begin_line:]).encode()

            cert = CertTool.load_cert_file(cert_path)
            self.assertEqual(cert_data, cert.dump())

        for path in ['openvpn-ca/keys/ca.key', 'openvpn-ca/keys/server.key', 'openvpn-ca/keys/ymiao.key']:
            pkey_path = os.path.join(data_folder, path)
            with open(pkey_path, 'rb') as f:
                pkey_data = f.read()
            pkey = CertTool.load_pkey_file(pkey_path)
            self.assertEqual(pkey_data, pkey.dump())

        for path in ['openvpn-ca/keys/crl.pem']:
            crl_path = os.path.join(data_folder, path)
            with open(crl_path, 'rb') as f:
                crl_data = f.read()
            crl = CertTool.load_crl_file(crl_path)
            self.assertEqual(crl_data, crl.dump())

    def test_load_crl(self):
        print('=== CRL ===')
        crl = CertTool.load_crl_file(os.path.join(data_folder, 'openvpn-ca/keys/crl.pem'))
        print(crl.dump_text())

    def test_to_dict(self):
        cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        print(json.dumps(cert.to_dict(), indent=2))
        pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))
        print(json.dumps(pkey.to_dict(), indent=2))

    def test_build_ca(self):
        now = datetime.utcnow()
        valid_time = timedelta(days=3650)

        pkey, cert = CertTool.build_ca(
            BuildPKeyParams(2048),
            BuildCertParams(
                uuid.uuid4().int,
                now,
                now + valid_time,
                dict(
                    countryName='AU',
                    stateOrProvinceName='NSW',
                    localityName='Sydney',
                    organizationName='UNSW',
                    organizationalUnitName='Knowledge Graph Group',
                    commonName='test-ca',
                    emailAddress='yukai.miao@unsw.edu.au',
                    name='server'
                ))
        )

        print(cert.dump_text())
        print(pkey)

        CertTool.verify_cert_pkey(cert, pkey)

    def test_build_server(self):
        ca_cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        ca_pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))

        now = datetime.utcnow()
        valid_time = timedelta(days=3650)

        pkey, cert = CertTool.build_server(
            BuildPKeyParams(2048),
            BuildCertParams(
                uuid.uuid4().int,
                now,
                now + valid_time,
                dict(
                    countryName='AU',
                    stateOrProvinceName='NSW',
                    localityName='Sydney',
                    organizationName='UNSW',
                    organizationalUnitName='Knowledge Graph Group',
                    commonName='test-server',
                    emailAddress='yukai.miao@unsw.edu.au',
                    name='server'
                )),
            ca_cert, ca_pkey
        )

        print(cert.dump_text())
        print(pkey)

        CertTool.verify_cert_pkey(cert, pkey)
        CertTool.verify_cert_ca(cert, ca_cert)

    def test_build_client(self):
        ca_cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        ca_pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))

        now = datetime.utcnow()
        valid_time = timedelta(days=3650)

        pkey, cert = CertTool.build_client(
            BuildPKeyParams(2048),
            BuildCertParams(
                uuid.uuid4().int,
                now,
                now + valid_time,
                dict(
                    countryName='AU',
                    stateOrProvinceName='NSW',
                    localityName='Sydney',
                    organizationName='UNSW',
                    organizationalUnitName='Knowledge Graph Group',
                    commonName='test-client',
                    emailAddress='yukai.miao@unsw.edu.au',
                    name='server'
                )),
            ca_cert, ca_pkey
        )

        print(cert.dump_text())
        print(pkey)

        CertTool.verify_cert_pkey(cert, pkey)
        CertTool.verify_cert_ca(cert, ca_cert)

    def test_build_crl(self):
        ca_cert = CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        ca_pkey = CertTool.load_pkey_file(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))

        now = datetime.utcnow()

        crl = CertTool.build_crl(
            [
                (CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/03.pem')), now),
                (CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/07.pem')), now),
                (CertTool.load_cert_file(os.path.join(data_folder, 'openvpn-ca/keys/0D.pem')), now),
            ],
            ca_cert,
            ca_pkey,
            365
        )
        print(crl.dump_text())

        empty_crl = CertTool.build_crl(
            [],
            ca_cert,
            ca_pkey,
            365
        )
        print(empty_crl.dump_text())
