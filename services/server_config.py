import re
from typing import Optional, List

from error import BasicError
from models import Route, db
from tools.config import ConfigTool


class ServerConfigServiceError(BasicError):
    pass


class ServerConfigService:
    _ip_max_length = 46
    _ip_regex = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')
    _route_description_max_length = 128

    _server_config_path = '/etc/openvpn/server.conf'
    _server_base_config_path = '/etc/openvpn/server_base.conf'

    @classmethod
    def init(cls, config: dict):
        cls._server_config_path = config.get('server_config_path', cls._server_config_path)
        cls._server_base_config_path = config.get('server_base_config_path', cls._server_base_config_path)

    @staticmethod
    def get_route(_id: int) -> Optional[Route]:
        if _id is None:
            raise ServerConfigServiceError('id is required')
        if type(_id) is not int:
            raise ServerConfigServiceError('id must be an integer')

        return Route.query.get(_id)

    @staticmethod
    def get_route_by_ip_mask(ip: str, mask: str) -> Optional[Route]:
        if not ip:
            raise ServerConfigServiceError('ip is required')
        if not mask:
            raise ServerConfigServiceError('mask is required')

        return Route.query.filter_by(ip=ip, mask=mask).first()

    @staticmethod
    def get_routes() -> List[Route]:
        return Route.query.order_by(Route.id).all()

    @classmethod
    def add_route(cls, ip: str, mask: str, description: str = None) -> Route:
        cls._check_route_fields(ip, mask, description)
        if cls.get_route_by_ip_mask(ip, mask):
            raise ServerConfigServiceError('duplicate route')

        route = Route(ip=ip, mask=mask, description=description)
        db.session.add(route)
        return route

    @classmethod
    def update_route(cls, route: Route, ip: str, mask: str, description: str = None):
        if route is None:
            raise ServerConfigServiceError('route is required')
        existing_route = cls.get_route_by_ip_mask(ip, mask)
        if existing_route and existing_route.id != route.id:
            raise ServerConfigServiceError('duplicate route')

        cls._check_route_fields(ip, mask, description)

        route.ip = ip
        route.mask = mask
        route.description = description

    @classmethod
    def _check_route_fields(cls, ip, mask, description):
        if not ip:
            raise ServerConfigServiceError('ip is required')
        if len(ip) > cls._ip_max_length:
            raise ServerConfigServiceError('ip too long')
        if not mask:
            raise ServerConfigServiceError('mask is required')
        if len(mask) > cls._ip_max_length:
            raise ServerConfigServiceError('mask too long')
        if description and len(description) > cls._route_description_max_length:
            raise ServerConfigServiceError('description too long')

        # only ipv4 is supported now
        if not cls._ip_regex.match(ip) or not all(0 <= int(num) <= 255 for num in ip.split('.')):
            raise ServerConfigServiceError('invalid ip format')
        if not cls._ip_regex.match(mask) or not all(0 <= int(num) <= 255 for num in mask.split('.')):
            raise ServerConfigServiceError('invalid mask format')

    @classmethod
    def update_config(cls):
        with open(cls._server_config_path, 'w') as f:
            additional_config = []
            additional_config.extend([ConfigTool.server_route_to_config(route.ip, route.mask)
                                      for route in cls.get_routes()])
            full_config = ConfigTool.build_server_config(cls._server_base_config_path, additional_config)
            f.write(full_config)
