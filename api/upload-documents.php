<?php
/**
 * Upload Documents Endpoint
 * POST /api/upload-documents.php - Upload PDF documents for a lead
 * GET /api/upload-documents.php?lead_id=123 - Get documents for a lead
 * GET /api/upload-documents.php?download=123 - Download a specific document
 */

require_once 'config.php';

// Configuration
$uploadDir = __DIR__ . '/../uploads/documents/';
$maxFileSize = 10 * 1024 * 1024; // 10MB per file
$maxFiles = 5; // Maximum 5 files per upload
$allowedTypes = ['application/pdf'];

// Ensure upload directory exists
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Handle preview request (inline display)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['preview'])) {
    $docId = (int)$_GET['preview'];

    try {
        $conn = getDbConnection();
        $stmt = $conn->prepare("SELECT * FROM lead_documents WHERE id = ?");
        $stmt->execute([$docId]);
        $doc = $stmt->fetch();

        if (!$doc) {
            sendJson(['error' => 'Document not found'], 404);
        }

        $filePath = $uploadDir . $doc['stored_filename'];

        if (!file_exists($filePath)) {
            sendJson(['error' => 'File not found on server'], 404);
        }

        // Send file for inline preview (not download)
        header('Content-Type: ' . $doc['mime_type']);
        header('Content-Disposition: inline; filename="' . $doc['original_filename'] . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, must-revalidate');

        readfile($filePath);
        exit;

    } catch (PDOException $e) {
        sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Handle download request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['download'])) {
    $docId = (int)$_GET['download'];

    try {
        $conn = getDbConnection();
        $stmt = $conn->prepare("SELECT * FROM lead_documents WHERE id = ?");
        $stmt->execute([$docId]);
        $doc = $stmt->fetch();

        if (!$doc) {
            sendJson(['error' => 'Document not found'], 404);
        }

        $filePath = $uploadDir . $doc['stored_filename'];

        if (!file_exists($filePath)) {
            sendJson(['error' => 'File not found on server'], 404);
        }

        // Send file for download
        header('Content-Type: ' . $doc['mime_type']);
        header('Content-Disposition: attachment; filename="' . $doc['original_filename'] . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, must-revalidate');

        readfile($filePath);
        exit;

    } catch (PDOException $e) {
        sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Handle GET request for lead documents
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['lead_id'])) {
    $leadId = (int)$_GET['lead_id'];

    try {
        $conn = getDbConnection();
        $stmt = $conn->prepare("SELECT id, original_filename, file_size, mime_type, uploaded_at FROM lead_documents WHERE lead_id = ? ORDER BY uploaded_at DESC");
        $stmt->execute([$leadId]);
        $documents = $stmt->fetchAll();

        sendJson($documents);

    } catch (PDOException $e) {
        sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Handle POST request for uploading documents
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if lead_id is provided
    if (!isset($_POST['lead_id']) || empty($_POST['lead_id'])) {
        sendJson(['error' => 'Lead ID is required'], 400);
    }

    $leadId = (int)$_POST['lead_id'];

    // Check if files were uploaded
    if (!isset($_FILES['documents']) || empty($_FILES['documents']['name'][0])) {
        sendJson(['error' => 'No files uploaded'], 400);
    }

    $files = $_FILES['documents'];
    $uploadedFiles = [];
    $errors = [];

    // Count files
    $fileCount = count($files['name']);
    if ($fileCount > $maxFiles) {
        sendJson(['error' => "Maximum $maxFiles files allowed per upload"], 400);
    }

    try {
        $conn = getDbConnection();

        // Verify lead exists
        $stmt = $conn->prepare("SELECT id FROM leads WHERE id = ?");
        $stmt->execute([$leadId]);
        if (!$stmt->fetch()) {
            sendJson(['error' => 'Lead not found'], 404);
        }

        // Process each file
        for ($i = 0; $i < $fileCount; $i++) {
            $fileName = $files['name'][$i];
            $fileSize = $files['size'][$i];
            $fileTmpName = $files['tmp_name'][$i];
            $fileError = $files['error'][$i];

            // Check for upload errors
            if ($fileError !== UPLOAD_ERR_OK) {
                $errors[] = "Error uploading $fileName";
                continue;
            }

            // Check file size
            if ($fileSize > $maxFileSize) {
                $errors[] = "$fileName exceeds maximum file size of 10MB";
                continue;
            }

            // Check file type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmpName);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = "$fileName is not a valid PDF file";
                continue;
            }

            // Generate unique filename
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);
            $storedFilename = 'doc_' . $leadId . '_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
            $targetPath = $uploadDir . $storedFilename;

            // Move uploaded file
            if (move_uploaded_file($fileTmpName, $targetPath)) {
                // Insert into database
                $stmt = $conn->prepare("
                    INSERT INTO lead_documents (lead_id, original_filename, stored_filename, file_size, mime_type)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([$leadId, $fileName, $storedFilename, $fileSize, $mimeType]);

                $uploadedFiles[] = [
                    'id' => (int)$conn->lastInsertId(),
                    'original_filename' => $fileName,
                    'file_size' => $fileSize
                ];
            } else {
                $errors[] = "Failed to save $fileName";
            }
        }

        // Return response
        $response = [
            'success' => count($uploadedFiles) > 0,
            'uploaded' => $uploadedFiles,
            'uploaded_count' => count($uploadedFiles)
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        sendJson($response);

    } catch (PDOException $e) {
        sendJson(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// If no valid request method matched
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}
?>
