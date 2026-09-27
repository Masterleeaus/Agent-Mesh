<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Thank you</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
<div class="container py-4" style="max-width:680px;">
    <h2 class="mb-2">Thank you</h2>
    <div class="text-muted mb-3">Your sign-off has been recorded.</div>

    <div class="alert alert-success">
        Signed by <strong>{{ $signoff->client_name }}</strong> for Job <strong>#{{ $signoff->job_id }}</strong>.
    </div>
</div>
</body>
</html>
