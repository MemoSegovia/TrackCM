/**
 * TrackCM - Sistema de Gestión de Educación Física
 * Colegio Mexicano
 * Backend en Google Apps Script (Code.gs)
 */

// ==========================================
// 1. RUTAS Y SERVICIO WEB APP
// ==========================================

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('TrackCM - Colegio Mexicano')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// 2. INICIALIZACIÓN Y CONFIGURACIÓN DE HOJA DE CÁLCULO
// ==========================================

/**
 * Obtiene la Hoja de Cálculo activa.
 * Si es un script independiente (Standalone), abre la hoja guardada o crea una nueva automáticamente.
 */
function getSpreadsheet() {
  var ss = null;
  
  // 1. Intentar obtener Hoja de Cálculo vinculada activa
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId()) return ss;
  } catch (err) {
    // No está vinculado activamente
  }

  // 2. Intentar abrir por ID guardado en Propiedades del Script
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty("SPREADSHEET_ID");
  
  if (sheetId) {
    try {
      ss = SpreadsheetApp.openById(sheetId);
      if (ss) return ss;
    } catch (e) {
      // ID no válido o permisos insuficientes
    }
  }

  // 3. Si no existe ninguna, crear automáticamente una nueva Hoja de Cálculo en Google Drive
  try {
    ss = SpreadsheetApp.create("TrackCM - Base de Datos Educación Física");
    props.setProperty("SPREADSHEET_ID", ss.getId());
    return ss;
  } catch (e) {
    Logger.log("Error al crear Spreadsheet automática: " + e.message);
    return null;
  }
}

/**
 * Permite cambiar o vincular manualmente el ID de una Hoja de Cálculo existente.
 */
function setSpreadsheetId(sheetId) {
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    if (ss) {
      PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", sheetId);
      initDatabase();
      return { success: true, message: "Hoja de Cálculo vinculada correctamente: " + ss.getName() };
    }
  } catch (e) {
    return { success: false, message: "Error al abrir la hoja con ID " + sheetId + ": " + e.message };
  }
  return { success: false, message: "ID de Hoja no válido." };
}

/**
 * Inicializa automáticamente las 6 pestañas necesarias si no existen.
 */
function initDatabase() {
  var ss = getSpreadsheet();
  if (!ss) {
    return { success: false, message: "No se encontró ni se pudo crear la Hoja de Cálculo vinculada." };
  }

  var sheetsConfig = [
    {
      name: "Usuarios",
      headers: ["ID_Usuario", "Nombre", "Correo", "Rol", "Password_Hash", "Nivel", "Grado", "Grupo"]
    },
    {
      name: "Alumnos",
      headers: ["ID_Alumno", "Nombre_Completo", "Fecha_Nacimiento", "Genero"]
    },
    {
      name: "Inscripciones_Ciclos",
      headers: ["ID_Inscripcion", "ID_Alumno", "Nivel", "Grado", "Grupo", "Ciclo_Escolar", "Estatus"]
    },
    {
      name: "Registros_Antropometricos",
      headers: ["ID_Registro", "Fecha_Registro", "ID_Alumno", "Ciclo_Escolar", "ID_Maestro", "Edad_Calculada", "Peso_kg", "Estatura_cm", "IMC", "Comentarios"]
    },
    {
      name: "Registros_Atletismo",
      headers: ["ID_Registro", "Fecha_Registro", "ID_Alumno", "Ciclo_Escolar", "ID_Maestro", "Prueba", "Resultado_Principal", "Detalle_Vueltas_o_Intentos", "Puntos_o_Marca"]
    },
    {
      name: "Registros_Cualitativos_y_Deportes",
      headers: ["ID_Registro", "Fecha_Registro", "ID_Alumno", "Ciclo_Escolar", "ID_Maestro", "Prueba_o_Deporte", "Valor_o_Calificacion"]
    }
  ];

  sheetsConfig.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
      sheet.appendRow(cfg.headers);
      
      // Formato visual para encabezados
      var headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
      headerRange.setBackground("#0f172a"); // Dark Navy
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });

  return { success: true, message: "Base de datos de TrackCM inicializada en '" + ss.getName() + "'." };
}

/**
 * Semilla de Datos de Demostración para probar la Web App inmediatamente.
 */
function seedDemoData() {
  initDatabase();
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "No hay Spreadsheet disponible." };

  // Limpiar y repoblar datos de demostración
  var usuariosSheet = ss.getSheetByName("Usuarios");
  var alumnosSheet = ss.getSheetByName("Alumnos");
  var inscripcionesSheet = ss.getSheetByName("Inscripciones_Ciclos");
  var antropoSheet = ss.getSheetByName("Registros_Antropometricos");
  var atletismoSheet = ss.getSheetByName("Registros_Atletismo");
  var cualiSheet = ss.getSheetByName("Registros_Cualitativos_y_Deportes");

  // Usuarios
  if (usuariosSheet.getLastRow() <= 1) {
    var usuarios = [
      ["USR001", "Admin Colegio Mexicano", "admin@colegiomexicano.edu.mx", "Administrador", "admin123", "Todos", "Todos", "Todos"],
      ["USR002", "Prof. Juan Carlos Pérez", "juan.perez@colegiomexicano.edu.mx", "Maestro", "maestro123", "Primaria", "3°", "A"],
      ["USR003", "Profra. Sofía Morales", "sofia.morales@colegiomexicano.edu.mx", "Maestro", "maestro123", "Preparatoria", "2° Semestre", "A"],
      ["USR004", "Mateo Hernández Ruiz", "mateo.hernandez@colegiomexicano.edu.mx", "Alumno", "alumno123", "Primaria", "3°", "A"],
      ["USR005", "Valentina Gómez Torres", "valentina.gomez@colegiomexicano.edu.mx", "Alumno", "alumno123", "Preparatoria", "2° Semestre", "A"]
    ];
    usuarios.forEach(row => usuariosSheet.appendRow(row));
  }

  // Alumnos
  if (alumnosSheet.getLastRow() <= 1) {
    var alumnos = [
      ["ALU001", "Mateo Hernández Ruiz", "2016-05-14", "Varonil"],
      ["ALU002", "Camila Rodríguez Silva", "2016-08-22", "Femenil"],
      ["ALU003", "Santiago López Castro", "2016-02-10", "Varonil"],
      ["ALU004", "Valentina Gómez Torres", "2009-11-03", "Femenil"],
      ["ALU005", "Diego Martínez Flores", "2009-04-18", "Varonil"]
    ];
    alumnos.forEach(row => alumnosSheet.appendRow(row));
  }

  // Inscripciones
  if (inscripcionesSheet.getLastRow() <= 1) {
    var inscripciones = [
      ["INS001", "ALU001", "Primaria", "3°", "A", "2026-2027", "Activo"],
      ["INS002", "ALU002", "Primaria", "3°", "A", "2026-2027", "Activo"],
      ["INS003", "ALU003", "Primaria", "3°", "A", "2026-2027", "Activo"],
      ["INS004", "ALU004", "Preparatoria", "2° Semestre", "A", "2026-3", "Activo"],
      ["INS005", "ALU005", "Preparatoria", "2° Semestre", "A", "2026-3", "Activo"]
    ];
    inscripciones.forEach(row => inscripcionesSheet.appendRow(row));
  }

  // Antropométricos
  if (antropoSheet.getLastRow() <= 1) {
    var antropo = [
      ["REG-ANT-001", "2026-08-10 09:30:00", "ALU001", "2026-2027", "USR002", 10.2, 34.5, 138.0, 18.11, "Excelente condición"],
      ["REG-ANT-002", "2026-08-10 09:40:00", "ALU002", "2026-2027", "USR002", 10.0, 31.0, 134.5, 17.14, "Normopeso"],
      ["REG-ANT-003", "2026-08-10 10:15:00", "ALU004", "2026-3", "USR003", 16.7, 56.0, 165.0, 20.57, "Atleta destacada en Voleibol"]
    ];
    antropo.forEach(row => antropoSheet.appendRow(row));
  }

  // Atletismo
  if (atletismoSheet.getLastRow() <= 1) {
    var atletismo = [
      ["REG-ATL-001", "2026-08-11 10:00:00", "ALU001", "2026-2027", "USR002", "75m Velocidad", "11.45s", JSON.stringify({ laps: ["11.45s"], best: "11.45s" }), 95],
      ["REG-ATL-002", "2026-08-11 10:10:00", "ALU002", "2026-2027", "USR002", "75m Velocidad", "12.10s", JSON.stringify({ laps: ["12.10s"], best: "12.10s" }), 88],
      ["REG-ATL-003", "2026-08-11 10:20:00", "ALU003", "2026-2027", "USR002", "Salto de Longitud", "2.15m", JSON.stringify({ intent1: "1.95m", intent2: "2.10m", intent3: "2.15m", best: "2.15m" }), 92],
      ["REG-ATL-004", "2026-08-11 11:30:00", "ALU004", "2026-3", "USR003", "100m Velocidad", "13.20s", JSON.stringify({ laps: ["13.20s"], best: "13.20s" }), 98],
      ["REG-ATL-005", "2026-08-11 11:45:00", "ALU005", "2026-3", "USR003", "100m Velocidad", "12.50s", JSON.stringify({ laps: ["12.50s"], best: "12.50s" }), 96]
    ];
    atletismo.forEach(row => atletismoSheet.appendRow(row));
  }

  // Cualitativos y Deportes
  if (cualiSheet.getLastRow() <= 1) {
    var cuali = [
      ["REG-CUA-001", "2026-08-11 10:30:00", "ALU001", "2026-2027", "USR002", "Cuerda y Coordinación", "S"],
      ["REG-CUA-002", "2026-08-11 10:35:00", "ALU002", "2026-2027", "USR002", "Orden y Control", "S"],
      ["REG-CUA-003", "2026-08-11 12:00:00", "ALU004", "2026-3", "USR003", "Voleibol - Saque y Remate", "S"],
      ["REG-CUA-004", "2026-08-11 12:15:00", "ALU005", "2026-3", "USR003", "Fútbol - Dominio de Balón", "S"]
    ];
    cuali.forEach(row => cualiSheet.appendRow(row));
  }

  return { success: true, message: "Datos de demostración cargados exitosamente." };
}

// ==========================================
// 3. OBTENCIÓN DE DATOS INICIALES Y CATÁLOGOS
// ==========================================

function getInitialData() {
  var result = {
    ciclosActivos: [
      { id: "2026-2027", nombre: "Ciclo 2026-2027 (Kínder, Primaria, Secundaria)", tipo: "Anual" },
      { id: "2025-2026", nombre: "Ciclo 2025-2026 (Kínder, Primaria, Secundaria)", tipo: "Anual" },
      { id: "2026-3", nombre: "Semestre 2026-3 (Ago - Dic Preparatoria)", tipo: "Semestral" },
      { id: "2027-1", nombre: "Semestre 2027-1 (Ene - Jun Preparatoria)", tipo: "Semestral" }
    ],
    niveles: ["Kínder", "Primaria", "Secundaria", "Preparatoria"],
    gradosPorNivel: {
      "Kínder": ["1°", "2°", "3°"],
      "Primaria": ["1°", "2°", "3°", "4°", "5°", "6°"],
      "Secundaria": ["1°", "2°", "3°"],
      "Preparatoria": ["1° Semestre", "2° Semestre", "3° Semestre", "4° Semestre", "5° Semestre", "6° Semestre"]
    },
    grupos: ["A", "B", "C", "D"],
    pruebasAtleticas: ["Velocidad (50m / 75m / 100m)", "Resistencia (800m / 1500m)", "Salto de Longitud", "Lanzamiento de Pelota / Bala"],
    pruebasCualitativas: ["Cuerda y Coordinación", "Orden y Control", "Abecedario Motor (ABC)", "Fútbol", "Básquetbol", "Voleibol"],
    usuarios: [],
    alumnos: [],
    inscripciones: []
  };

  try {
    initDatabase();
    var ss = getSpreadsheet();
    if (!ss) return result;

    // Cargar usuarios
    var uSheet = ss.getSheetByName("Usuarios");
    if (uSheet && uSheet.getLastRow() > 1) {
      var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, uSheet.getLastColumn()).getValues();
      result.usuarios = uData.map(r => ({
        id: r[0], nombre: r[1], correo: r[2], rol: r[3], pass: r[4], nivel: r[5], grado: r[6], grupo: r[7]
      }));
    }

    // Cargar alumnos
    var aSheet = ss.getSheetByName("Alumnos");
    if (aSheet && aSheet.getLastRow() > 1) {
      var aData = aSheet.getRange(2, 1, aSheet.getLastRow() - 1, aSheet.getLastColumn()).getValues();
      result.alumnos = aData.map(r => ({
        id: r[0], nombreCompleto: r[1], fechaNacimiento: r[2], genero: r[3]
      }));
    }

    // Cargar inscripciones
    var iSheet = ss.getSheetByName("Inscripciones_Ciclos");
    if (iSheet && iSheet.getLastRow() > 1) {
      var iData = iSheet.getRange(2, 1, iSheet.getLastRow() - 1, iSheet.getLastColumn()).getValues();
      result.inscripciones = iData.map(r => ({
        id: r[0], idAlumno: r[1], nivel: r[2], grado: r[3], grupo: r[4], ciclo: r[5], estatus: r[6]
      }));
    }
  } catch (err) {
    Logger.log("Error en getInitialData: " + err.message);
  }

  return result;
}

// ==========================================
// 4. AUTENTICACIÓN Y SESIÓN
// ==========================================

function loginUser(correo, password) {
  var ss = getSpreadsheet();
  if (!ss) {
    // Fallback demo si no hay sheet disponible
    if (correo.includes("admin")) return { success: true, user: { id: "USR001", nombre: "Admin Colegio Mexicano", correo: correo, rol: "Administrador" } };
    if (correo.includes("prof")) return { success: true, user: { id: "USR002", nombre: "Prof. Juan Carlos Pérez", correo: correo, rol: "Maestro" } };
    return { success: true, user: { id: "USR004", nombre: "Mateo Hernández Ruiz", correo: correo, rol: "Alumno" } };
  }

  var uSheet = ss.getSheetByName("Usuarios");
  if (!uSheet || uSheet.getLastRow() <= 1) {
    return { success: false, message: "No existen usuarios registrados. Inicialice los datos primero." };
  }

  var data = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, uSheet.getLastColumn()).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var uCorreo = String(row[2]).trim().toLowerCase();
    var uPass = String(row[4]).trim();
    if (uCorreo === String(correo).trim().toLowerCase() && uPass === String(password).trim()) {
      return {
        success: true,
        user: {
          id: row[0],
          nombre: row[1],
          correo: row[2],
          rol: row[3],
          nivel: row[5],
          grado: row[6],
          grupo: row[7]
        }
      };
    }
  }

  return { success: false, message: "Correo o contraseña incorrectos." };
}

// ==========================================
// 5. REGISTROS Y OPERACIONES DE CAMPO
// ==========================================

/**
 * Guarda o actualiza un registro Antropométrico.
 */
function saveAnthropometricRecord(data) {
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "Error al acceder a la Hoja de Cálculo." };

  var sheet = ss.getSheetByName("Registros_Antropometricos");
  var regId = "REG-ANT-" + Date.now();
  var fecha = new Date().toLocaleString('es-MX');

  // Calcular IMC
  var estMetros = parseFloat(data.estaturaCm) / 100;
  var imc = 0;
  if (estMetros > 0) {
    imc = (parseFloat(data.pesoKg) / (estMetros * estMetros)).toFixed(2);
  }

  var row = [
    regId,
    fecha,
    data.idAlumno,
    data.cicloEscolar,
    data.idMaestro || "DOC-DESCONOCIDO",
    data.edadCalculada,
    parseFloat(data.pesoKg),
    parseFloat(data.estaturaCm),
    parseFloat(imc),
    data.comentarios || ""
  ];

  sheet.appendRow(row);
  return { success: true, message: "Registro Antropométrico guardado exitosamente.", imc: imc };
}

/**
 * Guarda un registro de Atletismo (Velocidad, Resistencia, Salto, Lanzamiento).
 */
function saveAthleticRecord(data) {
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "Error al acceder a la Hoja de Cálculo." };

  var sheet = ss.getSheetByName("Registros_Atletismo");
  var regId = "REG-ATL-" + Date.now();
  var fecha = new Date().toLocaleString('es-MX');

  var row = [
    regId,
    fecha,
    data.idAlumno,
    data.cicloEscolar,
    data.idMaestro || "DOC-DESCONOCIDO",
    data.prueba,
    data.resultadoPrincipal,
    typeof data.detalle === "object" ? JSON.stringify(data.detalle) : data.detalle,
    data.puntosOMarca || 0
  ];

  sheet.appendRow(row);
  return { success: true, message: "Marca atlética registrada exitosamente." };
}

/**
 * Guarda una evaluación Cualitativa o Deporte en Equipo.
 */
function saveQualitativeRecord(data) {
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "Error al acceder a la Hoja de Cálculo." };

  var sheet = ss.getSheetByName("Registros_Cualitativos_y_Deportes");
  var regId = "REG-CUA-" + Date.now();
  var fecha = new Date().toLocaleString('es-MX');

  var row = [
    regId,
    fecha,
    data.idAlumno,
    data.cicloEscolar,
    data.idMaestro || "DOC-DESCONOCIDO",
    data.pruebaODeporte,
    data.valorOCalificacion
  ];

  sheet.appendRow(row);
  return { success: true, message: "Evaluación cualitativa guardada con éxito." };
}

// ==========================================
// 6. CONSULTA DE EXPEDIENTE DEL ALUMNO
// ==========================================

function getStudentExpediente(idAlumno) {
  var ss = getSpreadsheet();
  var expediente = {
    alumno: null,
    inscripciones: [],
    antropometricos: [],
    atletismo: [],
    cualitativos: []
  };

  if (!ss) return expediente;

  // Alumno Info
  var aSheet = ss.getSheetByName("Alumnos");
  if (aSheet && aSheet.getLastRow() > 1) {
    var aData = aSheet.getRange(2, 1, aSheet.getLastRow() - 1, aSheet.getLastColumn()).getValues();
    var match = aData.find(r => r[0] === idAlumno);
    if (match) {
      expediente.alumno = { id: match[0], nombreCompleto: match[1], fechaNacimiento: match[2], genero: match[3] };
    }
  }

  // Inscripciones
  var iSheet = ss.getSheetByName("Inscripciones_Ciclos");
  if (iSheet && iSheet.getLastRow() > 1) {
    var iData = iSheet.getRange(2, 1, iSheet.getLastRow() - 1, iSheet.getLastColumn()).getValues();
    expediente.inscripciones = iData
      .filter(r => r[1] === idAlumno)
      .map(r => ({ id: r[0], nivel: r[2], grado: r[3], grupo: r[4], ciclo: r[5], estatus: r[6] }));
  }

  // Antropométricos
  var antSheet = ss.getSheetByName("Registros_Antropometricos");
  if (antSheet && antSheet.getLastRow() > 1) {
    var antData = antSheet.getRange(2, 1, antSheet.getLastRow() - 1, antSheet.getLastColumn()).getValues();
    expediente.antropometricos = antData
      .filter(r => r[2] === idAlumno)
      .map(r => ({
        id: r[0], fecha: r[1], ciclo: r[3], maestro: r[4], edad: r[5], peso: r[6], estatura: r[7], imc: r[8], comentarios: r[9]
      }));
  }

  // Atletismo
  var atlSheet = ss.getSheetByName("Registros_Atletismo");
  if (atlSheet && atlSheet.getLastRow() > 1) {
    var atlData = atlSheet.getRange(2, 1, atlSheet.getLastRow() - 1, atlSheet.getLastColumn()).getValues();
    expediente.atletismo = atlData
      .filter(r => r[2] === idAlumno)
      .map(r => ({
        id: r[0], fecha: r[1], ciclo: r[3], maestro: r[4], prueba: r[5], resultado: r[6], detalle: r[7], puntos: r[8]
      }));
  }

  // Cualitativos
  var cuaSheet = ss.getSheetByName("Registros_Cualitativos_y_Deportes");
  if (cuaSheet && cuaSheet.getLastRow() > 1) {
    var cuaData = cuaSheet.getRange(2, 1, cuaSheet.getLastRow() - 1, cuaSheet.getLastColumn()).getValues();
    expediente.cualitativos = cuaData
      .filter(r => r[2] === idAlumno)
      .map(r => ({
        id: r[0], fecha: r[1], ciclo: r[3], maestro: r[4], prueba: r[5], valor: r[6]
      }));
  }

  return expediente;
}

// ==========================================
// 7. CONSULTA Y CLASIFICACIÓN (LEADERBOARDS)
// ==========================================

/**
 * Obtiene el ranking Top 3 y Top 10 según filtros de Ciclo, Prueba, Nivel, Grado, Grupo y Género.
 */
function getLeaderboards(filters) {
  var ss = getSpreadsheet();
  if (!ss) return [];

  var atlSheet = ss.getSheetByName("Registros_Atletismo");
  var alumSheet = ss.getSheetByName("Alumnos");
  var inscSheet = ss.getSheetByName("Inscripciones_Ciclos");

  if (!atlSheet || atlSheet.getLastRow() <= 1) return [];

  var atlData = atlSheet.getRange(2, 1, atlSheet.getLastRow() - 1, atlSheet.getLastColumn()).getValues();
  var alumData = alumSheet.getLastRow() > 1 ? alumSheet.getRange(2, 1, alumSheet.getLastRow() - 1, alumSheet.getLastColumn()).getValues() : [];
  var inscData = inscSheet.getLastRow() > 1 ? inscSheet.getRange(2, 1, inscSheet.getLastRow() - 1, inscSheet.getLastColumn()).getValues() : [];

  // Mapeos rápidos
  var alumMap = {};
  alumData.forEach(r => { alumMap[r[0]] = { nombre: r[1], genero: r[3] }; });

  var inscMap = {};
  inscData.forEach(r => { inscMap[r[1] + "_" + r[5]] = { nivel: r[2], grado: r[3], grupo: r[4] }; });

  var filtered = [];

  atlData.forEach(r => {
    var idAlumno = r[2];
    var ciclo = r[3];
    var prueba = r[5];
    var resultado = r[6];
    var puntos = parseFloat(r[8]) || 0;

    var alumno = alumMap[idAlumno] || { nombre: "Alumno " + idAlumno, genero: "Desconocido" };
    var insc = inscMap[idAlumno + "_" + ciclo] || { nivel: "General", grado: "-", grupo: "-" };

    // Aplicar filtros opcionales
    if (filters.cicloEscolar && filters.cicloEscolar !== "TODOS" && ciclo !== filters.cicloEscolar) return;
    if (filters.prueba && filters.prueba !== "TODAS" && !prueba.toLowerCase().includes(filters.prueba.toLowerCase())) return;
    if (filters.nivel && filters.nivel !== "TODOS" && insc.nivel !== filters.nivel) return;
    if (filters.grupo && filters.grupo !== "TODOS" && (insc.grado + insc.grupo) !== filters.grupo && insc.grupo !== filters.grupo) return;
    if (filters.genero && filters.genero !== "TODOS" && alumno.genero !== filters.genero) return;

    filtered.push({
      idRegistro: r[0],
      idAlumno: idAlumno,
      nombreAlumno: alumno.nombre,
      genero: alumno.genero,
      ciclo: ciclo,
      nivel: insc.nivel,
      gradoGrupo: insc.grado + " " + insc.grupo,
      prueba: prueba,
      resultado: resultado,
      puntos: puntos
    });
  });

  // Ordenar por mejores puntos / marcas
  filtered.sort((a, b) => b.puntos - a.puntos);

  return filtered;
}

// ==========================================
// 8. CARGA MASIVA Y GESTIÓN ADMINISTRATIVA (CSV)
// ==========================================

function bulkRegisterStudents(csvArray, defaultCiclo) {
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "Hoja de Cálculo no encontrada." };

  initDatabase();

  var alumnosSheet = ss.getSheetByName("Alumnos");
  var inscripcionesSheet = ss.getSheetByName("Inscripciones_Ciclos");

  var count = 0;
  csvArray.forEach(function(row) {
    // Columnas esperadas: Nombre_Completo, Fecha_Nacimiento (AAAA-MM-DD), Genero, Nivel, Grado, Grupo, Ciclo_Escolar (opcional)
    if (!row[0] || row[0].toString().trim() === "" || row[0].toString().toLowerCase().includes("nombre")) return;

    var idAlumno = "ALU-" + (Date.now() + count);
    var nombre = row[0].toString().trim();
    var fechaNac = row[1] ? row[1].toString().trim() : "2015-01-01";
    var genero = row[2] ? row[2].toString().trim() : "Varonil";
    var nivel = row[3] ? row[3].toString().trim() : "Primaria";
    var grado = row[4] ? row[4].toString().trim() : "1°";
    var grupo = row[5] ? row[5].toString().trim() : "A";
    var ciclo = (row[6] && row[6].toString().trim() !== "") ? row[6].toString().trim() : defaultCiclo;

    // Agregar Alumno
    alumnosSheet.appendRow([idAlumno, nombre, fechaNac, genero]);

    // Agregar Inscripción
    var idInsc = "INS-" + (Date.now() + count);
    inscripcionesSheet.appendRow([idInsc, idAlumno, nivel, grado, grupo, ciclo, "Activo"]);

    count++;
  });

  return { success: true, count: count, message: "Se registraron " + count + " alumnos e inscripciones con éxito." };
}

// ==========================================
// 9. GENERADOR DE REPORTE INSTITUCIONAL (COLEGIO MEXICANO)
// ==========================================

/**
 * Genera y da formato exacto a una pestaña en Google Sheets para el Reporte Oficial
 * según la imagen institucional del Colegio Mexicano.
 */
function generateInstitutionalReportSheet(params) {
  var ss = getSpreadsheet();
  if (!ss) return { success: false, message: "No hay Hoja de Cálculo activa disponible." };

  var nivel = params.nivel || "Primaria";
  var grado = params.grado || "1°";
  var grupo = params.grupo || "A";
  var ciclo = params.cicloEscolar || "2026-2027";
  var mes = params.mes || "OCTUBRE";
  var maestroEF = params.maestroEF || "L.G.A.D. CARLOS ANDREY MENDEZ LOPEZ";
  var maestroEspanol = params.maestroEspanol || "PROFRA. CINTHYA KARINA ALDAPE ACUÑA";
  var maestroIngles = params.maestroIngles || "PROFRA. RAQUEL PINTOS HUERTA";

  var sheetName = "Reporte_" + nivel + "_" + grado.replace("°","") + grupo + "_" + mes;
  
  // Si la pestaña existe, se elimina para regenerarla completamente limpia
  var existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }

  var sheet = ss.insertSheet(sheetName);

  // 1. ANCHOS DE COLUMNAS
  sheet.setColumnWidth(1, 40);  // No.
  sheet.setColumnWidth(2, 260); // Nombre del Alumno
  sheet.setColumnWidth(3, 35);  // G (M/H)
  sheet.setColumnWidth(4, 95);  // Velocidad
  sheet.setColumnWidth(5, 105); // Lanzamiento
  sheet.setColumnWidth(6, 75);  // Salto
  sheet.setColumnWidth(7, 105); // Resistencia
  sheet.setColumnWidth(8, 80);  // Cuerda
  sheet.setColumnWidth(9, 100); // Orden y Control
  sheet.setColumnWidth(10, 65); // ABC

  // 2. ENCABEZADO INSTITUCIONAL
  sheet.getRange("A1:J1").merge().setValue("COLEGIO MEXICANO")
    .setFontFamily("Arial").setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("A2:J2").merge().setValue(nivel.toUpperCase())
    .setFontFamily("Arial").setFontSize(13).setFontStyle("italic").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("A3:J3").merge().setValue("CICLO ESCOLAR " + ciclo)
    .setFontFamily("Arial").setFontSize(11).setFontStyle("italic").setFontWeight("bold").setHorizontalAlignment("center");

  // Renglón 4: Docente EF y Fecha
  sheet.getRange("A4").setValue(maestroEF).setFontWeight("bold").setFontSize(10);
  sheet.getRange("J4").setValue("* " + grado + " " + mes.toUpperCase() + " " + new Date().getFullYear())
    .setFontWeight("bold").setFontSize(10).setHorizontalAlignment("right");

  // Renglón 5 y 6: Docentes Aula y Materia
  sheet.getRange("A5").setValue("ESPAÑOL:  " + maestroEspanol.toUpperCase()).setFontSize(9).setFontWeight("bold");
  sheet.getRange("G5").setValue("MATERIA: EDUCACION FISICA").setFontSize(9).setFontWeight("bold");

  sheet.getRange("A6").setValue("INGLES:  " + maestroIngles.toUpperCase()).setFontSize(9).setFontWeight("bold");
  sheet.getRange("G6").setValue("MES: " + mes.toUpperCase()).setFontSize(9).setFontWeight("bold");

  // Línea divisora negra inferior del encabezado
  sheet.getRange("A6:J6").setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // 3. TABLA DE ENCABEZADOS DE EVALUACIÓN (Renglón 8 y 9)
  // Caja de Grado y Grupo (Cajas combinadas A8:B9)
  var gradoCaja = sheet.getRange("A8:B9");
  gradoCaja.merge().setValue(grado + ' AÑO "' + grupo + '"')
    .setFontFamily("Arial").setFontSize(14).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  gradoCaja.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Titulos de Columnas
  sheet.getRange("C8").setValue("No.").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("D8").setValue("NOMBRE DEL ALUMNO").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("left");
  sheet.getRange("E8").setValue("G").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");

  sheet.getRange("F8").setValue("VELOCIDAD").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("G8").setValue("LANZAMIENTO").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("H8").setValue("SALTO").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("I8").setValue("RESISTENCIA").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("J8").setValue("CUERDA").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  sheet.getRange("K8").setValue("ORDEN\nY\nCONTROL").setFontWeight("bold").setFontSize(8).setHorizontalAlignment("center");
  sheet.getRange("L8").setValue("ABC").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");

  // Ajustar borde de encabezado de tabla
  sheet.getRange("A8:J9").setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  // 4. OBTENER DATOS DE ALUMNOS E HISTORIAL
  var reportData = getInstitutionalReportData(params);
  
  var startRow = 10;
  for (var i = 0; i < reportData.length; i++) {
    var alumno = reportData[i];
    var currRow = startRow + i;

    sheet.getRange(currRow, 1).setValue(i + 1).setHorizontalAlignment("center").setFontSize(9); // No.
    sheet.getRange(currRow, 2).setValue(alumno.nombreCompleto.toUpperCase()).setFontSize(9).setFontWeight("bold"); // Nombre
    sheet.getRange(currRow, 3).setValue(alumno.generoBadge).setHorizontalAlignment("center").setFontSize(9); // G (M/H)

    sheet.getRange(currRow, 4).setValue(alumno.velocidad).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 5).setValue(alumno.lanzamiento).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 6).setValue(alumno.salto).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 7).setValue(alumno.resistencia).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 8).setValue(alumno.cuerda).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 9).setValue(alumno.ordenControl).setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange(currRow, 10).setValue(alumno.abc).setHorizontalAlignment("center").setFontSize(9);

    // Bordes por fila
    sheet.getRange(currRow, 1, 1, 10).setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
  }

  return {
    success: true,
    sheetName: sheetName,
    message: "Reporte Institucional '" + sheetName + "' generado en Google Sheets exitosamente."
  };
}

/**
 * Obtiene los datos mapeados para el reporte oficial.
 */
function getInstitutionalReportData(params) {
  var ss = getSpreadsheet();
  var nivel = params.nivel || "Primaria";
  var grado = params.grado || "1°";
  var grupo = params.grupo || "A";
  var ciclo = params.cicloEscolar || "2026-2027";

  var result = [];

  if (!ss) {
    // Datos Demo formateados según la imagen del usuario
    return [
      { nombreCompleto: "ALAFFA LAYLA FABE", generoBadge: "M", velocidad: "19.27", lanzamiento: "5", salto: "0.5", resistencia: "55.51", cuerda: "R", ordenControl: "S", abc: "S" },
      { nombreCompleto: "BERNAL VICENCIO SANTIAGO CALEB", generoBadge: "H", velocidad: "19.93", lanzamiento: "3", salto: "1", resistencia: "52.34", cuerda: "N/A", ordenControl: "R", abc: "N/A" },
      { nombreCompleto: "BRIONES LARA JADEN DOMENIK", generoBadge: "H", velocidad: "18.5", lanzamiento: "5", salto: "1", resistencia: "59.1", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "DE LEÓN OCHOA RENATA SOFÍA", generoBadge: "M", velocidad: "24", lanzamiento: "5", salto: "0.5", resistencia: "52.36", cuerda: "N/A", ordenControl: "R", abc: "N/A" },
      { nombreCompleto: "GARCÍA MENDIOLA ROBERTA ABIGAIL", generoBadge: "M", velocidad: "21.4", lanzamiento: "7", salto: "0.5", resistencia: "54.1", cuerda: "S", ordenControl: "S", abc: "S" },
      { nombreCompleto: "GARZA ROBERTO EMILIANO", generoBadge: "H", velocidad: "22.5", lanzamiento: "5", salto: "1.25", resistencia: "57.8", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "GONZÁLEZ HERNÁNDEZ SOL XIMENA", generoBadge: "M", velocidad: "17.9", lanzamiento: "6", salto: "1.25", resistencia: "48.5", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "GUERRA BOCANEGRA VALENTINO", generoBadge: "H", velocidad: "19.5", lanzamiento: "13", salto: "1", resistencia: "49.4", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "GUTIÉRREZ TORRES ALDO GABRIEL", generoBadge: "H", velocidad: "19.55", lanzamiento: "5", salto: "0.5", resistencia: "57.4", cuerda: "N/A", ordenControl: "N/A", abc: "N/A" },
      { nombreCompleto: "HERNÁNDEZ MALDONADO ITALIA DE JESUS", generoBadge: "M", velocidad: "21.3", lanzamiento: "6", salto: "0.5", resistencia: "53.5", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "HERRERA RAMÍREZ NAIARA", generoBadge: "M", velocidad: "18.92", lanzamiento: "5", salto: "1.5", resistencia: "45.5", cuerda: "S", ordenControl: "S", abc: "S" },
      { nombreCompleto: "LEAL REGALADO SALVADOR", generoBadge: "H", velocidad: "21.3", lanzamiento: "9", salto: "1.5", resistencia: "53.5", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "LEAL RODRÍGUEZ JORGE EDELMIRO", generoBadge: "H", velocidad: "22.25", lanzamiento: "5", salto: "1.5", resistencia: "57.5", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "LEÓN GONZÁLEZ LYDIA PAOLA", generoBadge: "M", velocidad: "18.5", lanzamiento: "6", salto: "1.5", resistencia: "49.5", cuerda: "R", ordenControl: "R", abc: "R" },
      { nombreCompleto: "MAR SOFÍA", generoBadge: "M", velocidad: "22.3", lanzamiento: "8", salto: "1.5", resistencia: "51.5", cuerda: "R", ordenControl: "R", abc: "R" }
    ];
  }

  // Cargar datos reales de Google Sheets
  var alumSheet = ss.getSheetByName("Alumnos");
  var inscSheet = ss.getSheetByName("Inscripciones_Ciclos");
  var atlSheet = ss.getSheetByName("Registros_Atletismo");
  var cualiSheet = ss.getSheetByName("Registros_Cualitativos_y_Deportes");

  if (!alumSheet || !inscSheet) return result;

  var alumData = alumSheet.getLastRow() > 1 ? alumSheet.getRange(2, 1, alumSheet.getLastRow() - 1, alumSheet.getLastColumn()).getValues() : [];
  var inscData = inscSheet.getLastRow() > 1 ? inscSheet.getRange(2, 1, inscSheet.getLastRow() - 1, inscSheet.getLastColumn()).getValues() : [];
  var atlData = (atlSheet && atlSheet.getLastRow() > 1) ? atlSheet.getRange(2, 1, atlSheet.getLastRow() - 1, atlSheet.getLastColumn()).getValues() : [];
  var cualiData = (cualiSheet && cualiSheet.getLastRow() > 1) ? cualiSheet.getRange(2, 1, cualiSheet.getLastRow() - 1, cualiSheet.getLastColumn()).getValues() : [];

  var alumMap = {};
  alumData.forEach(r => {
    // Genero M (Mujer/Femenil), H (Hombre/Varonil)
    var g = (r[3] && String(r[3]).toLowerCase().startsWith("f")) ? "M" : "H";
    alumMap[r[0]] = { nombre: r[1], generoBadge: g };
  });

  // Filtrar inscritos por nivel, grado, grupo y ciclo
  var inscritos = inscData.filter(r => r[2] === nivel && r[3] === grado && r[4] === grupo && r[5] === ciclo);

  inscritos.forEach(i => {
    var idAlum = i[1];
    var alum = alumMap[idAlum] || { nombre: "Alumno " + idAlum, generoBadge: "H" };

    // Buscar pruebas del alumno
    var vel = "-", lanz = "-", salto = "-", res = "-";
    var cuerda = "-", orden = "-", abc = "-";

    atlData.forEach(a => {
      if (a[2] === idAlum) {
        var p = String(a[5]).toLowerCase();
        if (p.includes("velocidad")) vel = a[6];
        if (p.includes("lanzamiento")) lanz = a[6];
        if (p.includes("salto")) salto = a[6];
        if (p.includes("resistencia")) res = a[6];
      }
    });

    cualiData.forEach(c => {
      if (c[2] === idAlum) {
        var p = String(c[5]).toLowerCase();
        if (p.includes("cuerda")) cuerda = c[6];
        if (p.includes("orden")) orden = c[6];
        if (p.includes("abc")) abc = c[6];
      }
    });

    result.push({
      nombreCompleto: alum.nombre,
      generoBadge: alum.generoBadge,
      velocidad: vel,
      lanzamiento: lanz,
      salto: salto,
      resistencia: res,
      cuerda: cuerda,
      ordenControl: orden,
      abc: abc
    });
  });

  return result;
}

