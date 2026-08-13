import { google } from 'googleapis';
import { Usuario, AlumnoInscrito, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from './types';

// Mock database for immediate zero-config testing & demonstration
const MOCK_USUARIOS: Usuario[] = [
  { ID_Usuario: 'USR-001', Nombre: 'Prof. Carlos Mendoza', Correo: 'maestro@colmexi.edu.mx', Password: '123', Rol: 'Maestro', Nivel_Asignado: 'Todos' },
  { ID_Usuario: 'USR-002', Nombre: 'Profra. Elena Gómez', Correo: 'elena.gomez@colmexi.edu.mx', Password: '123', Rol: 'Maestro', Nivel_Asignado: 'Secundaria' },
  { ID_Usuario: 'USR-003', Nombre: 'Mateo Hernández', Correo: 'alumno@colmexi.edu.mx', Password: '123', Rol: 'Alumno', Nivel_Asignado: 'N/A' },
  { ID_Usuario: 'USR-004', Nombre: 'Sofía Rodríguez', Correo: 'sofia.rodriguez@colmexi.edu.mx', Password: '123', Rol: 'Alumno', Nivel_Asignado: 'N/A' },
];

const MOCK_ALUMNOS: AlumnoInscrito[] = [
  { ID_Alumno: 'ALU-2026-001', Nombre_Completo: 'Mateo Hernández Ruiz', Fecha_Nacimiento: '2012-04-15', Genero: 'M', Nivel: 'Secundaria', Grado: '1', Grupo: 'A', Ciclo_Escolar: '2026-2027' },
  { ID_Alumno: 'ALU-2026-002', Nombre_Completo: 'Sofía Rodríguez Garza', Fecha_Nacimiento: '2012-08-22', Genero: 'F', Nivel: 'Secundaria', Grado: '1', Grupo: 'A', Ciclo_Escolar: '2026-2027' },
  { ID_Alumno: 'ALU-2026-003', Nombre_Completo: 'Santiago Morales Treviño', Fecha_Nacimiento: '2011-11-03', Genero: 'M', Nivel: 'Secundaria', Grado: '2', Grupo: 'B', Ciclo_Escolar: '2026-2027' },
  { ID_Alumno: 'ALU-2026-004', Nombre_Completo: 'Valentina López Silva', Fecha_Nacimiento: '2013-02-19', Genero: 'F', Nivel: 'Primaria', Grado: '6', Grupo: 'A', Ciclo_Escolar: '2026-2027' },
  { ID_Alumno: 'ALU-2026-005', Nombre_Completo: 'Diego Martínez Cantú', Fecha_Nacimiento: '2010-09-10', Genero: 'M', Nivel: 'Preparatoria', Grado: '1', Grupo: 'A', Ciclo_Escolar: '2026-2027' },
  { ID_Alumno: 'ALU-2026-006', Nombre_Completo: 'Camila Torres Navarro', Fecha_Nacimiento: '2012-01-30', Genero: 'F', Nivel: 'Secundaria', Grado: '1', Grupo: 'B', Ciclo_Escolar: '2026-2027' },
];

const MOCK_ANTROPOMETRICOS: RegistroAntropometrico[] = [
  { ID_Registro: 'ANT-260813-001', Fecha: '2026-08-10', ID_Alumno: 'ALU-2026-001', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Edad: 14, Peso_kg: 52.5, Estatura_cm: 162, IMC: 20.0 },
  { ID_Registro: 'ANT-260813-002', Fecha: '2026-08-10', ID_Alumno: 'ALU-2026-002', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Edad: 14, Peso_kg: 46.0, Estatura_cm: 158, IMC: 18.4 },
  { ID_Registro: 'ANT-260813-003', Fecha: '2026-08-11', ID_Alumno: 'ALU-2026-003', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Edad: 15, Peso_kg: 61.0, Estatura_cm: 170, IMC: 21.1 },
];

const MOCK_ATLETISMO: RegistroAtletismo[] = [
  { ID_Registro: 'ATL-260813-001', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-001', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Prueba: '100m Velocidad', Resultado_Principal: '12.85 s', Detalle_JSON_Vueltas: '{"laps":["12.85 s"]}', Puntos: 95 },
  { ID_Registro: 'ATL-260813-002', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-002', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Prueba: '100m Velocidad', Resultado_Principal: '13.40 s', Detalle_JSON_Vueltas: '{"laps":["13.40 s"]}', Puntos: 90 },
  { ID_Registro: 'ATL-260813-003', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-003', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Prueba: 'Salto de Longitud', Resultado_Principal: '4.95 m', Detalle_JSON_Vueltas: '{"attempts":["4.50 m","4.80 m","4.95 m"],"best":"4.95 m"}', Puntos: 92 },
  { ID_Registro: 'ATL-260813-004', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-005', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Prueba: '100m Velocidad', Resultado_Principal: '11.90 s', Detalle_JSON_Vueltas: '{"laps":["11.90 s"]}', Puntos: 98 },
];

const MOCK_CUALITATIVOS: RegistroCualitativo[] = [
  { ID_Registro: 'CUA-260813-001', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-001', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Deporte_o_Prueba: 'Básquetbol', Calificacion: 'Excelente' },
  { ID_Registro: 'CUA-260813-002', Fecha: '2026-08-12', ID_Alumno: 'ALU-2026-002', Ciclo_Escolar: '2026-2027', ID_Maestro: 'USR-001', Deporte_o_Prueba: 'Voleibol', Calificacion: 'Muy Bueno' },
];

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
