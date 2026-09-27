<?php
declare(strict_types=1);
namespace App\Extensions\TitanGo\System\Contracts;
interface GoRuntimeBridgeInterface{public function appSurface():string;public function interactionContract():string;public function interfaceRuntimeContract():string;public function visualRuntimeContract():string;public function builderContract():string;}
