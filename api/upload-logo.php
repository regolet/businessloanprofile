<?php
/**
 * Logo Upload Endpoint
 * POST /api/upload-logo.php - Upload company logo
 */

require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verify admin session
verifySession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        sendJson(['error' => 'No file uploaded or upload error'], 400);
    }

    $file = $_FILES['logo'];

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        sendJson(['error' => 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG'], 400);
    }

    // Validate file size (max 2MB)
    if ($file['size'] > 2 * 1024 * 1024) {
        sendJson(['error' => 'File size exceeds 2MB limit'], 400);
    }

    // Create uploads directory if it doesn't exist
    $uploadDir = '../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'logo_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
    $targetPath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        sendJson(['error' => 'Failed to save uploaded file'], 500);
    }

    // Delete old logo files (cleanup)
    $oldFiles = glob($uploadDir . 'logo_*');
    foreach ($oldFiles as $oldFile) {
        if ($oldFile !== $targetPath && is_file($oldFile)) {
            // Keep only the 3 most recent logos (for rollback purposes)
            $files = glob($uploadDir . 'logo_*');
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });

            if (count($files) > 3) {
                foreach (array_slice($files, 3) as $fileToDelete) {
                    @unlink($fileToDelete);
                }
            }
        }
    }

    // Return the URL path
    $logoUrl = 'uploads/' . $filename;

    sendJson([
        'success' => true,
        'url' => $logoUrl,
        'message' => 'Logo uploaded successfully'
    ]);

} catch (Exception $e) {
    sendJson(['error' => 'Upload failed: ' . $e->getMessage()], 500);
}
?>
