# Page Generation Prompt

Create a Titan Zero page definition for the requested business and surface.

Return:

- `id`, `name`, `surface`, `theme`, `mock_data`, `description`
- an ordered `sections` array
- one registered `block` and `renderer` per section
- declarative `intent` values only from the manifest allow-list
- concise copy suitable for Australian service businesses

Do not create migrations, models, controllers, payments, inventory transactions or operational business logic.
