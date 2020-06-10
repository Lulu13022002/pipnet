<?php
require_once 'observer.php';

// this is the same method that js pipnet.userAgent.security but this is called in server side (SERVER_SOFTWARE)
class Pipcrypt {
    
    private $software;
    public function __construct() {
        $this->software = new Observer($_SERVER['SERVER_SOFTWARE']);
    }
    public function TLS(): ?string {
        $openSSLVers = $this->software->getVersion('OpenSSL');
        if($openSSLVers) return $openSSLVers->get()['VALUE'] >= 1.01 ? "1.2" : "1.0";
        return null;
    }

    public function canUseTLS(): bool {
        return $this->software->existsVersion('OpenSSL');
    }

    public function SSL(): ?string {
        $openSSLVers = $this->software->getVersion('OpenSSL');
        if($openSSLVers && $openSSLVers->get()['VALUE'] <= 0.98) return "3";
        return null;
    }

    public function canUseSSL(): bool {
        return !!$this->SSl();
    }
}