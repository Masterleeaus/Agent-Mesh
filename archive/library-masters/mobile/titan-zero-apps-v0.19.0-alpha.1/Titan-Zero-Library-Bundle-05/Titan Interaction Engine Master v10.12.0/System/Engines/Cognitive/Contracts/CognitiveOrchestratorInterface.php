<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface CognitiveOrchestratorInterface
{
    public function getSemantic(): SemanticEngineInterface;
    public function getReasoning(): ReasoningEngineInterface;
    public function getInference(): InferenceEngineInterface;
    public function getReflection(): ReflectionEngineInterface;
    public function getExplainability(): ExplainabilityEngineInterface;
    public function getAbstraction(): AbstractionEngineInterface;
    public function getConcept(): ConceptEngineInterface;
    public function getAnalogy(): AnalogyEngineInterface;
    public function getCreativity(): CreativityEngineInterface;
}
