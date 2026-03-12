<?php
// debug_wrapper.php

// Simulate session
session_id('test_session');
@session_start();
$_SESSION['user_id'] = 1; // Assuming user ID 1 exists

// Simulate POST data
$_POST['prompt'] = "Test prompt from CLI wrapper";

// Mock the environment if needed, but the script handles it.

// Capture output
ob_start();
include 'api/ai_coach.php';
$output = ob_get_clean();

echo "--- START OUTPUT ---\n";
echo $output;
echo "\n--- END OUTPUT ---\n";
?>