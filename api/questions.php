<?php
/**
 * Questions Endpoint
 * GET /api/questions.php - Get all questions (public)
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

try {
    $conn = getDbConnection();

    // Get all questions
    $stmt = $conn->query("SELECT * FROM questions ORDER BY order_index ASC");
    $questions = $stmt->fetchAll();

    // Get options for each question
    $result = [];
    foreach ($questions as $question) {
        $optStmt = $conn->prepare("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC");
        $optStmt->execute([$question['id']]);
        $options = $optStmt->fetchAll();

        $result[] = [
            'id' => (int)$question['id'],
            'question_text' => $question['question_text'],
            'question_type' => $question['question_type'],
            'order_index' => (int)$question['order_index'],
            'created_at' => $question['created_at'],
            'options' => $options
        ];
    }

    sendJson($result);

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
