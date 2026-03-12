<?php
// test_ai.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>AI Connection Diagnostics</h1>";

// 1. Check .env loading
$envPath = __DIR__ . '/.env';
echo "<p>Checking .env at: $envPath ... " . (file_exists($envPath) ? "FOUND" : "NOT FOUND") . "</p>";

$apiKey = '';
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

if (empty($apiKey)) {
    $apiKey = getenv('GEMINI_API_KEY');
}

echo "<p>API Key loaded: " . (empty($apiKey) ? "NO" : "YES (Length: " . strlen($apiKey) . ")") . "</p>";

if (empty($apiKey)) {
    die("Stopping: No API Key.");
}

// 2. Test CURL
echo "<h2>Testing CURL Request</h2>";
$model = "gemini-1.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey";

echo "<p>Target URL: https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=HIDDEN</p>";

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'Hello, are you working? Respond with just "YES".']
            ]
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
// SSL Debug
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);

curl_close($ch);

echo "<p>HTTP Code: $httpCode</p>";

if ($curlErr) {
    echo "<p style='color:red'>CURL Error: $curlErr</p>";
} else {
    echo "<p>Response:</p><pre>" . htmlspecialchars($response) . "</pre>";
}

rewind($verbose);
$verboseLog = stream_get_contents($verbose);
echo "<h3>Verbose Log:</h3><pre>" . htmlspecialchars($verboseLog) . "</pre>";
?>