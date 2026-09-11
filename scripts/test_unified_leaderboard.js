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

function normalizeNivel(n) {
  if (!n) return '';
  const clean = n.toLowerCase().trim();
  if (clean.includes('kinder')) return 'kinder';
  if (clean.includes('primaria menor')) return 'primaria menor';
  if (clean.includes('primaria mayor')) return 'primaria mayor';
  if (clean.includes('secundaria')) return 'secundaria';
  if (clean.includes('preparatoria') || clean.includes('prepa') || clean.includes('bachillerato')) return 'preparatoria';
  if (clean.includes('primaria')) return 'primaria';
  return clean;
}

function getStudentNivelNormalized(a) {
  const norm = normalizeNivel(a.Nivel);
  if (norm === 'primaria') {
    const cleanG = (a.Grado || '').replace(/[^0-9]/g, '');
    const numG = parseInt(cleanG, 10);
    if (numG >= 1 && numG <= 3) return 'primaria menor';
    if (numG >= 4 && numG <= 6) return 'primaria mayor';
  }
  return norm;
}

function normalizeTokens(nameStr) {
  if (!nameStr) return new Set();
  return new Set(
    nameStr
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/,/g, ' ')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

function matchesStudent(record, student) {
  if (!record || !student) return false;
  if (record.ID_Alumno && student.ID_Alumno && String(record.ID_Alumno).trim() === String(student.ID_Alumno).trim()) {
    return true;
  }
  const recTokens = normalizeTokens(record.Nombre_Alumno || record.nombreAlumno);
  const stTokens = normalizeTokens(student.Nombre_Completo);
  if (recTokens.size > 0 && stTokens.size > 0) {
    let overlap = 0;
    recTokens.forEach((t) => {
      if (stTokens.has(t)) overlap++;
    });
    const minTokens = Math.min(recTokens.size, stTokens.size);
    if (overlap >= 2 && overlap >= minTokens - 1) {
      return true;
    }
  }
  return false;
}

function parseSecondsFromFormattedTime(formattedStr) {
  if (!formattedStr || formattedStr === '-') return Infinity;
  const match = formattedStr.match(/(?:(\d+):)?(\d+)(?:\.(\d+))?/);
  if (!match) return Infinity;
  const minutes = match[1] ? parseInt(match[1], 10) : 0;
  const seconds = parseInt(match[2], 10);
  const millisStr = match[3] ? match[3].padEnd(3, '0').slice(0, 3) : '0';
  const millis = parseInt(millisStr, 10);
  return minutes * 60 + seconds + millis / 1000;
}

function parseDistanceInMeters(distStr) {
  if (!distStr || distStr === '-') return -1;
  const match = distStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return -1;
  return parseFloat(match[1]);
}

async function testUnifiedLeaderboard() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId1 = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID);
  const mejoesSpreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID_MEJORES_RESULTADOS);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const [alumnosRes, atlRes, cualRes, groupTabsRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId1, range: 'Alumnos_Inscritos!A2:H' }),
    sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId1, range: 'Registros_Atletismo!A2:Z' }),
    sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId1, range: 'Registros_Cualitativos!A2:Z' }),
    sheets.spreadsheets.values.batchGet({
      spreadsheetId: mejoesSpreadsheetId,
      ranges: PESTANIAS_GRUPOS_OFICIALES.map((g) => `'${g}'!A5:J`),
    }),
  ]);

  const alumnos = (alumnosRes.data.values || []).map((r, index) => ({
    ID_Alumno: (r[0] || '').trim() || `ALU-${String(index + 1).padStart(4, '0')}`,
    Nombre_Completo: r[1] || '',
    Genero: r[3] || '',
    Nivel: r[4] || '',
    Grado: r[5] || '',
    Grupo: r[6] || '',
  }));

  const registrosAtl = (atlRes.data.values || []).map((r) => {
    const isNew = r.length >= 11;
    return {
      ID_Registro: r[0] || '',
      Fecha: r[1] || '',
      ID_Alumno: r[2] || '',
      Nombre_Alumno: isNew ? r[3] : '',
      Prueba: isNew ? r[7] : r[5] || '',
      Resultado_Principal: isNew ? r[8] : r[6] || '',
    };
  });

  const registrosCual = (cualRes.data.values || []).map((r) => {
    const isNew = r.length >= 9;
    return {
      ID_Registro: r[0] || '',
      Fecha: r[1] || '',
      ID_Alumno: r[2] || '',
      Nombre_Alumno: isNew ? r[3] : '',
      Deporte_o_Prueba: isNew ? r[7] : r[5] || '',
      Calificacion: isNew ? r[8] : r[6] || '',
    };
  });

  // Collect records from group tabs
  const groupTabRecords = [];
  (groupTabsRes.data.valueRanges || []).forEach((rangeObj) => {
    const rangeName = rangeObj.range || '';
    const tabMatch = rangeName.match(/'?([^'!]+)'?!/);
    const tabName = tabMatch ? tabMatch[1] : '';
    const rows = rangeObj.values || [];

    rows.forEach((r) => {
      const nombreAlumno = r[1] || '';
      const genero = r[2] || '';
      const vel = r[3] || '-';
      const salto = r[4] || '-';
      const lanz = r[5] || '-';
      const res = r[6] || '-';
      const cuerda = r[7] || '-';
      const orden = r[8] || '-';
      const abc = r[9] || '-';

      const student = alumnos.find((st) => matchesStudent({ Nombre_Alumno: nombreAlumno }, st));
      if (!student) return;

      if (vel !== '-') groupTabRecords.push({ student, prueba: 'Velocidad', resultado: vel });
      if (salto !== '-') groupTabRecords.push({ student, prueba: 'Salto', resultado: salto });
      if (lanz !== '-') groupTabRecords.push({ student, prueba: 'Lanzamiento', resultado: lanz });
      if (res !== '-') groupTabRecords.push({ student, prueba: 'Resistencia', resultado: res });
      if (cuerda !== '-') groupTabRecords.push({ student, prueba: 'Salto de Cuerda', resultado: cuerda });
      if (orden !== '-') groupTabRecords.push({ student, prueba: 'Orden y Control', resultado: orden });
      if (abc !== '-') groupTabRecords.push({ student, prueba: 'ABC', resultado: abc });
    });
  });

  console.log(`Extracted ${groupTabRecords.length} student test marks from group tabs.`);

  // Test Top 3 General for Velocidad across all levels
  const velStudents = groupTabRecords.filter((r) => r.prueba === 'Velocidad');
  const levelCountsVel = {};
  velStudents.forEach((r) => {
    levelCountsVel[r.student.Nivel] = (levelCountsVel[r.student.Nivel] || 0) + 1;
  });

  console.log('Velocidad marks count by Nivel:', levelCountsVel);
}

testUnifiedLeaderboard().catch(console.error);
