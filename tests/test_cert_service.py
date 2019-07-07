import glob
import os
import unittest
import uuid
from datetime import datetime, timedelta

from services.cert import CertService, BuildPKeyParams, BuildX509Params

data_folder = '/home/kelvin/openvpn-certs'


class TestCertService(unittest.TestCase):
    def test_load_certs(self):
        print('=== CA ===')
        ca_cert = CertService.load_cert(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        print(ca_cert.dump_text())
        ca_pkey = CertService.load_pkey(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))
        print(ca_pkey)
        # CertService.verify_cert_pkey(ca_cert, ca_pkey)
        # ca_cert2 = CertService.load_cert('/home/kelvin/EasyRSA-v3.0.6/pki/ca.crt')
        # print(ca_cert2.dump_text())

        print('=== Clients ===')
        for cert_path in glob.glob(os.path.join(data_folder, 'openvpn-ca/keys/*.crt')):
            if cert_path.endswith('/ca.crt'):  # skip ca
                continue
            cert = CertService.load_cert(cert_path)
            print(cert.dump_text())
            CertService.verify_cert_ca(cert, ca_cert)

            pkey_path = cert_path[:-4] + '.key'
            pkey = CertService.load_pkey(pkey_path)
            print(pkey)
            CertService.verify_cert_pkey(cert, pkey)

    def test_build_ca(self):
        now = datetime.utcnow()
        valid_time = timedelta(days=3650)

        pkey, cert = CertService.build_ca(
            BuildPKeyParams(2048),
            BuildX509Params(
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

        CertService.verify_cert_pkey(cert, pkey)

    def test_build_client(self):
        ca_cert = CertService.load_cert(os.path.join(data_folder, 'openvpn-ca/keys/ca.crt'))
        ca_pkey = CertService.load_pkey(os.path.join(data_folder, 'openvpn-ca/keys/ca.key'))

        now = datetime.utcnow()
        valid_time = timedelta(days=3650)

        pkey, cert = CertService.build_client(
            BuildPKeyParams(2048),
            BuildX509Params(
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

        CertService.verify_cert_pkey(cert, pkey)
        CertService.verify_cert_ca(cert, ca_cert)
