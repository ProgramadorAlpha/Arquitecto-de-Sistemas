<?php
// api/systems.php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM systems WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Create new system
    if (isset($input['title'])) {
        $stmt = $pdo->prepare("INSERT INTO systems (user_id, area, title, goal, identity, action, trigger, environment, plan_b) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $input['area'],
            $input['title'],
            $input['goal'],
            $input['identity'],
            $input['action'],
            $input['trigger'],
            $input['environment'],
            $input['plan_b']
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}
?>