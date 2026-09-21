import { useEffect, useState } from "react";
import {
    Bot,
    CheckCircle2,
    LoaderCircle,
    Send,
    ShieldCheck,
    X,
} from "lucide-react";

import {
    sendAgentMessage,
    type AgentChatResponse,
} from "../services/agentApi";

type ChatMessage = {
    id: string;
    role: "user" | "agent";
    text: string;
    response?: AgentChatResponse;
};

const starterMessage: ChatMessage = {
    id: "welcome",
    role: "agent",
    text:
        "Hello, I’m the FieldFlow Service Agent. I can inspect telemetry, " +
        "summarize fleet health, recommend troubleshooting steps, and create " +
        "service cases after receiving your confirmation.",
};

const examplePrompts = [
    "What is happening with FF-TR-3018?",
    "Which machines need attention?",
    "Create a service case for FF-RC-4025.",
];

export function ServiceAgentPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        starterMessage,
    ]);
    const [pendingRequest, setPendingRequest] =
        useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        function openAgent() {
            setIsOpen(true);
        }

        window.addEventListener("fieldflow:open-agent", openAgent);

        return () => {
            window.removeEventListener(
                "fieldflow:open-agent",
                openAgent,
            );
        };
    }, []);

    async function submitMessage(
        message: string,
        confirmAction = false,
    ) {
        const cleanedMessage = message.trim();

        if (!cleanedMessage || isSending) {
            return;
        }

        setError(null);
        setIsSending(true);

        const userText = confirmAction
            ? "Confirm service case creation"
            : cleanedMessage;

        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: crypto.randomUUID(),
                role: "user",
                text: userText,
            },
        ]);

        if (!confirmAction) {
            setInput("");
        }

        try {
            const response = await sendAgentMessage(
                cleanedMessage,
                confirmAction,
            );

            setMessages((currentMessages) => [
                ...currentMessages,
                {
                    id: crypto.randomUUID(),
                    role: "agent",
                    text: response.reply,
                    response,
                },
            ]);

            if (response.requires_confirmation) {
                setPendingRequest(cleanedMessage);
            } else {
                setPendingRequest(null);
            }

            if (response.action_status === "service_case_created") {
                window.dispatchEvent(
                    new Event("fieldflow:service-case-created"),
                );
            }
        } catch {
            setError(
                "The Service Agent is unavailable. Confirm that the API is running.",
            );
        } finally {
            setIsSending(false);
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void submitMessage(input);
    }

    return (
        <>
            <button
                aria-label="Open Service Agent"
                className="agent-launcher"
                onClick={() => setIsOpen(true)}
                type="button"
            >
                <Bot size={22} />
                <span>Service Agent</span>
            </button>

            {isOpen && (
                <aside className="agent-panel">
                    <header className="agent-header">
                        <div className="agent-header-identity">
                            <span>
                                <Bot size={20} />
                            </span>

                            <div>
                                <strong>FieldFlow Service Agent</strong>
                                <small>
                                    <i />
                                    Online · Grounded enterprise assistant
                                </small>
                            </div>
                        </div>

                        <button
                            aria-label="Close Service Agent"
                            onClick={() => setIsOpen(false)}
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    </header>

                    <div className="agent-governance">
                        <ShieldCheck size={15} />
                        Human approval is required before creating cases.
                    </div>

                    <div className="agent-messages">
                        {messages.map((message) => (
                            <div
                                className={`agent-message ${message.role}`}
                                key={message.id}
                            >
                                <div className="agent-message-bubble">
                                    <p>{message.text}</p>

                                    {message.response && (
                                        <div className="agent-evidence">
                                            <span>
                                                Intent: {message.response.intent}
                                            </span>
                                            <span>
                                                Confidence:{" "}
                                                {Math.round(
                                                    message.response.confidence * 100,
                                                )}
                                                %
                                            </span>

                                            {message.response.service_case_id && (
                                                <span>
                                                    Case: {message.response.service_case_id}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {message.response &&
                                        message.response.recommended_actions.length > 0 && (
                                            <div className="agent-recommendations">
                                                <strong>Recommended actions</strong>

                                                {message.response.recommended_actions.map(
                                                    (action) => (
                                                        <span key={action}>
                                                            <CheckCircle2 size={13} />
                                                            {action}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                    {message.response &&
                                        message.response.sources.length > 0 && (
                                            <details className="agent-sources">
                                                <summary>
                                                    {message.response.sources.length} sources
                                                </summary>

                                                {message.response.sources.map((source) => (
                                                    <span key={source}>{source}</span>
                                                ))}
                                            </details>
                                        )}
                                </div>
                            </div>
                        ))}

                        {isSending && (
                            <div className="agent-message agent">
                                <div className="agent-message-bubble agent-thinking">
                                    <LoaderCircle className="spinning" size={15} />
                                    Inspecting FieldFlow data…
                                </div>
                            </div>
                        )}
                    </div>

                    {messages.length === 1 && (
                        <div className="agent-prompts">
                            {examplePrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => void submitMessage(prompt)}
                                    type="button"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    {pendingRequest && (
                        <div className="agent-confirmation">
                            <div>
                                <ShieldCheck size={16} />
                                <span>
                                    Review the proposed action before approving it.
                                </span>
                            </div>

                            <div>
                                <button
                                    className="confirmation-cancel"
                                    onClick={() => setPendingRequest(null)}
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    className="confirmation-approve"
                                    disabled={isSending}
                                    onClick={() =>
                                        void submitMessage(pendingRequest, true)
                                    }
                                    type="button"
                                >
                                    Confirm action
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <p className="agent-error">{error}</p>}

                    <form className="agent-input" onSubmit={handleSubmit}>
                        <input
                            aria-label="Message the Service Agent"
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask about equipment or service cases…"
                            value={input}
                        />

                        <button
                            aria-label="Send message"
                            disabled={!input.trim() || isSending}
                            type="submit"
                        >
                            <Send size={17} />
                        </button>
                    </form>
                </aside>
            )}
        </>
    );
}