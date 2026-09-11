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

async function sampleGroupTabs() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const mejoesSpreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID_MEJORES_RESULTADOS);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const tabsToTest = ['K3A', '1A', '5A', '11B'];
  for (const tab of tabsToTest) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: mejoesSpreadsheetId,
        range: `'${tab}'!A1:J20`,
      });
      console.log(`\n=== Tab: ${tab} ===`);
      console.log(res.data.values);
    } catch (e) {
      console.error(`Error reading ${tab}:`, e.message);
    }
  }
}

sampleGroupTabs().catch(console.error);
