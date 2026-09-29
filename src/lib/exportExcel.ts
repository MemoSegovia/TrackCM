import * as XLSX from 'xlsx';
import { AlumnoInscrito, RegistroAtletismo, RegistroCualitativo } from './types';
import { calculateBestMarksForStudent, getAllGroupTabs, isStudentInGrupo } from './mejoresResultados';

export async function exportAllGroupsToExcel(
  cicloEscolar: string = '2026-2027',
  customTabsList?: string[]
): Promise<boolean> {
  try {
    // Fetch all raw data from API
    const res = await fetch(`/api/mejores-resultados?all=true&ciclo=${encodeURIComponent(cicloEscolar)}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Error al obtener datos para exportar');
    }

    const alumnos: AlumnoInscrito[] = data.alumnos || [];
    const atletismo: RegistroAtletismo[] = data.atletismo || [];
    const cualitativo: RegistroCualitativo[] = data.cualitativo || [];

    // Get tabs list (official + custom tabs)
    const tabs = customTabsList && customTabsList.length > 0 ? customTabsList : getAllGroupTabs();

    // Create Excel Workbook
    const wb = XLSX.utils.book_new();

    tabs.forEach((grp) => {
      const groupStudents = alumnos.filter((a) => isStudentInGrupo(a, grp));

      // Sort students alphabetically by full name
      groupStudents.sort((a, b) =>
        (a.Nombre_Completo || '').localeCompare(b.Nombre_Completo || '', 'es')
      );

      const rowsData = groupStudents.map((st) => {
        const best = calculateBestMarksForStudent(st, atletismo, cualitativo);
        return {
          'Nombre del alumno': best.nombreAlumno,
          'M/F': best.generoMF,
          'Velocidad': best.velocidad,
          'Salto': best.salto,
          'Lanzamiento': best.lanzamiento,
          'Resistencia': best.resistencia,
          'Cuerda': best.cuerda,
          'Orden y Control': best.ordenYControl,
          'ABC': best.abc,
        };
      });

      // Create sheet with explicit 9 header columns
      const ws = XLSX.utils.json_to_sheet(rowsData, {
        header: [
          'Nombre del alumno',
          'M/F',
          'Velocidad',
          'Salto',
          'Lanzamiento',
          'Resistencia',
          'Cuerda',
          'Orden y Control',
          'ABC',
        ],
      });

      // Format column widths
      ws['!cols'] = [
        { wch: 35 }, // Nombre del alumno
        { wch: 8 },  // M/F
        { wch: 15 }, // Velocidad
        { wch: 15 }, // Salto
        { wch: 15 }, // Lanzamiento
        { wch: 15 }, // Resistencia
        { wch: 12 }, // Cuerda
        { wch: 18 }, // Orden y Control
        { wch: 15 }, // ABC
      ];

      // Sanitize worksheet name for Excel (max 31 chars, no illegal characters)
      const sanitizedSheetName = grp.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Grupo';
      XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName);
    });

    // Save and download file
    const fileName = `Mejores_Resultados_Consolidados_Todos_los_Grupos_${cicloEscolar}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (err) {
    console.error('Error exporting all groups to Excel:', err);
    return false;
  }
}

export function exportSingleGroupToExcel(
  grupo: string,
  rows: any[],
  cicloEscolar: string = '2026-2027'
) {
  const wb = XLSX.utils.book_new();

  const formattedRows = rows.map((r) => ({
    'Nombre del alumno': r.nombreAlumno,
    'M/F': r.generoMF,
    'Velocidad': r.velocidad,
    'Salto': r.salto,
    'Lanzamiento': r.lanzamiento,
    'Resistencia': r.resistencia,
    'Cuerda': r.cuerda,
    'Orden y Control': r.ordenYControl,
    'ABC': r.abc,
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows, {
    header: [
      'Nombre del alumno',
      'M/F',
      'Velocidad',
      'Salto',
      'Lanzamiento',
      'Resistencia',
      'Cuerda',
      'Orden y Control',
      'ABC',
    ],
  });

  ws['!cols'] = [
    { wch: 35 },
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
  ];

  const sanitizedSheetName = grupo.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Grupo';
  XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName);

  const fileName = `Mejores_Resultados_Grupo_${grupo}_${cicloEscolar}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
