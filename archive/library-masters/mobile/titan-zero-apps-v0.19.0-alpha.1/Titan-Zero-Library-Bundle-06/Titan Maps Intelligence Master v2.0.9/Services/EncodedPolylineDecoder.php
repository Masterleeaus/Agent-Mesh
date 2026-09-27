<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class EncodedPolylineDecoder
{
    /** @return array<int,array{lat:float,lng:float}> */
    public function decode(?string $encoded): array
    {
        if ($encoded === null || $encoded === '') {
            return [];
        }

        $points = [];
        $index = 0;
        $length = strlen($encoded);
        $latitude = 0;
        $longitude = 0;

        while ($index < $length) {
            $latitude += $this->decodeValue($encoded, $index, $length);
            if ($index >= $length) {
                break;
            }
            $longitude += $this->decodeValue($encoded, $index, $length);
            $points[] = [
                'lat' => $latitude / 100000.0,
                'lng' => $longitude / 100000.0,
            ];
        }

        return $points;
    }

    private function decodeValue(string $encoded, int &$index, int $length): int
    {
        $result = 0;
        $shift = 0;

        do {
            if ($index >= $length) {
                return 0;
            }
            $byte = ord($encoded[$index++]) - 63;
            $result |= ($byte & 0x1f) << $shift;
            $shift += 5;
        } while ($byte >= 0x20 && $shift < 35);

        return ($result & 1) !== 0 ? ~($result >> 1) : ($result >> 1);
    }
}
