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

async function testFix() {
  const alumnos = await getAlumnosInscritos();
  const registrosAtl = await getRegistrosAtletismo();

  const targetNivel = 'Primaria Menor';
  const normTargetNivel = normalizeNivel(targetNivel);

  const matched = [];
  registrosAtl.forEach((r) => {
    const st = getStudentForRecord(r, alumnos);
    if (!st) return;

    const stNivel = getStudentNivelNormalized(st);
    if (stNivel === normTargetNivel && r.Prueba.includes('75m')) {
      matched.push({
        recordName: r.Nombre_Alumno,
        studentName: st.Nombre_Completo,
        studentNivel: st.Nivel,
        studentGrado: st.Grado,
        resultado: r.Resultado_Principal,
      });
    }
  });

  console.log(`Matched 75m Velocidad records for ${targetNivel} (Total: ${matched.length}):`);
  console.log(matched);
}

testFix().catch(console.error);
