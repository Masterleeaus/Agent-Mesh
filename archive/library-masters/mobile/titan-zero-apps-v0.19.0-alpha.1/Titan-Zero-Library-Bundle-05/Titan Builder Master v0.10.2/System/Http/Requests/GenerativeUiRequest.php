<?php
namespace App\Extensions\TitanBuilder\System\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class GenerativeUiRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['spec' => ['required','array'], 'surface' => ['nullable','string','max:32']]; }
}
