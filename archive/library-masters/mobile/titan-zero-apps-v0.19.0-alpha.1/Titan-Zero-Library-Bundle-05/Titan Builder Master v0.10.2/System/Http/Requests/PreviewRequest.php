<?php
namespace App\Extensions\TitanBuilder\System\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class PreviewRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return [
        'spec' => ['required','array'],
        'product_surface' => ['nullable','in:customer,field,owner,onboarding'],
        'device' => ['nullable','in:mobile,tablet,desktop'],
        'network' => ['nullable','in:online,offline,syncing,conflict,empty,populated,loading,error,permission-denied'],
        'theme' => ['nullable','string','max:120'],
        'mock_data' => ['nullable','string','regex:/^[a-z0-9-]+$/'],
    ]; }
}
