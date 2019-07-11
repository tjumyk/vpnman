from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

from tools.cert import CertTool

db = SQLAlchemy()


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(16), unique=True, nullable=False)

    email = db.Column(db.String(64))

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return '<Client %r>' % self.name

    def to_dict(self, with_active_credential: bool = True, with_all_credentials: bool = False,
                with_credential_details: bool = False) -> dict:
        d = dict(id=self.id, user_id=self.user_id, name=self.name, email=self.email,
                 created_at=self.created_at, modified_at=self.modified_at)
        if with_active_credential:
            active_cred = None
            for cred in self.credentials:
                if not cred.is_revoked:
                    active_cred = cred
                    break
            if active_cred is not None:
                d['active_credential'] = active_cred.to_dict(with_cert=with_credential_details,
                                                             with_pkey=with_credential_details)
            else:
                d['active_credential'] = None
        if with_all_credentials:
            d['credentials'] = [cred.to_dict(with_cert=with_credential_details, with_pkey=with_credential_details)
                                for cred in self.credentials]
        return d


class ClientCredential(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)

    cert = db.Column(db.Binary)
    pkey = db.Column(db.Binary)

    is_revoked = db.Column(db.Boolean, nullable=False, default=False)
    revoked_at = db.Column(db.DateTime)

    is_imported = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    client = db.relationship('Client', backref=db.backref('credentials'))

    def __repr__(self):
        return '<ClientCredentials %r>' % self.id

    def to_dict(self, with_client: bool = False, with_cert: bool = True, with_pkey: bool = True) -> dict:
        d = dict(id=self.id, client_id=self.client_id, is_revoked=self.is_revoked, revoked_at=self.revoked_at,
                 is_imported=self.is_imported, created_at=self.created_at)
        if with_client:
            d['client'] = self.client.to_dict()
        if with_cert:
            if self.cert is None:
                cert_dict = None
            else:
                cert = CertTool.load_cert(self.cert)
                cert_dict = cert.to_dict()
            d['cert'] = cert_dict
        if with_pkey:
            if self.pkey is None:
                pkey_dict = None
            else:
                pkey = CertTool.load_pkey(self.pkey)
                pkey_dict = pkey.to_dict()
            d['pkey'] = pkey_dict
        return d
