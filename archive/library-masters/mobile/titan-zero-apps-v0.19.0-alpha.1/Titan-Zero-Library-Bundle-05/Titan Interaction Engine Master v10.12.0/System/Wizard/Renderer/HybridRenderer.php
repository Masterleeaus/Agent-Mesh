<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Wizard\Renderer;
use App\Extensions\InteractionEngine\System\Presentation\GeneratedUiPresenter;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;
final class HybridRenderer implements WizardRendererInterface
{
    public function __construct(private readonly ArrayRenderer$arrayRenderer=new ArrayRenderer(),private readonly ConversationalRenderer$conversationalRenderer=new ConversationalRenderer(),private readonly ?GeneratedUiPresenter$presenter=null){}
    public function render(WizardSession$session):array{return['message'=>$this->conversationalRenderer->render($session),'view_model'=>$this->arrayRenderer->render($session),'interaction'=>$this->presenter?->present($session)??(new GeneratedUiPresenter())->present($session)];}
}
