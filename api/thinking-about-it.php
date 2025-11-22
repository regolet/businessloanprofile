<?php
/**
 * Thinking About It API Endpoint
 * Handles CRUD operations for "thinking about it" submissions
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGet($conn);
            break;
        case 'POST':
            handlePost($conn);
            break;
        case 'PUT':
            handlePut($conn);
            break;
        case 'DELETE':
            handleDelete($conn);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleGet($conn) {
    // Get all submissions
    $stmt = $conn->query("SELECT * FROM thinking_about_it ORDER BY created_at DESC");
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($submissions);
}

function handlePost($conn) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($input['name']) || empty($input['cell']) || empty($input['email']) || empty($input['ready_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields are required']);
        return;
    }

    // Validate email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        return;
    }

    // Insert new submission
    $stmt = $conn->prepare("
        INSERT INTO thinking_about_it (name, cell, email, ready_date, status)
        VALUES (?, ?, ?, ?, 'pending')
    ");

    $stmt->execute([
        $input['name'],
        $input['cell'],
        $input['email'],
        $input['ready_date']
    ]);

    echo json_encode([
        'success' => true,
        'id' => $conn->lastInsertId(),
        'message' => 'Submission received successfully'
    ]);
}

function handlePut($conn) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    // Build update query dynamically based on provided fields
    $updates = [];
    $params = [];

    if (isset($input['name'])) {
        $updates[] = "name = ?";
        $params[] = $input['name'];
    }
    if (isset($input['cell'])) {
        $updates[] = "cell = ?";
        $params[] = $input['cell'];
    }
    if (isset($input['email'])) {
        $updates[] = "email = ?";
        $params[] = $input['email'];
    }
    if (isset($input['ready_date'])) {
        $updates[] = "ready_date = ?";
        $params[] = $input['ready_date'];
    }
    if (isset($input['status'])) {
        $updates[] = "status = ?";
        $params[] = $input['status'];
    }
    if (isset($input['notes'])) {
        $updates[] = "notes = ?";
        $params[] = $input['notes'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }

    $params[] = $input['id'];
    $sql = "UPDATE thinking_about_it SET " . implode(', ', $updates) . " WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Updated successfully'
    ]);
}

function handleDelete($conn) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM thinking_about_it WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'Deleted successfully'
    ]);
}
?>
