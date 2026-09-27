# Titan Chatbot UI Pass 4 — Builder and Live Preview

This pass adds a persisted template-aware builder configuration to `ext_chatbots`, including:

- Titan app selection for all 14 template schemas
- Primary navigation editing and ordering
- Hamburger drawer editing and ordering
- Default screen selection
- Gear settings policy
- Home widget selection
- Device, role, theme and online/offline/conflict preview controls
- Main, drawer and settings preview surfaces
- Server-side request validation
- JSON persistence through `shell_builder_config`

## Database

Run `php artisan migrate` to add `titan_template` and `shell_builder_config`.

## Asset

The runtime is supplied at `public/vendor/chatbot/js/titan-shell-builder.js`; source is retained at `resources/js/titan-shell-builder.js`.
