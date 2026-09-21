from collections import Counter
from dataclasses import dataclass
from math import exp, log
import re


TRAINING_EXAMPLES = {
    "equipment_status": (
        "check the equipment status",
        "show the latest telemetry",
        "what is happening with this machine",
        "why is this equipment reporting an alert",
        "help me troubleshoot this asset",
        "show the machine health",
    ),
    "create_case": (
        "create a service case",
        "open a service ticket",
        "send this problem to a technician",
        "make a high priority case",
        "report this equipment problem",
        "assign this issue to service",
    ),
    "fleet_summary": (
        "which machines need attention",
        "show critical equipment",
        "give me a fleet summary",
        "list equipment with problems",
        "what assets have warnings",
        "show unhealthy machines",
    ),
    "help": (
        "what can you do",
        "help me use the assistant",
        "show available commands",
        "how does this agent work",
        "what questions can I ask",
        "help",
    ),
}


@dataclass(frozen=True)
class IntentPrediction:
    intent: str
    confidence: float


def tokenize(message: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", message.lower())


class NaiveBayesIntentClassifier:
    def __init__(self, training_examples: dict[str, tuple[str, ...]]):
        self.intent_counts: Counter[str] = Counter()
        self.word_counts: dict[str, Counter[str]] = {}
        self.total_words: dict[str, int] = {}
        self.vocabulary: set[str] = set()

        for intent, examples in training_examples.items():
            word_count: Counter[str] = Counter()

            for example in examples:
                words = tokenize(example)
                word_count.update(words)
                self.vocabulary.update(words)

            self.intent_counts[intent] = len(examples)
            self.word_counts[intent] = word_count
            self.total_words[intent] = sum(word_count.values())

    def predict(self, message: str) -> IntentPrediction:
        words = tokenize(message)
        scores: dict[str, float] = {}

        total_examples = sum(self.intent_counts.values())
        intent_total = len(self.intent_counts)
        vocabulary_size = len(self.vocabulary)

        for intent, example_count in self.intent_counts.items():
            prior = (example_count + 1) / (
                total_examples + intent_total
            )
            score = log(prior)

            for word in words:
                word_frequency = self.word_counts[intent][word]
                likelihood = (word_frequency + 1) / (
                    self.total_words[intent] + vocabulary_size
                )
                score += log(likelihood)

            scores[intent] = score

        highest_score = max(scores.values())
        probabilities = {
            intent: exp(score - highest_score)
            for intent, score in scores.items()
        }
        probability_total = sum(probabilities.values())

        best_intent = max(probabilities, key=probabilities.get)
        confidence = probabilities[best_intent] / probability_total

        return IntentPrediction(
            intent=best_intent,
            confidence=round(confidence, 3),
        )


CLASSIFIER = NaiveBayesIntentClassifier(TRAINING_EXAMPLES)


def detect_intent(message: str) -> IntentPrediction:
    normalized_message = message.lower()

    create_case_phrases = (
        "create a case",
        "create a service case",
        "open a case",
        "open a ticket",
        "create a ticket",
    )

    if any(
        phrase in normalized_message
        for phrase in create_case_phrases
    ):
        return IntentPrediction("create_case", 0.98)

    if "ff-" in normalized_message and any(
        phrase in normalized_message
        for phrase in (
            "status",
            "telemetry",
            "troubleshoot",
            "what is happening",
            "what's happening",
            "alerts",
        )
    ):
        return IntentPrediction("equipment_status", 0.96)

    if any(
        phrase in normalized_message
        for phrase in (
            "fleet summary",
            "critical equipment",
            "machines need attention",
            "equipment with problems",
        )
    ):
        return IntentPrediction("fleet_summary", 0.95)

    if any(
        phrase in normalized_message
        for phrase in (
            "what can you do",
            "available commands",
            "help me",
        )
    ):
        return IntentPrediction("help", 0.94)

    return CLASSIFIER.predict(message)