// ─── PayPal Live Plan Creator (with 7-day free trial) ─────────────────────
// Run: node create-paypal-plan.js

const https = require('https');

const CLIENT_ID     = 'AVOyWiRQqWHqgy94P4o-V-xuvVam-18kNrTaCk6ZXjaUGaAb-tSNgVj6J0iMoPtyzj9eUBa3VVo2ivSX';
const CLIENT_SECRET = 'EPQIuTBkK-W3IWO7Pv8gML_0VY264xEFIIKRW_P7O4vSw17J-vYueYo7IfZBik8eMb4qqr7MmJUdyHLm';

// ── Change these as needed ────────────────────────────────────────────────────
const PRODUCT_NAME  = 'NoteGraph Pro';
const PLAN_NAME     = 'NoteGraph Pro Monthly (7-day trial)';
const PRICE         = '9.99';   // USD per month
const CURRENCY      = 'USD';
// ─────────────────────────────────────────────────────────────────────────────

function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type':  'application/json',
      'Authorization': token
        ? `Bearer ${token}`
        : `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    };
    if (!token) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const payload = token ? JSON.stringify(body) : body;
    headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request({ hostname: 'api-m.paypal.com', path, method, headers }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting PayPal Live access token...');
  const auth = await request('/v1/oauth2/token', 'POST', 'grant_type=client_credentials', null);
  if (!auth.access_token) {
    console.error('❌ Failed to get token:', JSON.stringify(auth, null, 2));
    process.exit(1);
  }
  const token = auth.access_token;
  console.log('✅ Token obtained\n');

  console.log('📦 Creating Product...');
  const product = await request('/v1/catalogs/products', 'POST', {
    name: PRODUCT_NAME,
    type: 'SERVICE',
    category: 'SOFTWARE',
  }, token);
  if (!product.id) {
    console.error('❌ Failed to create product:', JSON.stringify(product, null, 2));
    process.exit(1);
  }
  console.log(`✅ Product created: ${product.id}\n`);

  console.log('📋 Creating Billing Plan with 7-day free trial...');
  const plan = await request('/v1/billing/plans', 'POST', {
    product_id: product.id,
    name: PLAN_NAME,
    status: 'ACTIVE',
    billing_cycles: [
      // ── Cycle 1: 7-day free trial ──────────────────────────────────────
      {
        frequency: { interval_unit: 'DAY', interval_count: 7 },
        tenure_type: 'TRIAL',
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: { fixed_price: { value: '0', currency_code: CURRENCY } },
      },
      // ── Cycle 2: Regular monthly billing after trial ───────────────────
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 2,
        total_cycles: 0, // 0 = infinite
        pricing_scheme: { fixed_price: { value: PRICE, currency_code: CURRENCY } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  }, token);

  if (!plan.id) {
    console.error('❌ Failed to create plan:', JSON.stringify(plan, null, 2));
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     ✅ PLAN CREATED WITH 7-DAY FREE TRIAL         ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  PAYPAL_PLAN_ID = ${plan.id.padEnd(28)} ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\nUpdate this in Vercel environment variables:');
  console.log(`PAYPAL_PLAN_ID=${plan.id}`);
}

main().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
