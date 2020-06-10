<?php
declare(strict_types=1);

// maybe take js strict attribute to return NAN when 1.11b is returned and not 1.11
class NumberJS {
    private static function isZero(string $value): bool {
        $value = trim($value);
        return $value[0] === '0' || strpos($value, '-0') === 0;
    }
    
    /* php doesn't return NAN when string isn't numeric for intval/floatval but 0
       and 0 it's also a value when you call intval("0"). Moreover isnumeric method return false for 1.11b
       so we cannot do: isnumeric(x) ? (float) x : NAN to allow 1.11
       so to create difference between floatval("0") and floatval("wrong") use these functions
       return NAN for malformed [$value]
       unsigned zero (-0) will also return 0 and not (float) -0 */
    public static function floatval(string $value) {
        $val = (float) $value;
        return self::isZero($value) || $val ? $val : NAN;
    }

    // can return NAN like a float
    public static function intval(string $value) {
        $val = (int) $value;
        return self::isZero($value) || $val ? $val : NAN;
    }

    // if doesn't want a specific type at the return, this will return int for 0 and float for 0.5...
    public static function numberval(string $value) {
        return strpos($value, '.', 1) ? self::floatval($value) : self::intval($value);
    }

    public static function map(string $value): array {
        return ['FLOAT' => self::floatval($value), 'INT' => self::intval($value)];
    }
}