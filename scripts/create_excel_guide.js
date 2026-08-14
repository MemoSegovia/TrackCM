const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const guideData = [
  ['TRACKCM - GUÍA PASO A PASO: CONFIGURACIÓN DE NUEVO CICLO ESCOLAR'],
  ['Sistema de Educación Física - Colegio Mexicano'],
  [''],
  ['PASO', 'FASE', 'ACCIÓN / INSTRUCCIÓN', 'DETALLE / NOTAS IMPORTANTES', 'ESTADO'],
  [
    '1',
    'Google Drive',
    'Crear nueva Hoja de Cálculo en Google Drive',
    'Ve a Google Drive y crea un documento en blanco con el nombre: "TrackCM - Mejores Resultados [AÑO]" (ej. 2027-2028)',
    'Pendiente'
  ],
  [
    '2',
    'Google Drive',
    'Compartir con la Service Account',
    'Haz clic en Compartir y añade el correo: trackcm-bot@trackcm-app.iam.gserviceaccount.com con permisos de EDITOR.',
    'Pendiente'
  ],
  [
    '3',
    'Google Drive',
    'Copiar el ID del Documento',
    'Copia el código de la URL entre /d/ y /edit (ejemplo: 1E0w0_WBW7mP3XMi88B_EIAM9k5zr-LvzArkWs8C-Mcs)',
    'Pendiente'
  ],
  [
    '4',
    'Base de Datos',
    'Registrar Alumnos en Alumnos_Inscritos',
    'En la pestaña Alumnos_Inscritos del archivo principal, agrega los alumnos asegurando colocar el nuevo Ciclo_Escolar (ej. 2027-2028)',
    'Pendiente'
  ],
  [
    '5',
    'Vercel',
    'Agregar Variable de Entorno en Vercel',
    'Ve a Vercel -> Settings -> Environment Variables. Crea: SPREADSHEET_ID_MEJORES_RESULTADOS_2027_2028 con el ID copiado.',
    'Pendiente'
  ],
  [
    '6',
    'Vercel',
    'Realizar Redeploy en Vercel',
    'Ve a Deployments -> Clic en los 3 puntos (...) del último deployment -> Selecciona "Redeploy" para aplicar el nuevo año.',
    'Pendiente'
  ],
  [
    '7',
    'Aplicación Web',
    'Seleccionar Nuevo Ciclo Escolar',
    'Entra al Portal Maestro o Panel Admin en la web y selecciona en el menú superior el Ciclo Escolar nuevo.',
    'Pendiente'
  ],
  [
    '8',
    'Aplicación Web',
    'Sincronizar Pestañas de Grupos',
    'Ve a "Tabla Mejores Resultados" y haz clic en "Sincronizar a Google Sheets". Las 41 pestañas se crearán automáticamente en el nuevo archivo.',
    'Pendiente'
  ],
];

const variablesData = [
  ['CONFIGURACIÓN DE VARIABLES DE ENTORNO POR CICLO ESCOLAR'],
  [''],
  ['CICLO ESCOLAR', 'NOMBRE DE LA VARIABLE EN VERCEL', 'VALOR (EJEMPLO)', 'DESCRIPCIÓN'],
  ['2026-2027', 'SPREADSHEET_ID_MEJORES_RESULTADOS', '1E0w0_WBW7mP3XMi88B_EIAM9k5zr-LvzArkWs8C-Mcs', 'Documento actual para el ciclo 2026-2027'],
  ['2027-2028', 'SPREADSHEET_ID_MEJORES_RESULTADOS_2027_2028', '1AbCdEfGhIjKlMnOpQrStUvWxYz...', 'Nuevo documento para el ciclo 2027-2028'],
  ['2028-2029', 'SPREADSHEET_ID_MEJORES_RESULTADOS_2028_2029', '1XyZAbCdEfGhIjKlMnOpQrStUv...', 'Nuevo documento para el ciclo 2028-2029'],
  ['2029-2030', 'SPREADSHEET_ID_MEJORES_RESULTADOS_2029_2030', '1MnOpQrStUvWxYzAbCdEfGhIj...', 'Nuevo documento para el ciclo 2029-2030'],
];

const wb = XLSX.utils.book_new();

const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
wsGuide['!cols'] = [
  { wch: 8 },
  { wch: 18 },
  { wch: 40 },
  { wch: 85 },
  { wch: 15 }
];

const wsVars = XLSX.utils.aoa_to_sheet(variablesData);
wsVars['!cols'] = [
  { wch: 16 },
  { wch: 48 },
  { wch: 48 },
  { wch: 50 }
];

XLSX.utils.book_append_sheet(wb, wsGuide, 'Pasos Nuevo Ciclo');
XLSX.utils.book_append_sheet(wb, wsVars, 'Variables de Entorno');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const outputPath = path.join(publicDir, 'Pasos_Inicio_Ciclo_Escolar_TrackCM.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Excel file generated successfully at:', outputPath);
