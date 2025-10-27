const PAYPAL_ENV = (process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox');
const PAYPAL_BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? '';

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Falta PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env');
  }
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`Token PayPal falló: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

export async function createOrder({ amount, currency = 'EUR', customId, description, noShipping = true }) {
  const access = await getAccessToken();
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: { currency_code: currency, value: amount.toFixed(2) },
        custom_id: customId?.toString(),
        description: description || undefined
      }
    ],
    application_context: {
      brand_name: 'YogurExpress',
      user_action: 'PAY_NOW',
      shipping_preference: noShipping ? 'NO_SHIPPING' : 'GET_FROM_FILE'
    }
  };
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Create order falló: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function captureOrder(orderId) {
  const access = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Capture falló: ${res.status} ${await res.text()}`);
  return res.json();
}
