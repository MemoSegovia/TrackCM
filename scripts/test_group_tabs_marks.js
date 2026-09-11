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

async function loadAllGroupTabsMarks() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const mejoesSpreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID_MEJORES_RESULTADOS);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: mejoesSpreadsheetId });
  const existingTabs = new Set((meta.data.sheets || []).map((s) => s.properties.title));

  const records = [];
  const levelCounts = {};

  for (const tab of PESTANIAS_GRUPOS_OFICIALES) {
    if (!existingTabs.has(tab)) continue;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: mejoesSpreadsheetId,
      range: `'${tab}'!A5:J`,
    });

    const rows = res.data.values || [];
    rows.forEach((r) => {
      // Header offset: r[0]=ID_Alumno/N°, r[1]=Nombre_Alumno, r[2]=M/F, r[3]=Velocidad, r[4]=Salto, r[5]=Lanzamiento, r[6]=Resistencia, r[7]=Cuerda, r[8]=OrdenYControl, r[9]=ABC
      const nombre = r[1] || '';
      const genero = r[2] || '';
      const velocidad = r[3] || '-';
      const salto = r[4] || '-';
      const lanzamiento = r[5] || '-';
      const resistencia = r[6] || '-';
      const cuerda = r[7] || '-';
      const orden = r[8] || '-';
      const abc = r[9] || '-';

      if (
        velocidad !== '-' ||
        salto !== '-' ||
        lanzamiento !== '-' ||
        resistencia !== '-' ||
        cuerda !== '-' ||
        orden !== '-' ||
        abc !== '-'
      ) {
        records.push({ tab, nombre, genero, velocidad, salto, lanzamiento, resistencia, cuerda, orden, abc });

        let lvl = 'General';
        if (tab.startsWith('K')) lvl = 'Kinder';
        else if (['1A','1B','1C','2A','2B','2C','3A','3B','3C'].includes(tab)) lvl = 'Primaria Menor';
        else if (['4A','4B','4C','5A','5B','5C','6A','6B','6C'].includes(tab)) lvl = 'Primaria Mayor';
        else if (['7A','7B','7C','8A','8B','8C','9A','9B','9C'].includes(tab)) lvl = 'Secundaria';
        else if (['10A','10B','10C','10D','10E','11A','11B','12A','12B','12C','12D'].includes(tab)) lvl = 'Preparatoria';

        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      }
    });
  }

  console.log(`Total students with marks found across Sheet 2 group tabs: ${records.length}`);
  console.log('Marks count by Nivel:', levelCounts);
}

loadAllGroupTabsMarks().catch(console.error);
