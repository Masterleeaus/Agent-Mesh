# Titan Go Upgrade Pass 7 — Company ID Boundary

Version: 1.6.0

Titan Go already used `company_id` as its application scope. This pass adds explicit regression protection so Go offline envelopes never emit a second tenant boundary and legacy tenant keys cannot enter audit context as independent authority metadata.
