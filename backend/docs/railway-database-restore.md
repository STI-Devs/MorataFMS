# Railway: Connect & Restore a Database Backup

Step-by-step guide for connecting to a Railway MySQL database and restoring a backup into it (written for the "DB Staging" service).

## Prerequisites

- Railway account with access to the project
- DBeaver
- A backup file: download the `.sql.gz` from S3 and extract it

## 1. Connect to the database

**Railway dashboard:**
1. Open the **"DB"** service → **Settings → Networking → Public Access → Enable TCP Proxy**.
2. Copy the `MYSQL_PUBLIC_URL` variable:
   ```
   mysql://root:<password>@<proxy-host>.proxy.rlwy.net:<port>/railway
   ```

**DBeaver:**
3. Convert the copied URL to JDBC format:
   - change the scheme `mysql://` → `jdbc:mysql://`
   - remove the `root:<password>@` part — put those in the Username/Password fields instead

   Example:
   ```
   mysql://root:xxx@altaria.proxy.rlwy.net:37714/railway
 → jdbc:mysql://altaria.proxy.rlwy.net:37714/railway
   ```
4. **New connection → MySQL**, then paste the converted **JDBC URL**:
   ```
   jdbc:mysql://<proxy-host>.proxy.rlwy.net:<port>/railway
   ```
   Enter the username (`root`) and password from `MYSQL_PUBLIC_URL`.
5. **Test Connection**.


## 2. Restore the backup

1. Right-click the **`railway`** database in the navigator → **Tools → Restore Database**.
2. **Import from file** → select your `.sql` backup.
3. Target database: `railway`.
4. Click **Start / Restore** and wait for it to finish.


## 3. Verify

```sql
USE railway;

SELECT COUNT(*) AS table_count
FROM information_schema.tables WHERE table_schema = 'railway';

SELECT COUNT(*) AS user_rows FROM users;
```

Compare the numbers against production to confirm the data landed.
