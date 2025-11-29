<?php
/**
 * Admin Leads Management Endpoint
 * PUT /api/admin-leads-manage.php - Update a lead
 * DELETE /api/admin-leads-manage.php?id=123 - Delete a lead
 */

require_once 'config.php';

verifySession();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDbConnection();

    if ($method === 'PUT') {
        // Update lead
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id'])) {
            sendJson(['error' => 'Lead ID is required'], 400);
        }

        $leadId = (int)$input['id'];

        // Build update query dynamically
        $allowedFields = ['name', 'email', 'phone', 'business_name', 'loan_amount'];
        $updates = [];
        $params = [];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updates)) {
            sendJson(['error' => 'No fields to update'], 400);
        }

        $params[] = $leadId;

        $sql = "UPDATE leads SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            sendJson(['success' => true, 'message' => 'Lead updated successfully']);
        } else {
            sendJson(['error' => 'Lead not found or no changes made'], 404);
        }

    } elseif ($method === 'DELETE') {
        // Delete lead
        if (!isset($_GET['id'])) {
            sendJson(['error' => 'Lead ID is required'], 400);
        }

        $leadId = (int)$_GET['id'];

        // First, delete associated documents from filesystem
        $docStmt = $conn->prepare("SELECT stored_filename FROM lead_documents WHERE lead_id = ?");
        $docStmt->execute([$leadId]);
        $documents = $docStmt->fetchAll();

        foreach ($documents as $doc) {
            $filePath = __DIR__ . '/../uploads/documents/' . $doc['stored_filename'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Delete lead (documents and answers will cascade delete)
        $stmt = $conn->prepare("DELETE FROM leads WHERE id = ?");
        $stmt->execute([$leadId]);

        if ($stmt->rowCount() > 0) {
            sendJson(['success' => true, 'message' => 'Lead deleted successfully']);
        } else {
            sendJson(['error' => 'Lead not found'], 404);
        }

    } else {
        sendJson(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
