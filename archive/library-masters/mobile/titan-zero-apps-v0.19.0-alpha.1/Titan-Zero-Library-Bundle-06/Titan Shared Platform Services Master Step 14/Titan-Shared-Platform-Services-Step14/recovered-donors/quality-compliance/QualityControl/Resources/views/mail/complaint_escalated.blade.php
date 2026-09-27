<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Complaint Escalated</title></head>
<body style="font-family:sans-serif;color:#333;margin:0;padding:20px">
<h2 style="color:#c0392b">🚨 Complaint Escalated — QC Failure</h2>
<p>The following complaint has been escalated and requires management attention.</p>
<table style="border-collapse:collapse;width:100%;max-width:600px">
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Complaint ID</th><td style="padding:6px">{{ $complaintId ? '#'.$complaintId : '(no complaint)' }}</td></tr>
  @if($qcRecordId)
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">QC Record ID</th><td style="padding:6px">#{{ $qcRecordId }}</td></tr>
  @endif
  @if($reason)
  <tr><th style="text-align:left;padding:6px;background:#f5f5f5">Escalation Reason</th><td style="padding:6px">{{ $reason }}</td></tr>
  @endif
</table>
<p style="margin-top:20px;font-size:13px;color:#777">Please review and resolve this complaint in the system.</p>
</body>
</html>
