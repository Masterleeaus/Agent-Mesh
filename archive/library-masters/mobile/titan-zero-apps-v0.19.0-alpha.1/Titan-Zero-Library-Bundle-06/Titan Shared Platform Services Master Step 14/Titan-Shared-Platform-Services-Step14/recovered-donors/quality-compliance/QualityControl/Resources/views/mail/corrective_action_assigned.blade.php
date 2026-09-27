<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Corrective Action Assigned</title></head>
<body style="font-family:sans-serif;color:#333;margin:0;padding:20px">
<h2 style="color:#2980b9">📋 Corrective Action Assigned</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px">
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Title</th><td style="padding:6px">{{ $action->title }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Severity</th><td style="padding:6px">{{ strtoupper($action->severity_level ?? 'N/A') }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Due Date</th><td style="padding:6px">{{ $action->due_date?->format('Y-m-d') ?? 'Not set' }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Status</th><td style="padding:6px">{{ $action->status }}</td></tr>
  @if($action->description)
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Description</th><td style="padding:6px">{{ $action->description }}</td></tr>
  @endif
</table>
<p style="margin-top:20px;font-size:13px;color:#777">Please log in to the Quality Control system to action this task.</p>
</body>
</html>
