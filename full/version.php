<?php
declare(strict_types=1);
require_once 'numberJS.php';

class Version {

    public static function parseUnsigned(string $value, string $replacement = null, string $abc = 'abcdefghijklmnopqrstuvwxyz') {
        $isINT = $replacement === null || $replacement === 'INT';
        $isIGNORE = $replacement === 'IGNORE';
        $result = '';
        for($i = 0, $l = strlen($value); $i < $l; $i++) {
            $char = $value[$i];
            $index = strpos($abc, strtolower($char));
            $result .= $index === false ? $char : ($isINT ? $index + 1 : $replacement);
        }
        return is_numeric($value) ? NumberJS::numberval($value) : new Version($result);
    }

    public $value, $isValid;
    public function __construct(string $value) {
        $this->value = $value;
        $this->isValid = trim($value) !== '';
    }

    public function get(?int $maxFragmentsCount = null, ?string $unsignedVersionReplacement = null): array {
        if(!$this->isValid) return ['length' => 0, 'array' => [], 'RAW' => [], 'MAJOR' => null, 'MINOR' => null, 'REVISION' => null, 'BUILD' => null, 'VALUE' => null];
        $array = [];
        $extra = '';
        $l = 0;
        $raw = $this->iterate(function($value, $raw, $i) use(&$array, &$extra, &$l) {
            $array[$i] = $value;
            $l++;
            if($i !== 0 && !is_nan($value)) $extra .= $raw;
        }, $maxFragmentsCount, $unsignedVersionReplacement);
        
        $o = ['length' => $l, 'array' => $array,
              'RAW' => $raw,
              'MAJOR' => @$array[0],
              'MINOR' => @$array[1],
              'REVISION' => @$array[2],
              'BUILD' => @$array[3]];

        if($extra === '') $o['VALUE'] = (float) $o['MAJOR'];
        else {
            $strValue = $o['MAJOR'] . '.';
            if(!$unsignedVersionReplacement || !$o['REVISION']) $strValue .= $extra;
            else {
                $uVersion = self::parseUnsigned($extra, $unsignedVersionReplacement);
                $strValue .= is_numeric($uVersion) ? "$uVersion" : $uVersion->value;
            }
            $o['VALUE'] = NumberJS::floatval($strValue);
        }
        return $o;
    }

    public function iterate(callable $callback, int $maxFragmentsCount = null, string $unsignedVersionReplacement = null, int &$gI = 0) {
        if(!$this->isValid) return;
        $strVers = $maxFragmentsCount != null ? explode('.', $this->value, $maxFragmentsCount) : explode('.', $this->value);
        $hasReplacement = $unsignedVersionReplacement != null;

        foreach($strVers as $frag) {
            if($hasReplacement) {
                $uVersion = self::parseUnsigned($frag, $unsignedVersionReplacement);
                if(is_numeric($uVersion)) {
                    if($callback($uVersion, $frag, $gI)) break;
                } else $uVersion->iterate($callback, null, null, $gI);
            } else if($callback((int) $frag, $frag, $gI)) break;
            
            $gI++;
        }
        if(!$hasReplacement) $gI--;
        return $strVers;
    }
}