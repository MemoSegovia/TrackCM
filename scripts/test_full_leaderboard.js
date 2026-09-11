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
  const recTokens = normalizeTokens(record.Nombre_Alumno);
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

async function testFullLeaderboard() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID);

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const [alumnosRes, atlRes, cualRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alumnos_Inscritos!A2:H' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Atletismo!A2:Z' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Cualitativos!A2:Z' }),
  ]);

  const alumnos = (alumnosRes.data.values || []).map((r, index) => ({
    ID_Alumno: (r[0] || '').trim() || `ALU-${String(index + 1).padStart(4, '0')}`,
    Nombre_Completo: r[1] || '',
    Genero: r[3] || '',
    Nivel: r[4] || '',
    Grado: r[5] || '',
    Grupo: r[6] || '',
  }));

  const atletismo = (atlRes.data.values || []).map((r) => {
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

  const studentMapCache = new Map();
  const getStudentForRecord = (r) => {
    const cacheKey = `${r.ID_Alumno}_${r.Nombre_Alumno}`;
    if (studentMapCache.has(cacheKey)) return studentMapCache.get(cacheKey);
    const found = alumnos.find((st) => matchesStudent(r, st));
    studentMapCache.set(cacheKey, found || null);
    return found || null;
  };

  const levelsFoundInLeaderboard = new Set();
  atletismo.forEach((r) => {
    const st = getStudentForRecord(r);
    if (st) {
      levelsFoundInLeaderboard.add(st.Nivel);
    }
  });

  console.log('Levels matched in Leaderboard dataset:', Array.from(levelsFoundInLeaderboard));
}

testFullLeaderboard().catch(console.error);
