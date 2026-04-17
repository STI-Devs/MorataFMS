# Production To Local Checklist

This checklist is the operational baseline for syncing production state into local development without turning the local environment into a risky copy of production.

## Current Deployment Topology

- Frontend production is deployed on Vercel.
- Backend production is deployed on Railway.
- Production database is Railway MySQL.
- Production document storage is AWS S3.
- Local development must never point directly at the production database.

## Current Local Mirror Setup

This repository now has a real command-based production mirror workflow.

Current mirror source:

- Railway MySQL TCP proxy host: `maglev.proxy.rlwy.net`
- Railway MySQL TCP proxy port: `23832`
- Production source database: `railway`

Current local mirror target:

- local mirror database name: `morata_fms_prod_mirror`
- local Docker MySQL host from the app perspective: `mysql`
- local Docker MySQL port inside Docker: `3306`
- local Docker MySQL port from Windows host: `127.0.0.1:3307`

Current snapshot folder:

- `C:/Users/User/Documents/MorataFMS Backups/production-mirror`

Important distinction:

- `backend/.env` controls the native local Laravel process such as `php artisan serve`
- `backend/.env.docker` controls the Docker backend container used by `docker compose`
- maintenance delete commands run on the machine where `php artisan` is executed
- production database targeting for destructive maintenance is now explicit through the `production_ops` Laravel connection
- bare `php artisan ops:*` commands must remain local by default

If the app does not show the mirrored data, always verify which backend mode is actually serving requests before assuming the sync failed.

## Daily Workflow

For normal maintenance and feature integration against current client data:

1. Refresh the local mirror from production.
2. Restore or recreate a local support admin account if needed.
3. Run the backend in the mode you actually intend to use.
4. Keep snapshots in the dedicated external backup folder.

Recommended command sequence:

```bash
php artisan ops:sync-production-mirror
php artisan ops:ensure-admin dev-support@example.test --name="Local Support Admin" --job-title="Administrator" --password="ReplaceThisWithAStrongPassword"
```

If you accidentally change or delete local mirror data while testing:

```bash
php artisan ops:restore-production-mirror
php artisan ops:ensure-admin dev-support@example.test --name="Local Support Admin" --job-title="Administrator" --password="ReplaceThisWithAStrongPassword"
```

## Break-Glass Production Admin Access

Use this when the maintenance team needs to recover admin access in production without touching client accounts manually.

### Preferred Recovery Command

The backend includes an operational command:

```bash
php artisan ops:ensure-admin support@example.com --name="Support Admin" --job-title="Administrator" --password="ReplaceThisWithAStrongPassword"
```

What it does:

- creates the account if it does not exist
- promotes the account to the `admin` role
- forces the account active
- rotates the password to the provided value

### Running It On Railway

Railway CLI can open a shell inside the deployed service container. Link the CLI to the backend service, then run the command from that shell.

Typical flow:

1. Link the repo to the correct Railway project and backend service.
2. Open a shell in the deployed backend service.
3. Run the Artisan command above inside the container.
4. Log in with the recovered support account.
5. Rotate the password again after access is restored.

Reference:

- Railway CLI SSH: https://docs.railway.com/cli/ssh

Important clarification:

- for this repository's current maintenance workflow, you do not need `railway run` to hit the production database
- `railway run php artisan ...` on this workstation was observed to execute Laravel locally with injected Railway variables, not inside the deployed container
- the safe and supported production-maintenance path is local `php artisan ... --connection=production_ops`
- this keeps the execution environment explicit and avoids relying on Railway private hostnames such as `mysql.railway.internal` from Windows

## Local Mirror Commands

Once your local `.env` is configured for production-mirror operations, use these commands instead of retyping the dump and import steps manually.

### Refresh The Local Mirror From Production

```bash
php artisan ops:sync-production-mirror
```

What it does:

- starts the local Docker MySQL service if needed
- recreates the local mirror database
- imports the latest production data from the configured Railway TCP proxy
- saves a timestamped SQL snapshot
- updates the configured snapshot directory's `latest.sql`
- does not overwrite unrelated local development databases

### Restore The Local Mirror After Local Testing Changes

```bash
php artisan ops:restore-production-mirror
```

What it does:

- recreates the local mirror database
- restores it from the configured snapshot directory's `latest.sql`
- does not pull new production data; it only restores from the last saved local snapshot

To restore from a specific saved snapshot:

```bash
php artisan ops:restore-production-mirror mirror-YYYYMMDD-HHMMSS.sql
```

### List Available Local Snapshots

```bash
php artisan ops:list-production-mirror-snapshots
```

Use this when you need to verify:

- which snapshots exist
- which snapshot is marked as `latest`
- when the last refresh was taken
- where the snapshot files are stored on disk

### Snapshot Folder Recommendation

Do not rely on the repository's internal storage path for long-lived operational snapshots.

Recommended approach:

- set `PRODUCTION_MIRROR_SNAPSHOT_PATH` to a dedicated folder outside the repo
- keep the folder in a secure location accessible to the maintenance team
- back up that folder separately from the workspace if you need retention beyond a single machine

Example Windows path:

```env
PRODUCTION_MIRROR_SNAPSHOT_PATH=C:/Users/User/Documents/MorataFMS Backups
```

This project is already configured to use that external folder in local development.

## Destructive Maintenance Commands

These commands are separate from the production-mirror workflow.

Use them only when you intentionally want to inspect or modify the live production database through the Railway TCP proxy from your local machine.

### Connection Model

- local default connection remains whatever `DB_CONNECTION` points to
- production maintenance connection is now the explicit Laravel connection name `production_ops`
- `production_ops` is configured in [backend/config/database.php](/C:/Users/User/Desktop/MorataFMS/backend/config/database.php)
- its credentials come from the `OPS_DB_*` variables in `backend/.env`
- there is no implicit env default that switches destructive commands to production

### Required Local Env For Production Maintenance

Set these in `backend/.env` on the machine that will run the maintenance command:

```env
OPS_DB_HOST=maglev.proxy.rlwy.net
OPS_DB_PORT=23832
OPS_DB_DATABASE=railway
OPS_DB_USERNAME=root
OPS_DB_PASSWORD=your-railway-mysql-password
```

Optional:

```env
OPS_DB_URL=
OPS_DB_SOCKET=
OPS_DB_CHARSET=utf8mb4
OPS_DB_COLLATION=utf8mb4_unicode_ci
OPS_MYSQL_ATTR_SSL_CA=
```

After changing those values, clear cached config before running commands:

```bash
php artisan config:clear
```

### Safe Command Rule

Treat the commands this way:

```bash
php artisan ops:reset-live-transactions --dry-run
```

- local only
- uses the app's normal default database connection

```bash
php artisan ops:reset-live-transactions --dry-run --connection=production_ops
```

- production database preview
- runs locally but queries the Railway MySQL TCP proxy

```bash
php artisan ops:delete transaction --type=import --id=123 --dry-run --connection=production_ops
php artisan ops:delete document --id=456 --dry-run --connection=production_ops
```

- production database preview for targeted deletes

### Production Safety Notes

- always start with `--dry-run`
- prefer explicit `--connection=production_ops` on every production-maintenance command even if you believe the env is correct
- do not rely on `railway run` for this workflow
- if the command output does not show `Database connection: production_ops`, stop immediately

### File Deletion Warning

These delete commands can remove both database rows and document files.

The command output also shows the configured storage disk. Review it before running a real delete.

If your local machine is not intentionally configured to talk to the production S3 document disk, use:

```bash
php artisan ops:reset-live-transactions --force --keep-files --connection=production_ops
```

and for targeted deletes:

```bash
php artisan ops:delete transaction --type=import --id=123 --force --keep-files --connection=production_ops
php artisan ops:delete document --id=456 --force --keep-files --connection=production_ops
```

This keeps file deletion disabled and limits the operation to database rows only.

### Minimum Production Checklist Before Real Delete

- confirm the output says `Database connection: production_ops`
- confirm the counts shown in the dry run match what you expect
- confirm whether files should be preserved with `--keep-files`
- confirm the storage disk shown by the command is expected
- confirm you are using the correct target filters and IDs
- only then re-run with `--force`

## Choosing The Local Backend Mode

You can use the mirrored database from either of these modes:

### Mode A: Native Laravel Process

This uses:

- `backend/.env`
- host database `127.0.0.1:3307`
- database `morata_fms_prod_mirror`

Typical start command:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### Mode B: Docker Backend

This uses:

- `backend/.env.docker`
- Docker database host `mysql`
- Docker database port `3306`
- database `morata_fms_prod_mirror`

Typical start command:

```bash
docker compose up -d backend
```

### Common Failure Mode

If the mirror command succeeds but the app still shows seeded data, the usual cause is:

- the mirror was refreshed correctly
- but the browser is hitting a backend process that still points to a different database

Always verify:

- which backend is serving `http://localhost:8000`
- whether that backend is using `morata_fms_prod_mirror`
- whether your browser session should be refreshed or re-authenticated after switching backends

Useful checks:

```bash
php artisan tinker --execute "dump(config('database.connections.mysql.host'), config('database.connections.mysql.port'), config('database.connections.mysql.database'));"
php artisan ops:list-production-mirror-snapshots
```

## Production-To-Local Refresh Workflow

Use this only when realistic production-shaped data is needed to investigate bugs, validate migrations, or test features against real-world edge cases.

### 1. Prepare A Safe Local Environment

Before importing anything:

- confirm local `.env` uses a local MySQL database
- confirm local mailer is `log`
- confirm local URLs are development URLs
- confirm local queues, webhooks, and third-party callbacks do not point to production services
- confirm local document storage is either isolated or intentionally read-only

Minimum local checks:

- `APP_ENV=local`
- `APP_DEBUG=true`
- `MAIL_MAILER=log`
- local `DB_*` values
- local `APP_URL` and `FRONTEND_URL`

## 2. Refresh The Local Mirror

Preferred command:

```bash
php artisan ops:sync-production-mirror
```

This replaces the manual dump/import flow for this repository.

References:

- Railway MySQL: https://docs.railway.com/guides/mysql
- Railway backups: https://docs.railway.com/volumes/backups

## 3. Sanitize Access-Critical Data Immediately

After import, do these before anyone uses the local copy:

- create or recover a local internal admin account
- rotate passwords for any accounts you will use
- clear remember tokens
- clear active sessions if needed
- revoke any API tokens if the environment includes them
- disable outbound email and webhook side effects

The minimum safe approach is to avoid logging in with real client credentials.

## 4. Handle S3 Documents Separately

This project stores documents on S3, so the database alone is not a full copy of production behavior.

Choose one of these modes:

- Metadata-only mode:
  - import the DB only
  - accept that some document links and previews will not work locally
- Selected file sync mode:
  - copy only the specific S3 objects needed for debugging
  - store them in a local or development-only bucket

Do not mirror the full production bucket to every developer machine unless there is a strong operational reason and approval.

## 5. Create A Local Maintenance Admin

After import, ensure local admin access exists with a non-client account.

Recommended local command:

```bash
php artisan ops:ensure-admin dev-support@example.test --name="Local Support Admin" --job-title="Administrator" --password="ReplaceThisWithAStrongPassword"
```

Important:

- after `ops:restore-production-mirror`, the local support admin may disappear if that account was not part of the stored snapshot
- when that happens, run `ops:ensure-admin` again

## 6. Record What Snapshot You Imported

Keep a minimal note for the team:

- snapshot date
- source environment
- whether S3 files were copied
- whether data was sanitized
- local database name used

Do not commit raw dumps into Git.

## 7. Cleanup Rules

After debugging or feature work:

- delete old local dumps you no longer need
- remove any temporary copied production files
- rotate any temporary support passwords that were exposed during maintenance

Recommended retention:

- keep `latest.sql`
- keep timestamped snapshots for the last 7 to 14 refreshes
- prune old snapshots manually or with a future retention command if the folder grows too large

## Operating Rules

- Production is the client environment, not the team sandbox.
- Local development must remain isolated from production side effects.
- Never use production as the default data source for development.
- Prefer sanitized snapshots over raw production data.
- Keep one internal support admin in production at all times.
