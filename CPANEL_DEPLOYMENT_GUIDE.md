# cPanel Deployment Guide - PHP Version

This guide will help you deploy the Business Loan Profile application to your Namecheap shared hosting (or any cPanel hosting).

## Prerequisites

- cPanel hosting account (Namecheap shared hosting)
- FTP access or cPanel File Manager access
- MySQL database (available in cPanel)

## Step 1: Create MySQL Database

1. Log into your **cPanel**
2. Find and click **"MySQL® Databases"**
3. Under **"Create New Database"**, enter a database name (e.g., `businessloans`)
4. Click **"Create Database"**
5. Scroll down to **"Add New User"**
   - Username: Choose a username (e.g., `blp_user`)
   - Password: Generate a strong password (save this!)
   - Click **"Create User"**
6. Scroll to **"Add User To Database"**
   - Select your user and database
   - Click **"Add"**
   - On the privileges page, select **"ALL PRIVILEGES"**
   - Click **"Make Changes"**

**Save these details - you'll need them:**
- Database name: (e.g., `yourusername_businessloans`)
- Database username: (e.g., `yourusername_blp_user`)
- Database password: (the password you generated)
- Database host: `localhost`

## Step 2: Upload Files to cPanel

### Using File Manager:

1. Go to cPanel **File Manager**
2. Navigate to **public_html/** (or a subdirectory if you want, e.g., `public_html/loans/`)
3. Upload all project files:
   ```
   api/               (all PHP files)
   *.html             (index.html, admin.html, login.html)
   *.css              (all stylesheet files)
   *.js               (all JavaScript files)
   images/            (logo and SVG files)
   .htaccess          (if exists)
   ```

### Using FTP:

1. Connect to your hosting via FTP (FileZilla recommended)
2. Navigate to `public_html/`
3. Upload the same folders listed above

**Files to upload:**
- Entire `api/` folder with all `.php` files
- All HTML files (index.html, admin.html, login.html)
- All CSS files (styles.css, admin-styles.css, login-styles.css)
- All JS files (app.js, admin.js, login.js, animations.js)
- `images/` folder with logo and SVG files
- DO NOT upload `.git/`, `.claude/`, or documentation `.md` files

## Step 3: Configure Database Connection

1. In cPanel File Manager, navigate to `/public_html/api/`
2. Right-click on `config.php` and select **"Edit"**
3. Update these lines with your database details:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'yourusername_businessloans');  // Your actual database name
define('DB_USER', 'yourusername_blp_user');  // Your actual username
define('DB_PASS', 'your-password-here');  // Your actual password
```

4. **IMPORTANT**: Change the admin credentials:

```php
define('ADMIN_USERNAME', 'admin');  // Change this
define('ADMIN_PASSWORD', 'your-secure-password');  // Change this to something strong!
```

5. Click **"Save Changes"**

## Step 4: Run Database Setup

1. Open your web browser
2. Navigate to: `http://yourdomain.com/api/setup.php`
   - Replace `yourdomain.com` with your actual domain
   - If you installed in a subdirectory, use: `http://yourdomain.com/subdirectory/api/setup.php`

3. You should see a success message:
   ```json
   {
     "success": true,
     "message": "Database tables created and default questions inserted successfully!"
   }
   ```

4. **IMPORTANT SECURITY**: After setup is complete, either:
   - Delete `setup.php` file, OR
   - Rename it to `setup.php.bak`

## Step 5: Configure URL Paths (if needed)

If you installed the application in a subdirectory (not in root `public_html/`), you need to update the API URLs:

1. Edit `public/app.js`, `public/admin.js`, and `public/login.js`
2. Change:
   ```javascript
   const API_URL = '/api';
   ```
   To:
   ```javascript
   const API_URL = '/subdirectory/api';  // Replace 'subdirectory' with your actual folder name
   ```

## Step 6: Test the Application

### Test Main Site:
1. Visit: `http://yourdomain.com` or `http://yourdomain.com/index.html`
2. You should see the landing page with loan information
3. Try filling out the questionnaire to test if it works

### Test Admin Login:
1. Visit: `http://yourdomain.com/login.html`
2. Log in with the credentials you set in `config.php`
3. You should be redirected to the admin panel

### Test Admin Panel:
1. Check if leads are showing up
2. Try adding/editing/deleting questions
3. Test the export (CSV/JSON) functionality

## Step 7: Optional - Set up Clean URLs

To make the site accessible at just `http://yourdomain.com` (without `/index.html`):

Create/edit `.htaccess` in `public_html/`:

```apache
# Set default index page
DirectoryIndex index.html

# Optional: Remove .html extensions for cleaner URLs
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^\.]+)$ $1.html [NC,L]
```

With this setup:
- `http://yourdomain.com` → Shows index.html
- `http://yourdomain.com/admin` → Shows admin.html
- `http://yourdomain.com/login` → Shows login.html

## Troubleshooting

### Issue: "Database connection failed"
**Solution**: Double-check your database credentials in `api/config.php`. Make sure the database name includes your cPanel username prefix (e.g., `username_database`).

### Issue: "404 Not Found" on API calls
**Solution**:
1. Verify that all `.php` files are in the `api/` folder
2. Check file permissions: PHP files should be `644`
3. Make sure mod_rewrite is not interfering

### Issue: "Unauthorized" when accessing admin
**Solution**:
1. Clear your browser cache and localStorage
2. Try logging in again with the correct credentials from `config.php`
3. Check browser console for errors

### Issue: Questions not loading
**Solution**:
1. Make sure you ran `setup.php` successfully
2. Check if the database tables were created (use phpMyAdmin in cPanel)
3. Verify API endpoint URLs are correct

### Issue: CORS errors in browser console
**Solution**: The `config.php` already includes CORS headers. If still having issues, add to `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
```

## Security Recommendations

1. **Change default admin credentials** in `config.php`
2. **Delete or rename `setup.php`** after initial setup
3. **Use HTTPS** - Get a free SSL certificate from cPanel (Let's Encrypt)
4. **Regular backups** - Use cPanel backup feature
5. **Keep credentials secure** - Never commit `config.php` with real credentials to GitHub

## File Permissions

Recommended permissions:
- Folders: `755`
- PHP files: `644`
- HTML/CSS/JS files: `644`
- Images: `644`

To set permissions in cPanel File Manager:
1. Right-click on file/folder
2. Select "Change Permissions"
3. Enter the appropriate code

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check cPanel Error Logs
3. Enable PHP error reporting temporarily (add to top of `config.php`):
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```
4. Check database connection with a simple test script

## Next Steps

- Customize the design and content
- Add your company logo and branding
- Configure email notifications (optional)
- Set up Google Analytics (optional)
- Point your domain to the application

---

**Your application is now live! 🎉**

Access your sites:
- Main site: `http://yourdomain.com` or `http://yourdomain.com/index.html`
- Admin login: `http://yourdomain.com/login.html`
- Admin panel: `http://yourdomain.com/admin.html` (accessed after login)
