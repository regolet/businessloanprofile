const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Create a new question (Admin)
app.post('/api/admin/questions', (req, res) => {
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

// Update a question (Admin)
app.put('/api/admin/questions/:id', (req, res) => {
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

// Delete a question (Admin)
app.delete('/api/admin/questions/:id', (req, res) => {
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

// Get all leads (Admin)
app.get('/api/admin/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get lead details with answers (Admin)
app.get('/api/admin/leads/:id', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
