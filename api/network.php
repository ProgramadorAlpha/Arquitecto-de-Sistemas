<?php
// api/network.php
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
    $stmt = $pdo->prepare("SELECT * FROM network_contacts WHERE user_id = ? ORDER BY display_order ASC, id ASC");
    $stmt->execute([$userId]);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Si no hay contactos, poblar con defaults para demo
    if (empty($contacts)) {
        $defaults = [
            ['Esposa', 'Pareja', date('Y-m-d', strtotime('-2 days')), 'Cita semanal', '🚫 No hablar de obra', 'good', 'Esposa', 'rose'],
            ['Hijo (21)', 'Sucesor', date('Y-m-d', strtotime('-1 day')), 'Mentoria', '👂 Escuchar más', 'warning', 'Hijo', 'amber'],
            ['Primo', 'Amigo', date('Y-m-d', strtotime('-5 days')), 'Café', '☕ Solo disfrute', 'good', 'Primo/a', 'teal']
        ];

        foreach ($defaults as $i => $c) {
            $stmt = $pdo->prepare("INSERT INTO network_contacts (user_id, name, role, last_connect_date, action_plan, rule, status, relationship, avatar_color, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $c[0], $c[1], $c[2], $c[3], $c[4], $c[5], $c[6], $c[7], $i]);
        }

        // Fetch again
        $stmt = $pdo->prepare("SELECT * FROM network_contacts WHERE user_id = ? ORDER BY display_order ASC");
        $stmt->execute([$userId]);
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Logic: 10% base + (candidates * 10%). Cap at 100%.
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM network_contacts WHERE user_id = ? AND status = 'candidate'");
    $stmt->execute([$userId]);
    $candidatesCount = $stmt->fetchColumn();
    $expansionProgress = min(100, 10 + ($candidatesCount * 10));

    echo json_encode(['contacts' => $contacts, 'expansion_progress' => $expansionProgress, 'candidates_count' => $candidatesCount]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action === 'update_connect') {
        $contactId = $input['id'];
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("UPDATE network_contacts SET last_connect_date = ?, status = 'good' WHERE id = ? AND user_id = ?");
        $stmt->execute([$today, $contactId, $userId]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'create') {
        $name = $input['name'] ?? 'Nuevo';
        $role = $input['role'] ?? 'Rol';
        // Support extended fields
        $rel = $input['relationship'] ?? 'Otro';
        $rem = $input['remider'] ?? '';
        $color = $input['color'] ?? 'blue';
        $isCandidate = ($input['type'] ?? '') === 'candidate';
        $status = $isCandidate ? 'candidate' : 'good';
        $today = date('Y-m-d');

        $stmt = $pdo->prepare("INSERT INTO network_contacts (user_id, name, role, last_connect_date, action_plan, rule, status, relationship, personal_reminder, avatar_color, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)");
        $stmt->execute([$userId, $name, $role, $today, 'Contactar', 'Regla', $status, $rel, $rem, $color]);

        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'update_full') {
        // Future use for editing card details
        // Not fully implemented in UI yet but good to have API ready
    }

    if ($action === 'update_order') {
        $order = $input['order']; // Array of IDs in order
        foreach ($order as $index => $id) {
            $stmt = $pdo->prepare("UPDATE network_contacts SET display_order = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$index, $id, $userId]);
        }
        echo json_encode(['success' => true]);
        exit;
    }
}
?>