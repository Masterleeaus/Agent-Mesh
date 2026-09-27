# Field & Home Services Vertical Packs

Titan Builder v0.8 preserves ten canonical configuration packs: cleaning, plumbing, electrical, hvac, handyman-property-maintenance, landscaping-gardening, pest-control, locksmith-security, roofing-guttering, and appliance-equipment-repair.

Each pack is presentation-only and now uses generic/CRM-era fields: `crm_capabilities`, `read_models`, `data_sources`, `action_intents`, `ui_hints` and terminology. The packs do not own services, booking rules, field requirements or business capabilities. CRM remains authoritative for those values.

Applying a vertical pack does not imply that every company has every feature in that vertical. `CrmVerticalContextProvider` checks the company's authoritative vertical and capabilities. Differences such as emergency-service availability come from CRM feature flags/capabilities, not from the vertical name alone.
