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

async function checkPruebaValues() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const [atlRes, cualRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Atletismo!A2:Z' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Cualitativos!A2:Z' }),
  ]);

  const atlPruebas = new Set();
  (atlRes.data.values || []).forEach((r) => {
    const isNew = r.length >= 11;
    const p = isNew ? r[7] : r[5] || '';
    if (p) atlPruebas.add(p);
  });

  const cualPruebas = new Set();
  (cualRes.data.values || []).forEach((r) => {
    const isNew = r.length >= 9;
    const p = isNew ? r[7] : r[5] || '';
    if (p) cualPruebas.add(p);
  });

  console.log('Unique Pruebas in Registros_Atletismo:', Array.from(atlPruebas));
  console.log('Unique Pruebas in Registros_Cualitativos:', Array.from(cualPruebas));
}

checkPruebaValues().catch(console.error);
