<?php
require_once 'api/db_connect.php';

try {
    $sql = file_get_contents('database/setup.sql');
    $pdo->exec($sql);
    echo "Database initialized successfully.\n";
} catch (Exception $e) {
    echo "Error initializing database: " . $e->getMessage() . "\n";
}
?>