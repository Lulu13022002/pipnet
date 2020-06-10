<?php
/* Since December 2019, google bot will now use Chrome/W.X.Y.Z userAgent so to retrieve Chromium (and not chrome) version we need to check it below*/
// using the support of googlebot this will replace Chrome/W.X.Y.Z by Chromium/79.0.3945.79 because googlebot 'Evergreen' use the latest stable Chromium version
// for spoofed userAgent
/* Experimental feature you can follow the guide to disable the support of googlebot (for getBot method) in the wiki: x */
define('ALL', '[^-]+?');
function is_valid_googlebot_ip(string $ip): bool {
    $hostname = gethostbyaddr($ip);
    if(preg_match('/crawl-' . ALL . '-' . ALL . '-' . ALL . '-' . ALL . '.googlebot.com/', $hostname) === false) return false; //"crawl-66-249-66-1.googlebot.com"
    
    return gethostbyname($hostname) === $ip;
}

header('Data: ' . (is_valid_googlebot_ip($_SERVER['REMOTE_ADDR']) ? 'true' : 'false'));
exit;