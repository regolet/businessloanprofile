const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database
const db = new sqlite3.Database(path.join(__dirname, 'business_loans.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  // Create questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create question options table
  db.run(`
    CREATE TABLE IF NOT EXISTS question_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Create leads table
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      business_name TEXT,
      loan_amount TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create answers table
  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  // Insert default questions
  db.get('SELECT COUNT(*) as count FROM questions', [], (err, row) => {
    if (err) {
      console.error('Error checking questions:', err);
      return;
    }
    if (row && row.count === 0) {
      insertDefaultQuestions();
    }
  });
}

function insertDefaultQuestions() {
  const defaultQuestions = [
    {
      text: 'What type of business loan are you looking for?',
      type: 'multiple_choice',
      order: 1,
      options: [
        'Term Loan',
        'Line of Credit',
        'SBA Loan',
        'Equipment Financing',
        'Invoice Financing',
        'Merchant Cash Advance'
      ]
    },
    {
      text: 'How much funding do you need?',
      type: 'multiple_choice',
      order: 2,
      options: [
        'Under $50,000',
        '$50,000 - $100,000',
        '$100,000 - $250,000',
        '$250,000 - $500,000',
        '$500,000+'
      ]
    },
    {
      text: 'How long has your business been operating?',
      type: 'multiple_choice',
      order: 3,
      options: [
        'Less than 6 months',
        '6 months - 1 year',
        '1 - 2 years',
        '2 - 5 years',
        '5+ years'
      ]
    },
    {
      text: 'What is your estimated annual revenue?',
      type: 'multiple_choice',
      order: 4,
      options: [
        'Under $100,000',
        '$100,000 - $250,000',
        '$250,000 - $500,000',
        '$500,000 - $1,000,000',
        '$1,000,000+'
      ]
    },
    {
      text: 'What will you use the funds for?',
      type: 'text',
      order: 5,
      options: []
    }
  ];

  defaultQuestions.forEach(q => {
    db.run(
      'INSERT INTO questions (question_text, question_type, order_index) VALUES (?, ?, ?)',
      [q.text, q.type, q.order],
      function() {
        const questionId = this.lastID;
        if (q.options.length > 0) {
          const stmt = db.prepare('INSERT INTO question_options (question_id, option_text) VALUES (?, ?)');
          q.options.forEach(option => {
            stmt.run([questionId, option]);
          });
          stmt.finalize();
        }
      }
    );
  });

  console.log('Default questions inserted');
}

module.exports = db;
