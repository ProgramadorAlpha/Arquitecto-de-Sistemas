<?php
require_once __DIR__ . '/api/db_connect.php';

try {
    $pdo->beginTransaction();

    // 1. Update users table
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0");
        echo "Column current_streak added to users.\n";
    } catch (Exception $e) {
        echo "Column current_streak might already exist or error: " . $e->getMessage() . "\n";
    }

    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN last_streak_date DATE");
        echo "Column last_streak_date added to users.\n";
    } catch (Exception $e) {
        echo "Column last_streak_date might already exist or error: " . $e->getMessage() . "\n";
    }

    // 2. Update daily_habits table
    // SQLite doesn't support DROP COLUMN easily, so we usually ignore 'reading' column or treat it as deprecated.
    // We will add the new columns.
    try {
        $pdo->exec("ALTER TABLE daily_habits ADD COLUMN plan_tomorrow BOOLEAN DEFAULT 0");
        echo "Column plan_tomorrow added to daily_habits.\n";
    } catch (Exception $e) {
        echo "Column plan_tomorrow might already exist or error: " . $e->getMessage() . "\n";
    }

    try {
        $pdo->exec("ALTER TABLE daily_habits ADD COLUMN environment_prep BOOLEAN DEFAULT 0");
        echo "Column environment_prep added to daily_habits.\n";
    } catch (Exception $e) {
        echo "Column environment_prep might already exist or error: " . $e->getMessage() . "\n";
    }

    $pdo->commit();
    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "Migration failed: " . $e->getMessage();
}
?>