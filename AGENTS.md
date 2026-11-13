# HubSpot module fields

- Never use `label` or `name` as a field identifier (the value of a field's `name` property). Use descriptive identifiers such as `platform_title`, `full_name`, or `button_text`.
- HubSpot schema properties named `name` and `label` are required metadata and must remain unchanged.
- When renaming a field, update HubL references, repeater sorting paths, group/repeater defaults, and template overrides together.
