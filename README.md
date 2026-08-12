# TrackCM - Sistema de Gestión de Educación Física (Colegio Mexicano)

**TrackCM** es una Aplicación Web completa (Web App) alojada en **Google Apps Script (GAS)** y vinculada a **Google Sheets** como base de datos centralizada e historial permanente. Está diseñada para los profesores de Educación Física del Colegio Mexicano para registrar, evaluar, dar seguimiento histórico y clasificar el desempeño deportivo de los alumnos.

---

## 🚀 Guía de Instalación y Despliegue en Google Apps Script

### Paso 1: Crear la Hoja de Cálculo (Google Sheets)
1. Abre [Google Sheets](https://sheets.google.com) y crea una nueva Hoja de Cálculo.
2. Nómbrala: **"TrackCM - Base de Datos Educación Física"**.

### Paso 2: Abrir el Editor de Apps Script
1. En el menú superior de tu Hoja de Cálculo, ve a **Extensiones > Apps Script**.
2. Ponle nombre al proyecto en la parte superior izquierda: **"TrackCM Web App"**.

### Paso 3: Copiar los Archivos del Proyecto
En el panel izquierdo del editor de Apps Script, crea los siguientes 4 archivos con su nombre exacto:

1. **`Code.gs`** (Archivo de script `.gs`):
   - Reemplaza todo el contenido con el código de [`Code.gs`](file:///c:/Users/Memo%20Segovia/Desktop/TrackCM%20Educacion%20Fisica/Code.gs).
2. **`Index.html`** (Archivo HTML):
   - Haz clic en `+` > `HTML`, nombralos `Index` y pega el código de [`Index.html`](file:///c:/Users/Memo%20Segovia/Desktop/TrackCM%20Educacion%20Fisica/Index.html).
3. **`Styles.html`** (Archivo HTML):
   - Haz clic en `+` > `HTML`, nombralos `Styles` y pega el código de [`Styles.html`](file:///c:/Users/Memo%20Segovia/Desktop/TrackCM%20Educacion%20Fisica/Styles.html).
4. **`Scripts.html`** (Archivo HTML):
   - Haz clic en `+` > `HTML`, nombralos `Scripts` y pega el código de [`Scripts.html`](file:///c:/Users/Memo%20Segovia/Desktop/TrackCM%20Educacion%20Fisica/Scripts.html).

### Paso 4: Inicializar la Base de Datos
1. En el editor de Apps Script, en la barra de menú superior, selecciona la función **`initDatabase`** o **`seedDemoData`** del menú desplegable.
2. Haz clic en **Ejecutar** (Run ▶️).
3. Concede los permisos solicitados de Google Sheets.
4. Verás que automáticamente se crean y formatean las 6 pestañas requeridas en tu hoja:
   - `Usuarios`
   - `Alumnos`
   - `Inscripciones_Ciclos`
   - `Registros_Antropometricos`
   - `Registros_Atletismo`
   - `Registros_Cualitativos_y_Deportes`

### Paso 5: Desplegar como Aplicación Web (Web App)
1. Haz clic en el botón azul **Desplegar (Deploy)** en la parte superior derecha > **Nuevo despliegue (New deployment)**.
2. Selecciona el tipo de despliegue: ⚙️ **Aplicación Web (Web App)**.
3. Configura los parámetros:
   - **Descripción**: `TrackCM v1.0`
   - **Ejecutar como (Execute as)**: `Yo (Me)`
   - **Quién tiene acceso (Who has access)**: `Cualquiera (Anyone)` (o dentro de tu organización/colegio).
4. Haz clic en **Desplegar (Deploy)**.
5. Copia la **URL de la aplicación web** generada. ¡Listo! Esa URL es la que compartirás con los maestros y alumnos.

---

## 📌 Características de TrackCM

1. **Estructura de Ciclos Académicos**:
   - **Kínder, Primaria y Secundaria**: Ciclos ANUALES (ej. `2026-2027`).
   - **Preparatoria**: Ciclos SEMESTRALES (ej. `2026-3` para Ago-Dic, `2027-1` para Ene-Jun).

2. **Registro de Campo Móvil / Tablet**:
   - **Ficha Antropométrica**: Captura de peso y estatura con cálculo automático en tiempo real de Edad exact e IMC con semáforo de estado (Bajo peso, Normopeso, Sobrepeso, Obesidad).
   - **Módulo de Atletismo**:
     - *Velocidad / Resistencia*: Cronómetro digital integrado con registro de Vueltas (Laps) guardado en formato JSON.
     - *Salto / Lanzamiento*: Formulario de hasta 3 intentos con selección automática de la mejor marca personal.
   - **Pruebas Cualitativas**: Botones táctiles ultrarrápidos para evaluaciones de coordinación, disciplina y deportes (`Sobresaliente (S)`, `Regular (R)`, `N/A`).

3. **Expediente del Alumno**:
   - Ficha histórica que muestra la evolución de estatura, peso, IMC y marcas deportivas a través de los años o semestres.

4. **Leaderboards / Tablas de Posiciones**:
   - Podio interactivo de 1er (🥇 Gold), 2do (🥈 Silver) y 3er lugar (🥉 Bronze), además de la tabla Top 10 con filtros por Ciclo, Prueba, Nivel, Grupo y Género.

5. **Carga Masiva (CSV)**:
   - Permite subir listas masivas de alumnos por nivel, grado, grupo y ciclo en segundos desde la pestaña de Administración.
