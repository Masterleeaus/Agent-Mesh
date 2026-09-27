<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use PHPUnit\Framework\TestCase;

final class GenerativeUiSpecValidatorTest extends TestCase
{
    private GenerativeUiSpecValidator $validator;

    protected function setUp(): void
    {
        $registry = new BuilderRegistry(dirname(__DIR__, 3).'/resources/builder');
        $normaliser = new GenerativeUiSpecNormaliser($registry);
        $this->validator = new GenerativeUiSpecValidator($registry, $normaliser);
    }

    public function test_unknown_components_actions_scripts_and_bad_pointers_are_rejected(): void
    {
        $spec = ['version'=>'1.1','authority'=>'presentation-only','surface'=>'mobile','root'=>'root','elements'=>['root'=>['type'=>'stack','props'=>[],'children'=>['bad']], 'bad'=>['type'=>'php-eval','props'=>['href'=>'javascript:alert(1)','token'=>['$state'=>'/~2bad']],'on'=>['click'=>['action'=>'root.shell']]]]];
        $result = $this->validator->validate($spec);
        self::assertFalse($result['valid']);
        self::assertGreaterThanOrEqual(4, count($result['issues']));
    }
}
