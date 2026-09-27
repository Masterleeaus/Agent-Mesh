<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Support\AppMultimodalInput;

final class AppMultimodalInputNormalizer
{
    /** @param array<string,mixed> $input @param list<string> $allowedModes */
    public function normalize(array $input,array $allowedModes): AppMultimodalInput
    {
        $mode=strtolower(trim((string)($input['mode']??'')));
        if($mode===''||!in_array($mode,$allowedModes,true)) throw new \InvalidArgumentException('app_input_mode_not_allowed');

        $text=null;
        if(array_key_exists('text',$input)&&$input['text']!==null){
            if(!is_string($input['text'])) throw new \InvalidArgumentException('app_input_text_invalid');
            $text=trim($input['text']);
            if($text==='') $text=null;
            $length=$text===null?0:(function_exists('mb_strlen')?mb_strlen($text):strlen($text));
            if($length>20000) throw new \InvalidArgumentException('app_input_text_too_long');
        }

        $media=[];
        foreach((array)($input['media_refs']??[]) as $ref){
            if(!is_string($ref)||trim($ref)===''||strlen($ref)>512||preg_match('/[\x00-\x1F\x7F]/',$ref)) {
                throw new \InvalidArgumentException('app_input_media_reference_invalid');
            }
            $media[trim($ref)]=true;
            if(count($media)>20) throw new \InvalidArgumentException('app_input_media_limit_exceeded');
        }

        if(in_array($mode,['text','voice','touch'],true)&&$text===null&&$media===[]) {
            throw new \InvalidArgumentException('app_input_content_required');
        }
        if(in_array($mode,['vision','attachment'],true)&&$media===[]&&$text===null) {
            throw new \InvalidArgumentException('app_input_content_required');
        }

        $metadata=is_array($input['metadata']??null)?$input['metadata']:[];
        foreach(['company_id','tenant_id','tenant_company_id','actor_id','roles','permissions','capabilities'] as $forbidden){
            if(array_key_exists($forbidden,$metadata)) throw new \InvalidArgumentException('app_input_authority_metadata_forbidden');
        }

        return new AppMultimodalInput($mode,$text,array_keys($media),$metadata);
    }
}
