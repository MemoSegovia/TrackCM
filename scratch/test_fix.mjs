import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val) process.env[key] = val;
    }
  });
}

const { getAlumnosInscritos, getRegistrosAtletismo } = await import('../src/lib/googleSheets.ts');

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

function getStudentForRecord(r, allAlumnos) {
  const recName = (r.Nombre_Alumno || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (recName) {
    const foundByName = allAlumnos.find((a) => (a.Nombre_Completo || '').trim().toLowerCase().replace(/\s+/g, ' ') === recName);
    if (foundByName) return foundByName;
  }
  if (r.ID_Alumno) {
    const foundById = allAlumnos.find((a) => a.ID_Alumno === r.ID_Alumno);
    if (foundById) return foundById;
  }
  return null;
}

async function testGroupFilter() {
  const alumnos = await getAlumnosInscritos();
  const registrosAtl = await getRegistrosAtletismo();

  const nivel = 'Primaria Mayor';
  const grado = '6';
  const grupo = 'B';

  const targetStudents = alumnos.filter((a) => {
    const studentNivel = getStudentNivelNormalized(a);
    const targetNivel = normalizeNivel(nivel);
    if (studentNivel !== targetNivel) return false;

    const cleanStudentGrado = (a.Grado || '').replace(/[^0-9]/g, '');
    if (cleanStudentGrado !== grado) return false;

    const cleanStudentGrupo = (a.Grupo || '').trim().toUpperCase();
    if (cleanStudentGrupo !== grupo) return false;

    return true;
  });

  console.log(`Target students for ${nivel} ${grado}° "${grupo}":`, targetStudents.length);
  console.log('Target student names:', targetStudents.map(s => s.Nombre_Completo));

  const targetStudentsSet = new Set(targetStudents);

  const matchedOldBug = [];
  const matchedFixed = [];

  const targetStudentIdsOld = new Set(targetStudents.map(s => s.ID_Alumno));

  registrosAtl.forEach((r) => {
    const st = getStudentForRecord(r, alumnos);
    if (!st) return;

    // OLD BUG:
    if (targetStudentIdsOld.has(st.ID_Alumno)) {
      matchedOldBug.push({
        recordName: r.Nombre_Alumno,
        studentMatchedName: st.Nombre_Completo,
        studentMatchedGroup: `${st.Nivel} - ${st.Grado} ${st.Grupo}`,
      });
    }

    // FIXED:
    if (targetStudentsSet.has(st)) {
      matchedFixed.push({
        recordName: r.Nombre_Alumno,
        studentMatchedName: st.Nombre_Completo,
        studentMatchedGroup: `${st.Nivel} - ${st.Grado} ${st.Grupo}`,
      });
    }
  });

  console.log('\n--- OLD BUG MATCHES ---');
  console.log(matchedOldBug.slice(0, 10));

  console.log('\n--- FIXED MATCHES ---');
  console.log(matchedFixed);
}

testGroupFilter().catch(console.error);
