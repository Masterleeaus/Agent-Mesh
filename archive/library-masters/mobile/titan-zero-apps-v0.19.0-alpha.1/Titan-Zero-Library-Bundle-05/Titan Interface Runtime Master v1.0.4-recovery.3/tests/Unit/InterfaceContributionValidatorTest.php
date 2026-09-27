<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use PHPUnit\Framework\TestCase;

final class InterfaceContributionValidatorTest extends TestCase
{
    public function test_runtime_self_manifest_is_valid(): void
    {
        $root = dirname(__DIR__, 2);
        $manifest = json_decode((string) file_get_contents($root . '/resources/interface/interface-manifest.json'), true, 512, JSON_THROW_ON_ERROR);
        $result = (new InterfaceContributionValidator())->validate($manifest, 'titan-interface-runtime');
        self::assertTrue($result->valid(), implode("\n", $result->errors));
    }

    public function test_hub_exposure_and_ungoverned_mutation_fail_closed(): void
    {
        $manifest = [
            'schema_version' => '1.0', 'extension_key' => 'sample',
            'context' => ['required' => ['company_id'], 'optional' => []],
            'domains' => [['key'=>'d','label'=>'D','layer'=>'business','product_surfaces'=>['hub'],'intent_surfaces'=>['home'],'object_refs'=>['o'],'default_view_refs'=>[]]],
            'objects' => [['key'=>'o','label'=>'O','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['hub'],'customer_safe'=>false,'permissions'=>[],'facet_refs'=>[],'view_refs'=>[],'action_refs'=>['a'],'relationship_refs'=>[],'offline_mode'=>'read-only']],
            'facets'=>[], 'views'=>[],
            'actions'=>[['key'=>'a','label'=>'A','applies_to'=>['o'],'mutating'=>true,'capability_ref'=>null,'interaction'=>null,'product_surfaces'=>['hub'],'permissions'=>[],'offline_mode'=>'online-required','requires_confirmation'=>true]],
            'lifecycles'=>[], 'global_work'=>[], 'providers'=>['attention'=>[],'decisions'=>[],'insights'=>[]], 'legacy_data_surfaces'=>[],
        ];
        $errors = (new InterfaceContributionValidator())->validate($manifest, 'sample')->errors;
        self::assertStringContainsString('customer_safe', implode("\n", $errors));
        self::assertStringContainsString('mutating action', implode("\n", $errors));
    }
}
