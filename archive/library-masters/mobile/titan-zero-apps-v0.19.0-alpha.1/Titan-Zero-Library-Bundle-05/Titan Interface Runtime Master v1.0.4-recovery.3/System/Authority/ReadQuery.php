<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use JsonSerializable;

final readonly class ReadQuery implements JsonSerializable
{
    public const MAX_FILTERS = 50;
    public const MAX_SORTS = 10;
    public const MAX_PER_PAGE = 200;

    /**
     * @param array<string, scalar|null|list<scalar|null>> $filters
     * @param list<array{field:string,direction:string}> $sort
     */
    public function __construct(
        public array $filters = [],
        public array $sort = [],
        public int $page = 1,
        public int $perPage = 50,
        public ?string $cursor = null,
        public ?string $search = null,
    ) {
        if ($page < 1 || $page > 100000) throw new \InvalidArgumentException('page is outside the supported read budget.');
        if ($perPage < 1 || $perPage > self::MAX_PER_PAGE) throw new \InvalidArgumentException('per_page is outside the supported read budget.');
        if (count($filters) > self::MAX_FILTERS) throw new \InvalidArgumentException('Too many read filters.');
        if (count($sort) > self::MAX_SORTS) throw new \InvalidArgumentException('Too many read sort terms.');
        foreach ($filters as $field => $value) {
            self::assertField($field);
            self::assertFilterValue($value);
        }
        foreach ($sort as $term) {
            if (! is_array($term) || ! isset($term['field'], $term['direction']) || ! is_string($term['field']) || ! is_string($term['direction'])) {
                throw new \InvalidArgumentException('Each sort term requires string field and direction values.');
            }
            self::assertField($term['field']);
            if (! in_array(strtolower($term['direction']), ['asc', 'desc'], true)) throw new \InvalidArgumentException('Sort direction must be asc or desc.');
        }
        if ($cursor !== null && ($cursor === '' || strlen($cursor) > 512 || preg_match('/[\x00-\x1F\x7F]/', $cursor))) {
            throw new \InvalidArgumentException('cursor contains an invalid value.');
        }
        if ($search !== null && (strlen($search) > 500 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $search))) {
            throw new \InvalidArgumentException('search contains an invalid value.');
        }
    }

    /** @return array<string, mixed> */
    public function criteria(): array
    {
        $filters = $this->filters;
        ksort($filters, SORT_STRING);
        $sort = array_map(static fn (array $term): array => [
            'field' => $term['field'],
            'direction' => strtolower($term['direction']),
        ], $this->sort);

        return [
            'filters' => $filters,
            'sort' => $sort,
            'page' => $this->page,
            'per_page' => $this->perPage,
            'cursor' => $this->cursor,
            'search' => $this->search,
        ];
    }

    public function fingerprint(): string
    {
        return hash('sha256', (string) json_encode($this->criteria(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    public function jsonSerialize(): array
    {
        return $this->criteria();
    }

    private static function assertField(string $field): void
    {
        if (! preg_match('/^[A-Za-z][A-Za-z0-9._-]{0,127}$/', $field)) throw new \InvalidArgumentException('Read field contains an unsafe token.');
    }

    private static function assertFilterValue(mixed $value): void
    {
        $values = is_array($value) ? $value : [$value];
        if (count($values) > 100) throw new \InvalidArgumentException('Filter list exceeds the supported budget.');
        foreach ($values as $item) {
            if (! is_scalar($item) && $item !== null) throw new \InvalidArgumentException('Filters may contain scalar or null values only.');
            if (is_string($item) && strlen($item) > 1000) throw new \InvalidArgumentException('Filter value is too large.');
        }
    }
}
