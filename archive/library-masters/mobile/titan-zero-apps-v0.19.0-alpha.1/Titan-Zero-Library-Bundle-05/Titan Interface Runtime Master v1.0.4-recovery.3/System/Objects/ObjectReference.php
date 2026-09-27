<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Objects;

final readonly class ObjectReference implements \JsonSerializable
{
    private const KEY_PATTERN = '[a-z0-9]+(?:[._-][a-z0-9]+)*';
    private const TENANT_PATTERN = '[A-Za-z0-9][A-Za-z0-9._-]{0,127}';
    private const ID_PATTERN = '[A-Za-z0-9][A-Za-z0-9._~-]{0,127}';

    public function __construct(
        public string $objectKey,
        public string $objectId,
        public ?string $companyId = null,
    ) {
        if (preg_match('/^' . self::KEY_PATTERN . '$/', $objectKey) !== 1) {
            throw new ObjectReferenceResolutionException('Object reference contains an invalid object key.');
        }
        if (preg_match('/^' . self::ID_PATTERN . '$/', $objectId) !== 1) {
            throw new ObjectReferenceResolutionException('Object reference contains an unsafe or unsupported object identifier.');
        }
        if ($companyId !== null && preg_match('/^' . self::TENANT_PATTERN . '$/', $companyId) !== 1) {
            throw new ObjectReferenceResolutionException('Object reference contains an unsafe or unsupported tenant identifier.');
        }
    }

    public static function parse(string $value): self
    {
        if ($value === '' || strlen($value) > 320 || preg_match('~[\x00-\x20\x7F\\/]~', $value) === 1) {
            throw new ObjectReferenceResolutionException('Object reference contains unsafe characters.');
        }

        $pattern = '/^(' . self::KEY_PATTERN . ')(?:@(' . self::TENANT_PATTERN . '))?:(' . self::ID_PATTERN . ')$/';
        if (preg_match($pattern, $value, $matches) !== 1) {
            throw new ObjectReferenceResolutionException('Object reference must use object-key[@tenant]:object-id syntax.');
        }

        return new self(
            objectKey: $matches[1],
            objectId: $matches[3],
            companyId: isset($matches[2]) && $matches[2] !== '' ? $matches[2] : null,
        );
    }

    public static function tenant(string $objectKey, int|string $companyId, string $objectId): self
    {
        return new self($objectKey, $objectId, (string) $companyId);
    }

    public static function global(string $objectKey, string $objectId): self
    {
        return new self($objectKey, $objectId, null);
    }

    public function canonical(): string
    {
        return $this->objectKey
            . ($this->companyId !== null ? '@' . $this->companyId : '')
            . ':' . $this->objectId;
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'object_key' => $this->objectKey,
            'object_id' => $this->objectId,
            'company_id' => $this->companyId,
            'company_id' => $this->companyId,
            'canonical' => $this->canonical(),
        ];
    }
}
