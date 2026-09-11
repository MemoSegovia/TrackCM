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

async function inspectSheets() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId1 = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID);
  const spreadsheetId2 = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID_MEJORES_RESULTADOS);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('--- Inspecting Sheet 1 (Main DB) ---');
  const meta1 = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId1 });
  console.log('Sheet 1 Tabs:', meta1.data.sheets.map((s) => s.properties.title));

  const cualRes = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId1, range: 'Registros_Cualitativos!A2:Z' });
  console.log(`Registros_Cualitativos rows: ${cualRes.data.values ? cualRes.data.values.length : 0}`);

  if (spreadsheetId2) {
    console.log('\n--- Inspecting Sheet 2 (Mejores Resultados Group Tabs) ---');
    const meta2 = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId2 });
    const tabTitles = meta2.data.sheets.map((s) => s.properties.title);
    console.log(`Sheet 2 has ${tabTitles.length} group tabs:`, tabTitles.slice(0, 15), '...');
  }
}

inspectSheets().catch(console.error);
