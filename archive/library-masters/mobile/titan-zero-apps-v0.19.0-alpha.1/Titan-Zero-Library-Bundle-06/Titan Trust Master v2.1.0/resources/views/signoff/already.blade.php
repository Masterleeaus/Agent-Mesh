<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Job Sign-off</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
<div class="container py-4" style="max-width:680px;">
    <h2 class="mb-2">Already signed</h2>
    <div class="text-muted mb-3">Job #{{ $signoff->job_id }}</div>

    <div class="alert alert-success">
        This job was signed off by <strong>{{ $signoff->client_name }}</strong> at
        <strong>{{ optional($signoff->signed_at)->format('Y-m-d H:i') }}</strong>.
    </div>
</div>
</body>
</html>
