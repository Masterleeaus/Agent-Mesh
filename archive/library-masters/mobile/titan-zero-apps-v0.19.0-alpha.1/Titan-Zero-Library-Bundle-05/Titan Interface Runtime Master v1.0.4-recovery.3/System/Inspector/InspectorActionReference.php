<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Inspector;

use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;

final readonly class InspectorActionReference implements \JsonSerializable
{
    /** @param array<string,mixed> $intent */
    public function __construct(
        public string $actionKey,
        public string $label,
        public bool $mutating,
        public bool $requiresConfirmation,
        public string $offlineMode,
        public array $intent,
        public bool $executable = false,
    ) {
        if ($executable) throw new \InvalidArgumentException('Inspector action references may not be locally executable.');
    }

    public static function fromDescriptor(ActionDescriptor $action, string $objectRef): self
    {
        $intent=['kind'=>'reference','object_ref'=>$objectRef,'action_ref'=>$action->key];
        if ($action->interaction !== null) {
            $intent=['kind'=>'interaction','object_ref'=>$objectRef,'action_ref'=>$action->key,'interaction'=>$action->interaction];
        } elseif ($action->capabilityRef !== null) {
            $intent=['kind'=>'capability','object_ref'=>$objectRef,'action_ref'=>$action->key,'capability_ref'=>$action->capabilityRef];
        }
        return new self($action->key,$action->label,$action->mutating,$action->requiresConfirmation,$action->offlineMode,$intent,false);
    }

    public function jsonSerialize(): array
    {
        return [
            'action_key'=>$this->actionKey,
            'label'=>$this->label,
            'mutating'=>$this->mutating,
            'requires_confirmation'=>$this->requiresConfirmation,
            'offline_mode'=>$this->offlineMode,
            'intent'=>$this->intent,
            'executable'=>false,
        ];
    }
}
