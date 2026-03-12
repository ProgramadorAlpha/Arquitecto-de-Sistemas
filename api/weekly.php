<?php
// api/weekly.php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$weekStartDate = date('Y-m-d', strtotime('monday this week')); // Simplification: always current week

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM weekly_plans WHERE user_id = ? AND week_start_date = ?");
    $stmt->execute([$userId, $weekStartDate]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($plan) {
        // Decode JSON checklist
        $plan['checklist'] = json_decode($plan['checklist_json'], true);
        unset($plan['checklist_json']);
        echo json_encode($plan);
    } else {
        // Return defaults
        echo json_encode([
            'brain_dump' => '',
            'priority_1' => '',
            'priority_2' => '',
            'priority_3' => '',
            'checklist' => [
                'finances' => false,
                'delegation' => false,
                'review' => false,
                'schedule' => false
            ]
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $checklistJson = json_encode($input['checklist'] ?? []);

    // Check if exists
    $stmt = $pdo->prepare("SELECT id FROM weekly_plans WHERE user_id = ? AND week_start_date = ?");
    $stmt->execute([$userId, $weekStartDate]);
    $existing = $stmt->fetch();

    if ($existing) {
        $sql = "UPDATE weekly_plans SET 
                brain_dump = ?, priority_1 = ?, priority_2 = ?, priority_3 = ?, checklist_json = ? 
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['brain_dump'] ?? '',
            $input['priority_1'] ?? '',
            $input['priority_2'] ?? '',
            $input['priority_3'] ?? '',
            $checklistJson,
            $existing['id']
        ]);
    } else {
        $sql = "INSERT INTO weekly_plans (user_id, week_start_date, brain_dump, priority_1, priority_2, priority_3, checklist_json) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $userId,
            $weekStartDate,
            $input['brain_dump'] ?? '',
            $input['priority_1'] ?? '',
            $input['priority_2'] ?? '',
            $input['priority_3'] ?? '',
            $checklistJson
        ]);
    }

    echo json_encode(['success' => true]);
}
?>