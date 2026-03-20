import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Utility to get a PayPal Bearer Token using the Client ID & Secret
 */
async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PayPal API keys in environment variables");
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
  if (!response.ok) {
    console.error("PayPal Auth Error:", data);
    throw new Error("Failed to authenticate with PayPal");
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!PAYPAL_PLAN_ID) {
      return NextResponse.json({ error: "Missing PayPal Plan ID" }, { status: 500 });
    }

    // 2. Obtain PayPal Access Token
    const accessToken = await getPayPalAccessToken();

    // 3. Create Subscription via PayPal API
    const createSubRes = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID,
        custom_id: user.id, // Store Supabase user.id in custom_id to tie it to the webhook later
        application_context: {
          brand_name: "Cerebro Premium",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
          },
          return_url: `${APP_URL}/settings?payment=success`,
          cancel_url: `${APP_URL}/settings?payment=cancelled`
        }
      })
    });

    const subscriptionData = await createSubRes.json();

    if (!createSubRes.ok) {
      console.error("PayPal Create Subscription Error:", subscriptionData);
      const paypalError = subscriptionData?.message || subscriptionData?.error_description || JSON.stringify(subscriptionData);
      return NextResponse.json({ error: `PayPal error: ${paypalError}` }, { status: 500 });
    }

    // 4. Extract the Approval URL
    // This is the URL where the user actually logs into PayPal to approve the payment manually
    const approvalLink = subscriptionData.links.find((link: any) => link.rel === "approve");

    if (!approvalLink) {
      return NextResponse.json({ error: "No approval URL found in PayPal response" }, { status: 500 });
    }

    // 5. Pre-register the ID in the database as 'trialing' or pending, matching the user
    // (The webhook will flip it to 'active' later)
    await supabaseAdmin.from("subscriptions").upsert({
      user_id: user.id,
      paypal_subscription_id: subscriptionData.id,
      paypal_plan_id: PAYPAL_PLAN_ID,
      status: "trialing",
    }, { onConflict: "user_id" });

    // Return the URL for the frontend to perform window.location.href = redirectUrl
    return NextResponse.json({ 
      subscriptionId: subscriptionData.id,
      redirectUrl: approvalLink.href 
    });

  } catch (error: any) {
    console.error("Setup PayPal Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
