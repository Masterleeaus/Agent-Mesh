<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>QC Inspection Failed</title></head>
<body style="font-family:sans-serif;color:#333;margin:0;padding:20px">
<h2 style="color:#c0392b">⚠ Quality Control Inspection Failed</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px">
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Record ID</th><td style="padding:6px">#{{ $record->id }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Score</th><td style="padding:6px">{{ $record->overall_score ?? 0 }}%</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Severity</th><td style="padding:6px">{{ strtoupper($record->severity_level ?? 'N/A') }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Status</th><td style="padding:6px">{{ $record->status }}</td></tr>
  @if($record->notes)
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Notes</th><td style="padding:6px">{{ $record->notes }}</td></tr>
  @endif
</table>
<p style="margin-top:20px;font-size:13px;color:#777">This is an automated notification from the Quality Control system.</p>
</body>
</html>
