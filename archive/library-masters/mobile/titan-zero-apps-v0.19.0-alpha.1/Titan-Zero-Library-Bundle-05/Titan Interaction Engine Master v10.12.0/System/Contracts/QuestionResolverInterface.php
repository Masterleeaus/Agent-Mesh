<?php

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\Question;
use App\Extensions\InteractionEngine\System\DTO\Answer;

interface QuestionResolverInterface
{
    public function resolve(Question $question, array $context): Answer;
}
