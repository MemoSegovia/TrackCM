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

async function fixSheets() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const mejoesSpreadsheetId = process.env.SPREADSHEET_ID_MEJORES_RESULTADOS;

  if (!clientEmail || !privateKey || !mejoesSpreadsheetId) {
    console.error('Missing Google credentials in env!');
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 1. Get metadata of Mejores Resultados spreadsheet
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: mejoesSpreadsheetId,
    });

    const sheetsList = meta.data.sheets || [];
    console.log('Current tabs:', sheetsList.map(s => s.properties.title));

    // Check if tab "A" exists
    const tabA = sheetsList.find(s => s.properties.title === 'A');
    if (tabA && sheetsList.length > 1) {
      console.log('Deleting malformed tab "A"...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: mejoesSpreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: tabA.properties.sheetId,
              },
            },
          ],
        },
      });
      console.log('Successfully deleted tab "A".');
    }

    console.log('Done cleaning Mejores Resultados spreadsheet.');
  } catch (err) {
    console.error('Error in fixSheets:', err.message);
  }
  process.exit(0);
}

fixSheets();
