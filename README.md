# MorataFMS — Freight Management System

A full-stack web application for **F.M. Morata**, a freight/customs brokerage company. Tracks import/export transactions, manages client records, and handles document storage on AWS S3.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 · PHP 8.2+ · MySQL |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 |
| Storage | AWS S3 (`ap-southeast-1`) |
| Auth | Laravel Sanctum (cookie-based SPA) |
| Package manager | `pnpm` (frontend) · `composer` (backend) |

---

## Prerequisites

Install these before contributing:

### Required

| Tool | Version | Download |
|---|---|---|
| **PHP** | 8.2 or higher | [php.net/downloads](https://www.php.net/downloads) |
| **Composer** | Latest | [getcomposer.org](https://getcomposer.org) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | Latest | `npm install -g pnpm` |
| **MySQL** | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Recommended

| Tool | Purpose |
|---|---|
| **VS Code** | Editor (`.vscode/` config included) |
| **TablePlus** or **DBeaver** | MySQL GUI client |
| **Postman** | API testing |

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url> MorataFMS
cd MorataFMS
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
```

Edit `.env` and set your database and AWS credentials:

```env
DB_CONNECTION=mysql
DB_DATABASE=morata_fms
DB_USERNAME=root
DB_PASSWORD=your_password

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=morata-fms-documents
FILESYSTEM_DISK=s3
```

Then run:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Backend runs at → `http://localhost:8000`

**Default admin login:** `admin@morata.com` / `password`

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at → `http://localhost:3000`

---

## Windows-Specific: PHP SSL Fix for S3

> **Required on Windows only.** Linux/macOS servers have this pre-installed by the OS.

PHP on Windows does not include a CA certificate bundle, which causes S3 uploads to **silently fail** with `cURL error 60: SSL certificate problem`. Fix it once:

**1. Download the CA bundle:**

```powershell
Invoke-WebRequest -Uri "https://curl.se/ca/cacert.pem" -OutFile "C:\php\php-8.4.7-Win32-vs17-x64\extras\ssl\cacert.pem"
```

> Adjust the path to match your PHP installation directory.

**2. Edit `php.ini`** (find it with `php --ini`):

```ini
curl.cainfo = "C:\php\php-8.4.7-Win32-vs17-x64\extras\ssl\cacert.pem"
openssl.cafile = "C:\php\php-8.4.7-Win32-vs17-x64\extras\ssl\cacert.pem"
```

**3. Restart `php artisan serve`.** PHP must reload the config.

---

## Running Tests

```bash
cd backend
php artisan test
```

All tests use a faked S3 disk — no real AWS calls are made during tests.

---

## S3 Folder Structure

Uploaded documents follow this path in S3:

```
documents/
  imports/
    {year}/
      {BL-number}/
        {stage}_{filename}_{unique}.{ext}
  exports/
    {year}/
      {BL-number}/
        {stage}_{filename}_{unique}.{ext}
```

**Example:**
```
documents/imports/2026/MAEU123456789/boc_commercial_invoice_a1b2c3.pdf
documents/exports/2026/BL-99112233/bl_generation_lading_d4e5f6.pdf
```

- **Year** — auto-set from server clock; used by S3 Lifecycle Policy for Glacier tiering
- **BL number** — the shipment's Bill of Lading number (falls back to DB ID if not set)
- **Stage** — snake_case stage key (`boc`, `ppa`, `do`, `port_charges`, `releasing`, `billing`)
- **Unique suffix** — 6-char ID to prevent overwriting if the same filename is uploaded twice

---

## Role Hierarchy

```
encoder < broker < supervisor < manager < admin
```

- **Encoder** — can upload documents, view transactions
- **Broker** — same as encoder
- **Supervisor** — can delete any document, manage transactions
- **Manager** — full access except user management
- **Admin** — full system access

---

## Project Structure

```
MorataFMS/
├── backend/          Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Http/Requests/
│   │   ├── Models/
│   │   └── Policies/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/         React 19 SPA
│   └── src/
│       ├── features/
│       │   └── tracking/   (main feature: transactions + documents)
│       └── components/     (shared UI components)
└── README.md
```

For detailed technical reference (DB schema, API routes, ERD), see [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md).
