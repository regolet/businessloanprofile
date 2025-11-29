<?php
/**
 * Database Setup Script
 * Run this file ONCE to create all necessary MySQL tables
 * Access: http://yourdomain.com/api/setup.php
 */

require_once 'config.php';

// Set up HTML output for better readability
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Setup - BusinessLoansProfile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f7fa;
            color: #2d3748;
        }
        h1 {
            color: #1a202c;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 0.5rem;
        }
        .section {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #2c5282;
            margin-top: 0;
            font-size: 1.25rem;
        }
        .item {
            padding: 0.5rem 0;
            border-left: 3px solid #e2e8f0;
            padding-left: 1rem;
            margin: 0.5rem 0;
        }
        .created {
            border-left-color: #48bb78;
            background: #f0fff4;
        }
        .exists {
            border-left-color: #4299e1;
            background: #ebf8ff;
        }
        .inserted {
            border-left-color: #9f7aea;
            background: #faf5ff;
        }
        .skipped {
            border-left-color: #ed8936;
            background: #fffaf0;
        }
        .error {
            border-left-color: #f56565;
            background: #fff5f5;
        }
        .icon {
            font-weight: bold;
            margin-right: 0.5rem;
        }
        .created .icon { color: #48bb78; }
        .exists .icon { color: #4299e1; }
        .inserted .icon { color: #9f7aea; }
        .skipped .icon { color: #ed8936; }
        .error .icon { color: #f56565; }
        .summary {
            background: #edf2f7;
            border-left: 4px solid #3182ce;
            padding: 1rem;
            margin: 1.5rem 0;
            font-weight: 500;
        }
        code {
            background: #edf2f7;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>🗄️ Database Setup - BusinessLoansProfile</h1>
    <p>This script will create all necessary database tables and insert default data.</p>

<?php
try {
    // Use inline connection for setup to avoid JSON error responses
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
    } catch (PDOException $e) {
        echo "<div class='section'>";
        echo "<div class='item error'><span class='icon'>✖</span><strong>Database Connection Failed:</strong> " . htmlspecialchars($e->getMessage()) . "</div>";
        echo "<p style='margin-top: 1rem;'>Please check your database credentials in <code>config.php</code>:</p>";
        echo "<ul>";
        echo "<li>DB_HOST: " . htmlspecialchars(DB_HOST) . "</li>";
        echo "<li>DB_NAME: " . htmlspecialchars(DB_NAME) . "</li>";
        echo "<li>DB_USER: " . htmlspecialchars(DB_USER) . "</li>";
        echo "</ul>";
        echo "</div></body></html>";
        exit();
    }
    echo "<div class='summary'>✓ Database connection established successfully</div>";

    // Track statistics
    $stats = [
        'tables_created' => 0,
        'tables_existed' => 0,
        'columns_added' => 0,
        'data_inserted' => 0
    ];

    // ========== TABLES CREATION ==========
    echo "<div class='section'>";
    echo "<h2>📋 Creating Database Tables</h2>";

    // Define all tables
    $tables = [
        'questions' => "
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50) NOT NULL,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'question_options' => "
            CREATE TABLE IF NOT EXISTS question_options (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                option_text TEXT NOT NULL,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'leads' => "
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                business_name VARCHAR(255),
                loan_amount VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'answers' => "
            CREATE TABLE IF NOT EXISTS answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                question_id INT NOT NULL,
                answer_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'site_settings' => "
            CREATE TABLE IF NOT EXISTS site_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                setting_type VARCHAR(20) DEFAULT 'text',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_setting (category, setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'hero_features' => "
            CREATE TABLE IF NOT EXISTS hero_features (
                id INT AUTO_INCREMENT PRIMARY KEY,
                feature_text VARCHAR(255) NOT NULL,
                icon_name VARCHAR(50) DEFAULT NULL,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'loan_types' => "
            CREATE TABLE IF NOT EXISTS loan_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon_name VARCHAR(50),
                features TEXT,
                is_featured TINYINT(1) DEFAULT 0,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'how_it_works_steps' => "
            CREATE TABLE IF NOT EXISTS how_it_works_steps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                step_number INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url VARCHAR(500),
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'faqs' => "
            CREATE TABLE IF NOT EXISTS faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'thinking_about_it' => "
            CREATE TABLE IF NOT EXISTS thinking_about_it (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                cell VARCHAR(50) NOT NULL,
                email VARCHAR(255) NOT NULL,
                ready_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'accounts' => "
            CREATE TABLE IF NOT EXISTS accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                account_status VARCHAR(20) NOT NULL DEFAULT 'regular',
                billing_status VARCHAR(20) DEFAULT 'active',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                is_active TINYINT(1) DEFAULT 1,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        'lead_documents' => "
            CREATE TABLE IF NOT EXISTS lead_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL,
                file_size INT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
                INDEX idx_lead_id (lead_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        "
    ];

    // Create each table and check if it existed
    foreach ($tables as $tableName => $createSQL) {
        // Check if table exists
        $checkTable = $conn->query("SHOW TABLES LIKE '$tableName'")->fetch();

        if (!$checkTable) {
            $conn->exec($createSQL);
            echo "<div class='item created'><span class='icon'>✓</span>Created table: <code>$tableName</code></div>";
            $stats['tables_created']++;
        } else {
            echo "<div class='item exists'><span class='icon'>ℹ️</span>Table already exists: <code>$tableName</code></div>";
            $stats['tables_existed']++;
        }
    }

    echo "</div>";

    // ========== MIGRATIONS (Column Additions) ==========
    echo "<div class='section'>";
    echo "<h2>🔧 Checking for Schema Migrations</h2>";

    // Check and add features column to loan_types
    $featuresExists = $conn->query("SHOW COLUMNS FROM loan_types LIKE 'features'")->fetch();
    if (!$featuresExists) {
        $conn->exec("ALTER TABLE loan_types ADD COLUMN features TEXT AFTER icon_name");
        echo "<div class='item created'><span class='icon'>✓</span>Added column <code>features</code> to <code>loan_types</code> table</div>";
        $stats['columns_added']++;
    } else {
        echo "<div class='item exists'><span class='icon'>ℹ️</span>Column <code>features</code> already exists in <code>loan_types</code></div>";
    }

    // Check and add is_featured column to loan_types
    $isFeaturedExists = $conn->query("SHOW COLUMNS FROM loan_types LIKE 'is_featured'")->fetch();
    if (!$isFeaturedExists) {
        $conn->exec("ALTER TABLE loan_types ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER features");
        echo "<div class='item created'><span class='icon'>✓</span>Added column <code>is_featured</code> to <code>loan_types</code> table</div>";
        $stats['columns_added']++;
    } else {
        echo "<div class='item exists'><span class='icon'>ℹ️</span>Column <code>is_featured</code> already exists in <code>loan_types</code></div>";
    }

    // Check and add image_url column to how_it_works_steps
    $imageUrlExists = $conn->query("SHOW COLUMNS FROM how_it_works_steps LIKE 'image_url'")->fetch();
    if (!$imageUrlExists) {
        $conn->exec("ALTER TABLE how_it_works_steps ADD COLUMN image_url VARCHAR(500) AFTER description");
        echo "<div class='item created'><span class='icon'>✓</span>Added column <code>image_url</code> to <code>how_it_works_steps</code> table</div>";
        $stats['columns_added']++;
    } else {
        echo "<div class='item exists'><span class='icon'>ℹ️</span>Column <code>image_url</code> already exists in <code>how_it_works_steps</code></div>";
    }

    // Check and add currency setting if it doesn't exist
    $currencyExists = $conn->query("SELECT id FROM site_settings WHERE category = 'company' AND setting_key = 'currency'")->fetch();
    if (!$currencyExists) {
        $conn->exec("INSERT INTO site_settings (category, setting_key, setting_value, setting_type) VALUES ('company', 'currency', '$', 'text')");
        echo "<div class='item created'><span class='icon'>✓</span>Added <code>currency</code> setting to <code>site_settings</code></div>";
        $stats['data_inserted']++;
    } else {
        echo "<div class='item exists'><span class='icon'>ℹ️</span>Setting <code>currency</code> already exists in <code>site_settings</code></div>";
    }

    echo "</div>";

    // ========== DEFAULT DATA INSERTION ==========
    echo "<div class='section'>";
    echo "<h2>📝 Inserting Default Data</h2>";

    // Check and insert default questions
    $stmt = $conn->query("SELECT COUNT(*) as count FROM questions");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default questions...</div>";

        $defaultQuestions = [
            [
                'text' => 'What type of business loan are you looking for?',
                'type' => 'multiple_choice',
                'order' => 1,
                'options' => [
                    'Term Loan',
                    'Line of Credit',
                    'SBA Loan',
                    'Equipment Financing',
                    'Invoice Financing',
                    'Merchant Cash Advance'
                ]
            ],
            [
                'text' => 'How much funding do you need?',
                'type' => 'multiple_choice',
                'order' => 2,
                'options' => [
                    'Under $50,000',
                    '$50,000 - $100,000',
                    '$100,000 - $250,000',
                    '$250,000 - $500,000',
                    '$500,000+'
                ]
            ],
            [
                'text' => 'How long has your business been operating?',
                'type' => 'multiple_choice',
                'order' => 3,
                'options' => [
                    'Less than 6 months',
                    '6 months - 1 year',
                    '1 - 2 years',
                    '2 - 5 years',
                    '5+ years'
                ]
            ],
            [
                'text' => 'What is your estimated annual revenue?',
                'type' => 'multiple_choice',
                'order' => 4,
                'options' => [
                    'Under $100,000',
                    '$100,000 - $250,000',
                    '$250,000 - $500,000',
                    '$500,000 - $1,000,000',
                    '$1,000,000+'
                ]
            ],
            [
                'text' => 'What will you use the funds for?',
                'type' => 'text',
                'order' => 5,
                'options' => []
            ]
        ];

        $questionStmt = $conn->prepare("INSERT INTO questions (question_text, question_type, order_index) VALUES (?, ?, ?)");
        $optionStmt = $conn->prepare("INSERT INTO question_options (question_id, option_text) VALUES (?, ?)");

        $questionCount = 0;
        $optionCount = 0;
        foreach ($defaultQuestions as $q) {
            $questionStmt->execute([$q['text'], $q['type'], $q['order']]);
            $questionId = $conn->lastInsertId();
            $questionCount++;

            foreach ($q['options'] as $option) {
                $optionStmt->execute([$questionId, $option]);
                $optionCount++;
            }
        }

        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted $questionCount questions with $optionCount options</div>";
        $stats['data_inserted'] += $questionCount;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped questions - {$row['count']} questions already exist</div>";
    }

    // Check and insert default site settings
    $stmt = $conn->query("SELECT COUNT(*) as count FROM site_settings");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default site settings...</div>";

        $defaultSettings = [
            // System Settings
            ['system', 'maintenance_mode', '0', 'text'],

            // Company Profile
            ['company', 'name', 'BusinessLoansProfile', 'text'],
            ['company', 'email', 'info@businessloans.com', 'email'],
            ['company', 'phone', '1-800-BUSINESS', 'text'],
            ['company', 'address', '', 'textarea'],
            ['company', 'currency', '$', 'text'],

            // Hero Section
            ['hero', 'title', 'Funding to Fuel Your Business', 'text'],
            ['hero', 'subtitle', 'Compare multiple loan options at once and select the best fit with confidence. You\'re in the driver\'s seat.', 'textarea'],
            ['hero', 'cta_text', 'Get Started', 'text'],
            ['hero', 'note', 'Answer some basic questions with no impact to your credit score', 'text'],
            ['hero', 'image_url', 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&auto=format&fit=crop', 'text'],

            // Hero Features
            ['hero_features', 'feature1_text', 'Under 3 minutes', 'text'],
            ['hero_features', 'feature2_text', 'No credit impact', 'text'],
            ['hero_features', 'feature3_text', 'Funding in 24 hours', 'text'],

            // Loan Types Section
            ['loan_types', 'section_title', 'Explore Your Loan Options', 'text'],
            ['loan_types', 'section_subtitle', 'Understanding which type of financing best suits your business needs', 'text'],

            // How It Works
            ['how_it_works', 'section_title', 'Compare Multiple Offers in Minutes', 'text'],
            ['how_it_works', 'section_subtitle', 'Our proprietary technology matches you with handpicked lenders from our network', 'text'],

            // About Us
            ['about_us', 'title', 'About BusinessLoansProfile', 'text'],
            ['about_us', 'subtitle', 'Your trusted partner in business financing', 'text'],
            ['about_us', 'description', 'We are dedicated to helping businesses of all sizes access the funding they need to grow and succeed. With years of experience in the financial industry, our team understands the challenges business owners face when seeking capital.', 'textarea'],
            ['about_us', 'image_url', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&auto=format&fit=crop', 'text'],
            ['about_us', 'feature1_title', 'Trusted Network', 'text'],
            ['about_us', 'feature1_text', 'Access to 50+ vetted lenders offering competitive rates and terms', 'text'],
            ['about_us', 'feature2_title', 'Fast Process', 'text'],
            ['about_us', 'feature2_text', 'Get matched with lenders in minutes, not days or weeks', 'text'],
            ['about_us', 'feature3_title', 'Expert Support', 'text'],
            ['about_us', 'feature3_text', 'Our funding specialists guide you every step of the way', 'text'],

            // FAQ Items (default 4 FAQs)
            ['faq', 'faq1_question', 'How long does the application take?', 'text'],
            ['faq', 'faq1_answer', 'Our streamlined application takes less than 3 minutes to complete. You\'ll answer some basic questions about your business and funding needs.', 'textarea'],
            ['faq', 'faq2_question', 'Will checking rates affect my credit score?', 'text'],
            ['faq', 'faq2_answer', 'No. The initial review and offer comparison process does not impact your credit score. Only when you proceed with a specific lender might a hard credit check be required.', 'textarea'],
            ['faq', 'faq3_question', 'How quickly can I get funded?', 'text'],
            ['faq', 'faq3_answer', 'Funding speed varies by lender and loan type. Many of our partners offer funding within 24 hours of approval, though some products may take longer.', 'textarea'],
            ['faq', 'faq4_question', 'What do I need to qualify?', 'text'],
            ['faq', 'faq4_answer', 'Requirements vary by loan type and lender. Generally, you\'ll need to be in business for a minimum period and meet certain revenue thresholds. Our network includes options for various credit profiles.', 'textarea'],

            // Footer Settings
            ['footer', 'copyright_text', '© 2024 BusinessLoansProfile. All rights reserved.', 'text'],
            ['footer', 'tagline', 'Empowering businesses with fast, flexible financing solutions.', 'text'],
        ];

        $settingStmt = $conn->prepare("INSERT INTO site_settings (category, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)");

        foreach ($defaultSettings as $setting) {
            $settingStmt->execute($setting);
        }

        $settingsCount = count($defaultSettings);
        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted $settingsCount site settings (including footer settings)</div>";
        $stats['data_inserted'] += $settingsCount;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped site settings - {$row['count']} settings already exist</div>";
    }

    // Insert default hero features
    $stmt = $conn->query("SELECT COUNT(*) as count FROM hero_features");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default hero features...</div>";

        $featureStmt = $conn->prepare("INSERT INTO hero_features (feature_text, order_index) VALUES (?, ?)");
        $featureStmt->execute(['Under 3 minutes', 1]);
        $featureStmt->execute(['No credit impact', 2]);
        $featureStmt->execute(['Funding in 24 hours', 3]);

        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted 3 hero features</div>";
        $stats['data_inserted'] += 3;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped hero features - {$row['count']} features already exist</div>";
    }

    // Insert default loan types
    $stmt = $conn->query("SELECT COUNT(*) as count FROM loan_types");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default loan types...</div>";

        $loanTypeStmt = $conn->prepare("INSERT INTO loan_types (title, description, icon_name, order_index) VALUES (?, ?, ?, ?)");
        $loanTypeStmt->execute(['Short Term Loan', 'Quick funding with flexible terms for immediate business needs', 'clock', 1]);
        $loanTypeStmt->execute(['Long Term Loan', 'Lower monthly payments for major investments and expansion', 'calendar', 2]);
        $loanTypeStmt->execute(['Line of Credit', 'Revolving credit for ongoing operational expenses', 'refresh', 3]);
        $loanTypeStmt->execute(['Merchant Cash Advance', 'Fast funding based on your daily credit card sales', 'credit-card', 4]);

        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted 4 loan types</div>";
        $stats['data_inserted'] += 4;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped loan types - {$row['count']} types already exist</div>";
    }

    // Insert default how it works steps
    $stmt = $conn->query("SELECT COUNT(*) as count FROM how_it_works_steps");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default 'How It Works' steps...</div>";

        $stepStmt = $conn->prepare("INSERT INTO how_it_works_steps (step_number, title, description, order_index) VALUES (?, ?, ?, ?)");
        $stepStmt->execute([1, 'Tell us about your business', 'Answer a few quick questions about your business and funding needs', 1]);
        $stepStmt->execute([2, 'Review your matches', 'We\'ll match you with the best lenders from our trusted network', 2]);
        $stepStmt->execute([3, 'Get funded', 'Choose your preferred offer and receive funding in as little as 24 hours', 3]);

        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted 3 'How It Works' steps</div>";
        $stats['data_inserted'] += 3;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped 'How It Works' - {$row['count']} steps already exist</div>";
    }

    // Insert default FAQs
    $stmt = $conn->query("SELECT COUNT(*) as count FROM faqs");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Inserting default FAQs...</div>";

        $faqStmt = $conn->prepare("INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)");
        $faqStmt->execute(['How long does the application take?', 'Our streamlined application takes less than 3 minutes to complete. You\'ll answer some basic questions about your business and funding needs.', 1]);
        $faqStmt->execute(['Will checking rates affect my credit score?', 'No. The initial review and offer comparison process does not impact your credit score. Only when you proceed with a specific lender might a hard credit check be required.', 2]);
        $faqStmt->execute(['How quickly can I get funded?', 'Funding speed varies by lender and loan type. Many of our partners offer funding within 24 hours of approval, though some products may take longer.', 3]);
        $faqStmt->execute(['What do I need to qualify?', 'Requirements vary by loan type and lender. Generally, you\'ll need to be in business for a minimum period and meet certain revenue thresholds. Our network includes options for various credit profiles.', 4]);

        echo "<div class='item inserted'><span class='icon'>✓</span>Inserted 4 FAQs</div>";
        $stats['data_inserted'] += 4;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped FAQs - {$row['count']} FAQs already exist</div>";
    }

    // Insert default super admin account
    $stmt = $conn->query("SELECT COUNT(*) as count FROM accounts");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        echo "<div class='item inserted'><span class='icon'>➕</span>Creating default super admin account...</div>";

        // Create super admin with username 'admin' and password 'admin123'
        // IMPORTANT: Change these credentials after first login!
        $defaultPassword = 'admin123';
        $passwordHash = password_hash($defaultPassword, PASSWORD_DEFAULT);

        $accountStmt = $conn->prepare("INSERT INTO accounts (username, email, password_hash, role, account_status, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $accountStmt->execute(['admin', 'admin@businessloans.com', $passwordHash, 'super_admin', 'max', 'Super', 'Admin']);

        echo "<div class='item inserted'><span class='icon'>✓</span>Created super admin account</div>";
        echo "<div class='item' style='background: #fffaf0; border-left-color: #ed8936;'><span class='icon'>⚠️</span><strong>IMPORTANT:</strong> Default login - Username: <code>admin</code>, Password: <code>admin123</code> - Change this immediately!</div>";
        $stats['data_inserted'] += 1;
    } else {
        echo "<div class='item skipped'><span class='icon'>⊘</span>Skipped accounts - {$row['count']} accounts already exist</div>";
    }

    echo "</div>";

    // ========== SUMMARY ==========
    echo "<div class='section'>";
    echo "<h2>📊 Setup Summary</h2>";
    echo "<div style='background: white; padding: 1rem; border-radius: 5px;'>";
    echo "<p><strong>Tables Created:</strong> {$stats['tables_created']}</p>";
    echo "<p><strong>Tables Already Existed:</strong> {$stats['tables_existed']}</p>";
    echo "<p><strong>Columns Added (Migrations):</strong> {$stats['columns_added']}</p>";
    echo "<p><strong>Default Data Records Inserted:</strong> {$stats['data_inserted']}</p>";
    echo "</div>";

    if ($stats['tables_created'] > 0 || $stats['data_inserted'] > 0) {
        echo "<div class='summary' style='border-left-color: #48bb78; background: #f0fff4;'>";
        echo "✅ <strong>Setup completed successfully!</strong> Your database is ready to use.";
        echo "</div>";
    } else {
        echo "<div class='summary' style='border-left-color: #4299e1; background: #ebf8ff;'>";
        echo "ℹ️ <strong>No changes needed.</strong> All tables and data already exist. Your database is up to date.";
        echo "</div>";
    }
    echo "</div>";

} catch (PDOException $e) {
    echo "<div class='section'>";
    echo "<div class='item error'><span class='icon'>✖</span><strong>Setup Failed:</strong> " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "</div>";
    http_response_code(500);
}
?>

</body>
</html>
