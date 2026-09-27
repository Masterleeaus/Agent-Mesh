<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class StartResourceFallbackRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'company_id'=>['prohibited'],'resource_type'=>['required','string','in:contractor,supplier'],'operational_need_type'=>['sometimes','string','in:manual,job,inventory_shortage'],'operational_need_public_id'=>['sometimes','nullable','string','max:191'],'job_public_id'=>['sometimes','nullable','string','max:191'],
            'service_key'=>['sometimes','nullable','string','max:191'],'query'=>['sometimes','nullable','string','max:255'],
            'latitude'=>['required_without:job_public_id','nullable','numeric','between:-90,90'],'longitude'=>['required_without:job_public_id','nullable','numeric','between:-180,180'],
            'radius_metres'=>['sometimes','nullable','numeric','min:100','max:50000'],'travel_mode'=>['sometimes','string','in:DRIVE,WALK,BICYCLE,TWO_WHEELER'],
            'routing_preference'=>['sometimes','string','in:TRAFFIC_AWARE,TRAFFIC_AWARE_OPTIMAL,TRAFFIC_UNAWARE'],'open_now'=>['sometimes','boolean'],
        ];
    }
}
