<?php
// api/ai_coach.php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function debug_log($msg)
{
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}

debug_log("--- Request Started ---");

// Session
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
debug_log("Session ID: " . session_id());
debug_log("User ID: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NULL'));

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if (!isset($_SESSION['user_id'])) {
    debug_log("Auth failed.");
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debug_log("Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Env
$apiKey = '';
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        list($name, $value) = explode('=', $line, 2);
        if (trim($name) === 'GEMINI_API_KEY') {
            $apiKey = trim($value, '"');
            break;
        }
    }
}
if (empty($apiKey))
    $apiKey = getenv('GEMINI_API_KEY');

if (empty($apiKey)) {
    debug_log("API Key missing.");
    http_response_code(500);
    echo json_encode(['error' => 'API Key missing']);
    exit;
}

// Input
$input = json_decode(file_get_contents('php://input'), true);
$prompt = $input['prompt'] ?? '';
debug_log("Prompt length: " . strlen($prompt));

if (empty($prompt)) {
    debug_log("Empty prompt.");
    http_response_code(400);
    echo json_encode(['error' => 'Prompt required']);
    exit;
}

// Gemini
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey";
$url_log = str_replace($apiKey, 'HIDDEN_KEY', $url);
debug_log("Target URL (safe): " . $url_log);

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => $prompt]
            ]
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

debug_log("Executing Curl...");
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);

debug_log("Curl finished. HTTP Code: $httpCode. Curl Error: [$curlErr]");
debug_log("Response Body Snippet: " . substr($response, 0, 500));

if ($curlErr) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl Error: ' . $curlErr]);
} else {
    $decoded = json_decode($response, true);
    if ($decoded === null) {
        debug_log("JSON Decode failed. Response was not JSON.");
        http_response_code(500);
        echo json_encode(['error' => 'Invalid JSON from Gemini']);
    } elseif (isset($decoded['error'])) {
        debug_log("Gemini returned error: " . print_r($decoded['error'], true));
        http_response_code(500);
        echo json_encode(['error' => 'Gemini Error: ' . ($decoded['error']['message'] ?? 'Unknown')]);
    } else {
        $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? 'No text generated.';
        debug_log("Success. Text length: " . strlen($text));
        echo json_encode(['result' => $text]);
    }
}
curl_close($ch);
?>