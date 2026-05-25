import { GoogleAuth } from "google-auth-library";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
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
      headers: corsHeaders,
      body: JSON.stringify({
        access_token: tokenResponse.token,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
}