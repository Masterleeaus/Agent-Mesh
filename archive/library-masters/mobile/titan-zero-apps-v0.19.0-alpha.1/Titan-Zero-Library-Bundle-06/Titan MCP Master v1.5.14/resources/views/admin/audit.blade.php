@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="mb-4"><h1 class="h3 mb-1">Titan MCP Audit Ledger</h1><p class="text-muted mb-0">Tamper-evident mutation audit-chain status.</p></div>
    <div class="row g-3">
        <div class="col-md-3"><div class="card"><div class="card-body"><div class="text-muted small">Integrity</div><div class="h4 mb-0">{{ ($audit['valid'] ?? false) ? 'Valid' : 'Attention required' }}</div></div></div></div>
        <div class="col-md-3"><div class="card"><div class="card-body"><div class="text-muted small">Chained entries</div><div class="h4 mb-0">{{ $audit['entries'] ?? 0 }}</div></div></div></div>
        <div class="col-md-3"><div class="card"><div class="card-body"><div class="text-muted small">Legacy entries</div><div class="h4 mb-0">{{ $audit['legacy_entries'] ?? 0 }}</div></div></div></div>
        <div class="col-md-3"><div class="card"><div class="card-body"><div class="text-muted small">Ledger size</div><div class="h4 mb-0">{{ number_format((int)($audit['bytes'] ?? 0)) }} B</div></div></div></div>
    </div>
    @if(!($audit['valid'] ?? false))
        <div class="alert alert-danger mt-4">Writes are fail-closed while the audit ledger is invalid. {{ implode('; ', $audit['errors'] ?? []) }}</div>
    @endif
</div>
@endsection
