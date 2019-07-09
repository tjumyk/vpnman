import json
import os

from flask import Flask, request, jsonify, send_from_directory

from auth_connect import oauth
from models import db
from services.client import ClientService, ClientServiceError
from services.credential import CredentialService

app = Flask(__name__)
with open('config.json') as _f_config:
    _config = json.load(_f_config)
app.config.from_mapping(_config)

db.init_app(app)
CredentialService.init(_config.get('CLIENT_SERVICE'))

# import logging
# logging.basicConfig()
# logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)


def _login_callback(user: oauth.User):
    try:
        ClientService.sync_oauth_user(user)
        db.session.commit()
    except ClientServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


oauth.init_app(app, login_callback=_login_callback)


@app.route('/')
@app.route('/terms/<path:path>')
@app.route('/admin/<path:path>')
@oauth.requires_login
def get_index_page(path=''):
    return app.send_static_file('index.html')


@app.errorhandler(404)
def page_not_found(error):
    for mime in request.accept_mimetypes:
        if mime[0] == 'text/html':
            break
        if mime[0] == 'application/json':
            return jsonify(msg='wrong url', detail='You have accessed an unknown location'), 404
    # in case we are building the front-end
    if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.root_path, 'building.html', cache_timeout=0), 503
    return app.send_static_file('index.html'), 404


@app.route('/api/me')
@oauth.requires_login
def api_me():
    try:
        user = oauth.get_user()
        return jsonify(user.to_dict())
    except oauth.OAuthError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/my-client')
@oauth.requires_login
def api_my_client():
    try:
        user = oauth.get_user()
        client = ClientService.get_by_user_id(user.id)
        if client is None:
            return jsonify(msg='client not found'), 500

        return jsonify(client.to_dict())
    except (oauth.OAuthError, ClientServiceError) as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/clients')
@oauth.requires_admin
def api_all_clients():
    try:
        clients = ClientService.get_all()
        return jsonify([client.to_dict() for client in clients])
    except ClientServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.cli.command()
def create_db():
    db.create_all()


@app.cli.command()
def drop_db():
    db.drop_all()


if __name__ == '__main__':
    app.run(host='localhost', port=8785)
