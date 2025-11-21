# PHP Version - Business Loan Profile Application

This application has been converted from Node.js to PHP to run on standard cPanel shared hosting.

## What Changed?

### Backend Conversion
- **Node.js/Express** → **PHP**
- **SQLite** → **MySQL/MariaDB**
- All API endpoints converted to individual PHP files

### File Structure

```
businessloanprofile/
├── api/                          # NEW: PHP Backend
│   ├── config.php               # Database configuration & auth
│   ├── setup.php                # Database setup script (run once)
│   ├── questions.php            # Public: Get questions
│   ├── submit.php               # Public: Submit lead
│   ├── admin-login.php          # Admin: Login
│   ├── admin-verify.php         # Admin: Verify session
│   ├── admin-logout.php         # Admin: Logout
│   ├── admin-leads.php          # Admin: Manage leads
│   └── admin-questions.php      # Admin: Manage questions
│
├── public/                      # Frontend (updated for PHP)
│   ├── index.html              # Main landing page
│   ├── admin.html              # Admin panel
│   ├── login.html              # Admin login
│   ├── app.js                  # Updated API calls
│   ├── admin.js                # Updated API calls
│   ├── login.js                # Updated API calls
│   ├── styles.css              # Styles
│   ├── admin-styles.css        # Admin styles
│   ├── animations.js           # Animations
│   └── images/                 # Images & logos
│
├── server/                      # OLD: Node.js files (keep for reference)
│   ├── index.js                # Old Node.js server
│   └── database.js             # Old SQLite setup
│
└── CPANEL_DEPLOYMENT_GUIDE.md  # Deployment instructions
```

## API Endpoint Mappings

| Node.js Endpoint | PHP Endpoint | Method | Description |
|-----------------|--------------|--------|-------------|
| `/api/questions` | `/api/questions.php` | GET | Get all questions |
| `/api/submit` | `/api/submit.php` | POST | Submit application |
| `/api/admin/login` | `/api/admin-login.php` | POST | Admin login |
| `/api/admin/verify` | `/api/admin-verify.php` | GET | Verify session |
| `/api/admin/logout` | `/api/admin-logout.php` | POST | Admin logout |
| `/api/admin/leads` | `/api/admin-leads.php` | GET | Get all leads |
| `/api/admin/leads/:id` | `/api/admin-leads.php?id=123` | GET | Get lead details |
| `/api/admin/questions` | `/api/admin-questions.php` | POST | Create question |
| `/api/admin/questions/:id` | `/api/admin-questions.php?id=123` | PUT | Update question |
| `/api/admin/questions/:id` | `/api/admin-questions.php?id=123` | DELETE | Delete question |

## Key Features

✅ **No Node.js required** - Runs on standard PHP shared hosting
✅ **MySQL database** - Available on all cPanel hosts
✅ **Session-based authentication** - Secure admin access
✅ **Backward compatible** - Frontend code mostly unchanged
✅ **Easy deployment** - Upload files and configure database
✅ **Default questions** - Automatically created on setup
✅ **Full admin panel** - Manage questions and view leads
✅ **Export functionality** - CSV and JSON exports with answers

## Deployment

### Quick Start:

1. **Create MySQL database** in cPanel
2. **Upload files** to `public_html/`
3. **Configure** `api/config.php` with database credentials
4. **Run** `http://yourdomain.com/api/setup.php` once
5. **Delete** `setup.php` after setup
6. **Access** your site!

📖 **See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for detailed instructions**

## Configuration

Edit `api/config.php` to set:

```php
// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Admin Credentials (CHANGE THESE!)
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'secure-password-here');
```

## Database Tables

The setup script creates 4 tables:

1. **questions** - Questionnaire questions
2. **question_options** - Multiple choice options
3. **leads** - Contact information
4. **answers** - Questionnaire responses

## Security Features

- ✅ Session-based authentication
- ✅ SQL injection protection (PDO prepared statements)
- ✅ XSS protection (HTML escaping)
- ✅ CORS headers configured
- ✅ Password protected admin area
- ✅ Session expiration (24 hours)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts (Inter, Outfit)
- Responsive design

**Backend:**
- PHP 7.4+ (works with PHP 8.x)
- MySQL 5.7+ / MariaDB 10.x
- PDO for database access
- Native PHP sessions

## Testing

After deployment, test:

1. ✅ Main landing page loads
2. ✅ Questionnaire displays questions
3. ✅ Form submission works
4. ✅ Admin login works
5. ✅ Admin panel displays leads
6. ✅ Question management works
7. ✅ CSV/JSON export works

## Troubleshooting

**Issue: API calls failing**
- Check `config.php` database credentials
- Verify `.php` files are in `api/` folder
- Check file permissions (644 for PHP files)

**Issue: Admin login not working**
- Verify credentials in `config.php`
- Clear browser cache and localStorage
- Check browser console for errors

**Issue: Database connection error**
- Confirm database exists in cPanel
- Check username includes cPanel prefix
- Verify user has ALL PRIVILEGES

## Support & Maintenance

- PHP version works on 99% of shared hosting
- No special server configuration needed
- Standard cPanel tools for backups
- Compatible with cPanel MySQL/MariaDB

## Migration Notes

If you were using the Node.js version:

1. Old data in SQLite won't transfer automatically
2. You'll need to export from old version and import to MySQL
3. Session tokens from Node.js won't work (users need to re-login)
4. All functionality remains the same

## Credits

- Original concept: Business loan questionnaire funnel
- Converted to PHP for cPanel compatibility
- Uses premium design with glassmorphism effects
- Responsive mobile-first design

---

## 🚀 Ready to Deploy!

Follow the [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

**Estimated deployment time: 15-20 minutes**
