import os
import time
from datetime import datetime

import click
from flask import Flask, request, jsonify, send_from_directory, json, current_app

from auth_connect import oauth
from models import db
from services.client import ClientService, ClientServiceError
from services.credential import CredentialService, CredentialServiceError

app = Flask(__name__)
with open('config.json') as _f_config:
    _config = json.load(_f_config)
app.config.from_mapping(_config)

db.init_app(app)
CredentialService.init(_config.get('CREDENTIAL_SERVICE'))


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


@app.route('/api/my-client/details')
@oauth.requires_login
def api_my_client_details():
    try:
        user = oauth.get_user()
        client = ClientService.get_by_user_id(user.id)
        if client is None:
            return jsonify(msg='client not found'), 500

        return jsonify(client.to_dict(with_active_credential=False, with_all_credentials=True,
                                      with_credential_details=True))
    except (oauth.OAuthError, ClientServiceError) as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/my-client/export-config')
@oauth.requires_login
def api_my_client_export_config():
    try:
        user = oauth.get_user()
        client = ClientService.get_by_user_id(user.id)
        if client is None:
            return jsonify(msg='client not found'), 500

        # find active credential
        active_cred = None
        for cred in client.credentials:
            if not cred.is_revoked:
                active_cred = cred
                break
        if active_cred is None:
            return jsonify(msg='no active credential'), 400

        # generate client config
        is_linux = request.args.get('linux') == 'true'
        if is_linux:
            config_file_name = '%s_linux.ovpn' % client.name
        else:
            config_file_name = '%s.ovpn' % client.name
        config_data = CredentialService.export_client_config(active_cred, is_linux=is_linux)

        # make response
        rv = current_app.response_class(
            config_data,
            mimetype='text/plain',
            headers={
                'Content-Disposition': 'attachment; filename="%s"' % config_file_name
            }
        )
        # disable cache
        rv.cache_control.max_age = 0
        rv.expires = int(time.time())

        return rv
    except (oauth.OAuthError, ClientServiceError) as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/clients')
@oauth.requires_admin
def api_admin_all_clients():
    try:
        clients = ClientService.get_all()
        return jsonify([client.to_dict() for client in clients])
    except ClientServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/clients/<int:cid>')
@oauth.requires_admin
def api_admin_client_detail(cid: int):
    try:
        client = ClientService.get(cid)
        if client is None:
            return jsonify(msg='client not found'), 400

        return jsonify(client.to_dict(with_active_credential=False, with_all_credentials=True,
                                      with_credential_details=True))
    except ClientServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/credentials/<int:cid>/revoke', methods=['PUT', 'DELETE'])
@oauth.requires_admin
def api_admin_credential_revoke(cid: int):
    try:
        cred = CredentialService.get(cid)
        if cred is None:
            return jsonify(msg='credential not found'), 400

        if request.method == 'PUT':
            CredentialService.revoke(cred)
        else:  # DELETE
            CredentialService.unrevoke(cred)
        db.session.commit()
        CredentialService.update_crl()
    except CredentialServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.cli.command()
def create_db():
    db.create_all()


@app.cli.command()
def drop_db():
    db.drop_all()


@app.cli.command()
@click.argument('client_name')
@click.argument('cert_file')
@click.argument('pkey_file')
@click.option('-r', '--revoked-at', type=click.DateTime())
@click.option('-c/-C', '--check-common-name/-no-check-common-name', default=True)
def import_credential(client_name: str, cert_file: str, pkey_file: str, revoked_at: datetime, check_common_name: bool):
    client = ClientService.get_by_name(client_name)
    if client is None:
        print('client not found')
        exit(1)

    is_revoked = revoked_at is not None
    cred = CredentialService.import_for_client(
        client, cert_file, pkey_file,
        is_revoked=is_revoked, revoked_at=revoked_at,
        check_common_name=check_common_name
    )
    db.session.commit()
    if is_revoked:
        CredentialService.update_crl()
    print(json.dumps(cred.to_dict(with_client=False, with_cert=False, with_pkey=False), indent=2))


@app.cli.command()
@click.argument('user_id', type=int)
@click.argument('name')
@click.option('-e', '--email')
def import_client(user_id: int, name: str, email: str):
    client = ClientService.add(user_id, name, email)
    db.session.commit()
    print(json.dumps(client.to_dict(with_active_credential=False, with_all_credentials=False), indent=2))


if __name__ == '__main__':
    app.run(host='localhost', port=8785)
