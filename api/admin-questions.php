<?php
/**
 * Admin Questions Management Endpoint
 * POST /api/admin-questions.php - Create new question
 * PUT /api/admin-questions.php?id=123 - Update question
 * DELETE /api/admin-questions.php?id=123 - Delete question
 */

require_once 'config.php';

verifySession();

$conn = getDbConnection();

try {
    // CREATE
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = getJsonInput();

        $questionText = $input['question_text'] ?? '';
        $questionType = $input['question_type'] ?? '';
        $orderIndex = $input['order_index'] ?? 0;
        $options = $input['options'] ?? [];

        $conn->beginTransaction();

        // Insert question
        $stmt = $conn->prepare("
            INSERT INTO questions (question_text, question_type, order_index)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$questionText, $questionType, $orderIndex]);
        $questionId = $conn->lastInsertId();

        // Insert options
        if (!empty($options)) {
            $optStmt = $conn->prepare("
                INSERT INTO question_options (question_id, option_text)
                VALUES (?, ?)
            ");
            foreach ($options as $option) {
                $optStmt->execute([$questionId, $option]);
            }
        }

        $conn->commit();

        sendJson([
            'id' => (int)$questionId,
            'message' => 'Question created successfully'
        ]);
    }

    // UPDATE
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJson(['error' => 'Question ID required'], 400);
        }

        $input = getJsonInput();

        $questionText = $input['question_text'] ?? '';
        $questionType = $input['question_type'] ?? '';
        $orderIndex = $input['order_index'] ?? 0;
        $options = $input['options'] ?? [];

        $conn->beginTransaction();

        // Update question
        $stmt = $conn->prepare("
            UPDATE questions
            SET question_text = ?, question_type = ?, order_index = ?
            WHERE id = ?
        ");
        $stmt->execute([$questionText, $questionType, $orderIndex, $id]);

        // Delete old options
        $conn->prepare("DELETE FROM question_options WHERE question_id = ?")
             ->execute([$id]);

        // Insert new options
        if (!empty($options)) {
            $optStmt = $conn->prepare("
                INSERT INTO question_options (question_id, option_text)
                VALUES (?, ?)
            ");
            foreach ($options as $option) {
                $optStmt->execute([$id, $option]);
            }
        }

        $conn->commit();

        sendJson(['message' => 'Question updated successfully']);
    }

    // DELETE
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            sendJson(['error' => 'Question ID required'], 400);
        }

        $stmt = $conn->prepare("DELETE FROM questions WHERE id = ?");
        $stmt->execute([$id]);

        sendJson(['message' => 'Question deleted successfully']);
    }

    else {
        sendJson(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
