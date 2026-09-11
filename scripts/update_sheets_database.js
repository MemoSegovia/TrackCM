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

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function apiCallWithRetry(fn, maxRetries = 8) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.status === 429 || (err.response && err.response.status === 429) || (err.message && err.message.includes('Quota exceeded'));
      if (is429) {
        attempt++;
        if (attempt > maxRetries) throw err;
        const waitTime = Math.min(attempt * 8, 30);
        console.warn(`⏳ [Rate Limit 429] Waiting ${waitTime}s before retry (attempt ${attempt}/${maxRetries})...`);
        await sleep(waitTime * 1000);
      } else {
        throw err;
      }
    }
  }
}

function toProperCase(str) {
  if (!str) return '';
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
  
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function formatStudentName(fullName) {
  if (!fullName) return '';
  const clean = fullName.trim();
  if (clean.includes(',')) {
    const parts = clean.split(',');
    const apellidos = toProperCase(parts[0].trim());
    const nombres = toProperCase(parts[1].trim());
    return `${apellidos}, ${nombres}`;
  }

  const tokens = clean.split(/\s+/);
  if (tokens.length === 1) {
    return toProperCase(clean);
  }

  let firstNameCount = 1;
  if (tokens.length === 4) {
    firstNameCount = 2;
  } else if (tokens.length === 3) {
    firstNameCount = 1;
  } else if (tokens.length === 2) {
    firstNameCount = 1;
  } else if (tokens.length > 4) {
    let deIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (['DE', 'DEL', 'DE LA', 'DE LOS'].includes(tokens[i].toUpperCase())) {
        deIndex = i;
        break;
      }
    }
    if (deIndex > 0) {
      firstNameCount = deIndex;
    } else {
      firstNameCount = tokens.length - 2;
    }
  }

  const firstNames = tokens.slice(0, firstNameCount).join(' ');
  const lastNames = tokens.slice(firstNameCount).join(' ');

  return `${toProperCase(lastNames)}, ${toProperCase(firstNames)}`;
}

// Student additions defined by user
const NEW_STUDENTS = [
  // Kinder
  { nombre: 'Cárdenas Cavazos, Sofía', nivel: 'Kinder', grado: '3°', grupo: 'A', genero: 'Femenino' },
  { nombre: 'Garza Treviño, Mateo', nivel: 'Kinder', grado: '3°', grupo: 'A', genero: 'Masculino' },
  { nombre: 'Morales Cantú, Emiliano', nivel: 'Kinder', grado: '3°', grupo: 'B', genero: 'Masculino' },
  
  // Primaria 1-3
  { nombre: 'Alvarado Gómez, Valeria', nivel: 'Primaria menor', grado: '2°', grupo: 'A', genero: 'Femenino' },
  { nombre: 'Castillo Hinojosa, Regina', nivel: 'Primaria menor', grado: '3°', grupo: 'B', genero: 'Femenino' },
  { nombre: 'Flores Salinas, Leonardo', nivel: 'Primaria menor', grado: '1°', grupo: 'B', genero: 'Masculino' },
  { nombre: 'Garza Peña, Romina', nivel: 'Primaria menor', grado: '3°', grupo: 'A', genero: 'Femenino' },
  
  // Primaria 4-6
  { nombre: 'Benavides Leal, Marcelo', nivel: 'Primaria Mayor', grado: '5°', grupo: 'A', genero: 'Masculino' },
  { nombre: 'De la Garza Reyna, Lucía', nivel: 'Primaria Mayor', grado: '4°', grupo: 'B', genero: 'Femenino' },
  { nombre: 'Ortiz Méndez, Sebastián', nivel: 'Primaria Mayor', grado: '6°', grupo: 'B', genero: 'Masculino' },

  // Secundaria
  { nombre: 'Chapa Villarreal, Patricio', nivel: 'Secundaria', grado: '7°', grupo: 'A', genero: 'Masculino' },
  { nombre: 'Garza Lozano, Valentina', nivel: 'Secundaria', grado: '7°', grupo: 'B', genero: 'Femenino' },
  { nombre: 'González Morales, Eduardo', nivel: 'Secundaria', grado: '8°', grupo: 'B', genero: 'Masculino' },
  { nombre: 'Tijerina Cantú, Andrea', nivel: 'Secundaria', grado: '9°', grupo: 'A', genero: 'Femenino' },
  { nombre: 'Zúñiga Reyna, Daniel', nivel: 'Secundaria', grado: '9°', grupo: 'C', genero: 'Masculino' },

  // Preparatoria
  { nombre: 'Cantú Rodríguez, Jorge Alberto', nivel: 'Preparatoria', grado: '10°', grupo: 'B', genero: 'Masculino' },
  { nombre: 'Salinas Treviño, Mariana', nivel: 'Preparatoria', grado: '10°', grupo: 'C', genero: 'Femenino' },
  { nombre: 'Dávila Garza, Fernando', nivel: 'Preparatoria', grado: '11°', grupo: 'A', genero: 'Masculino' },
  { nombre: 'Treviño Benavides, Paulina', nivel: 'Preparatoria', grado: '11°', grupo: 'D', genero: 'Femenino' },
  { nombre: 'Leal Quiroga, Marcelo', nivel: 'Preparatoria', grado: '12°', grupo: 'C', genero: 'Masculino' },
  { nombre: 'Mendoza Cavazos, Andrea', nivel: 'Preparatoria', grado: '12°', grupo: 'A', genero: 'Femenino' },
];

// Exact student deletions requested by user
const DELETED_STUDENT_FULL_NAMES = [
  'GÓMEZ SALDAÑA LUIS FERNANDO',
  'MARTÍNEZ CRUZ ANDRÉS',
  'RUIZ BENAVIDES CAMILA',
  'CISNEROS GARZA PATRICIO',
  'VÁZQUEZ HINOJOSA PAULINA',
  'PEÑA SALINAS DIEGO',
  'GARZA DE LEÓN CARLOS',
  'LOZANO CAVAZOS SOFÍA',
  'BARRIENTOS DÍAZ MATEO',
  'HINOJOSA MORA DAVID',
  'SOTO MORALES REGINA',
];

function isStudentDeleted(nombre) {
  const normName = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/,/g, '').toUpperCase().trim();
  
  for (const del of DELETED_STUDENT_FULL_NAMES) {
    const delNorm = del.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/,/g, '').toUpperCase().trim();
    if (normName === delNorm) {
      return true;
    }
  }
  return false;
}

// Helpers for best marks calculations
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
  if (clean === 'F' || clean === 'FEMENINO' || clean === 'MUJER' || clean === 'FEMENIL') return 'F';
  return 'M';
}

function matchesStudent(record, student) {
  if (!record) return false;
  const recName = (record.Nombre_Alumno || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const stName = (student.Nombre_Completo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (recName && stName) {
    if (recName === stName) return true;
    const recTokens = recName.replace(',', '').split(/\s+/);
    const stTokens = stName.replace(',', '').split(/\s+/);
    const overlap = recTokens.filter(t => stTokens.includes(t)).length;
    if (overlap >= 2 && overlap >= stTokens.length - 1) return true;
  }

  if (record.ID_Alumno && student.ID_Alumno && record.ID_Alumno === student.ID_Alumno) {
    return true;
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
    (r) => r.Resultado_Principal !== 'No Completada' && r.Prueba.toLowerCase().includes('salto') && !r.Prueba.toLowerCase().includes('cuerda')
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
        r.Prueba.toLowerCase().includes('600m') ||
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

function getTeacherNameForLevel(nivel) {
  const clean = (nivel || '').toLowerCase().trim();
  if (clean.includes('kinder')) return 'Jaqueline Michelle Hinojosa castro';
  if (clean.includes('primaria menor')) return 'Orlando Campos';
  if (clean.includes('primaria mayor')) return 'Diego Armando Ibarra Reyes';
  if (clean.includes('secundaria') || clean.includes('preparatoria')) return 'Eduardo Yazebet Armenta Gonzáles';
  return 'Profesor de Educación Física';
}

function getNivelByGrupo(grupoName) {
  const g = (grupoName || '').trim().toUpperCase();
  if (['K3A', 'K3B', 'K3C', 'K3D', 'K1', 'K2', 'K3'].includes(g) || g.startsWith('K')) return 'Kinder';
  if (['1A', '1B', '1C', '1D', '2A', '2B', '2C', '3A', '3B', '3C', '3D'].includes(g)) return 'Primaria Menor';
  if (['4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C'].includes(g)) return 'Primaria Mayor';
  if (['7A', '7B', '7C', '7D', '8A', '8B', '8C', '8D', '9A', '9B', '9C'].includes(g)) return 'Secundaria';
  if (['10A', '10B', '10C', '10D', '10E', '11A', '11B', '11D', '12A', '12B', '12C', '12D'].includes(g)) return 'Preparatoria';
  return 'General';
}

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

const PESTANIAS_GRUPOS_OFICIALES = [
  'K3A', 'K3B', 'K3C', 'K3D',
  '1A', '1B', '1C', '1D', '2A', '2B', '2C', '3A', '3B', '3C', '3D',
  '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C',
  '7A', '7B', '7C', '7D', '8A', '8B', '8C', '8D', '9A', '9B', '9C',
  '10A', '10B', '10C', '10D', '10E', '11A', '11B', '11D', '12A', '12B', '12C', '12D',
];

async function updateAllSheets() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getSanitizedPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const mejoesSpreadsheetId = process.env.SPREADSHEET_ID_MEJORES_RESULTADOS;

  console.log('Connecting to Google Sheets API...');
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Fetch current data
  const [resAlu, resAtl, resCual] = await Promise.all([
    apiCallWithRetry(() => sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alumnos_Inscritos!A2:H' })),
    apiCallWithRetry(() => sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Atletismo!A2:Z' })),
    apiCallWithRetry(() => sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registros_Cualitativos!A2:Z' })),
  ]);

  const rawRows = resAlu.data.values || [];
  console.log(`Fetched ${rawRows.length} existing students from Alumnos_Inscritos.`);

  // 2. Process existing students: format names & filter out deleted
  let updatedAlumnos = [];
  let deletedCount = 0;

  rawRows.forEach((r) => {
    const rawId = r[0] || '';
    const rawNombre = r[1] || '';
    const correo = r[2] || '';
    const genero = r[3] || 'Masculino';
    const nivel = r[4] || '';
    const grado = r[5] || '';
    const grupo = r[6] || '';
    const ciclo = r[7] || '2026-2027';

    if (isStudentDeleted(rawNombre)) {
      console.log(`[DELETION] Removing student: "${rawNombre}" (${nivel} ${grado}°${grupo})`);
      deletedCount++;
      return;
    }

    const formattedNombre = formatStudentName(rawNombre);
    updatedAlumnos.push({
      ID_Alumno: rawId,
      Nombre_Completo: formattedNombre,
      Correo: correo,
      Genero: genero,
      Nivel: nivel,
      Grado: grado,
      Grupo: grupo,
      Ciclo_Escolar: ciclo,
    });
  });

  console.log(`Processed existing students. Retained: ${updatedAlumnos.length}, Deleted: ${deletedCount}`);

  // 3. Add NEW students
  let addedCount = 0;
  NEW_STUDENTS.forEach((st) => {
    const nameParts = st.nombre.split(',')[0].toLowerCase().trim().replace(/[^a-z]/g, '');
    const firstName = (st.nombre.split(',')[1] || '').trim().toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const email = `${firstName}.${nameParts}@colmexi.edu.mx`;

    const normNewName = st.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const exists = updatedAlumnos.some((a) => {
      const normA = a.Nombre_Completo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      return normA === normNewName && a.Grado.replace(/[^0-9]/g, '') === st.grado.replace(/[^0-9]/g, '') && a.Grupo.trim().toUpperCase() === st.grupo.trim().toUpperCase();
    });

    if (!exists) {
      console.log(`[ADDITION] Adding new student: "${st.nombre}" (${st.nivel} ${st.grado}°${st.grupo})`);
      updatedAlumnos.push({
        ID_Alumno: '',
        Nombre_Completo: formatStudentName(st.nombre),
        Correo: email,
        Genero: st.genero,
        Nivel: st.nivel,
        Grado: st.grado,
        Grupo: st.grupo,
        Ciclo_Escolar: '2026-2027',
      });
      addedCount++;
    } else {
      console.log(`[ADDITION] Student already exists, skipping duplicate add: "${st.nombre}"`);
    }
  });

  console.log(`Added ${addedCount} new students.`);

  // 4. Sort updatedAlumnos by Nivel, Grado, Grupo, then Nombre_Completo (Apellidos, Nombres)
  const nivelOrder = {
    'Kinder': 1,
    'Primaria menor': 2,
    'Primaria Menor': 2,
    'Primaria Mayor': 3,
    'Secundaria': 4,
    'Preparatoria': 5,
  };

  updatedAlumnos.sort((a, b) => {
    const nA = nivelOrder[a.Nivel] || 99;
    const nB = nivelOrder[b.Nivel] || 99;
    if (nA !== nB) return nA - nB;

    const gA = parseInt(a.Grado.replace(/[^0-9]/g, ''), 10) || 0;
    const gB = parseInt(b.Grado.replace(/[^0-9]/g, ''), 10) || 0;
    if (gA !== gB) return gA - gB;

    const grpA = (a.Grupo || '').trim().toUpperCase();
    const grpB = (b.Grupo || '').trim().toUpperCase();
    if (grpA !== grpB) return grpA.localeCompare(grpB);

    return a.Nombre_Completo.localeCompare(b.Nombre_Completo, 'es', { sensitivity: 'base' });
  });

  updatedAlumnos.forEach((st, i) => {
    st.ID_Alumno = String(i + 1);
  });

  console.log(`Total students to write to Alumnos_Inscritos: ${updatedAlumnos.length}`);

  // 5. Update Alumnos_Inscritos tab in main Google Sheet
  const alumnosSheetValues = [
    ['ID_Alumno', 'Nombre_Completo', 'Correo', 'Genero', 'Nivel', 'Grado', 'Grupo', 'Ciclo_Escolar'],
    ...updatedAlumnos.map((st) => [
      st.ID_Alumno,
      st.Nombre_Completo,
      st.Correo,
      st.Genero,
      st.Nivel,
      st.Grado,
      st.Grupo,
      st.Ciclo_Escolar,
    ]),
  ];

  await apiCallWithRetry(() => sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Alumnos_Inscritos!A1:H${alumnosSheetValues.length}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: alumnosSheetValues },
  }));

  console.log('✅ Successfully updated tab "Alumnos_Inscritos" in main Google Sheet!');
  await sleep(1500);

  // 6. Update SPREADSHEET_ID_MEJORES_RESULTADOS tabs
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

  const cicloEscolar = '2026-2027';
  const metaMej = await apiCallWithRetry(() => sheets.spreadsheets.get({ spreadsheetId: mejoesSpreadsheetId }));
  const existingTabTitles = (metaMej.data.sheets || []).map((s) => s.properties?.title || '');

  for (const grp of PESTANIAS_GRUPOS_OFICIALES) {
    const grpStudents = updatedAlumnos.filter((a) => isStudentInGrupo(a, grp));

    grpStudents.sort((a, b) => a.Nombre_Completo.localeCompare(b.Nombre_Completo, 'es', { sensitivity: 'base' }));

    const rowsData = grpStudents.map((st) => calculateBestMarksForStudent(st, atletismo, cualitativo));
    const nivel = getNivelByGrupo(grp);
    const maestroNombre = getTeacherNameForLevel(nivel);

    const headerBlock = [
      [`Profesor: ${maestroNombre}`, '', `Ciclo Escolar: ${cicloEscolar}`, ''],
      [`Materia: Educación Física`, '', `Nivel Escolar: ${nivel}`, `Grupo: ${grp}`],
      [],
      ['ID_Alumno', 'Nombre del alumno', 'M / F', 'Velocidad', 'Salto', 'Lanzamiento', 'Resistencia', 'Cuerda', 'Orden y Control', 'ABC'],
    ];

    const dataRows = rowsData.map((r, index) => [
      String(index + 1),
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

    if (!existingTabTitles.includes(grp)) {
      try {
        await apiCallWithRetry(() => sheets.spreadsheets.batchUpdate({
          spreadsheetId: mejoesSpreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: grp } } }],
          },
        }));
        console.log(`Created missing sheet tab "${grp}"`);
        await sleep(1500);
      } catch (e) {
        console.warn(`Error creating tab "${grp}":`, e.message);
      }
    }

    const paddedValues = [...allValues];
    while (paddedValues.length < 50) {
      paddedValues.push(['', '', '', '', '', '', '', '', '', '']);
    }

    await apiCallWithRetry(() => sheets.spreadsheets.values.update({
      spreadsheetId: mejoesSpreadsheetId,
      range: `'${grp}'!A1:J${paddedValues.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: paddedValues },
    }));

    console.log(`✅ Updated tab "${grp}" (${grpStudents.length} alumnos, lista consecutiva 1..${grpStudents.length})`);
    await sleep(1500); // 1.5s delay to stay comfortably under API rate limits
  }

  console.log('\n🎉 ALL GOOGLE SHEETS TABS UPDATED SUCCESSFULLY!');
}

updateAllSheets().catch((err) => {
  console.error('Fatal error updating sheets:', err);
  process.exit(1);
});
