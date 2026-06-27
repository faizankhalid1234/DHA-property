/**
 * End-to-end sale flow smoke test against local API.
 * Run: node scripts/test-sale-flow.js
 */
const API = 'http://localhost:5000/api';
const ts = Date.now();
const cnicSuffix = String(ts).slice(-7);
const makeCnic = (n) => `42101-${String(n).padStart(7, '0')}-1`;

const post = async (path, body, token) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const get = async (path, token) => {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const run = async () => {
  console.log('1. Admin login...');
  const adminLogin = await post('/auth/login', { email: 'admin@dha.com', password: 'Admin@123' });
  assert(adminLogin.data.success, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  const adminToken = adminLogin.data.data.token;

  const sellerEmail = `seller${ts}@test.com`;
  const buyerEmail = `buyer${ts}@test.com`;

  console.log('2. Create seller customer...');
  const sellerRes = await post(
    '/customers',
    {
      fullName: 'Test Seller',
      fatherName: 'Father S',
      cnic: makeCnic(cnicSuffix),
      phone: `0300${String(ts).slice(-7)}`,
      email: sellerEmail,
      address: 'DHA Karachi',
    },
    adminToken
  );
  assert(sellerRes.status === 201, `Create seller failed: ${JSON.stringify(sellerRes.data)}`);
  const sellerId = sellerRes.data.data._id;
  const sellerPhone = sellerRes.data.data.phone;

  console.log('3. Create buyer customer...');
  const buyerRes = await post(
    '/customers',
    {
      fullName: 'Test Buyer',
      fatherName: 'Father B',
      cnic: makeCnic(Number(cnicSuffix) + 1),
      phone: `0301${String(ts).slice(-7)}`,
      email: buyerEmail,
      address: 'DHA Karachi',
    },
    adminToken
  );
  assert(buyerRes.status === 201, `Create buyer failed: ${JSON.stringify(buyerRes.data)}`);
  const buyerPhone = buyerRes.data.data.phone;

  console.log('4. Seller registers account...');
  const sellerReg = await post('/auth/customer-register', {
    fullName: 'Test Seller',
    fatherName: 'Father S',
    cnic: makeCnic(cnicSuffix),
    phone: sellerPhone,
    email: sellerEmail,
    address: 'DHA Karachi',
    password: 'Test@123',
  });
  assert(sellerReg.data.success, `Seller register failed: ${JSON.stringify(sellerReg.data)}`);
  const sellerToken = sellerReg.data.data.user.token;

  console.log('5. Get block and create property...');
  const blocks = await get('/blocks', adminToken);
  assert(blocks.data.data?.length, 'No blocks found');
  const block = blocks.data.data[0];

  const propRes = await post(
    '/properties',
    {
      propertyNumber: `T-${ts}`,
      propertyType: 'plot',
      block: block._id,
      blockName: block.name,
      plotSize: '5 Marla',
      width: 25,
      length: 45,
      price: 5000000,
      status: 'active',
    },
    adminToken
  );
  assert(propRes.status === 201, `Create property failed: ${JSON.stringify(propRes.data)}`);
  const propertyId = propRes.data.data._id;

  console.log('6. Assign property to seller...');
  const assignRes = await post(
    `/properties/${propertyId}/assign`,
    { customerId: sellerId, purchaseDate: new Date().toISOString().split('T')[0] },
    adminToken
  );
  assert(assignRes.data.success, `Assign failed: ${JSON.stringify(assignRes.data)}`);

  console.log('7. Seller initiates sale to buyer email...');
  const sellRes = await post(
    '/sales/sell',
    { propertyId, buyerEmail, notes: 'Test sale' },
    sellerToken
  );
  assert(sellRes.status === 201, `Sell failed: ${JSON.stringify(sellRes.data)}`);
  const saleId = sellRes.data.data._id;

  console.log('8. Admin approves sale...');
  const approveRes = await post(
    `/sales/${saleId}/approve`,
    { saleDate: new Date().toISOString().split('T')[0] },
    adminToken
  );
  assert(approveRes.data.success, `Approve failed: ${JSON.stringify(approveRes.data)}`);

  console.log('9. Verify new owner...');
  const propCheck = await get(`/properties/${propertyId}`, adminToken);
  assert(
    propCheck.data.data.ownerName === 'Test Buyer',
    `Owner not updated: ${propCheck.data.data.ownerName}`
  );

  console.log('10. Buyer registers and sells to new buyer (chain)...');
  const buyer2Email = `buyer2${ts}@test.com`;
  const buyer2Res = await post(
    '/customers',
    {
      fullName: 'Test Buyer Two',
      fatherName: 'Father B2',
      cnic: makeCnic(Number(cnicSuffix) + 2),
      phone: `0302${String(ts).slice(-7)}`,
      email: buyer2Email,
      address: 'DHA Karachi',
    },
    adminToken
  );
  assert(buyer2Res.status === 201, `Create buyer2 failed: ${JSON.stringify(buyer2Res.data)}`);

  const buyerReg = await post('/auth/customer-register', {
    fullName: 'Test Buyer',
    fatherName: 'Father B',
    cnic: makeCnic(Number(cnicSuffix) + 1),
    phone: buyerPhone,
    email: buyerEmail,
    address: 'DHA Karachi',
    password: 'Test@123',
  });
  assert(buyerReg.data.success, `Buyer register failed: ${JSON.stringify(buyerReg.data)}`);
  const buyerToken = buyerReg.data.data.user.token;

  const chainSell = await post(
    '/sales/sell',
    { propertyId, buyerEmail: buyer2Email, notes: 'Chain sale' },
    buyerToken
  );
  assert(chainSell.status === 201, `Chain sell failed: ${JSON.stringify(chainSell.data)}`);

  const chainApprove = await post(
    `/sales/${chainSell.data.data._id}/approve`,
    { saleDate: new Date().toISOString().split('T')[0] },
    adminToken
  );
  assert(chainApprove.data.success, `Chain approve failed: ${JSON.stringify(chainApprove.data)}`);

  const finalCheck = await get(`/properties/${propertyId}`, adminToken);
  assert(
    finalCheck.data.data.ownerName === 'Test Buyer Two',
    `Chain owner wrong: ${finalCheck.data.data.ownerName}`
  );

  console.log('\n✅ FULL SALE FLOW + CHAIN SALE PASSED');
};

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
