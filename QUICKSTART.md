# Quick Start Guide

## Your Application is Ready! 🎉

The business loan funnel application is now running on your local machine.

## Access Your Application

### Public Website (Customer-facing)
**URL:** http://localhost:3000

This is the main website where customers can:
- Browse different loan types
- Learn how the process works
- Apply for a business loan through the questionnaire
- Submit their contact information

### Admin Panel
**URL:** http://localhost:3000/admin.html

This is where you can:
- View all submitted lead applications
- See detailed information for each lead
- Create, edit, and delete questionnaire questions
- Customize the application flow

## What's Included

### ✅ Landing Page Features
- Modern hero section with call-to-action
- 6 different loan type cards (Term Loan, Line of Credit, SBA Loan, etc.)
- How it works section (3 steps)
- Professional business loan theme with blue/green color scheme
- Fully responsive design
- Stock images from Unsplash

### ✅ Questionnaire System
- 5 default questions pre-configured
- Dynamic question loading from database
- Progress bar showing completion
- Support for multiple choice and text input questions
- Smooth animations and transitions

### ✅ Lead Capture
- Contact form collects:
  - Full Name
  - Email Address
  - Phone Number
  - Business Name
  - Desired Loan Amount
- Stores all data in SQLite database
- Optional email notifications (requires SMTP setup)

### ✅ Admin Panel
- Dashboard with statistics (Total leads, Today's leads, This week)
- Complete lead management
- View detailed lead information with all answers
- Question management system
- Add/Edit/Delete questions
- Reorder questions
- Add custom options for multiple choice questions

## Database Location

Your SQLite database is stored at:
`server/business_loans.db`

All leads, questions, and answers are stored here.

## Next Steps

1. **Customize the Design**
   - Edit `public/styles.css` to change colors and styling
   - Update the hero text in `public/index.html`
   - Change the business name/logo

2. **Modify Questions**
   - Go to http://localhost:3000/admin.html
   - Click on "Questions" in the sidebar
   - Edit existing questions or add new ones

3. **Set Up Email Notifications** (Optional)
   - Copy `.env.example` to `.env`
   - Add your SMTP credentials
   - Restart the server

4. **Deploy to Production**
   - Choose a hosting provider (Heroku, DigitalOcean, AWS, etc.)
   - Update the API_URL in `public/app.js` and `public/admin.js`
   - Add authentication to the admin panel
   - Set up HTTPS/SSL certificate

## Test the Application

1. Open http://localhost:3000
2. Scroll down to "Start Your Application"
3. Answer the questionnaire questions
4. Fill in the contact form
5. Submit the application
6. Go to http://localhost:3000/admin.html to view the submission

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Restarting the Server

```bash
npm start
```

## Need Help?

- Check the README.md for full documentation
- Review the code comments for implementation details
- All files are well-organized and easy to modify

## File Structure

```
businessloanprofile/
├── server/
│   ├── index.js           # Main server file
│   ├── database.js        # Database setup and initialization
│   └── business_loans.db  # SQLite database (created on first run)
├── public/
│   ├── index.html         # Main landing page
│   ├── styles.css         # Main site styles
│   ├── app.js             # Frontend JavaScript
│   ├── admin.html         # Admin panel
│   ├── admin-styles.css   # Admin panel styles
│   └── admin.js           # Admin panel JavaScript
├── package.json           # Dependencies
├── README.md             # Full documentation
└── QUICKSTART.md         # This file

Enjoy your new business loan funnel! 🚀
```
