<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\ExportWriter;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\PrivateExportStore;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Exports\CsvExportWriter;
use App\Extensions\TitanMapsIntelligence\Exports\JsonExportWriter;
use App\Extensions\TitanMapsIntelligence\Exports\XlsxExportWriter;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use DateInterval;
use DateTimeImmutable;

final class CandidateExportService
{
    /** @var array<string, ExportWriter> */
    private array $writers;

    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly PrivateExportStore $store,
        private readonly AuditRecorder $audit,
        ?CsvExportWriter $csv = null,
        ?JsonExportWriter $json = null,
        ?XlsxExportWriter $xlsx = null,
    ) {
        $writers = [$csv ?? new CsvExportWriter(), $json ?? new JsonExportWriter(), $xlsx ?? new XlsxExportWriter()];
        $this->writers = [];
        foreach ($writers as $writer) {
            $this->writers[$writer->extension()] = $writer;
        }
    }

    /** @return array{reference:string,signed_url:string,expires_at:string,format:string,record_count:int,filename:string} */
    public function export(string $searchId, string $format, array $filters = []): array
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.search.export', ['search_id' => $searchId, 'format' => $format]);

        $search = DiscoverySearch::query()->forCompany($companyId)->whereKey($searchId)->first();
        if ($search === null) {
            throw MapsIntelligenceException::fromCode('MAPS_SEARCH_NOT_FOUND', 'The search does not exist in the authorised company scope.');
        }
        $writer = $this->writers[$format] ?? null;
        if ($writer === null) {
            throw MapsIntelligenceException::fromCode('MAPS_EXPORT_FORMAT_UNSUPPORTED', 'The requested export format is not supported.');
        }

        $query = DiscoveryCandidate::query()
            ->with('place')
            ->forCompany($companyId)
            ->where('discovery_search_id', $searchId);
        if (isset($filters['candidate_status']) && $filters['candidate_status'] !== null && $filters['candidate_status'] !== '') {
            $query->where('review_status', (string) $filters['candidate_status']);
        }

        $rows = [];
        foreach ($query->lazyById(250) as $candidate) {
            $place = $candidate->place;
            if ($place === null || $place->company_id !== $companyId) {
                continue;
            }
            $rows[] = [
                'candidate_id' => (string) $candidate->getKey(),
                'candidate_type' => $candidate->candidate_type,
                'review_status' => $candidate->review_status,
                'name' => $place->name,
                'category' => $place->primary_category,
                'address' => $place->address,
                'phone' => $place->phone,
                'website' => $place->website,
                'public_email' => $place->public_email,
                'rating' => $place->rating,
                'review_count' => $place->review_count,
                'provider' => $place->provider,
                'source_url' => $place->source_url,
                'last_observed_at' => $place->last_observed_at?->toIso8601String(),
                'confidence' => $place->confidence,
            ];
        }

        $expiresAt = (new DateTimeImmutable())->add(new DateInterval('PT15M'));
        $filename = sprintf('titan-maps-%s-%s.%s', $searchId, gmdate('Ymd-His'), $writer->extension());
        $stored = $this->store->put($companyId, $filename, $writer->mimeType(), $writer->write($rows), $expiresAt);
        $this->audit->record([
            'type' => 'maps.search_exported',
            'company_id' => $companyId,
            'user_id' => $userId,
            'agent_id' => $filters['agent_id'] ?? null,
            'conversation_id' => $filters['conversation_id'] ?? null,
            'search_id' => $searchId,
            'format' => $format,
            'record_count' => count($rows),
            'export_reference' => $stored['reference'],
            'expires_at' => $stored['expires_at'],
        ]);

        return $stored + ['format' => $format, 'record_count' => count($rows), 'filename' => $filename];
    }
}
