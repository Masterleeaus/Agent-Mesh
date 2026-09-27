# Adaptive Generative UI Integration

Version: 6.6

This extension renders validated, presentation-only JSON UI specifications inside customer chat, staff inbox and the chatbot builder preview.

## User triggers

- `/ui show today’s cleaning jobs`
- `/canvas build a scheduling workspace`
- Natural requests such as “show me an invoice form” when enabled.

## Safety boundary

- AI output is never rendered as arbitrary HTML, Blade or JavaScript.
- Components and action intents must be registered in `resources/builder/manifest.json`.
- Actions dispatch `titan-generative-ui-action` and `chatbot:generative-ui-intent`; the renderer does not execute operational commands.
- Generated UI state is message-scoped local presentation state.

## Builder lab

`/dashboard/chatbot/generative-ui`

## Published assets

- `public/vendor/chatbot/js/titan-generative-ui.js`
- `public/vendor/chatbot/css/titan-generative-ui.css`
- `public/chatbot-pwa/generative-ui-state.js`
