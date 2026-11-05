#!/usr/bin/env python3
"""Creates and configures the Erandel Supabase project through the Supabase Management API.

Usage:  SUPABASE_TOKEN=sbp_... python3 tools/supabase/setup.py [--org SLUG] [--ref EXISTING_REF]

Steps: pick the organization, create the project "erandel" in Singapore (or reuse --ref),
wait until it is healthy, apply tools/supabase/schema.sql, switch on guest (anonymous) sign-ins,
switch off email confirmation (no mail provider yet), set the site URL, and print the project
URL and public key to put in ACCOUNT_CFG in src/index.html. The token is only read from the
environment and is never written anywhere.
"""
import json, os, secrets, sys, time, urllib.request, urllib.error, pathlib

API = 'https://api.supabase.com/v1'
TOKEN = os.environ.get('SUPABASE_TOKEN', '').strip()
SITE = 'https://soladelvaux.github.io/erandel/'


def call(method, path, body=None, ok=(200, 201)):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'erandel-setup'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode()
            return json.loads(txt) if txt else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{method} {path} -> HTTP {e.code}: {e.read().decode()[:400]}')


def main():
    if not TOKEN.startswith('sbp_'):
        raise SystemExit('Set SUPABASE_TOKEN to a personal access token (starts with sbp_).')
    args = sys.argv[1:]
    ref = args[args.index('--ref') + 1] if '--ref' in args else None
    if not ref:
        orgs = call('GET', '/organizations')
        if not orgs:
            raise SystemExit('No organization found. Create one in the Supabase dashboard first.')
        org = args[args.index('--org') + 1] if '--org' in args else (orgs[0].get('slug') or orgs[0]['id'])
        existing = [p for p in call('GET', '/projects') if p.get('name') == 'erandel']
        if existing:
            ref = existing[0]['id']
            print('Reusing project', ref)
        else:
            p = call('POST', '/projects', {'name': 'erandel', 'organization_id': org, 'db_pass': secrets.token_urlsafe(24), 'region': 'ap-southeast-1'})
            ref = p['id']
            print('Created project', ref)
    for _ in range(90):
        st = call('GET', f'/projects/{ref}').get('status')
        if st == 'ACTIVE_HEALTHY':
            break
        print('Waiting for project:', st)
        time.sleep(10)
    else:
        raise SystemExit('Project did not become healthy in 15 minutes.')
    sql = (pathlib.Path(__file__).parent / 'schema.sql').read_text()
    call('POST', f'/projects/{ref}/database/query', {'query': sql})
    print('Schema applied')
    call('PATCH', f'/projects/{ref}/config/auth', {
        'site_url': SITE,
        'uri_allow_list': SITE + ',https://soladelvaux.github.io/**',
        'external_anonymous_users_enabled': True,
        'mailer_autoconfirm': True,
        'password_min_length': 8,
    })
    print('Auth configured: guests on, email confirmation off, site', SITE)
    keys = call('GET', f'/projects/{ref}/api-keys') or []
    pub = next((k['api_key'] for k in keys if k.get('name') == 'anon' and k.get('api_key')), None) or \
        next((k['api_key'] for k in keys if k.get('type') == 'publishable' and k.get('api_key')), None)
    if not pub:
        raise SystemExit('Could not read the public key: ' + json.dumps([k.get('name') for k in keys]))
    print(json.dumps({'url': f'https://{ref}.supabase.co', 'key': pub}))


if __name__ == '__main__':
    main()
