<?php
/**
 * Admin Leads Endpoint
 * GET /api/admin-leads.php - Get all leads
 * GET /api/admin-leads.php?id=123 - Get specific lead with answers and documents
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

verifySession();

try {
    $conn = getDbConnection();

    // Check if requesting specific lead
    if (isset($_GET['id'])) {
        $leadId = (int)$_GET['id'];

        // Get lead details
        $stmt = $conn->prepare("SELECT * FROM leads WHERE id = ?");
        $stmt->execute([$leadId]);
        $lead = $stmt->fetch();

        if (!$lead) {
            sendJson(['error' => 'Lead not found'], 404);
        }

        // Get answers with question text
        $answerStmt = $conn->prepare("
            SELECT a.*, q.question_text
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.lead_id = ?
        ");
        $answerStmt->execute([$leadId]);
        $answers = $answerStmt->fetchAll();

        // Get documents
        $documents = [];
        try {
            $docStmt = $conn->prepare("
                SELECT id, original_filename, file_size, mime_type, uploaded_at
                FROM lead_documents
                WHERE lead_id = ?
                ORDER BY uploaded_at DESC
            ");
            $docStmt->execute([$leadId]);
            $documents = $docStmt->fetchAll();
        } catch (PDOException $e) {
            // Table might not exist yet, ignore
        }

        sendJson([
            'id' => (int)$lead['id'],
            'name' => $lead['name'],
            'email' => $lead['email'],
            'phone' => $lead['phone'],
            'business_name' => $lead['business_name'],
            'loan_amount' => $lead['loan_amount'],
            'created_at' => $lead['created_at'],
            'answers' => $answers,
            'documents' => $documents
        ]);

    } else {
        // Get all leads with document count
        $stmt = $conn->query("
            SELECT l.*,
                   (SELECT COUNT(*) FROM lead_documents WHERE lead_id = l.id) as document_count
            FROM leads l
            ORDER BY l.created_at DESC
        ");
        $leads = $stmt->fetchAll();

        sendJson($leads);
    }

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
