/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Receives contact form submissions, creates a HubSpot contact,
 * and fires a webhook to the Claude agent (pinned — enable when ready).
 *
 * Secrets (set via Cloudflare dashboard or `wrangler secret put`):
 *   HUBSPOT_ACCESS_TOKEN
 *   CLAUDE_WEBHOOK_URL   (pin: set when agent is wired up)
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // --- Parse body ---
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { name, email, phone, trade, message } = body;

  if (!name || !email || !phone) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const [firstname, ...rest] = name.trim().split(" ");
  const lastname = rest.join(" ") || "";

  // --- HubSpot: create or update contact ---
  const hsPayload = {
    properties: {
      firstname,
      lastname,
      email,
      phone,
      hs_lead_status: "NEW",
      // Map trade to a custom HubSpot property if you create one later
      // trade_type: trade,
      message__c: message || "",
      lead_source: "fieldcrewai.com contact form",
    },
  };

  let hubspotResult;
  try {
    const hsRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hsPayload),
    });

    hubspotResult = await hsRes.json();

    if (!hsRes.ok) {
      // 409 = contact already exists — not a hard failure
      if (hsRes.status !== 409) {
        console.error("HubSpot error:", JSON.stringify(hubspotResult));
        return jsonResponse({ error: "Failed to save contact" }, 502);
      }
    }
  } catch (err) {
    console.error("HubSpot fetch failed:", err);
    return jsonResponse({ error: "Failed to reach CRM" }, 502);
  }

  // --- Claude agent webhook (PINNED — uncomment when agent is ready) ---
  /*
  if (env.CLAUDE_WEBHOOK_URL) {
    const agentPayload = {
      trigger: "new_lead",
      lead: { name, email, phone, trade, message },
      hubspot_id: hubspotResult?.id ?? null,
      received_at: new Date().toISOString(),
    };
    try {
      await fetch(env.CLAUDE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentPayload),
      });
    } catch (err) {
      // Non-fatal — log and continue
      console.error("Claude webhook failed:", err);
    }
  }
  */

  return jsonResponse({ success: true });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://fieldcrewai.com",
    },
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://fieldcrewai.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
