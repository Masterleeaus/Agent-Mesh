<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface VisualContribution
{
    public function id(): string;
    public function metadata(): array;
}
