@extends('layouts.app')

@section('title', 'Interaction')

@section('content')
<div id="interaction-container">
    {!! $content !!}
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('interaction-container');
    const runId = {{ $runId }};

    container.addEventListener('submit', async function(e) {
        const form = e.target.closest('form');
        if (!form) return;
        e.preventDefault();

        const formData = new FormData(form);
        const answers = {};
        const action = formData.get('action');

        for (let [key, value] of formData.entries()) {
            if (key.startsWith('answers[')) {
                const field = key.match(/answers\[(.*?)\]/)[1];
                answers[field] = value;
            }
        }

        try {
            const response = await fetch(`/interaction/${runId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    answers: answers,
                    action: action || 'next'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Show validation errors
                if (data.errors) {
                    for (const [field, messages] of Object.entries(data.errors)) {
                        const input = form.querySelector(`[name="answers[${field}]"]`);
                        if (input) {
                            const errorEl = input.parentElement.querySelector('.error-message');
                            if (errorEl) {
                                errorEl.textContent = messages[0];
                            } else {
                                const newError = document.createElement('p');
                                newError.className = 'error-message text-red-600 text-sm mt-1';
                                newError.textContent = messages[0];
                                input.parentElement.appendChild(newError);
                            }
                            input.classList.add('border-red-500');
                        }
                    }
                }
                return;
            }

            if (data.complete) {
                window.location.href = '/dashboard';
            } else if (data.nextView) {
                container.innerHTML = data.nextView;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error processing interaction:', error);
        }
    });
});
</script>
@endpush
