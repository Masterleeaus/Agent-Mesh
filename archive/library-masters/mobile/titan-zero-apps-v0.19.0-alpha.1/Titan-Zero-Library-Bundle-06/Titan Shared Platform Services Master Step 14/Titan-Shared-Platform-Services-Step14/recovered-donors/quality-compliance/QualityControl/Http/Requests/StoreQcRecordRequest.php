<?php

namespace Modules\QualityControl\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQcRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id'   => ['nullable', 'string', 'max:36'],
            'cleaner_id'   => ['nullable', 'integer', 'min:1'],
            'template_id'  => ['nullable', 'integer', 'min:1'],
            'schedule_id'  => ['nullable', 'integer', 'min:1'],
            'property_id'  => ['nullable', 'integer', 'min:1'],
            'unit_id'      => ['nullable', 'integer', 'min:1'],
            'room_id'      => ['nullable', 'integer', 'min:1'],
            'visit_id'     => ['nullable', 'integer', 'min:1'],
            'notes'        => ['nullable', 'string'],
            'inspected_at' => ['nullable', 'date'],
            'items'        => ['nullable', 'array'],
            'items.*.item_label' => ['required', 'string', 'max:191'],
            'items.*.score'      => ['required', 'integer', 'min:0', 'max:100'],
            'items.*.weight'     => ['nullable', 'integer', 'min:0', 'max:100'],
            'items.*.notes'      => ['nullable', 'string'],
        ];
    }
}
