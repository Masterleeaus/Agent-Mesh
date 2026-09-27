<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Offline;

final class LocalCommandOutbox
{
    private string $key = '';
    private bool $configured = false;
    private WizardOutboxStoreInterface $store;
    private ?string $defaultCompanyId;
    private ?string $lastCompanyId = null;

    public function __construct(string $secret, ?WizardOutboxStoreInterface $store = null, ?string $defaultCompanyId = null)
    {
        $secret = trim($secret);
        $this->configured = $secret !== '';
        if ($this->configured) {
            $this->key = hash('sha256', $secret, true);
        }
        $this->store = $store ?? new InMemoryWizardOutboxStore();
        $this->defaultCompanyId = $defaultCompanyId !== null ? trim($defaultCompanyId) : null;
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    public function enqueue(array $command): array
    {
        $this->requireConfigured();
        $plain = json_encode($command, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        if (!function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_encrypt')) {
            throw new \RuntimeException('The PHP Sodium extension is required for encrypted offline commands.');
        }
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        $ciphertext = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($plain, '', $nonce, $this->key);
        $algorithm = 'xchacha20poly1305';
        $envelope = [
            'id' => (string) ($command['id'] ?? bin2hex(random_bytes(16))),
            'algorithm' => $algorithm,
            'nonce' => base64_encode($nonce),
            'ciphertext' => base64_encode($ciphertext),
            'queued_at' => gmdate(DATE_ATOM),
            'status' => 'pending',
        ];
        $envelope['signature'] = $this->signature($envelope);
        $companyId = $this->companyFromCommand($command);
        $this->lastCompanyId = $companyId;
        $this->store->put($companyId, $envelope);
        return $envelope;
    }

    public function pending(?string $companyId = null): array
    {
        return $this->store->pending($this->company($companyId));
    }

    public function verify(array $envelope): bool
    {
        if (!$this->configured) return false;
        return isset($envelope['signature']) && hash_equals($this->signature($envelope), (string) $envelope['signature']);
    }

    public function decrypt(array $envelope): array
    {
        $this->requireConfigured();
        if (!$this->verify($envelope)) {
            throw new \RuntimeException('Outbox command integrity check failed.');
        }
        $nonce = base64_decode((string) $envelope['nonce'], true);
        $ciphertext = base64_decode((string) $envelope['ciphertext'], true);
        if ($nonce === false || $ciphertext === false) {
            throw new \RuntimeException('Outbox command encoding is invalid.');
        }
        if (($envelope['algorithm'] ?? null) !== 'xchacha20poly1305') {
            throw new \RuntimeException('Unsupported outbox encryption algorithm.');
        }
        $plain = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($ciphertext, '', $nonce, $this->key);
        if ($plain === false) {
            throw new \RuntimeException('Outbox command decryption failed.');
        }
        return json_decode($plain, true, 512, JSON_THROW_ON_ERROR);
    }

    public function markSynced(string $id, ?string $companyId = null): void
    {
        $this->store->markSynced($this->company($companyId), $id);
    }

    private function companyFromCommand(array $command): string
    {
        $companyId = (string) ($command['metadata']['company_id'] ?? $command['payload']['_context']['company_id'] ?? $this->defaultCompanyId ?? '');
        return $this->company($companyId);
    }

    private function company(?string $companyId): string
    {
        $companyId = trim((string) ($companyId ?? $this->defaultCompanyId ?? $this->lastCompanyId ?? ''));
        if ($companyId === '') {
            // Backwards-compatible standalone/test mode may only infer company when exactly one in-memory queue is used.
            if ($this->store instanceof InMemoryWizardOutboxStore) return '__standalone__';
            throw new \RuntimeException('Wizard outbox access requires trusted company_id.');
        }
        return $companyId;
    }

    private function requireConfigured(): void
    {
        if (!$this->configured) {
            throw new \RuntimeException('Offline outbox encryption is unavailable until INTERACTION_OUTBOX_SECRET is configured.');
        }
    }

    private function signature(array $envelope): string
    {
        unset($envelope['signature']);
        ksort($envelope);
        return hash_hmac('sha256', json_encode($envelope, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES), $this->key);
    }
}
