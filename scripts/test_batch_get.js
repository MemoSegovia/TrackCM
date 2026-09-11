const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

function getSanitizedPrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

function getSanitizedSpreadsheetId(id) {
  if (!id) return undefined;
  if (id.includes('/d/')) {
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : id;
  }
  return id;
}

const PESTANIAS_GRUPOS_OFICIALES = [
  'K3A', 'K3B', 'K3C', 'K3D',
  '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C',
  '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C',
  '7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C',
  '10A', '10B', '10C', '10D', '10E', '11A', '11B', '12A', '12B', '12C', '12D',
];

async function testBatchGet() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const mejoesSpreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID_MEJORES_RESULTADOS);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const start = Date.now();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: mejoesSpreadsheetId,
    ranges: PESTANIAS_GRUPOS_OFICIALES.map((g) => `'${g}'!A5:J`),
  });

  const duration = Date.now() - start;
  console.log(`batchGet completed in ${duration}ms for ${res.data.valueRanges.length} group tabs!`);
}

testBatchGet().catch(console.error);
