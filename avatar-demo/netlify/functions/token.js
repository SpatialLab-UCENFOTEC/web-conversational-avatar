import { GoogleAuth } from "google-auth-library";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
    body: JSON.stringify({ ok: true }),
    };
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ access_token: tokenResponse.token }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: error.message }),
    };
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };
}