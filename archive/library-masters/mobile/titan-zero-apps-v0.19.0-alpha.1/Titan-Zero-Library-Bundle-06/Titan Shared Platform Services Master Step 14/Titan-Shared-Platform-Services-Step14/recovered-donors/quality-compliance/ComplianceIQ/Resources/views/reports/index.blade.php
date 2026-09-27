@extends('layouts.app')
@section('content')
<div class="container"><h1>Compliance Reports</h1>
<table class="table"><thead><tr><th>Title</th><th>Period</th><th>Status</th><th>Integrity</th></tr></thead><tbody>
@foreach($reports as $report)<tr><td><a href="{{ route('admin.compliance.reports.show',$report->id) }}">{{ $report->title }}</a></td><td>{{ $report->period_start }} – {{ $report->period_end }}</td><td>{{ $report->status }}</td><td>{{ $report->integrity_root ?: 'Pending' }}</td></tr>@endforeach
</tbody></table>{{ $reports->links() }}</div>
@endsection
