import { google } from 'googleapis';
import { Usuario, AlumnoInscrito, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from './types';

const MOCK_USUARIOS: Usuario[] = [];
const MOCK_ALUMNOS: AlumnoInscrito[] = [];
const MOCK_ANTROPOMETRICOS: RegistroAntropometrico[] = [];
const MOCK_ATLETISMO: RegistroAtletismo[] = [];
const MOCK_CUALITATIVOS: RegistroCualitativo[] = [];

// Helper to sanitize private keys coming from env vars (handling escaped newlines \n)
function getSanitizedPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

function getSanitizedSpreadsheetId(id?: string): string | undefined {
  if (!id) return undefined;
  if (id.includes('/d/')) {
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : id;
  }
  return id;
}

function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = getSanitizedSpreadsheetId(process.env.SPREADSHEET_ID);

  if (!clientEmail || !privateKey || !spreadsheetId) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  } catch (err) {
    console.warn('Google Sheets Auth Error. Falling back to mock data mode:', err);
    return null;
  }
}

// -------------------------------------------------------------
// READ OPERATIONS
// -------------------------------------------------------------

export async function getUsuarios(): Promise<Usuario[]> {
  const client = getGoogleSheetsClient();
  if (!client) return MOCK_USUARIOS;

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Usuarios!A2:F',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_USUARIOS;

    return rows.map((r) => ({
      ID_Usuario: r[0] || '',
      Nombre: r[1] || '',
      Correo: r[2] || '',
      Password: r[3] || '',
      Rol: (r[4] as any) || 'Alumno',
      Nivel_Asignado: r[5] || '',
    }));
  } catch (err) {
    console.error('Error fetching Usuarios from Sheets:', err);
    return MOCK_USUARIOS;
  }
}

export async function getAlumnosInscritos(): Promise<AlumnoInscrito[]> {
  const client = getGoogleSheetsClient();
  if (!client) return MOCK_ALUMNOS;

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Alumnos_Inscritos!A2:H',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_ALUMNOS;

    return rows.map((r) => ({
      ID_Alumno: r[0] || '',
      Nombre_Completo: r[1] || '',
      Fecha_Nacimiento: r[2] || '',
      Genero: r[3] || '',
      Nivel: r[4] || '',
      Grado: r[5] || '',
      Grupo: r[6] || '',
      Ciclo_Escolar: r[7] || '',
    }));
  } catch (err) {
    console.error('Error fetching Alumnos_Inscritos from Sheets:', err);
    return MOCK_ALUMNOS;
  }
}

export async function getRegistrosAntropometricos(): Promise<RegistroAntropometrico[]> {
  const client = getGoogleSheetsClient();
  if (!client) return MOCK_ANTROPOMETRICOS;

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Antropometricos!A2:I',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_ANTROPOMETRICOS;

    return rows.map((r) => ({
      ID_Registro: r[0] || '',
      Fecha: r[1] || '',
      ID_Alumno: r[2] || '',
      Ciclo_Escolar: r[3] || '',
      ID_Maestro: r[4] || '',
      Edad: parseFloat(r[5]) || 0,
      Peso_kg: parseFloat(r[6]) || 0,
      Estatura_cm: parseFloat(r[7]) || 0,
      IMC: parseFloat(r[8]) || 0,
    }));
  } catch (err) {
    console.error('Error fetching Registros_Antropometricos:', err);
    return MOCK_ANTROPOMETRICOS;
  }
}

export async function getRegistrosAtletismo(): Promise<RegistroAtletismo[]> {
  const client = getGoogleSheetsClient();
  if (!client) return MOCK_ATLETISMO;

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Atletismo!A2:I',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_ATLETISMO;

    return rows.map((r) => ({
      ID_Registro: r[0] || '',
      Fecha: r[1] || '',
      ID_Alumno: r[2] || '',
      Ciclo_Escolar: r[3] || '',
      ID_Maestro: r[4] || '',
      Prueba: r[5] || '',
      Resultado_Principal: r[6] || '',
      Detalle_JSON_Vueltas: r[7] || '',
      Puntos: parseFloat(r[8]) || 0,
    }));
  } catch (err) {
    console.error('Error fetching Registros_Atletismo:', err);
    return MOCK_ATLETISMO;
  }
}

export async function getRegistrosCualitativos(): Promise<RegistroCualitativo[]> {
  const client = getGoogleSheetsClient();
  if (!client) return MOCK_CUALITATIVOS;

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Cualitativos!A2:G',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_CUALITATIVOS;

    return rows.map((r) => ({
      ID_Registro: r[0] || '',
      Fecha: r[1] || '',
      ID_Alumno: r[2] || '',
      Ciclo_Escolar: r[3] || '',
      ID_Maestro: r[4] || '',
      Deporte_o_Prueba: r[5] || '',
      Calificacion: r[6] || '',
    }));
  } catch (err) {
    console.error('Error fetching Registros_Cualitativos:', err);
    return MOCK_CUALITATIVOS;
  }
}

// -------------------------------------------------------------
// WRITE OPERATIONS (APPEND ROW)
// -------------------------------------------------------------

export async function addRegistroAntropometrico(data: RegistroAntropometrico): Promise<boolean> {
  const client = getGoogleSheetsClient();
  if (!client) {
    MOCK_ANTROPOMETRICOS.unshift(data);
    return true;
  }

  try {
    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Antropometricos!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Edad,
          data.Peso_kg,
          data.Estatura_cm,
          data.IMC,
        ]],
      },
    });
    return true;
  } catch (err) {
    console.error('Error appending to Registros_Antropometricos:', err);
    MOCK_ANTROPOMETRICOS.unshift(data);
    return true;
  }
}

export async function addRegistroAtletismo(data: RegistroAtletismo): Promise<boolean> {
  const client = getGoogleSheetsClient();
  if (!client) {
    MOCK_ATLETISMO.unshift(data);
    return true;
  }

  try {
    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Atletismo!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Prueba,
          data.Resultado_Principal,
          data.Detalle_JSON_Vueltas || '',
          data.Puntos || 0,
        ]],
      },
    });
    return true;
  } catch (err) {
    console.error('Error appending to Registros_Atletismo:', err);
    MOCK_ATLETISMO.unshift(data);
    return true;
  }
}

export async function addRegistroCualitativo(data: RegistroCualitativo): Promise<boolean> {
  const client = getGoogleSheetsClient();
  if (!client) {
    MOCK_CUALITATIVOS.unshift(data);
    return true;
  }

  try {
    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Cualitativos!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Deporte_o_Prueba,
          data.Calificacion,
        ]],
      },
    });
    return true;
  } catch (err) {
    console.error('Error appending to Registros_Cualitativos:', err);
    MOCK_CUALITATIVOS.unshift(data);
    return true;
  }
}
