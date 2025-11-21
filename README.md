# Business Loan Profile Application

A modern, responsive business loan application website with dynamic questionnaire system and admin panel. **Now optimized for cPanel shared hosting!**

## 🚀 Quick Start - cPanel Deployment

This application runs on standard PHP shared hosting (Namecheap, HostGator, Bluehost, etc.)

**📖 See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for complete deployment instructions**

### Quick Deploy (15 minutes):
1. Create MySQL database in cPanel
2. Upload `api/` and `public/` folders
3. Configure `api/config.php` with database credentials
4. Visit `http://yourdomain.com/api/setup.php` once
5. Done! 🎉

## Features

### Public Site
- **Modern Landing Page** - Professional design with hero section, loan types showcase
- **Dynamic Questionnaire** - Customizable questions that admins can manage
- **Lead Capture** - Collects client information (name, email, phone, business details)
- **Progress Tracking** - Visual progress bar throughout application process
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Premium Design** - Glassmorphism effects, Inter & Outfit fonts, smooth animations

### Admin Panel
- **Secure Login** - Session-based authentication with password protection
- **Lead Management** - View all submitted applications with complete details
  - Search by name, email, phone, or business name
  - Date range filtering
  - Export to CSV or JSON (includes questionnaire answers)
  - Pagination (10/20/50/100 rows per page)
  - Sortable columns
  - View detailed lead information with all answers
- **Question Management** - Create, edit, and delete custom questionnaire questions
- **Statistics Dashboard** - Track total leads, today's leads, and weekly leads
- **Multiple Question Types** - Support for multiple choice and text input
- **Modern UI** - Professional design with glassmorphism, SVG icons, premium styling

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Google Fonts
- **Backend**: PHP 7.4+ (compatible with PHP 8.x)
- **Database**: MySQL 5.7+ / MariaDB 10.x
- **Hosting**: cPanel shared hosting (Namecheap, HostGator, etc.)
- **Authentication**: PHP sessions with secure password protection

## Project Structure

```
businessloanprofile/
├── api/                          # PHP Backend
│   ├── config.php               # Database & admin configuration
│   ├── setup.php                # One-time database setup
│   ├── questions.php            # Get questions (public)
│   ├── submit.php               # Submit leads (public)
│   ├── admin-login.php          # Admin authentication
│   ├── admin-verify.php         # Session verification
│   ├── admin-logout.php         # Logout
│   ├── admin-leads.php          # Lead management
│   └── admin-questions.php      # Question management
│
├── public/                      # Frontend
│   ├── index.html              # Main landing page
│   ├── admin.html              # Admin panel
│   ├── login.html              # Admin login page
│   ├── app.js                  # Main application JS
│   ├── admin.js                # Admin panel JS
│   ├── login.js                # Login JS
│   ├── styles.css              # Main styles
│   ├── admin-styles.css        # Admin styles
│   ├── animations.js           # Scroll animations
│   └── images/                 # Logo and images
│
└── CPANEL_DEPLOYMENT_GUIDE.md  # Deployment instructions
```

## Installation & Deployment

### For cPanel Hosting (Recommended)

**📖 Full guide:** [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

**Quick steps:**

1. **Create MySQL Database in cPanel**
   - Database name, username, and password

2. **Upload Files**
   - Upload `api/` and `public/` folders to `public_html/`

3. **Configure Database**
   - Edit `api/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'yourusername_businessloans');
   define('DB_USER', 'yourusername_dbuser');
   define('DB_PASS', 'your-password');
   define('ADMIN_USERNAME', 'admin');
   define('ADMIN_PASSWORD', 'your-secure-password');
   ```

4. **Run Setup**
   - Visit: `http://yourdomain.com/api/setup.php`
   - Delete `setup.php` after successful setup

5. **Access Your Site**
   - Main: `http://yourdomain.com/public/index.html`
   - Admin: `http://yourdomain.com/public/login.html`

### Default Admin Credentials

Set your own in `api/config.php`:
```php
define('ADMIN_USERNAME', 'admin');  // Change this
define('ADMIN_PASSWORD', 'admin123');  // Change this!
```

**⚠️ IMPORTANT**: Change these before deploying!

## Usage

### For Visitors
1. Visit the homepage
2. Explore loan types and information
3. Click "Get Started" to begin application
4. Answer questionnaire questions
5. Fill in contact information
6. Submit application

### For Admins
1. Navigate to `/public/login.html`
2. Log in with your credentials
3. View and manage submitted leads
4. Export data to CSV or JSON
5. Manage questionnaire questions
6. View statistics and analytics

## Database Schema

### Tables Created Automatically
- **questions** - Questionnaire questions
- **question_options** - Multiple choice options for questions
- **leads** - Submitted applications (contact info)
- **answers** - Questionnaire responses linked to leads

All tables are created automatically when you run `setup.php`

## Default Questions

The system includes 5 pre-configured questions:
1. What type of business loan are you looking for?
2. How much funding do you need?
3. How long has your business been operating?
4. What is your estimated annual revenue?
5. What will you use the funds for?

You can modify, delete, or add new questions from the admin panel.

## API Endpoints

### Public Endpoints
- `GET /api/questions.php` - Get all questions with options
- `POST /api/submit.php` - Submit application with answers

### Admin Endpoints (Authentication Required)
- `POST /api/admin-login.php` - Admin login
- `GET /api/admin-verify.php` - Verify session
- `POST /api/admin-logout.php` - Logout
- `GET /api/admin-leads.php` - Get all leads
- `GET /api/admin-leads.php?id=123` - Get lead details with answers
- `POST /api/admin-questions.php` - Create new question
- `PUT /api/admin-questions.php?id=123` - Update question
- `DELETE /api/admin-questions.php?id=123` - Delete question

## Security Features

✅ **Session-based authentication** - PHP sessions for admin access
✅ **SQL injection protection** - PDO prepared statements
✅ **XSS protection** - HTML escaping for all user input
✅ **Password protection** - Configurable admin credentials
✅ **Session expiration** - 24-hour session lifetime
✅ **CORS headers** - Configured for secure API access

## Customization

### Styling
- Edit `public/styles.css` for main site
- Edit `public/admin-styles.css` for admin panel
- Colors use CSS custom properties (easy to change)

### Branding
- Update logo in `public/images/logo.png`
- Change company name in HTML files
- Modify colors in CSS variables
- Update footer information

### Images
- Default images from Unsplash
- Replace URLs in `index.html` with your own

## Browser Compatibility

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

See [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) for:
- Database connection issues
- 404 errors on API calls
- Authentication problems
- CORS errors
- And more...

## Documentation

- **[CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[PHP_VERSION_README.md](PHP_VERSION_README.md)** - PHP conversion details
- **[PHP_API_ENDPOINTS.md](PHP_API_ENDPOINTS.md)** - API endpoint reference

## Requirements

- **Hosting**: cPanel shared hosting or any PHP hosting
- **PHP**: 7.4 or higher (8.x compatible)
- **MySQL**: 5.7+ or MariaDB 10.x
- **Web Server**: Apache with mod_rewrite
- **Space**: ~5MB (excluding database)

## License

MIT License

## Support

For deployment help, see [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md)

---

**Made with ❤️ for cPanel hosting compatibility**
