<?php
// api/auth.php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Mock Login for Prototype
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Login
    if (isset($input['action']) && $input['action'] === 'login') {
        $email = $input['email'];
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Email y contraseña requeridos']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            // Usuario existe
            if (empty($user['password_hash'])) {
                // Migración Legacy: Primer login de usuario existente sin clave -> Guardar clave
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $upd = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                $upd->execute([$hash, $user['id']]);
            } else {
                // Verificar contraseña
                if (!password_verify($password, $user['password_hash'])) {
                    echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
                    exit;
                }
            }
        } else {
            // Nuevo usuario -> Registrar
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)");
            $stmt->execute([$email, $hash, explode('@', $email)[0]]);
            $userId = $pdo->lastInsertId();
            $user = ['id' => $userId, 'email' => $email, 'name' => explode('@', $email)[0]];
        }

        $_SESSION['user_id'] = $user['id'];
        echo json_encode(['success' => true, 'user' => $user]);
        exit;
    }

    // Logout
    if (isset($input['action']) && $input['action'] === 'logout') {
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }
}

// Check Session
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        echo json_encode(['logged_in' => true, 'user' => $user]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}
?>