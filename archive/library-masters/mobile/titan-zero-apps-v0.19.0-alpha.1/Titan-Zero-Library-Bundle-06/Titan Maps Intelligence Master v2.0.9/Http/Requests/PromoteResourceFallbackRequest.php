<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class PromoteResourceFallbackRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'company_id'=>['prohibited'],'candidate_id'=>['required','uuid'],'confirmed'=>['required','accepted'],
            'accepted_fields'=>['required','array','min:1'],'accepted_fields.*'=>['string','in:name,phone,website,public_email,address,categories'],
            'reason'=>['sometimes','nullable','string','max:2000'],'agent_id'=>['sometimes','nullable','string','max:255'],'conversation_id'=>['sometimes','nullable','string','max:255'],'correlation_id'=>['sometimes','nullable','string','max:255'],
        ];
    }
}
