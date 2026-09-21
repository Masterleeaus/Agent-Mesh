-- ResQAI V2 Migration 001
-- Date:    2026-06-29
-- Purpose: Create reference_data_v2 lookup table with seed data
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create reference_data_v2 table
-- ============================================================
-- lemma table create reference_data_v2 \
--   id:UUID --pk \
--   type:TEXT \
--   code:TEXT \
--   label:TEXT \
--   description:TEXT \
--   sort_order:INTEGER \
--   is_active:BOOLEAN \
--   created_at:TIMESTAMPTZ \
--   updated_at:TIMESTAMPTZ

-- ============================================================
-- Step 2: Add indexes and constraints
-- ============================================================
-- lemma table add-index reference_data_v2 idx_refdata_type_code --using btree --fields type,code
-- lemma table add-index reference_data_v2 idx_refdata_type_sort --using btree --fields type,sort_order
-- lemma table add-index reference_data_v2 idx_refdata_is_active --using btree --fields is_active
-- lemma table add-unique reference_data_v2 uq_refdata_type_code --fields type,code

-- Verify: lemma table describe reference_data_v2
-- Verify: lemma table indexes reference_data_v2
-- Expected: idx_refdata_type_code, idx_refdata_type_sort, idx_refdata_is_active
-- Expected: uq_refdata_type_code (unique on type + code)

-- ============================================================
-- Step 3: Seed type: service_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "service_type", "code": "repair", "label": "Repair", "description": "Equipment or appliance repair", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "service_type", "code": "installation", "label": "Installation", "description": "New equipment installation", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "service_type", "code": "maintenance", "label": "Maintenance", "description": "Routine preventive maintenance", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "service_type", "code": "inspection", "label": "Inspection", "description": "Site or equipment inspection", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "service_type", "code": "consultation", "label": "Consultation", "description": "Expert consultation", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 4: Seed type: ticket_channel
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "email", "label": "Email", "description": "Email ticket", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "chat", "label": "Chat", "description": "Live chat", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "sms", "label": "SMS", "description": "Text message", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "phone", "label": "Phone", "description": "Phone call", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "web", "label": "Web Portal", "description": "Web self-service portal", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "social", "label": "Social Media", "description": "Social media platform", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_channel", "code": "api", "label": "API", "description": "Third-party API integration", "sort_order": 7, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 5: Seed type: ticket_request_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "new_booking", "label": "New Booking", "description": "Request for new service booking", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "reschedule", "label": "Reschedule", "description": "Reschedule existing appointment", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "cancellation", "label": "Cancellation", "description": "Cancel existing appointment", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "complaint", "label": "Complaint", "description": "Customer complaint", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "follow_up", "label": "Follow Up", "description": "Follow-up on previous service", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "general_inquiry", "label": "General Inquiry", "description": "General question or information request", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_request_type", "code": "billing", "label": "Billing", "description": "Billing or invoice question", "sort_order": 7, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 6: Seed type: dispute_resolution_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispute_resolution_type", "code": "refund", "label": "Refund", "description": "Issue full or partial refund", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispute_resolution_type", "code": "rework", "label": "Rework", "description": "Redo service at no charge", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispute_resolution_type", "code": "credit", "label": "Credit", "description": "Apply account credit", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispute_resolution_type", "code": "escalation", "label": "Escalation", "description": "Escalate to management", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispute_resolution_type", "code": "dismissed", "label": "Dismissed", "description": "Dispute dismissed as invalid", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 7: Seed type: followup_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_type", "code": "post_service", "label": "Post-Service Check", "description": "Follow-up after service completion", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_type", "code": "feedback", "label": "Feedback Request", "description": "Request customer feedback", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_type", "code": "quality", "label": "Quality Assurance", "description": "QA follow-up call", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_type", "code": "reminder", "label": "Reminder", "description": "Appointment or payment reminder", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_type", "code": "reengagement", "label": "Re-Engagement", "description": "Win-back lapsed customer", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 8: Seed type: inventory_category
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "inventory_category", "code": "parts", "label": "Parts", "description": "Replacement parts inventory", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "inventory_category", "code": "tools", "label": "Tools", "description": "Tools and equipment", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "inventory_category", "code": "consumables", "label": "Consumables", "description": "Disposable supplies", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "inventory_category", "code": "ppe", "label": "PPE", "description": "Personal protective equipment", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 9: Seed type: notification_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "ticket_assigned", "label": "Ticket Assigned", "description": "New ticket assignment notification", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "status_change", "label": "Status Change", "description": "Ticket status updated", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "appointment_reminder", "label": "Appointment Reminder", "description": "Upcoming appointment reminder", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "dispute_update", "label": "Dispute Update", "description": "Dispute resolution progress", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "followup_due", "label": "Follow-Up Due", "description": "Follow-up action is due", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_type", "code": "system_alert", "label": "System Alert", "description": "System or infrastructure alert", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 10: Seed type: work_order_stage
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "scheduled", "label": "Scheduled", "description": "Work order has been scheduled", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "dispatched", "label": "Dispatched", "description": "Technician dispatched to site", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "in_progress", "label": "In Progress", "description": "Work is being performed", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "completed", "label": "Completed", "description": "Work completed successfully", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "cancelled", "label": "Cancelled", "description": "Work order cancelled", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "work_order_stage", "code": "on_hold", "label": "On Hold", "description": "Work order paused awaiting input", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 11: Seed type: customer_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "customer_type", "code": "residential", "label": "Residential", "description": "Homeowner or residential customer", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "customer_type", "code": "commercial", "label": "Commercial", "description": "Business or commercial entity", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "customer_type", "code": "industrial", "label": "Industrial", "description": "Industrial or manufacturing facility", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "customer_type", "code": "government", "label": "Government", "description": "Government or public sector", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "customer_type", "code": "property_manager", "label": "Property Manager", "description": "Property management company", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 12: Seed type: skill_name
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "hvac", "label": "HVAC", "description": "Heating, ventilation, and air conditioning", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "plumbing", "label": "Plumbing", "description": "Plumbing systems and fixtures", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "electrical", "label": "Electrical", "description": "Electrical systems and wiring", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "appliance", "label": "Appliance Repair", "description": "Major appliance repair", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "carpentry", "label": "Carpentry", "description": "Woodworking and structural repairs", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "skill_name", "code": "general", "label": "General Handyman", "description": "General maintenance and repairs", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 13: Seed type: evidence_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "evidence_type", "code": "photo", "label": "Photo", "description": "Photographic evidence", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "evidence_type", "code": "video", "label": "Video", "description": "Video recording", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "evidence_type", "code": "document", "label": "Document", "description": "PDF or document file", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "evidence_type", "code": "audio", "label": "Audio", "description": "Audio recording", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "evidence_type", "code": "signature", "label": "Signature", "description": "Digital signature capture", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 14: Seed type: feedback_source
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "feedback_source", "code": "survey", "label": "Survey", "description": "Post-service satisfaction survey", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "feedback_source", "code": "email", "label": "Email", "description": "Direct email feedback", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "feedback_source", "code": "phone", "label": "Phone", "description": "Phone call feedback", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "feedback_source", "code": "social", "label": "Social Media", "description": "Social media review or comment", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "feedback_source", "code": "app", "label": "Mobile App", "description": "In-app rating and review", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 15: Seed type: dispatch_type
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_type", "code": "scheduled", "label": "Scheduled", "description": "Pre-scheduled dispatch", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_type", "code": "emergency", "label": "Emergency", "description": "Urgent emergency dispatch", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_type", "code": "same_day", "label": "Same Day", "description": "Same-day service dispatch", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_type", "code": "next_day", "label": "Next Day", "description": "Next-day service dispatch", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 16: Seed type: appointment_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "pending", "label": "Pending", "description": "Awaiting confirmation", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "confirmed", "label": "Confirmed", "description": "Appointment confirmed", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "en_route", "label": "En Route", "description": "Technician en route", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "in_progress", "label": "In Progress", "description": "Service in progress", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "completed", "label": "Completed", "description": "Service completed", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "cancelled", "label": "Cancelled", "description": "Appointment cancelled", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "appointment_status", "code": "no_show", "label": "No Show", "description": "Customer did not show", "sort_order": 7, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 17: Seed type: ticket_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "new", "label": "New", "description": "Newly created ticket", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "classified", "label": "Classified", "description": "Ticket categorized and routed", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "drafted", "label": "Drafted", "description": "Response draft created", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "approved_to_send", "label": "Approved to Send", "description": "Draft approved for sending", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "sent", "label": "Sent", "description": "Response sent to customer", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "ticket_status", "code": "closed", "label": "Closed", "description": "Ticket resolved and closed", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 18: Seed type: followup_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_status", "code": "pending", "label": "Pending", "description": "Follow-up action pending", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_status", "code": "in_progress", "label": "In Progress", "description": "Follow-up in progress", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_status", "code": "completed", "label": "Completed", "description": "Follow-up completed", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_status", "code": "overdue", "label": "Overdue", "description": "Follow-up past due date", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "followup_status", "code": "cancelled", "label": "Cancelled", "description": "Follow-up cancelled", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 19: Seed type: task_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "task_status", "code": "todo", "label": "To Do", "description": "Task not yet started", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "task_status", "code": "in_progress", "label": "In Progress", "description": "Task is being worked on", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "task_status", "code": "done", "label": "Done", "description": "Task completed", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "task_status", "code": "blocked", "label": "Blocked", "description": "Task is blocked by dependency", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "task_status", "code": "cancelled", "label": "Cancelled", "description": "Task cancelled", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 20: Seed type: notification_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_status", "code": "pending", "label": "Pending", "description": "Awaiting delivery", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_status", "code": "sent", "label": "Sent", "description": "Successfully delivered", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_status", "code": "failed", "label": "Failed", "description": "Delivery failed", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_status", "code": "read", "label": "Read", "description": "Notification read by recipient", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "notification_status", "code": "cancelled", "label": "Cancelled", "description": "Notification cancelled before send", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- ============================================================
-- Step 21: Seed type: dispatch_status
-- ============================================================
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "pending", "label": "Pending", "description": "Dispatch request pending", "sort_order": 1, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "assigned", "label": "Assigned", "description": "Technician assigned", "sort_order": 2, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "accepted", "label": "Accepted", "description": "Technician accepted dispatch", "sort_order": 3, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "en_route", "label": "En Route", "description": "Technician traveling to site", "sort_order": 4, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "on_site", "label": "On Site", "description": "Technician arrived at site", "sort_order": 5, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "completed", "label": "Completed", "description": "Dispatch completed", "sort_order": 6, "is_active": true, "created_at": "now()", "updated_at": "now()" }'
-- lemma table insert reference_data_v2 '{ "id": "gen_random_uuid()", "type": "dispatch_status", "code": "cancelled", "label": "Cancelled", "description": "Dispatch cancelled", "sort_order": 7, "is_active": true, "created_at": "now()", "updated_at": "now()" }'

-- Verify: lemma table count reference_data_v2
-- Expected: total rows across all types
-- Verify: lemma table query reference_data_v2 --filter 'type = "service_type"'
-- Expected: 5 rows
-- Verify: lemma table query reference_data_v2 --filter 'type = "ticket_status"'
-- Expected: 6 rows
-- Verify: lemma table query reference_data_v2 --filter 'type = "dispatch_status"'
-- Expected: 7 rows
