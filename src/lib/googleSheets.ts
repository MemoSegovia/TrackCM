import { google } from 'googleapis';
import { Usuario, AlumnoInscrito, RegistroAntropometrico, RegistroAtletismo, RegistroCualitativo } from './types';
import { getNivelByGrupo } from './mejoresResultados';

const MOCK_USUARIOS: Usuario[] = [
  {
    ID_Usuario: 'USR-006',
    Nombre: 'Orlando Campos',
    Correo: 'orlando.campos@colmexi.edu.mx',
    Password: '123',
    Rol: 'Maestro',
    Nivel_Asignado: 'Primaria Menor',
  },
  {
    ID_Usuario: 'USR-007',
    Nombre: 'Diego Armando Ibarra Reyes',
    Correo: 'diego.ibarra@colmexi.edu.mx',
    Password: '123',
    Rol: 'Maestro',
    Nivel_Asignado: 'Primaria Menor, Primaria Mayor',
  },
];
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

    return rows.map((r, index) => {
      const rawId = (r[0] || '').trim();
      const fallbackId = `ALU-${String(index + 1).padStart(4, '0')}`;
      return {
        ID_Alumno: rawId || fallbackId,
        Nombre_Completo: r[1] || '',
        Fecha_Nacimiento: r[2] || '',
        Genero: r[3] || '',
        Nivel: r[4] || '',
        Grado: r[5] || '',
        Grupo: r[6] || '',
        Ciclo_Escolar: r[7] || '',
      };
    });
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
      range: 'Registros_Antropometricos!A2:Z',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_ANTROPOMETRICOS;

    return rows.map((r) => {
      const isNewSchema = r.length >= 11;
      return {
        ID_Registro: r[0] || '',
        Fecha: r[1] || '',
        ID_Alumno: r[2] || '',
        Nombre_Alumno: isNewSchema ? r[3] : '',
        Ciclo_Escolar: isNewSchema ? r[4] : r[3] || '',
        ID_Maestro: isNewSchema ? r[5] : r[4] || '',
        Nombre_Maestro: isNewSchema ? r[6] : '',
        Edad: parseFloat(isNewSchema ? r[7] : r[5]) || 0,
        Peso_kg: parseFloat(isNewSchema ? r[8] : r[6]) || 0,
        Estatura_cm: parseFloat(isNewSchema ? r[9] : r[7]) || 0,
        IMC: parseFloat(isNewSchema ? r[10] : r[8]) || 0,
      };
    });
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
      range: 'Registros_Atletismo!A2:Z',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_ATLETISMO;

    return rows.map((r) => {
      const isNewSchema = r.length >= 11;
      return {
        ID_Registro: r[0] || '',
        Fecha: r[1] || '',
        ID_Alumno: r[2] || '',
        Nombre_Alumno: isNewSchema ? r[3] : '',
        Ciclo_Escolar: isNewSchema ? r[4] : r[3] || '',
        ID_Maestro: isNewSchema ? r[5] : r[4] || '',
        Nombre_Maestro: isNewSchema ? r[6] : '',
        Prueba: isNewSchema ? r[7] : r[5] || '',
        Resultado_Principal: isNewSchema ? r[8] : r[6] || '',
        Detalle_JSON_Vueltas: isNewSchema ? r[9] : r[7] || '',
        Puntos: parseFloat(isNewSchema ? r[10] : r[8]) || 0,
      };
    });
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
      range: 'Registros_Cualitativos!A2:Z',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return MOCK_CUALITATIVOS;

    return rows.map((r) => {
      const isNewSchema = r.length >= 9;
      return {
        ID_Registro: r[0] || '',
        Fecha: r[1] || '',
        ID_Alumno: r[2] || '',
        Nombre_Alumno: isNewSchema ? r[3] : '',
        Ciclo_Escolar: isNewSchema ? r[4] : r[3] || '',
        ID_Maestro: isNewSchema ? r[5] : r[4] || '',
        Nombre_Maestro: isNewSchema ? r[6] : '',
        Deporte_o_Prueba: isNewSchema ? r[7] : r[5] || '',
        Calificacion: isNewSchema ? r[8] : r[6] || '',
      };
    });
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
      range: 'Registros_Antropometricos!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Nombre_Alumno || '',
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Nombre_Maestro || '',
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
      range: 'Registros_Atletismo!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Nombre_Alumno || '',
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Nombre_Maestro || '',
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

export async function deleteRegistroAtletismo(
  idRegistro?: string,
  idAlumno?: string,
  fecha?: string,
  prueba?: string,
  resultadoPrincipal?: string
): Promise<boolean> {
  const client = getGoogleSheetsClient();

  if (!client) {
    const idx = MOCK_ATLETISMO.findIndex(
      (r) =>
        (idRegistro && r.ID_Registro === idRegistro) ||
        (r.ID_Alumno === idAlumno &&
          (!fecha || r.Fecha === fecha) &&
          r.Prueba === prueba &&
          r.Resultado_Principal === resultadoPrincipal)
    );
    if (idx !== -1) {
      MOCK_ATLETISMO.splice(idx, 1);
    }
    return true;
  }

  try {
    const meta = await client.sheets.spreadsheets.get({
      spreadsheetId: client.spreadsheetId,
    });
    const sheet = meta.data.sheets?.find(
      (s) => s.properties?.title === 'Registros_Atletismo'
    );
    const sheetId = sheet?.properties?.sheetId;

    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: 'Registros_Atletismo!A2:Z',
    });

    const rows = res.data.values || [];
    let targetRowIndex = -1;

    if (idRegistro && idRegistro.trim() !== '') {
      targetRowIndex = rows.findIndex((r) => r[0] && r[0].trim() === idRegistro.trim());
    }

    if (targetRowIndex === -1 && (idAlumno || prueba)) {
      targetRowIndex = rows.findIndex((r) => {
        const isNewSchema = r.length >= 11;
        const rowIdAlumno = r[2] || '';
        const rowFecha = r[1] || '';
        const rowPrueba = isNewSchema ? r[7] : r[5] || '';
        const rowResultado = isNewSchema ? r[8] : r[6] || '';

        const matchAlumno = !idAlumno || rowIdAlumno === idAlumno;
        const matchFecha = !fecha || rowFecha === fecha;
        const matchPrueba = !prueba || rowPrueba === prueba;
        const matchResultado = !resultadoPrincipal || rowResultado === resultadoPrincipal;

        return matchAlumno && matchFecha && matchPrueba && matchResultado;
      });
    }

    if (targetRowIndex === -1) {
      console.warn('Record not found in Registros_Atletismo sheet for deletion:', { idRegistro, idAlumno, prueba });
      return false;
    }

    if (sheetId !== undefined) {
      const startRowIndex = targetRowIndex + 1;
      const endRowIndex = startRowIndex + 1;

      await client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: client.spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: startRowIndex,
                  endIndex: endRowIndex,
                },
              },
            },
          ],
        },
      });
    } else {
      console.warn('Sheet ID for Registros_Atletismo not found.');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting from Registros_Atletismo:', err);
    return false;
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
      range: 'Registros_Cualitativos!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.ID_Registro,
          data.Fecha,
          data.ID_Alumno,
          data.Nombre_Alumno || '',
          data.Ciclo_Escolar,
          data.ID_Maestro,
          data.Nombre_Maestro || '',
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

function getSpreadsheetIdForCiclo(cicloEscolar?: string): string | undefined {
  if (cicloEscolar) {
    const cleanCiclo = cicloEscolar.replace(/[^a-zA-Z0-9]/g, '_');
    const envKey = `SPREADSHEET_ID_MEJORES_RESULTADOS_${cleanCiclo}`;
    if (process.env[envKey]) {
      return process.env[envKey];
    }
  }
  return process.env.SPREADSHEET_ID_MEJORES_RESULTADOS || process.env.SPREADSHEET_ID;
}

export async function getTeacherNameForLevel(nivel: string): Promise<string> {
  const usuarios = await getUsuarios();
  const maestros = usuarios.filter(
    (u) => u.Rol?.toLowerCase() === 'maestro' || u.Rol?.toLowerCase() === 'profesor'
  );

  const cleanNivel = (nivel || '').toLowerCase().trim();

  const found = maestros.find((m) => {
    const assigned = (m.Nivel_Asignado || '').toLowerCase();
    return assigned.includes(cleanNivel);
  });

  if (found && found.Nombre) {
    return found.Nombre;
  }

  if (cleanNivel.includes('kinder')) return 'Jaqueline Michelle Hinojosa castro';
  if (cleanNivel.includes('primaria menor')) return 'Orlando Campos';
  if (cleanNivel.includes('primaria mayor')) return 'Diego Armando Ibarra Reyes';
  if (cleanNivel.includes('secundaria') || cleanNivel.includes('preparatoria'))
    return 'Eduardo Yazebet Armenta Gonzáles';

  return 'Profesor de Educación Física';
}

export async function updateGrupoMejoresResultadosSheet(
  grupo: string,
  cicloEscolar: string,
  maestroNombre: string,
  rowsData: any[]
): Promise<boolean> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const mejoesSpreadsheetId = getSanitizedSpreadsheetId(
    getSpreadsheetIdForCiclo(cicloEscolar)
  );

  if (!clientEmail || !privateKey || !mejoesSpreadsheetId) {
    console.warn('Sheets client not configured for mejores resultados. Operating in mock mode.');
    return true;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Determine level from group name and resolve assigned teacher name
    const nivel = getNivelByGrupo(grupo);
    const maestroAsignado = await getTeacherNameForLevel(nivel);
    const maestroNombreFinal = maestroAsignado || maestroNombre || 'Profesor de Educación Física';

    const headerBlock = [
      [`Profesor: ${maestroNombreFinal}`, '', `Ciclo Escolar: ${cicloEscolar}`, ''],
      [`Materia: Educación Física`, '', `Nivel Escolar: ${nivel}`, `Grupo: ${grupo}`],
      [],
      ['ID_Alumno', 'Nombre del alumno', 'M / F', 'Velocidad', 'Salto', 'Lanzamiento', 'Resistencia', 'Cuerda', 'Orden y Control', 'ABC'],
    ];

    const dataRows = rowsData.map((r) => [
      r.idAlumno,
      r.nombreAlumno,
      r.generoMF,
      r.velocidad,
      r.salto,
      r.lanzamiento,
      r.resistencia,
      r.cuerda,
      r.ordenYControl,
      r.abc,
    ]);

    const allValues = [...headerBlock, ...dataRows];
    const tabName = grupo.trim();

    try {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: mejoesSpreadsheetId,
      });
      const existingTitles = (meta.data.sheets || []).map((s) => s.properties?.title || '');
      if (!existingTitles.includes(tabName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: mejoesSpreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: tabName },
                },
              },
            ],
          },
        });
      }
    } catch (e) {
      console.warn(`Warning checking/creating sheet tab ${tabName}:`, e);
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: mejoesSpreadsheetId,
      range: `'${tabName}'!A1:J${allValues.length + 5}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: allValues,
      },
    });

    return true;
  } catch (err) {
    console.error(`Error updating Google Sheet tab ${grupo}:`, err);
    return false;
  }
}

