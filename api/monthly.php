<?php
// api/monthly.php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$monthYear = date('Y-m'); // Always current month

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM monthly_reviews WHERE user_id = ? AND month_year = ?");
    $stmt->execute([$userId, $monthYear]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($review) {
        echo json_encode($review);
    } else {
        echo json_encode([
            'wins' => '',
            'drains' => '',
            'intention' => '',
            'revenue_last' => '',
            'revenue_goal' => '',
            'celebration' => ''
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("SELECT id FROM monthly_reviews WHERE user_id = ? AND month_year = ?");
    $stmt->execute([$userId, $monthYear]);
    $existing = $stmt->fetch();

    if ($existing) {
        $sql = "UPDATE monthly_reviews SET 
                wins = ?, drains = ?, intention = ?, revenue_last = ?, revenue_goal = ?, celebration = ?
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['wins'] ?? '',
            $input['drains'] ?? '',
            $input['intention'] ?? '',
            $input['revenue_last'] ?? '',
            $input['revenue_goal'] ?? '',
            $input['celebration'] ?? '',
            $existing['id']
        ]);
    } else {
        $sql = "INSERT INTO monthly_reviews (user_id, month_year, wins, drains, intention, revenue_last, revenue_goal, celebration) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $userId,
            $monthYear,
            $input['wins'] ?? '',
            $input['drains'] ?? '',
            $input['intention'] ?? '',
            $input['revenue_last'] ?? '',
            $input['revenue_goal'] ?? '',
            $input['celebration'] ?? ''
        ]);
    }

    echo json_encode(['success' => true]);
}
?>