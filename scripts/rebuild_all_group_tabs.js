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

const PESTANIAS_GRUPOS_OFICIALES = [
  'K3A', 'K3B', 'K3C', 'K3D',
  '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C',
  '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C',
  '7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C',
  '10A', '10B', '10C', '10D', '10E', '11A', '11B', '12A', '12B', '12C', '12D',
];

function isStudentInGrupo(a, targetGrupo) {
  const target = (targetGrupo || '').trim().toUpperCase();
  const rawNivel = (a.Nivel || '').trim().toLowerCase();
  const rawGradoClean = (a.Grado || '').replace(/[^0-9]/g, '');
  const rawGrupoClean = (a.Grupo || '').replace(/[^A-Z]/g, '');

  if (target.startsWith('K')) {
    const targetGrupoLetter = target.replace(/[^A-Z]/g, '').replace(/^K/, '');
    const targetGradoNum = target.replace(/[^0-9]/g, '');
    if (rawNivel.includes('kinder')) {
      if (targetGradoNum && rawGradoClean && targetGradoNum !== rawGradoClean) return false;
      if (targetGrupoLetter && rawGrupoClean && targetGrupoLetter !== rawGrupoClean) return false;
      return true;
    }
    return false;
  }

  if (rawNivel.includes('kinder')) return false;

  const cleanTargetGrado = target.replace(/[^0-9]/g, '');
  const cleanTargetGrupo = target.replace(/[^A-Z]/g, '');

  if (cleanTargetGrado && cleanTargetGrupo && rawGradoClean && rawGrupoClean) {
    return rawGradoClean === cleanTargetGrado && rawGrupoClean === cleanTargetGrupo;
  }

  const directGrupoClean = (a.Grupo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (directGrupoClean === target) return true;

  const combo = `${rawGradoClean}${rawGrupoClean}`;
  return combo === target;
}

function getNivelByGrupo(grupoName) {
  const g = (grupoName || '').trim().toUpperCase();
  if (['K3A', 'K3B', 'K3C', 'K3D', 'K1', 'K2', 'K3'].includes(g) || g.startsWith('K')) return 'Kinder';
  if (['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'].includes(g)) return 'Primaria Menor';
  if (['4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C'].includes(g)) return 'Primaria Mayor';
  if (['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'].includes(g)) return 'Secundaria';
  if (['10A', '10B', '10C', '10D', '10E', '11A', '11B', '12A', '12B', '12C', '12D'].includes(g)) return 'Preparatoria';
  return 'General';
}

function getTeacherNameForLevel(nivel) {
  const clean = (nivel || '').toLowerCase().trim();
  if (clean.includes('kinder')) return 'Jaqueline Michelle Hinojosa castro';
  if (clean.includes('primaria menor')) return 'Orlando Campos';
  if (clean.includes('primaria mayor')) return 'Diego Armando Ibarra Reyes';
  if (clean.includes('secundaria') || clean.includes('preparatoria')) return 'Eduardo Yazebet Armenta Gonzáles';
  return 'Profesor de Educación Física';
}

function parseSecondsFromFormattedTime(formattedStr) {
  if (!formattedStr) return Infinity;
  const match = formattedStr.match(/(?:(\d+):)?(\d+)(?:\.(\d+))?/);
  if (!match) return Infinity;
  const minutes = match[1] ? parseInt(match[1], 10) : 0;
  const seconds = parseInt(match[2], 10);
  const millisStr = match[3] ? match[3].padEnd(3, '0').slice(0, 3) : '0';
  const millis = parseInt(millisStr, 10);
  return minutes * 60 + seconds + millis / 1000;
}

function parseDistanceInMeters(distStr) {
  if (!distStr) return -1;
  const match = distStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return -1;
  return parseFloat(match[1]);
}

function formatGender(genero) {
  if (!genero) return 'M';
  const clean = genero.trim().toUpperCase();
  if (clean === 'F' || clean === 'FEMENINO' || clean === 'MUJER') return 'F';
  return 'M';
}

function matchesStudent(record, student) {
  if (!record) return false;
  const recName = (record.Nombre_Alumno || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const stName = (student.Nombre_Completo || '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (recName && stName && recName === stName) {
    return true;
  }

  if (record.ID_Alumno && student.ID_Alumno && record.ID_Alumno === student.ID_Alumno) {
    if (!recName || recName === stName) return true;
  }

  return false;
}

function calculateBestMarksForStudent(student, atletismoRecords, cualitativoRecords) {
  const studentAtl = atletismoRecords.filter((r) => matchesStudent(r, student));
  const studentCual = cualitativoRecords.filter((r) => matchesStudent(r, student));

  // 1. Velocidad
  const velRecs = studentAtl.filter(
    (r) =>
      r.Resultado_Principal !== 'No Completada' &&
      (r.Prueba.toLowerCase().includes('velocidad') ||
        r.Prueba.toLowerCase().includes('50m') ||
        r.Prueba.toLowerCase().includes('75m') ||
        r.Prueba.toLowerCase().includes('100m') ||
        r.Prueba.toLowerCase().includes('200m') ||
        r.Prueba.toLowerCase().includes('400m'))
  );
  let bestVel = '-';
  if (velRecs.length > 0) {
    let minTime = Infinity;
    velRecs.forEach((r) => {
      const s = parseSecondsFromFormattedTime(r.Resultado_Principal);
      if (s < minTime) {
        minTime = s;
        bestVel = r.Resultado_Principal;
      }
    });
  }

  // 2. Salto
  const saltoRecs = studentAtl.filter(
    (r) => r.Resultado_Principal !== 'No Completada' && r.Prueba.toLowerCase().includes('salto')
  );
  let bestSalto = '-';
  if (saltoRecs.length > 0) {
    let maxDist = -1;
    saltoRecs.forEach((r) => {
      const d = parseDistanceInMeters(r.Resultado_Principal);
      if (d > maxDist) {
        maxDist = d;
        bestSalto = r.Resultado_Principal;
      }
    });
  }

  // 3. Lanzamiento
  const lanzRecs = studentAtl.filter(
    (r) => r.Resultado_Principal !== 'No Completada' && r.Prueba.toLowerCase().includes('lanzamiento')
  );
  let bestLanz = '-';
  if (lanzRecs.length > 0) {
    let maxDist = -1;
    lanzRecs.forEach((r) => {
      const d = parseDistanceInMeters(r.Resultado_Principal);
      if (d > maxDist) {
        maxDist = d;
        bestLanz = r.Resultado_Principal;
      }
    });
  }

  // 4. Resistencia
  const resRecs = studentAtl.filter(
    (r) =>
      r.Resultado_Principal !== 'No Completada' &&
      (r.Prueba.toLowerCase().includes('resistencia') ||
        r.Prueba.toLowerCase().includes('800m') ||
        r.Prueba.toLowerCase().includes('1500m') ||
        r.Prueba.toLowerCase().includes('fondo') ||
        r.Prueba.toLowerCase().includes('vueltas'))
  );
  let bestRes = '-';
  if (resRecs.length > 0) {
    let minTime = Infinity;
    resRecs.forEach((r) => {
      const s = parseSecondsFromFormattedTime(r.Resultado_Principal);
      if (s < minTime) {
        minTime = s;
        bestRes = r.Resultado_Principal;
      }
    });
  }

  // 5. Cuerda
  const cuerdaAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('cuerda'));
  const cuerdaCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('cuerda'));
  let bestCuerda = '-';
  if (cuerdaAtl.length > 0) {
    bestCuerda = cuerdaAtl[cuerdaAtl.length - 1].Resultado_Principal;
  } else if (cuerdaCual.length > 0) {
    bestCuerda = cuerdaCual[cuerdaCual.length - 1].Calificacion;
  }

  // 6. Orden y Control
  const ordenAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('orden'));
  const ordenCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('orden'));
  let bestOrden = '-';
  if (ordenAtl.length > 0) {
    bestOrden = ordenAtl[ordenAtl.length - 1].Resultado_Principal;
  } else if (ordenCual.length > 0) {
    bestOrden = ordenCual[ordenCual.length - 1].Calificacion;
  }

  // 7. ABC
  const abcAtl = studentAtl.filter((r) => r.Prueba.toLowerCase().includes('abc'));
  const abcCual = studentCual.filter((r) => r.Deporte_o_Prueba.toLowerCase().includes('abc'));
  let bestABC = '-';
  if (abcAtl.length > 0) {
    bestABC = abcAtl[abcAtl.length - 1].Resultado_Principal;
  } else if (abcCual.length > 0) {
    bestABC = abcCual[abcCual.length - 1].Calificacion;
  }

  return {
    idAlumno: student.ID_Alumno,
    nombreAlumno: student.Nombre_Completo,
    generoMF: formatGender(student.Genero),
    velocidad: bestVel,
    salto: bestSalto,
    lanzamiento: bestLanz,
    resistencia: bestRes,
    cuerda: bestCuerda,
    ordenYControl: bestOrden,
    abc: bestABC,
  };
}

async function rebuild() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const mejoesSpreadsheetId = process.env.SPREADSHEET_ID_MEJORES_RESULTADOS;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const [resAlu, resAtl, resCual] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alumnos_Inscritos!A2:H' }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Atletismo!A2:Z' }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Cualitativos!A2:Z' }),
    ]);

    const alumnos = (resAlu.data.values || []).map((r, i) => ({
      ID_Alumno: r[0] || `ALU-${i+1}`,
      Nombre_Completo: r[1] || '',
      Fecha_Nacimiento: r[2] || '',
      Genero: r[3] || '',
      Nivel: r[4] || '',
      Grado: r[5] || '',
      Grupo: r[6] || '',
      Ciclo_Escolar: r[7] || '',
    }));

    const atletismo = (resAtl.data.values || []).map((r) => {
      const isNew = r.length >= 11;
      return {
        ID_Registro: r[0] || '',
        Fecha: r[1] || '',
        ID_Alumno: r[2] || '',
        Nombre_Alumno: isNew ? r[3] : '',
        Ciclo_Escolar: isNew ? r[4] : r[3] || '',
        ID_Maestro: isNew ? r[5] : r[4] || '',
        Nombre_Maestro: isNew ? r[6] : '',
        Prueba: isNew ? r[7] : r[5] || '',
        Resultado_Principal: isNew ? r[8] : r[6] || '',
      };
    });

    const cualitativo = (resCual.data.values || []).map((r) => {
      const isNew = r.length >= 9;
      return {
        ID_Registro: r[0] || '',
        Fecha: r[1] || '',
        ID_Alumno: r[2] || '',
        Nombre_Alumno: isNew ? r[3] : '',
        Ciclo_Escolar: isNew ? r[4] : r[3] || '',
        ID_Maestro: isNew ? r[5] : r[4] || '',
        Nombre_Maestro: isNew ? r[6] : '',
        Deporte_o_Prueba: isNew ? r[7] : r[5] || '',
        Calificacion: isNew ? r[8] : r[6] || '',
      };
    });

    console.log(`Loaded ${alumnos.length} students, ${atletismo.length} atletismo, ${cualitativo.length} cualitativo records.`);

    const groupsWithStudents = PESTANIAS_GRUPOS_OFICIALES.filter((grp) =>
      alumnos.some((a) => isStudentInGrupo(a, grp))
    );

    console.log('Groups with enrolled students:', groupsWithStudents);

    const cicloEscolar = '2026-2027';

    for (const grp of groupsWithStudents) {
      const grpStudents = alumnos.filter((a) => isStudentInGrupo(a, grp));
      const rowsData = grpStudents.map((st) => calculateBestMarksForStudent(st, atletismo, cualitativo));

      const nivel = getNivelByGrupo(grp);
      const maestroNombre = getTeacherNameForLevel(nivel);

      const headerBlock = [
        [`Profesor: ${maestroNombre}`, '', `Ciclo Escolar: ${cicloEscolar}`, ''],
        [`Materia: Educación Física`, '', `Nivel Escolar: ${nivel}`, `Grupo: ${grp}`],
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

      try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId: mejoesSpreadsheetId });
        const existingTitles = (meta.data.sheets || []).map((s) => s.properties?.title || '');
        if (!existingTitles.includes(grp)) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: mejoesSpreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: grp } } }],
            },
          });
        }
      } catch (e) {}

      await sheets.spreadsheets.values.update({
        spreadsheetId: mejoesSpreadsheetId,
        range: `'${grp}'!A1:J${allValues.length + 5}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: allValues },
      });

      console.log(`Updated tab "${grp}" (${grpStudents.length} students) with teacher "${maestroNombre}"!`);
    }

    console.log('REBUILD COMPLETE WITH TEACHER NAMES PER LEVEL!');

  } catch (err) {
    console.error('Error rebuilding group tabs:', err);
  }
  process.exit(0);
}

rebuild();
