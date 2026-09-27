<?php
namespace App\Extensions\TitanBuilder\System\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
final class AssetUploadRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['file'=>['required','file','max:10240']]; }
}
