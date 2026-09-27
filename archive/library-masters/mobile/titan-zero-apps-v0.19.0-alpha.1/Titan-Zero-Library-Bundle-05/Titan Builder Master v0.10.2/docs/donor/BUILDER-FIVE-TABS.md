# Chatbot Builder Five-Tab Reorganisation

This pass keeps the extension's original Blade, Alpine, component, route, model and persistence structure intact.

## Tabs

1. Identity — Titan app template, chatbot identity, instructions, prompts and language.
2. Knowledge — existing website, PDF, text and Q&A training UI.
3. Capabilities — existing human-agent, review, voice-call, booking, ecommerce and channel controls.
4. Experience — existing branding, avatar, colours, backgrounds, welcome-screen, links and widget controls.
5. Operations — existing trusted-domain, testing, embed-size and embed-code controls.

## Structural changes

- Existing capability partials were moved from Identity to Capabilities rather than duplicated.
- Capabilities is always present, even when no social channel extension is installed.
- Existing channel cards and channel table remain conditional on installed channel extensions.
- Existing chatbot update handling now saves changes when leaving Capabilities.
- Existing file layout, components and data model were retained.
