<?php
/**
 * Public Dynamic Content Endpoint (No Authentication Required)
 * GET /api/public-content.php?type=hero_features|loan_types|how_it_works|faqs
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $conn = getDbConnection();

    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendJson(['error' => 'Method not allowed'], 405);
        exit;
    }

    // Parse query parameters
    parse_str($_SERVER['QUERY_STRING'] ?? '', $queryParams);
    $contentType = $queryParams['type'] ?? '';

    // Route based on content type
    switch ($contentType) {
        case 'hero_features':
            $stmt = $conn->query("SELECT * FROM hero_features ORDER BY order_index ASC");
            $data = $stmt->fetchAll();
            sendJson($data);
            break;

        case 'loan_types':
            $stmt = $conn->query("SELECT * FROM loan_types ORDER BY order_index ASC");
            $data = $stmt->fetchAll();
            sendJson($data);
            break;

        case 'how_it_works':
            $stmt = $conn->query("SELECT * FROM how_it_works_steps ORDER BY order_index ASC");
            $data = $stmt->fetchAll();
            sendJson($data);
            break;

        case 'faqs':
            $stmt = $conn->query("SELECT * FROM faqs ORDER BY order_index ASC");
            $data = $stmt->fetchAll();
            sendJson($data);
            break;

        default:
            http_response_code(400);
            sendJson(['error' => 'Invalid content type. Use: hero_features, loan_types, how_it_works, or faqs']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    sendJson(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
