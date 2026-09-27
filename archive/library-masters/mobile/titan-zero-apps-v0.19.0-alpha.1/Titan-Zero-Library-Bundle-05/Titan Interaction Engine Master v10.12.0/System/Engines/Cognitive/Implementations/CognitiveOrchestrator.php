<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\CognitiveOrchestratorInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\SemanticEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReasoningEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\InferenceEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReflectionEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ExplainabilityEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AbstractionEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ConceptEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AnalogyEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\CreativityEngineInterface;

class CognitiveOrchestrator implements CognitiveOrchestratorInterface
{
    public function __construct(
        private SemanticEngineInterface $semantic,
        private ReasoningEngineInterface $reasoning,
        private InferenceEngineInterface $inference,
        private ReflectionEngineInterface $reflection,
        private ExplainabilityEngineInterface $explainability,
        private AbstractionEngineInterface $abstraction,
        private ConceptEngineInterface $concept,
        private AnalogyEngineInterface $analogy,
        private CreativityEngineInterface $creativity
    ) {}

    public function getSemantic(): SemanticEngineInterface { return $this->semantic; }
    public function getReasoning(): ReasoningEngineInterface { return $this->reasoning; }
    public function getInference(): InferenceEngineInterface { return $this->inference; }
    public function getReflection(): ReflectionEngineInterface { return $this->reflection; }
    public function getExplainability(): ExplainabilityEngineInterface { return $this->explainability; }
    public function getAbstraction(): AbstractionEngineInterface { return $this->abstraction; }
    public function getConcept(): ConceptEngineInterface { return $this->concept; }
    public function getAnalogy(): AnalogyEngineInterface { return $this->analogy; }
    public function getCreativity(): CreativityEngineInterface { return $this->creativity; }
}
