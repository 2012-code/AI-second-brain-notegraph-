import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_PLAN_ID = process.env.PAYPAL_FOUNDER_PLAN_ID || ""; // Use Founder Plan
const APP_URL = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
  ? process.env.NEXT_PUBLIC_APP_URL.trim()
  : "https://notegraph.online";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PayPal API keys");
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accessToken = await getPayPalAccessToken();
    
    if (!PAYPAL_PLAN_ID) {
      console.error("[FOUNDER CHECKOUT] Missing PAYPAL_FOUNDER_PLAN_ID env var");
      return NextResponse.json({ error: "Configuration error: Missing Plan ID" }, { status: 500 });
    }

    const createSubRes = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID,
        custom_id: user.id,
        application_context: {
          brand_name: "NoteGraph",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${APP_URL}/settings?payment=success`,
          cancel_url: `${APP_URL}/settings?payment=cancelled`
        }
      })
    });

    const subscriptionData = await createSubRes.json();

    if (!createSubRes.ok) {
      console.error("[FOUNDER CHECKOUT] PayPal Error:", JSON.stringify(subscriptionData, null, 2));
      return NextResponse.json({ 
        error: `PayPal Error: ${subscriptionData.message || 'Failed to create subscription'}`,
        debug: subscriptionData
      }, { status: createSubRes.status });
    }

    const approvalLink = subscriptionData.links?.find((l: any) => l.rel === "approve");

    if (!approvalLink) {
      console.error("[FOUNDER CHECKOUT] No approval link in response:", subscriptionData);
      return NextResponse.json({ error: "No approval link found in PayPal response" }, { status: 500 });
    }

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: user.id,
      paypal_subscription_id: subscriptionData.id,
      paypal_plan_id: PAYPAL_PLAN_ID,
      status: "trialing",
    }, { onConflict: "user_id" });

    return NextResponse.json({ redirectUrl: approvalLink.href });
  } catch (error: any) {
    console.error("[FOUNDER CHECKOUT] Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
