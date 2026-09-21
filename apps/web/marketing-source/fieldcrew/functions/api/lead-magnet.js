/**
 * Cloudflare Pages Function — POST /api/lead-magnet
 *
 * Receives checklist form submissions and creates a HubSpot contact.
 * This form only collects name and email, so SMS consent is not needed here.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { name, email } = body;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Name and a valid email are required" }, 400);
  }

  const [firstname, ...rest] = name.trim().split(/\s+/);
  const lastname = rest.join(" ");

  const hsPayload = {
    properties: {
      firstname: firstname || name.trim(),
      lastname,
      email: email.trim(),
      hs_lead_status: "NEW",
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

    if (!hsRes.ok && hsRes.status !== 409) {
      console.error("HubSpot error:", JSON.stringify(hubspotResult));
      return jsonResponse({ error: "Failed to save checklist lead" }, 502);
    }
  } catch (err) {
    console.error("HubSpot fetch failed:", err);
    return jsonResponse({ error: "Failed to reach CRM" }, 502);
  }

  return jsonResponse({ success: true, hubspot_id: hubspotResult?.id ?? null });
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
