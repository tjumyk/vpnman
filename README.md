#  VPN Management System

## Setup

### Pull Git Submodules
```shell
git submodule init 
git submodule update
```

### Prepare Environment

1. Create and activate a Python (>=3.7) virtual environment
2. Install nodejs (>=14) and npm
3. Install dependencies

```shell
pip install -r requirements.txt
cd angular
npm i
cd ..
```

### Make Configuration
1. Copy config file

```shell
cp config.example.json config.json
cp auth_connect/oauth.config.example.json oauth.config.json
```

2. Edit `config.json` and `oauth.config.json` according to actual setup.

### Initialize Database

```shell
flask create-db
```

### Build Front-end

For node version >= 17:

```shell
cd angular
NODE_OPTIONS=--openssl-legacy-provider npm run build
cd ..
```

For node version < 17:

```shell
cd angular
npm run build
cd ..
```

## Run

### Run web app

1. For development, use Flask itself

```shell
flask run --port 8785
```

2. For production, please use more mature solutions, e.g.

```shell
pip install gunicorn[gevent]
gunicorn -w 4 -b '127.0.0.1:8785' app:app
```
