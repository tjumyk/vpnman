import os
import time
from datetime import datetime

import click
from flask import Flask, request, jsonify, send_from_directory, json, current_app

from auth_connect import oauth
from models import db, ClientCredential
from services.client import ClientService, ClientServiceError
from services.credential import CredentialService, CredentialServiceError
from tools.cert import CertTool
from tools.manage import ManagementTool, ManagementToolError

app = Flask(__name__)
with open('config.json') as _f_config:
    _config = json.load(_f_config)
app.config.from_mapping(_config)

db.init_app(app)
CredentialService.init(_config.get('CREDENTIAL_SERVICE'))
ManagementTool.init(_config.get('MANAGEMENT_TOOL'))


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

        with_details = request.args.get('details') == 'true'
        return jsonify(client.to_dict(with_credential_details=with_details))
    except (oauth.OAuthError, ClientServiceError) as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


def _export_config(cred: ClientCredential):
    client = cred.client
    # generate client config
    is_linux = request.args.get('linux') == 'true'
    if is_linux:
        config_file_name = '%s_linux.ovpn' % client.name
    else:
        config_file_name = '%s.ovpn' % client.name
    config_data = CredentialService.export_client_config(cred, is_linux=is_linux)

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


@app.route('/api/my-credentials/<int:cid>/export-config')
@oauth.requires_login
def api_my_credential_export_config(cid):
    try:
        user = oauth.get_user()
        client = ClientService.get_by_user_id(user.id)
        if client is None:
            return jsonify(msg='client not found'), 500

        cred = CredentialService.get(cid)
        if cred is None:
            return jsonify(msg='credential not found'), 404

        if cred.client_id != client.id:
            return jsonify(msg='credential does not belong to you'), 403

        return _export_config(cred)
    except (oauth.OAuthError, ClientServiceError, CredentialServiceError) as e:
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
def api_admin_client(cid: int):
    try:
        client = ClientService.get(cid)
        if client is None:
            return jsonify(msg='client not found'), 400

        return jsonify(client.to_dict(with_credential_details=True))
    except ClientServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/clients/<int:cid>/generate-credential')
@oauth.requires_admin
def api_admin_client_generate_credential(cid: int):
    try:
        client = ClientService.get(cid)
        if client is None:
            return jsonify(msg='client not found'), 400

        cred = CredentialService.generate_for_client(client)

        db.session.commit()
        CredentialService.update_crl()
        return jsonify(cred.to_dict())
    except (ClientServiceError, CredentialServiceError) as e:
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
        return jsonify(cred.to_dict(with_cert=False, with_pkey=False))
    except CredentialServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/credentials/<int:cid>/export-config')
@oauth.requires_admin
def api_admin_credential_export_config(cid: int):
    try:
        cred = CredentialService.get(cid)
        if cred is None:
            return jsonify(msg='credential not found'), 404

        return _export_config(cred)
    except CredentialServiceError as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/manage/info')
@oauth.requires_admin
def api_admin_manage_info():
    try:
        with ManagementTool.connect() as sess:
            # get the latest state only
            states = sess.state(1)
            state = states[0] if states else None

            status = sess.status()
            client_list = status.get('client_list')
            if client_list:
                # map client to db objects via common name (may fail for clients using imported credentials whose common
                # names are different from the name of the client/user)
                common_names = {client['common_name'] for client in client_list}
                client_db_mapping = ClientService.get_many_by_names(common_names)
                for client in client_list:
                    db_client = client_db_mapping.get(client['common_name'])
                    client['_db_client_id'] = db_client.id if db_client else None

            return jsonify(
                version=sess.version(),
                status=status,
                state=state,
                load_stats=sess.load_stats()
            )
    except (ManagementToolError, ClientServiceError) as e:
        return jsonify(msg=e.msg, detail=e.detail), 500


@app.route('/api/admin/manage/log')
@oauth.requires_admin
def api_admin_manage_log():
    try:
        with ManagementTool.connect() as sess:
            return jsonify(sess.log('all'))
    except ManagementToolError as e:
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
    print(json.dumps(cred.to_dict(), indent=2))


@app.cli.command()
@click.argument('user_id', type=int)
@click.argument('name')
@click.option('-e', '--email')
def import_client(user_id: int, name: str, email: str):
    client = ClientService.add(user_id, name, email)
    db.session.commit()
    print(json.dumps(client.to_dict(), indent=2))


@app.cli.command()
@click.argument('file_path')
@click.option('-t', '--file-type')
def dump(file_path: str, file_type: str):
    if file_type is None:  # auto detect
        file_name = os.path.basename(file_path)
        if file_name == 'crl.pem':
            file_type = 'crl'
        else:
            _, ext = os.path.splitext(file_name)
            if ext == '.crt':
                file_type = 'cert'
            elif ext == '.key':
                file_type = 'pkey'

    if file_type:
        file_type = file_type.lower()
    if file_type == 'cert':
        print(CertTool.load_cert_file(file_path).dump_text())
    elif file_type == 'pkey':
        print(CertTool.load_pkey_file(file_path).dump_text())
    elif file_type == 'crl':
        print(CertTool.load_crl_file(file_path).dump_text())
    else:
        print('File type not supported')


if __name__ == '__main__':
    app.run(host='localhost', port=8785)
