<?php
namespace App\Extensions\TitanBuilder\System\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class PageStoreRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['name'=>['required','string','max:160'],'slug'=>['required','string','regex:/^[a-z0-9-]+$/','max:120'],'sort_order'=>['nullable','integer','min:0','max:10000'],'meta'=>['nullable','array']]; }
}
