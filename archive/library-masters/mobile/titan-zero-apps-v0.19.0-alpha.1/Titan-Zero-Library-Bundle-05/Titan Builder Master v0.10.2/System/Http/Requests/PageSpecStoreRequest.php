<?php

namespace App\Extensions\TitanBuilder\System\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ENHANCED: Proper validation for text content and widget specs
 */
final class PageSpecStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'spec' => ['required', 'array', 'min:1'],
            'spec.*.id' => ['required', 'string', 'max:255'],
            'spec.*.component' => ['required', 'string', 'max:255'],
            'spec.*.content' => ['sometimes', 'string', 'max:50000'],
            'spec.*.text' => ['sometimes', 'string', 'max:50000'],
            'spec.*.description' => ['sometimes', 'string', 'max:10000'],
            'spec.*.attributes' => ['sometimes', 'array'],
            'spec.*.children' => ['sometimes', 'array'],
            'merge_strategy' => ['sometimes', 'string', 'in:full,partial,text_only,widget_only'],
        ];
    }

    public function messages(): array
    {
        return [
            'spec.*.content.max' => 'Content field exceeds 50,000 character limit',
            'merge_strategy.in' => 'Invalid merge strategy specified',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('spec') && is_array($this->spec)) {
            $spec = $this->sanitizeTextFields($this->spec);
            $this->merge(['spec' => $spec]);
        }
    }

    private function sanitizeTextFields(array $spec): array
    {
        $textFields = ['content', 'text', 'label', 'heading', 'description'];
        array_walk_recursive($spec, function (&$value, $key) use ($textFields) {
            if (in_array($key, $textFields, true) && is_string($value)) {
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
            }
        });
        return $spec;
    }
}
