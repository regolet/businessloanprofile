<?php
/**
 * Database Setup Script
 * Run this file ONCE to create all necessary MySQL tables
 * Access: http://yourdomain.com/api/setup.php
 */

require_once 'config.php';

try {
    $conn = getDbConnection();

    // Create questions table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_text TEXT NOT NULL,
            question_type VARCHAR(50) NOT NULL,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create question_options table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS question_options (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            option_text TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create leads table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            business_name VARCHAR(255),
            loan_amount VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create answers table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS answers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lead_id INT NOT NULL,
            question_id INT NOT NULL,
            answer_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create site_settings table
    $conn->exec("
        CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            setting_key VARCHAR(100) NOT NULL,
            setting_value TEXT,
            setting_type VARCHAR(20) DEFAULT 'text',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_setting (category, setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create hero_features table (dynamic)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS hero_features (
            id INT AUTO_INCREMENT PRIMARY KEY,
            feature_text VARCHAR(255) NOT NULL,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create loan_types table (dynamic)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS loan_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            icon_name VARCHAR(50),
            features TEXT,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add features column if it doesn't exist (migration)
    try {
        $conn->exec("ALTER TABLE loan_types ADD COLUMN features TEXT AFTER icon_name");
    } catch (PDOException $e) {
        // Column already exists, ignore error
    }

    // Create how_it_works_steps table (dynamic)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS how_it_works_steps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            step_number INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(500),
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add image_url column if it doesn't exist (migration)
    try {
        $conn->exec("ALTER TABLE how_it_works_steps ADD COLUMN image_url VARCHAR(500) AFTER description");
    } catch (PDOException $e) {
        // Column already exists, ignore error
    }

    // Create faqs table (dynamic)
    $conn->exec("
        CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Check if default questions exist
    $stmt = $conn->query("SELECT COUNT(*) as count FROM questions");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        // Insert default questions
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

        foreach ($defaultQuestions as $q) {
            $questionStmt->execute([$q['text'], $q['type'], $q['order']]);
            $questionId = $conn->lastInsertId();

            foreach ($q['options'] as $option) {
                $optionStmt->execute([$questionId, $option]);
            }
        }

        $settingsInserted = true;
    } else {
        $settingsInserted = false;
    }

    // Check if default settings exist
    $stmt = $conn->query("SELECT COUNT(*) as count FROM site_settings");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        // Insert default settings
        $defaultSettings = [
            // Company Profile
            ['company', 'name', 'BusinessLoansProfile', 'text'],
            ['company', 'email', 'info@businessloans.com', 'email'],
            ['company', 'phone', '1-800-BUSINESS', 'text'],
            ['company', 'address', '', 'textarea'],

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

            // FAQ Items (default 4 FAQs)
            ['faq', 'faq1_question', 'How long does the application take?', 'text'],
            ['faq', 'faq1_answer', 'Our streamlined application takes less than 3 minutes to complete. You\'ll answer some basic questions about your business and funding needs.', 'textarea'],
            ['faq', 'faq2_question', 'Will checking rates affect my credit score?', 'text'],
            ['faq', 'faq2_answer', 'No. The initial review and offer comparison process does not impact your credit score. Only when you proceed with a specific lender might a hard credit check be required.', 'textarea'],
            ['faq', 'faq3_question', 'How quickly can I get funded?', 'text'],
            ['faq', 'faq3_answer', 'Funding speed varies by lender and loan type. Many of our partners offer funding within 24 hours of approval, though some products may take longer.', 'textarea'],
            ['faq', 'faq4_question', 'What do I need to qualify?', 'text'],
            ['faq', 'faq4_answer', 'Requirements vary by loan type and lender. Generally, you\'ll need to be in business for a minimum period and meet certain revenue thresholds. Our network includes options for various credit profiles.', 'textarea'],
        ];

        $settingStmt = $conn->prepare("INSERT INTO site_settings (category, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)");

        foreach ($defaultSettings as $setting) {
            $settingStmt->execute($setting);
        }

        $settingsInserted = true;
    }

    // Insert default hero features
    $stmt = $conn->query("SELECT COUNT(*) as count FROM hero_features");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $featureStmt = $conn->prepare("INSERT INTO hero_features (feature_text, order_index) VALUES (?, ?)");
        $featureStmt->execute(['Under 3 minutes', 1]);
        $featureStmt->execute(['No credit impact', 2]);
        $featureStmt->execute(['Funding in 24 hours', 3]);
    }

    // Insert default loan types
    $stmt = $conn->query("SELECT COUNT(*) as count FROM loan_types");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $loanTypeStmt = $conn->prepare("INSERT INTO loan_types (title, description, icon_name, order_index) VALUES (?, ?, ?, ?)");
        $loanTypeStmt->execute(['Short Term Loan', 'Quick funding with flexible terms for immediate business needs', 'clock', 1]);
        $loanTypeStmt->execute(['Long Term Loan', 'Lower monthly payments for major investments and expansion', 'calendar', 2]);
        $loanTypeStmt->execute(['Line of Credit', 'Revolving credit for ongoing operational expenses', 'refresh', 3]);
        $loanTypeStmt->execute(['Merchant Cash Advance', 'Fast funding based on your daily credit card sales', 'credit-card', 4]);
    }

    // Insert default how it works steps
    $stmt = $conn->query("SELECT COUNT(*) as count FROM how_it_works_steps");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $stepStmt = $conn->prepare("INSERT INTO how_it_works_steps (step_number, title, description, order_index) VALUES (?, ?, ?, ?)");
        $stepStmt->execute([1, 'Tell us about your business', 'Answer a few quick questions about your business and funding needs', 1]);
        $stepStmt->execute([2, 'Review your matches', 'We\'ll match you with the best lenders from our trusted network', 2]);
        $stepStmt->execute([3, 'Get funded', 'Choose your preferred offer and receive funding in as little as 24 hours', 3]);
    }

    // Insert default FAQs
    $stmt = $conn->query("SELECT COUNT(*) as count FROM faqs");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $faqStmt = $conn->prepare("INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)");
        $faqStmt->execute(['How long does the application take?', 'Our streamlined application takes less than 3 minutes to complete. You\'ll answer some basic questions about your business and funding needs.', 1]);
        $faqStmt->execute(['Will checking rates affect my credit score?', 'No. The initial review and offer comparison process does not impact your credit score. Only when you proceed with a specific lender might a hard credit check be required.', 2]);
        $faqStmt->execute(['How quickly can I get funded?', 'Funding speed varies by lender and loan type. Many of our partners offer funding within 24 hours of approval, though some products may take longer.', 3]);
        $faqStmt->execute(['What do I need to qualify?', 'Requirements vary by loan type and lender. Generally, you\'ll need to be in business for a minimum period and meet certain revenue thresholds. Our network includes options for various credit profiles.', 4]);
    }

    if ($settingsInserted) {
        echo json_encode([
            'success' => true,
            'message' => 'Database tables created and default data inserted successfully!'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Database tables already exist. No changes made.'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Setup failed: ' . $e->getMessage()
    ]);
}
?>
