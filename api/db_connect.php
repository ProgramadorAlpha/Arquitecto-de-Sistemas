<?php
// api/db_connect.php

try {
    // Ruta absoluta o relativa a la base de datos
    $dbPath = __DIR__ . '/../database/database.sqlite';
    $dsn = "sqlite:$dbPath";

    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Habilitar foreign keys en SQLite
    $pdo->exec("PRAGMA foreign_keys = ON;");

} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>