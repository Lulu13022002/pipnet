<?php
require_once '../entry.php';
header('Data: ' . (Entry::is_valid_googlebot_ip($_SERVER['REMOTE_ADDR']) ? 'true' : 'false'));
exit;