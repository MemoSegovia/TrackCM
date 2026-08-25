const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

// Manually parse .env.local
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

async function updateSheet() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
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
    // Restore row 32 (DIEGO ALONSO RAMIREZ GARZA)
    const row32Data = [
      "",
      "DIEGO ALONSO RAMIREZ GARZA",
      "diego.ramirez@colmexi.edu.mx",
      "123456789",
      "alumno",
      "Kinder"
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Usuarios!A32:F32',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row32Data] },
    });
    console.log('Restored Row 32 (DIEGO ALONSO RAMIREZ GARZA).');

    // Update Row 6 (Orlando Campos) -> Primaria Menor (1° y 2° de Primaria)
    const row6Data = [
      "USR-006",
      "Orlando Campos",
      "orlando.campos@colmexi.edu.mx",
      "123456789",
      "maestro",
      "Primaria Menor"
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Usuarios!A6:F6',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row6Data] },
    });
    console.log('Updated Row 6 (Orlando Campos) to Primaria Menor.');

    // Update Row 7 (Diego Armando Ibarra Reyes) -> Primaria Menor, Primaria Mayor (3°, 4°, 5°, 6° de Primaria)
    const row7Data = [
      "USR-007",
      "Diego Armando Ibarra Reyes",
      "diego.ibarra@colmexi.edu.mx",
      "123456789",
      "maestro",
      "Primaria Menor, Primaria Mayor"
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Usuarios!A7:F7',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row7Data] },
    });
    console.log('Updated Row 7 (Diego Armando Ibarra Reyes) to Primaria Menor, Primaria Mayor.');

    // Fetch and display updated rows 1 to 10
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Usuarios!A1:F10',
    });
    console.log('Verified Usuarios rows 1-10:');
    console.log(JSON.stringify(res.data.values, null, 2));

  } catch (err) {
    console.error('Error updating Google Sheets:', err.message);
  }
  process.exit(0);
}

updateSheet();
