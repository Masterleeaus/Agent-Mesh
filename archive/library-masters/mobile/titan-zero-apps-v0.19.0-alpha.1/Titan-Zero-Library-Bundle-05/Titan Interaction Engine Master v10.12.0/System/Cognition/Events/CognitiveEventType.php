<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Events;

enum CognitiveEventType: string
{
    case ObservationRecorded = 'observation_recorded';
    case IntentInferred = 'intent_inferred';
    case CandidateGenerated = 'candidate_generated';
    case ConstraintRejected = 'constraint_rejected';
    case RecommendationCreated = 'recommendation_created';
    case ClarificationRequested = 'clarification_requested';
    case UserCorrected = 'user_corrected';
    case UserApproved = 'user_approved';
    case UserRejected = 'user_rejected';
    case CommandPrepared = 'command_prepared';
    case CommandExecuted = 'command_executed';
    case CommandFailed = 'command_failed';
    case OutcomeObserved = 'outcome_observed';
    case PredictionScored = 'prediction_scored';
    case MemoryCreated = 'memory_created';
    case MemoryDisputed = 'memory_disputed';
    case ModelUpdated = 'model_updated';
}
