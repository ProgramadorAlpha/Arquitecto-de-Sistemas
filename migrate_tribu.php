<?php
require_once 'api/db_connect.php';

try {
    // Add new columns to network_contacts
    $cols = [
        "ALTER TABLE network_contacts ADD COLUMN relationship TEXT;",
        "ALTER TABLE network_contacts ADD COLUMN personal_reminder TEXT;",
        "ALTER TABLE network_contacts ADD COLUMN avatar_color TEXT DEFAULT 'blue';",
        "ALTER TABLE network_contacts ADD COLUMN display_order INTEGER DEFAULT 0;"
    ];

    foreach ($cols as $sql) {
        try {
            $pdo->exec($sql);
            echo "Executed: $sql\n";
        } catch (Exception $e) {
            // Ignore if column exists (simple migration check)
            echo "Skipped (or error): $sql - " . $e->getMessage() . "\n";
        }
    }

    // Create daily_banners table for rotation logic
    $sqlBox = "
    CREATE TABLE IF NOT EXISTS daily_banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        rule_text TEXT,
        quote_text TEXT,
        question_text TEXT
    );";
    $pdo->exec($sqlBox);
    echo "Table daily_banners checked/created.\n";

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    echo "Critical Error: " . $e->getMessage() . "\n";
}
?>