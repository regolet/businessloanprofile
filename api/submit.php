<?php
/**
 * Submit Lead/Application Endpoint
 * POST /api/submit.php
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();

$contactInfo = $input['contact_info'] ?? [];
$answers = $input['answers'] ?? [];

try {
    $conn = getDbConnection();
    $conn->beginTransaction();

    // Insert lead
    $stmt = $conn->prepare("
        INSERT INTO leads (name, email, phone, business_name, loan_amount)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $contactInfo['name'] ?? '',
        $contactInfo['email'] ?? '',
        $contactInfo['phone'] ?? '',
        $contactInfo['business_name'] ?? '',
        $contactInfo['loan_amount'] ?? ''
    ]);

    $leadId = $conn->lastInsertId();

    // Insert answers
    if (!empty($answers)) {
        $answerStmt = $conn->prepare("
            INSERT INTO answers (lead_id, question_id, answer_text)
            VALUES (?, ?, ?)
        ");

        foreach ($answers as $answer) {
            $answerStmt->execute([
                $leadId,
                $answer['question_id'] ?? 0,
                $answer['answer_text'] ?? ''
            ]);
        }
    }

    $conn->commit();

    sendJson([
        'id' => (int)$leadId,
        'message' => 'Application submitted successfully'
    ]);

} catch (PDOException $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    sendJson(['error' => 'Submission failed: ' . $e->getMessage()], 500);
}
?>
