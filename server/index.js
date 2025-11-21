const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory session store (for production, use Redis or database)
const sessions = new Map();

// Default admin credentials (change these in production!)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify session middleware
function verifySession(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.session = session;
  next();
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Email configuration (optional - configure with your SMTP details)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// API Routes

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    sessions.set(token, {
      username,
      createdAt: Date.now(),
      expiresAt
    });

    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Verify session
app.get('/api/admin/verify', verifySession, (req, res) => {
  res.json({
    success: true,
    username: req.session.username
  });
});

// Admin logout
app.post('/api/admin/logout', verifySession, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);
  sessions.delete(token);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get all questions
app.get('/api/questions', (req, res) => {
  db.all('SELECT * FROM questions ORDER BY order_index ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get options for each question
    const questionsWithOptions = rows.map(question => {
      return new Promise((resolve) => {
        db.all('SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC',
          [question.id],
          (err, options) => {
            resolve({
              ...question,
              options: options || []
            });
          }
        );
      });
    });

    Promise.all(questionsWithOptions).then(questions => {
      res.json(questions);
    });
  });
});

// Create a new question (Admin - Protected)
app.post('/api/admin/questions', verifySession, (req, res) => {
  const { question_text, question_type, order_index, options } = req.body;

  db.run(
    'INSERT INTO questions (question_text, question_type, order_index) VALUES (?, ?, ?)',
    [question_text, question_type, order_index],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const questionId = this.lastID;

      // Insert options if provided
      if (options && options.length > 0) {
        const stmt = db.prepare('INSERT INTO question_options (question_id, option_text) VALUES (?, ?)');
        options.forEach(option => {
          stmt.run([questionId, option]);
        });
        stmt.finalize();
      }

      res.json({ id: questionId, message: 'Question created successfully' });
    }
  );
});

// Update a question (Admin - Protected)
app.put('/api/admin/questions/:id', verifySession, (req, res) => {
  const { id } = req.params;
  const { question_text, question_type, order_index, options } = req.body;

  db.run(
    'UPDATE questions SET question_text = ?, question_type = ?, order_index = ? WHERE id = ?',
    [question_text, question_type, order_index, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Delete old options and insert new ones
      db.run('DELETE FROM question_options WHERE question_id = ?', [id], (err) => {
        if (options && options.length > 0) {
          const stmt = db.prepare('INSERT INTO question_options (question_id, option_text) VALUES (?, ?)');
          options.forEach(option => {
            stmt.run([id, option]);
          });
          stmt.finalize();
        }
      });

      res.json({ message: 'Question updated successfully' });
    }
  );
});

// Delete a question (Admin - Protected)
app.delete('/api/admin/questions/:id', verifySession, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Question deleted successfully' });
  });
});

// Submit lead/application
app.post('/api/submit', async (req, res) => {
  const { contact_info, answers, send_email } = req.body;

  // Insert lead
  db.run(
    'INSERT INTO leads (name, email, phone, business_name, loan_amount) VALUES (?, ?, ?, ?, ?)',
    [
      contact_info.name || '',
      contact_info.email || '',
      contact_info.phone || '',
      contact_info.business_name || '',
      contact_info.loan_amount || ''
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const leadId = this.lastID;

      // Insert answers
      if (answers && answers.length > 0) {
        const stmt = db.prepare('INSERT INTO answers (lead_id, question_id, answer_text) VALUES (?, ?, ?)');
        answers.forEach(answer => {
          stmt.run([leadId, answer.question_id, answer.answer_text]);
        });
        stmt.finalize();
      }

      // Send email if configured and requested
      if (send_email && process.env.SMTP_USER) {
        const emailContent = `
          New Business Loan Application

          Contact Information:
          Name: ${contact_info.name}
          Email: ${contact_info.email}
          Phone: ${contact_info.phone}
          Business Name: ${contact_info.business_name}
          Loan Amount: ${contact_info.loan_amount}

          Answers:
          ${answers.map(a => `Question ${a.question_id}: ${a.answer_text}`).join('\n')}
        `;

        transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: 'New Business Loan Application',
          text: emailContent
        }).catch(err => console.log('Email error:', err));
      }

      res.json({
        id: leadId,
        message: 'Application submitted successfully'
      });
    }
  );
});

// Get all leads (Admin - Protected)
app.get('/api/admin/leads', verifySession, (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get lead details with answers (Admin - Protected)
app.get('/api/admin/leads/:id', verifySession, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM leads WHERE id = ?', [id], (err, lead) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.all(
      `SELECT a.*, q.question_text
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.lead_id = ?`,
      [id],
      (err, answers) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          ...lead,
          answers
        });
      }
    );
  });
});

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export the Express app for Vercel serverless functions
module.exports = app;
