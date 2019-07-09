from typing import Optional, List

from sqlalchemy import or_

from auth_connect import oauth
from error import BasicError
from models import db, Client


class ClientServiceError(BasicError):
    pass


class ClientService:
    @staticmethod
    def get(_id: int) -> Optional[Client]:
        if _id is None:
            raise ClientServiceError('id is required')
        if type(_id) is not int:
            raise ClientServiceError('id must be an integer')

        return Client.query.get(_id)

    @staticmethod
    def get_all() -> List[Client]:
        return Client.query.all()

    @staticmethod
    def get_by_user_id(user_id: int) -> Optional[Client]:
        if user_id is None:
            raise ClientServiceError('user id is required')
        if type(user_id) is not int:
            raise ClientServiceError('user id must be an integer')

        return Client.query.filter_by(user_id=user_id).first()

    @staticmethod
    def add(user_id: int, name: str, email: str = None) -> Client:
        if user_id is None:
            raise ClientServiceError('user id is required')
        if type(user_id) is not int:
            raise ClientServiceError('user id must be an integer')
        if not name:
            raise ClientServiceError('name is required')

        if db.session.query(Client).filter(or_(Client.user_id == user_id, Client.name == name)).count():
            raise ClientServiceError('duplicate user id or name')

        client = Client(user_id=user_id, name=name, email=email)
        db.session.add(client)

        return client

    @classmethod
    def sync_oauth_user(cls, user: oauth.User):
        client = cls.get_by_user_id(user.id)
        if client is not None:  # client already exists, check if basic fields match
            if client.name != user.name:
                raise ClientServiceError('user name mismatch with client name')
        else:
            cls.add(user.id, user.name, user.email)
