<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verification Reminder</title></head>
<body style="font-family:sans-serif;color:#333;margin:0;padding:20px">
<h2 style="color:#8e44ad">🔔 QC Verification Reminder</h2>
<p>A follow-up verification is pending and requires your attention.</p>
<table style="border-collapse:collapse;width:100%;max-width:600px">
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Verification ID</th><td style="padding:6px">#{{ $verification->id }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Status</th><td style="padding:6px">{{ $verification->status }}</td></tr>
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Due By</th><td style="padding:6px">{{ $verification->due_at?->format('Y-m-d H:i') ?? 'Not set' }}</td></tr>
</table>
<p style="margin-top:20px;font-size:13px;color:#777">Please complete the verification in the Quality Control system.</p>
</body>
</html>
