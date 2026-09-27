<?php
namespace App\Extensions\TitanBuilder\System\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class ProjectStoreRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['name'=>['required','string','max:160'],'slug'=>['required','string','regex:/^[a-z0-9-]+$/','max:120'],'surface'=>['required','in:customer,field,owner,onboarding'],'meta'=>['nullable','array']]; }
}
