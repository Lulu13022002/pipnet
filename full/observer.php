<?php
declare(strict_types=1);
require_once 'version.php';

class Observer {
    private $value;
    public function __construct(string $value) {
        $this->value = $value;
    }

    public function getValue(): string {
        return $this->value;
    }

    public function existsVersion(string $program): bool {
        return strpos($program . '/', $this->value) !== false;
    }

    public function getVersion0(string $program): ?string {
        $index = strpos($this->value, $program . '/');
        if($index !== false) {
            $vers = substr($this->value, $index + strlen($program) + 1);
            $indexOfSpace = strpos($vers, ' ');
            return $indexOfSpace !== false ? substr($vers, 0, $indexOfSpace) : $vers;
        }
        return null;
    }

    public function getVersion(string $program): ?Version {
        $vers0 = $this->getVersion0($program);
        return $vers0 ? new Version($vers0) : null;
    }
}