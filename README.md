# Business Loan Funnel Application

A modern, responsive business loan application website with dynamic questionnaire system and admin panel.

## Features

### Public Site
- **Modern Landing Page** - Professional design with hero section, loan types, and how it works
- **Dynamic Questionnaire** - Customizable questions that admins can create/edit
- **Lead Capture** - Collects client information (name, email, phone, business details)
- **Progress Tracking** - Visual progress bar throughout the application process
- **Responsive Design** - Works on desktop, tablet, and mobile devices

### Admin Panel
- **Lead Management** - View all submitted applications with detailed information
- **Question Management** - Create, edit, and delete custom questionnaire questions
- **Statistics Dashboard** - Track total leads, today's leads, and weekly leads
- **Multiple Question Types** - Support for multiple choice and text input questions

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Email**: Nodemailer (optional)

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure email settings:
Create a `.env` file in the root directory:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

3. Start the server:
```bash
npm start
```

4. Open your browser:
- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/regolet/businessloanprofile)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

### Important Notes for Vercel

⚠️ **Database Limitation**: Vercel serverless functions are stateless, so SQLite will reset between deployments. For production, you should:

- Use a cloud database like:
  - **PostgreSQL** (Vercel Postgres, Supabase, Neon)
  - **MongoDB** (MongoDB Atlas)
  - **PlanetScale** (MySQL)

- Or use Vercel KV/Storage for persistent data

The current SQLite setup works for development but data will not persist in production on Vercel.

## Usage

### For Visitors
1. Visit the homepage
2. Explore different loan types
3. Click "Get Started" or scroll to the application section
4. Answer the questionnaire questions
5. Fill in contact information
6. Submit application

### For Admins
1. Navigate to `/admin.html`
2. View submitted leads and their details
3. Manage questions in the Questions section
4. Add new questions with custom options
5. Edit or delete existing questions

## Database Schema

### Tables
- **questions** - Stores questionnaire questions
- **question_options** - Stores multiple choice options
- **leads** - Stores submitted applications
- **answers** - Stores questionnaire responses

## Features Configuration

### Email Notifications
To enable email notifications when leads are submitted:
1. Set up SMTP credentials in `.env`
2. Applications will automatically be sent to the admin email

### Default Questions
The system comes with 5 default questions:
1. What type of business loan are you looking for?
2. How much funding do you need?
3. How long has your business been operating?
4. What is your estimated annual revenue?
5. What will you use the funds for?

You can modify or delete these from the admin panel.

## Customization

### Styling
- Edit `public/styles.css` for main site styling
- Edit `public/admin-styles.css` for admin panel styling
- Color scheme is defined in CSS variables

### Images
The site uses Unsplash images via CDN. Replace URLs in `index.html` with your own images if needed.

### Branding
- Update the business name in navigation
- Modify colors in CSS variables
- Update footer information

## API Endpoints

### Public Endpoints
- `GET /api/questions` - Get all questions with options
- `POST /api/submit` - Submit application with answers

### Admin Endpoints
- `GET /api/admin/leads` - Get all leads
- `GET /api/admin/leads/:id` - Get lead details with answers
- `POST /api/admin/questions` - Create new question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

## Security Notes

- Currently no authentication on admin panel (add this for production)
- No GDPR consent implemented (as requested)
- Add rate limiting for production use
- Consider adding CORS restrictions for production

## Future Enhancements

- Add admin authentication
- Implement GDPR consent banner
- Add export functionality for leads (CSV/Excel)
- Email notification system
- Lead status tracking (new, contacted, approved, etc.)
- Advanced analytics and reporting
- Multi-step form validation

## License

MIT License

## Support

For issues or questions, please contact your administrator.
