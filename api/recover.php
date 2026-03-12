<?php
// api/recover.php
require_once 'db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email requerido']);
    exit;
}

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    // Security: Do not reveal user existence? 
    // For specific user request "Simulate", we might be explicit or follow standard.
    // Let's prevent enumeration but for Dev/Local let's be helpful.
    // Returning success even if not found is standard security practice.
    // BUT user wanted "Simulate process".
    sleep(1); // Fake work
}

// Log token (Simulation)
$token = bin2hex(random_bytes(16));
$logMsg = "RECOVERY REQUEST: Email: $email | Token: $token\n";
file_put_contents(__DIR__ . '/debug_log.txt', date('Y-m-d H:i:s') . " - " . $logMsg, FILE_APPEND);

// Response
echo json_encode([
    'success' => true,
    'message' => 'Si el correo existe, recibirás instrucciones.',
    'debug_token' => $token // Included for localhost dev convenience
]);
?>