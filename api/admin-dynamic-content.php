<?php
/**
 * Admin API - Dynamic Content Management
 * Manages hero features, loan types, how it works steps, and FAQs
 */

session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

verifySession();

try {
    $conn = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['REQUEST_URI'];

    // Parse query parameters
    parse_str($_SERVER['QUERY_STRING'] ?? '', $queryParams);
    $contentType = $queryParams['type'] ?? '';
    $id = $queryParams['id'] ?? null;

    // Route based on content type and method
    switch ($contentType) {
        case 'hero_features':
            handleHeroFeatures($conn, $method, $id);
            break;
        case 'loan_types':
            handleLoanTypes($conn, $method, $id);
            break;
        case 'how_it_works':
            handleHowItWorks($conn, $method, $id);
            break;
        case 'faqs':
            handleFAQs($conn, $method, $id);
            break;
        default:
            http_response_code(400);
            sendJson(['error' => 'Invalid content type']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    sendJson(['error' => 'Database error: ' . $e->getMessage()]);
}

// ============= HERO FEATURES =============
function handleHeroFeatures($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getHeroFeature($conn, $id);
            } else {
                getAllHeroFeatures($conn);
            }
            break;
        case 'POST':
            createHeroFeature($conn);
            break;
        case 'PUT':
            updateHeroFeature($conn, $id);
            break;
        case 'DELETE':
            deleteHeroFeature($conn, $id);
            break;
        default:
            http_response_code(405);
            sendJson(['error' => 'Method not allowed']);
    }
}

function getAllHeroFeatures($conn) {
    $stmt = $conn->query("SELECT * FROM hero_features ORDER BY order_index ASC");
    $features = $stmt->fetchAll();
    sendJson($features);
}

function getHeroFeature($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM hero_features WHERE id = ?");
    $stmt->execute([$id]);
    $feature = $stmt->fetch();
    if ($feature) {
        sendJson($feature);
    } else {
        http_response_code(404);
        sendJson(['error' => 'Feature not found']);
    }
}

function createHeroFeature($conn) {
    $input = getJsonInput();

    if (empty($input['feature_text'])) {
        http_response_code(400);
        sendJson(['error' => 'Feature text is required']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO hero_features (feature_text, order_index) VALUES (?, ?)");
    $stmt->execute([
        $input['feature_text'],
        $input['order_index'] ?? 0
    ]);

    sendJson([
        'success' => true,
        'id' => $conn->lastInsertId(),
        'message' => 'Hero feature created successfully'
    ]);
}

function updateHeroFeature($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $input = getJsonInput();
    $stmt = $conn->prepare("UPDATE hero_features SET feature_text = ?, order_index = ? WHERE id = ?");
    $stmt->execute([
        $input['feature_text'],
        $input['order_index'] ?? 0,
        $id
    ]);

    sendJson(['success' => true, 'message' => 'Hero feature updated successfully']);
}

function deleteHeroFeature($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM hero_features WHERE id = ?");
    $stmt->execute([$id]);
    sendJson(['success' => true, 'message' => 'Hero feature deleted successfully']);
}

// ============= LOAN TYPES =============
function handleLoanTypes($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getLoanType($conn, $id);
            } else {
                getAllLoanTypes($conn);
            }
            break;
        case 'POST':
            createLoanType($conn);
            break;
        case 'PUT':
            updateLoanType($conn, $id);
            break;
        case 'DELETE':
            deleteLoanType($conn, $id);
            break;
        default:
            http_response_code(405);
            sendJson(['error' => 'Method not allowed']);
    }
}

function getAllLoanTypes($conn) {
    $stmt = $conn->query("SELECT * FROM loan_types ORDER BY order_index ASC");
    $types = $stmt->fetchAll();
    sendJson($types);
}

function getLoanType($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM loan_types WHERE id = ?");
    $stmt->execute([$id]);
    $type = $stmt->fetch();
    if ($type) {
        sendJson($type);
    } else {
        http_response_code(404);
        sendJson(['error' => 'Loan type not found']);
    }
}

function createLoanType($conn) {
    $input = getJsonInput();

    if (empty($input['title'])) {
        http_response_code(400);
        sendJson(['error' => 'Title is required']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO loan_types (title, description, icon_name, features, order_index) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['title'],
        $input['description'] ?? '',
        $input['icon_name'] ?? 'file-text',
        $input['features'] ?? null,
        $input['order_index'] ?? 0
    ]);

    sendJson([
        'success' => true,
        'id' => $conn->lastInsertId(),
        'message' => 'Loan type created successfully'
    ]);
}

function updateLoanType($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $input = getJsonInput();
    $stmt = $conn->prepare("UPDATE loan_types SET title = ?, description = ?, icon_name = ?, features = ?, order_index = ? WHERE id = ?");
    $stmt->execute([
        $input['title'],
        $input['description'] ?? '',
        $input['icon_name'] ?? 'file-text',
        $input['features'] ?? null,
        $input['order_index'] ?? 0,
        $id
    ]);

    sendJson(['success' => true, 'message' => 'Loan type updated successfully']);
}

function deleteLoanType($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM loan_types WHERE id = ?");
    $stmt->execute([$id]);
    sendJson(['success' => true, 'message' => 'Loan type deleted successfully']);
}

// ============= HOW IT WORKS STEPS =============
function handleHowItWorks($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getHowItWorksStep($conn, $id);
            } else {
                getAllHowItWorksSteps($conn);
            }
            break;
        case 'POST':
            createHowItWorksStep($conn);
            break;
        case 'PUT':
            updateHowItWorksStep($conn, $id);
            break;
        case 'DELETE':
            deleteHowItWorksStep($conn, $id);
            break;
        default:
            http_response_code(405);
            sendJson(['error' => 'Method not allowed']);
    }
}

function getAllHowItWorksSteps($conn) {
    $stmt = $conn->query("SELECT * FROM how_it_works_steps ORDER BY order_index ASC");
    $steps = $stmt->fetchAll();
    sendJson($steps);
}

function getHowItWorksStep($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM how_it_works_steps WHERE id = ?");
    $stmt->execute([$id]);
    $step = $stmt->fetch();
    if ($step) {
        sendJson($step);
    } else {
        http_response_code(404);
        sendJson(['error' => 'Step not found']);
    }
}

function createHowItWorksStep($conn) {
    $input = getJsonInput();

    if (empty($input['title'])) {
        http_response_code(400);
        sendJson(['error' => 'Title is required']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO how_it_works_steps (step_number, title, description, image_url, order_index) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['step_number'] ?? 1,
        $input['title'],
        $input['description'] ?? '',
        $input['image_url'] ?? null,
        $input['order_index'] ?? 0
    ]);

    sendJson([
        'success' => true,
        'id' => $conn->lastInsertId(),
        'message' => 'Step created successfully'
    ]);
}

function updateHowItWorksStep($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $input = getJsonInput();
    $stmt = $conn->prepare("UPDATE how_it_works_steps SET step_number = ?, title = ?, description = ?, image_url = ?, order_index = ? WHERE id = ?");
    $stmt->execute([
        $input['step_number'] ?? 1,
        $input['title'],
        $input['description'] ?? '',
        $input['image_url'] ?? null,
        $input['order_index'] ?? 0,
        $id
    ]);

    sendJson(['success' => true, 'message' => 'Step updated successfully']);
}

function deleteHowItWorksStep($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM how_it_works_steps WHERE id = ?");
    $stmt->execute([$id]);
    sendJson(['success' => true, 'message' => 'Step deleted successfully']);
}

// ============= FAQs =============
function handleFAQs($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                getFAQ($conn, $id);
            } else {
                getAllFAQs($conn);
            }
            break;
        case 'POST':
            createFAQ($conn);
            break;
        case 'PUT':
            updateFAQ($conn, $id);
            break;
        case 'DELETE':
            deleteFAQ($conn, $id);
            break;
        default:
            http_response_code(405);
            sendJson(['error' => 'Method not allowed']);
    }
}

function getAllFAQs($conn) {
    $stmt = $conn->query("SELECT * FROM faqs ORDER BY order_index ASC");
    $faqs = $stmt->fetchAll();
    sendJson($faqs);
}

function getFAQ($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM faqs WHERE id = ?");
    $stmt->execute([$id]);
    $faq = $stmt->fetch();
    if ($faq) {
        sendJson($faq);
    } else {
        http_response_code(404);
        sendJson(['error' => 'FAQ not found']);
    }
}

function createFAQ($conn) {
    $input = getJsonInput();

    if (empty($input['question']) || empty($input['answer'])) {
        http_response_code(400);
        sendJson(['error' => 'Question and answer are required']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO faqs (question, answer, order_index) VALUES (?, ?, ?)");
    $stmt->execute([
        $input['question'],
        $input['answer'],
        $input['order_index'] ?? 0
    ]);

    sendJson([
        'success' => true,
        'id' => $conn->lastInsertId(),
        'message' => 'FAQ created successfully'
    ]);
}

function updateFAQ($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $input = getJsonInput();
    $stmt = $conn->prepare("UPDATE faqs SET question = ?, answer = ?, order_index = ? WHERE id = ?");
    $stmt->execute([
        $input['question'],
        $input['answer'],
        $input['order_index'] ?? 0,
        $id
    ]);

    sendJson(['success' => true, 'message' => 'FAQ updated successfully']);
}

function deleteFAQ($conn, $id) {
    if (!$id) {
        http_response_code(400);
        sendJson(['error' => 'ID is required']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM faqs WHERE id = ?");
    $stmt->execute([$id]);
    sendJson(['success' => true, 'message' => 'FAQ deleted successfully']);
}
