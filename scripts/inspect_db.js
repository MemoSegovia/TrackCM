const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

function getSanitizedPrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

async function inspectAll() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const mejoesSpreadsheetId = process.env.SPREADSHEET_ID_MEJORES_RESULTADOS;

  console.log('Main Sheet ID:', spreadsheetId);
  console.log('Mejores Sheet ID:', mejoesSpreadsheetId);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 1. Inspect Alumnos_Inscritos
    const resAlu = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Alumnos_Inscritos!A1:H30',
    });
    console.log('\n--- Alumnos_Inscritos (first 30 rows) ---');
    console.log(JSON.stringify(resAlu.data.values, null, 2));

    // 2. Inspect Registros_Atletismo
    const resAtl = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registros_Atletismo!A1:K30',
    });
    console.log('\n--- Registros_Atletismo (first 30 rows) ---');
    console.log(JSON.stringify(resAtl.data.values, null, 2));

    // 3. Inspect Mejores Resultados spreadsheet tabs
    const resMejMeta = await sheets.spreadsheets.get({
      spreadsheetId: mejoesSpreadsheetId,
    });
    const tabs = resMejMeta.data.sheets.map(s => s.properties.title);
    console.log('\n--- Mejores Resultados Tabs ---');
    console.log(tabs);

    if (tabs.length > 0) {
      const firstTab = tabs[0];
      const resTab = await sheets.spreadsheets.values.get({
        spreadsheetId: mejoesSpreadsheetId,
        range: `'${firstTab}'!A1:J35`,
      });
      console.log(`\n--- Contents of tab "${firstTab}" ---`);
      console.log(JSON.stringify(resTab.data.values, null, 2));
    }

  } catch (err) {
    console.error('Error inspecting sheets:', err.message);
  }
  process.exit(0);
}

inspectAll();
