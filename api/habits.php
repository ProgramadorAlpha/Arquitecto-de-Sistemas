<?php
session_start();
require_once 'db_connect.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$today = date('Y-m-d');

if ($method === 'GET') {
    // 1. Check/Update Streak Logic (Simple "Daily Login" Streak)
    $stmt = $pdo->prepare("SELECT current_streak, last_streak_date FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $streak = $user['current_streak'] ?? 0;
    $last_date = $user['last_streak_date'];

    if ($last_date !== $today) {
        // First login of the day logic
        if ($last_date === date('Y-m-d', strtotime('-1 day'))) {
            // Consecutive day: Increment
            // We only increment if they actually did something yesterday? 
            // Or just by logging in today? Standard apps often just count "showing up".
            // Let's stick to simple "Logged in different day" = increment if consecutive.
            // Ideally we'd check if they completed habits yesterday, but for MVP "Show Up" is good.
            // Actually, usually streak increments when you COMPLETE a habit. 
            // But for now let's leave the logic I designed: Update on load.
            // FIX: Only increment if consecutive.
            $streak++;
        } elseif ($last_date && $last_date < $today) {
            // Missed a day or more. Check if it was yesterday?
            // If last_date was NOT yesterday (and not today), then reset.
            if ($last_date !== date('Y-m-d', strtotime('-1 day'))) {
                $streak = 1; // Reset to 1 (Today)
            }
        } else {
            // First time ever
            if ($streak == 0)
                $streak = 1;
        }

        // Update User
        $updateStmt = $pdo->prepare("UPDATE users SET current_streak = ?, last_streak_date = ? WHERE id = ?");
        $updateStmt->execute([$streak, $today, $user_id]);
    }

    // 2. Get Daily Habits for Today
    $stmt = $pdo->prepare("SELECT * FROM daily_habits WHERE user_id = ? AND date = ?");
    $stmt->execute([$user_id, $today]);
    $habits = $stmt->fetch(PDO::FETCH_ASSOC);

    // If no record for today, create one (Cinderella Effect: Fresh Start)
    if (!$habits) {
        $insertStmt = $pdo->prepare("INSERT INTO daily_habits (user_id, date) VALUES (?, ?)");
        $insertStmt->execute([$user_id, $today]);

        // Fetch again
        $stmt->execute([$user_id, $today]);
        $habits = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Map DB columns (snake_case) to Frontend keys (camelCase)
    // Ensures app.js receives what it expects
    $response = [
        'streak' => $streak,
        'habits' => [
            'movement' => (bool) $habits['movement'],
            'meditation' => (bool) $habits['meditation'],
            'reflection' => (bool) $habits['reflection'],
            'greenJuice' => (bool) $habits['green_juice'],
            'tvLimit' => (bool) $habits['tv_limit'],
            'planTomorrow' => (bool) $habits['plan_tomorrow'],
            'environmentPrep' => (bool) $habits['environment_prep']
        ]
    ];

    echo json_encode($response);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $habitName = $data['habit'] ?? '';
    $value = $data['value'] ?? false;

    // Map frontend keys to DB columns
    $map = [
        'movement' => 'movement',
        'meditation' => 'meditation',
        'reflection' => 'reflection',
        'greenJuice' => 'green_juice',
        'tvLimit' => 'tv_limit',
        'planTomorrow' => 'plan_tomorrow',
        'environmentPrep' => 'environment_prep'
    ];

    if (!array_key_exists($habitName, $map)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid habit: $habitName"]);
        exit;
    }

    $col = $map[$habitName];
    $val = $value ? 1 : 0;

    // Ensure record exists for today before updating
    // (Should exist if they loaded the page, but good safety)
    $stmt = $pdo->prepare("SELECT id FROM daily_habits WHERE user_id = ? AND date = ?");
    $stmt->execute([$user_id, $today]);
    if (!$stmt->fetch()) {
        $pdo->prepare("INSERT INTO daily_habits (user_id, date) VALUES (?, ?)")->execute([$user_id, $today]);
    }

    $stmt = $pdo->prepare("UPDATE daily_habits SET $col = ? WHERE user_id = ? AND date = ?");
    $stmt->execute([$val, $user_id, $today]);

    echo json_encode(["success" => true, "habit" => $habitName, "value" => $value]);
}
?>