# VPS Deployment Notes

Native Laravel 12 + React deploy on Ubuntu EC2 (no Docker). Commands only.

## 1. System packages

```bash
sudo add-apt-repository universe && sudo apt update
sudo apt install -y nginx git composer supervisor mysql-server certbot python3-certbot-nginx
```

**Note:** Ubuntu 26.04 ships PHP 8.5 (Ondrej PPA unsupported). Satisfies `php:^8.4`.

## 2. PHP 8.5 + extensions

```bash
sudo apt install -y php8.5-fpm php8.5-cli php8.5-mysql php8.5-bcmath \
    php8.5-gd php8.5-intl php8.5-zip php8.5-curl php8.5-mbstring php8.5-xml
```
`opcache` is built in. `xmlwriter` is inside `php8.5-xml`.

## 3. Enable services

```bash
sudo systemctl enable mysql php8.5-fpm nginx --now
```

## 4. MySQL

```bash
sudo mysql_secure_installation
sudo mysql
```
```sql
CREATE DATABASE morata_fms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'morata'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON morata_fms.* TO 'morata'@'localhost';
FLUSH PRIVILEGES;
```
```bash
# Cap InnoDB pool for 2GB box
sudo bash -c 'echo -e "\ninnodb_buffer_pool_size = 256M" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo systemctl restart mysql
```
DB user must exist before migrate — Laravel can't create users.

## 5. Node + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.15.1 --activate
```

## 6. Deploy backend

```bash
sudo mkdir -p /var/www && sudo chown -R $USER:$USER /var/www
cd /var/www
git clone --branch staging https://github.com/STI-Devs/MorataFMS.git
cd MorataFMS/backend
composer install --no-dev --no-interaction
sudo chown -R www-data:www-data /var/www/MorataFMS/backend/storage /var/www/MorataFMS/backend/bootstrap/cache
```
`www-data` (php-fpm) must own storage or errors silently vanish from the log.

## 7. `.env`

```bash
sudo nano /var/www/MorataFMS/backend/.env
```
```ini
APP_URL=https://api-s2.fmmcbs.com
APP_ENV=production
APP_DEBUG=false
SESSION_DOMAIN=api-s2.fmmcbs.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=api-s2.fmmcbs.com
APP_ENFORCE_TRUSTED_HOSTS=true
APP_TRUSTED_HOSTS=api-s2.fmmcbs.com
FILESYSTEM_DISK=local
```
`SANCTUM_STATEFUL_DOMAINS` empty → login 500 ("Session store not set"). Always `php artisan config:clear` after `.env` edits.

## 8. Migrate + seed

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
```

## 9. nginx

```bash
sudo nano /etc/nginx/sites-available/morata
```
Config:
- `root` → `backend/public`
- API paths (`/api/`, `/sanctum`, `/up`, `/storage`, `/docs`) → `try_files $uri /index.php?$query_string`
- `= /` and `/` → serve `frontend/dist` via `try_files $uri $uri/ /index.html`
- `server_tokens off;`
- keep certbot's 443/ssl lines

```bash
sudo ln -sf /etc/nginx/sites-available/morata /etc/nginx/sites-enabled/morata
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 10. Queue worker + scheduler (systemd)

```bash
sudo nano /etc/systemd/system/queue-worker.service
```
```ini
[Unit]
Description=Laravel Queue Worker
After=network.target mysql.service
[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/MorataFMS/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --timeout=900 --memory=512 --max-time=21600
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
```
```bash
sudo nano /etc/systemd/system/scheduler.service
```
Contents: `ExecStart=/usr/bin/php artisan schedule:run --no-interaction --quiet`
```bash
sudo nano /etc/systemd/system/scheduler.timer
```
```ini
[Unit]
Description=Laravel Scheduler
[Timer]
OnBootSec=60
OnUnitActiveSec=60
[Install]
WantedBy=timers.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now queue-worker.service scheduler.timer
```

## 11. Build frontend

```bash
cd /var/www/MorataFMS/frontend
nano .env   # VITE_API_URL=..., VITE_TRANSACTION_SYNC_ENABLED=false
pnpm install && pnpm build     # install → node_modules; build → dist/
```

## 12. HTTPS

```bash
sudo certbot --nginx -d api-s2.fmmcbs.com
```
Set `server_name` to the domain first or certbot can't find the block.

## 13. Monitoring

```bash
free -h                                              # RAM/swap
htop                                                 # per-process
df -h /                                              # disk
sudo tail -f storage/logs/laravel.log                # Laravel errors
sudo tail -f /var/log/nginx/morata.error.log         # nginx errors
```

## 14. Security

```bash
sudo sshd -T | grep -i passwordauthenticated        # want: no
sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban
```
Security group: only `22`, `80`, `443` open. Never 3306.

See `EC2_PAUSE_RESUME.md` for stopping the instance.