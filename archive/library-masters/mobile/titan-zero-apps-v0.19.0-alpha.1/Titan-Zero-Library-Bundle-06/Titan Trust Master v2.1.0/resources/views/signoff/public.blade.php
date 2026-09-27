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
    <h2 class="mb-2">Job Sign-off</h2>
    <div class="text-muted mb-3">Job #{{ $signoff->job_id }}</div>

    @if($errors->any())
        <div class="alert alert-danger">
            <div class="fw-bold mb-1">Please fix:</div>
            <ul class="mb-0">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="card">
        <div class="card-body">
            <form method="POST" action="{{ route('titan-trust.public.signoff.store', ['token' => $signoff->token]) }}" enctype="multipart/form-data">
                @csrf

                <div class="mb-3">
                    <label class="form-label">Your name</label>
                    <input name="client_name" class="form-control" value="{{ old('client_name') }}" required>
                </div>

                <div class="mb-3">
                    <label class="form-label">Signature (upload a photo)</label>
                    <input type="file" name="signature" class="form-control" accept="image/*" capture="environment" required>
                    <div class="form-text">Tip: on mobile, this opens the camera.</div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Notes (optional)</label>
                    <textarea name="notes" class="form-control" rows="3">{{ old('notes') }}</textarea>
                </div>

                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" name="agree" id="agree" value="1" required>
                    <label class="form-check-label" for="agree">
                        I confirm the work has been completed to my satisfaction.
                    </label>
                </div>

                <button class="btn btn-primary btn-lg w-100" type="submit">Sign off</button>
            </form>
        </div>
    </div>

    <div class="text-center text-muted small mt-3">
        This link is unique to your job sign-off.
    </div>
</div>
</body>
</html>
