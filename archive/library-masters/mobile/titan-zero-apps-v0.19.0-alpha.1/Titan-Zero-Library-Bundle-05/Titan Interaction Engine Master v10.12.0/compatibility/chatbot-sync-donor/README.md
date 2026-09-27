# Legacy Chatbot Sync Donor

These files were found inside the Interaction Engine package under `System/` but declare
`App\Extensions\Chatbot` namespaces. They are not referenced by the Interaction Engine
service provider or active routes and are therefore not part of the active Interaction Engine runtime.

They are retained here only as explicit backward-compatibility / migration evidence.
Their historical `tenant_id` fields are not a Titan Apps tenant boundary. Canonical runtime
isolation is `company_id` only.
