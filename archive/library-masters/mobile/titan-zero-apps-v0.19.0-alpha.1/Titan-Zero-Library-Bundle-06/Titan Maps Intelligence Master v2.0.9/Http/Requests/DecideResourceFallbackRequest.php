<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class DecideResourceFallbackRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['company_id'=>['prohibited'],'candidate_id'=>['required','uuid'],'decision'=>['required','string','in:approve,reject'],'reason'=>['sometimes','nullable','string','max:2000']];
    }
}
