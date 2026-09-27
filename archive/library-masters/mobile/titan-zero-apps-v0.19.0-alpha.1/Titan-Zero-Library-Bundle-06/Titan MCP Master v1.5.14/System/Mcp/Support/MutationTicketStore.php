<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class MutationTicketStore
{
    public function __construct(private readonly string $root) {}

    /** @param array<string,mixed> $ticket @return array<string,mixed> */
    public function create(array $ticket): array
    {
        $this->assertRootReady();
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $id = 'mt_'.bin2hex(random_bytes(16));
            if (!is_file($this->jsonPath($id)) && !is_file($this->sealPath($id))) {
                $ticket['ticket_id'] = $id;
                $this->writeSealed($id, $ticket, false);
                return $ticket;
            }
        }
        throw new RuntimeException('Unable to allocate a unique mutation ticket id.');
    }

    /** @return array<string,mixed> */
    public function read(string $ticketId): array
    {
        $this->assertRootReady();
        $id = $this->assertId($ticketId);
        return $this->readVerified($id);
    }

    /** @param array<string,mixed> $ticket */
    public function replace(string $ticketId, array $ticket): void
    {
        $this->assertRootReady();
        $id = $this->assertId($ticketId);
        if (!is_file($this->jsonPath($id))) throw new RuntimeException('Mutation ticket does not exist.');
        $ticket['ticket_id'] = $id;
        $this->writeSealed($id, $ticket, true);
    }

    /**
     * Atomic single-ticket compare-and-swap transition.
     * @param array<string,mixed> $changes
     * @return array<string,mixed>
     */
    public function transition(string $ticketId, string $expectedStatus, array $changes): array
    {
        $this->assertRootReady();
        $id = $this->assertId($ticketId);
        $lockPath = $this->root.'/'.$id.'.lock';
        $handle = fopen($lockPath, 'c+');
        if ($handle === false) throw new RuntimeException('Unable to open mutation ticket lock.');
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('Unable to lock mutation ticket.');
            $current = $this->readVerified($id);
            if (($current['status'] ?? null) !== $expectedStatus) {
                throw new RuntimeException("Mutation ticket is not in expected '{$expectedStatus}' state.");
            }
            $next = array_replace($current, $changes);
            $next['ticket_id'] = $id;
            $this->writeSealed($id, $next, true);
            flock($handle, LOCK_UN);
            return $next;
        } finally {
            fclose($handle);
        }
    }

    private function assertRootReady(): void
    {
        $root = rtrim($this->root, DIRECTORY_SEPARATOR);
        if ($root === '') throw new RuntimeException('Mutation ticket storage root is empty.');
        $parent = dirname($root);
        if (!is_dir($parent) && !mkdir($parent, 0700, true) && !is_dir($parent)) {
            throw new RuntimeException('Unable to create mutation ticket storage parent.');
        }
        $this->assertNoSymlinkComponents($parent);
        if (is_link($root)) throw new RuntimeException('Mutation ticket storage root may not be a symbolic link.');
        if (!is_dir($root) && !mkdir($root, 0700, true) && !is_dir($root)) {
            throw new RuntimeException('Unable to create mutation ticket storage root.');
        }
        @chmod($root, 0700);
        $this->assertNoSymlinkComponents($root);
    }

    private function assertNoSymlinkComponents(string $path): void
    {
        $current = str_starts_with($path, DIRECTORY_SEPARATOR) ? DIRECTORY_SEPARATOR : '';
        foreach (array_values(array_filter(explode(DIRECTORY_SEPARATOR, trim($path, DIRECTORY_SEPARATOR)), 'strlen')) as $segment) {
            $current = $current === DIRECTORY_SEPARATOR ? $current.$segment : ($current === '' ? $segment : $current.DIRECTORY_SEPARATOR.$segment);
            if (is_link($current)) throw new RuntimeException('Mutation ticket storage may not traverse symbolic links.');
        }
    }

    private function assertId(string $ticketId): string
    {
        if (preg_match('/^mt_[a-f0-9]{32}$/', $ticketId) !== 1) throw new RuntimeException('Invalid mutation ticket id.');
        return $ticketId;
    }

    /** @return array<string,mixed> */
    private function readVerified(string $id): array
    {
        $jsonPath = $this->jsonPath($id);
        $sealPath = $this->sealPath($id);
        if (!is_file($jsonPath) || !is_file($sealPath) || is_link($jsonPath) || is_link($sealPath)) {
            throw new RuntimeException('Mutation ticket is missing or unsafe.');
        }
        $bytes = file_get_contents($jsonPath);
        $seal = trim((string) file_get_contents($sealPath));
        if (!is_string($bytes) || preg_match('/^[a-f0-9]{64}$/', $seal) !== 1 || !hash_equals($seal, hash('sha256', $bytes))) {
            throw new RuntimeException('Mutation ticket integrity verification failed.');
        }
        $decoded = json_decode($bytes, true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($decoded) || ($decoded['ticket_id'] ?? null) !== $id) throw new RuntimeException('Mutation ticket payload is invalid.');
        return $decoded;
    }

    /** @param array<string,mixed> $ticket */
    private function writeSealed(string $id, array $ticket, bool $replace): void
    {
        $jsonPath = $this->jsonPath($id);
        if (!$replace && file_exists($jsonPath)) throw new RuntimeException('Mutation ticket already exists.');
        $bytes = json_encode($ticket, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n";
        $jsonTmp = $jsonPath.'.'.bin2hex(random_bytes(5)).'.tmp';
        $sealTmp = $this->sealPath($id).'.'.bin2hex(random_bytes(5)).'.tmp';
        try {
            if (file_put_contents($jsonTmp, $bytes, LOCK_EX) === false) throw new RuntimeException('Unable to write mutation ticket payload.');
            if (file_put_contents($sealTmp, hash('sha256', $bytes)."\n", LOCK_EX) === false) throw new RuntimeException('Unable to write mutation ticket seal.');
            @chmod($jsonTmp, 0600); @chmod($sealTmp, 0600);
            if (!rename($jsonTmp, $jsonPath)) throw new RuntimeException('Unable to activate mutation ticket payload.');
            if (!rename($sealTmp, $this->sealPath($id))) throw new RuntimeException('Unable to activate mutation ticket seal.');
            @chmod($jsonPath, 0600); @chmod($this->sealPath($id), 0600);
        } finally {
            if (is_file($jsonTmp)) @unlink($jsonTmp);
            if (is_file($sealTmp)) @unlink($sealTmp);
        }
    }

    private function jsonPath(string $id): string { return rtrim($this->root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$id.'.json'; }
    private function sealPath(string $id): string { return rtrim($this->root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$id.'.sha256'; }
}
