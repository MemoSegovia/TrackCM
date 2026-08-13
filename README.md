# 🏆 TrackCM — Sistema de Registro y Clasificación Deportiva (Colegio Mexicano)

**TrackCM** es una aplicación web moderna de alto rendimiento desarrollada en **Next.js (App Router)**, **React**, **TypeScript** y **Tailwind CSS**, diseñada para que los profesores de Educación Física del **Colegio Mexicano** registren, clasifiquen y consulten el desempeño deportivo de los estudiantes.

La base de datos completa se gestiona de forma transparente en **Google Sheets** a través de **Vercel Serverless Functions (API Routes)** utilizando una **Cuenta de Servicio (Service Account)** de Google Cloud.

---

## 🚀 Características Principales

1. **Autenticación por Roles (Google Sheets):**
   - **Maestro:** Acceso completo para tomar tiempos con el cronómetro, registrar saltos/lanzamientos, fichas antropométricas y evaluaciones cualitativas.
   - **Alumno:** Consulta individual de su propio historial, gráficas de evolución de IMC y récords en atletismo.
2. **Selectores en Cascada Dinámicos:**
   - `Ciclo Escolar` ➔ `Nivel` ➔ `Grado` ➔ `Grupo` ➔ `Alumno` (alimentados automáticamente desde Google Sheets).
3. **Módulo de Atletismo & Cronómetro de Precisión:**
   - Cronómetro de cancha con Iniciar, Pausar, Registrar Vuelta (Lap) y Detener.
   - Guardado automático con detalle de laps en JSON.
4. **Módulo de Saltos y Lanzamientos:**
   - Captura de hasta 3 intentos por atleta, destacando y guardando automáticamente la mejor marca.
5. **Ficha Antropométrica (IMC en Tiempo Real):**
   - Ingrese Peso (kg) y Estatura (cm). La interfaz calcula dinámicamente el IMC y la clasificación nutricional.
6. **Leaderboards & Tablas de Posiciones Top 3:**
   - Ranking de mejores marcas ordenado por prueba y filtrable por Grupo, Nivel o General.
7. **Modo Híbrido (Google API + Contingencia Demo):**
   - Si aún no has configurado tus credenciales de Google Cloud, la app funciona inmediatamente en **Modo Demo**, permitiendo probar la interfaz completa y la navegación sin interrupciones.

---

## 📊 Estructura de la Hoja de Google Sheets

Crea un libro de Google Sheets con las siguientes 5 pestañas exactamente con estos nombres de columna en la Fila 1:

### 1. `Usuarios`
`ID_Usuario` | `Nombre` | `Correo` | `Password` | `Rol` | `Nivel_Asignado`

### 2. `Alumnos_Inscritos`
`ID_Alumno` | `Nombre_Completo` | `Fecha_Nacimiento` | `Genero` | `Nivel` | `Grado` | `Grupo` | `Ciclo_Escolar`

### 3. `Registros_Antropometricos`
`ID_Registro` | `Fecha` | `ID_Alumno` | `Ciclo_Escolar` | `ID_Maestro` | `Edad` | `Peso_kg` | `Estatura_cm` | `IMC`

### 4. `Registros_Atletismo`
`ID_Registro` | `Fecha` | `ID_Alumno` | `Ciclo_Escolar` | `ID_Maestro` | `Prueba` | `Resultado_Principal` | `Detalle_JSON_Vueltas` | `Puntos`

### 5. `Registros_Cualitativos`
`ID_Registro` | `Fecha` | `ID_Alumno` | `Ciclo_Escolar` | `ID_Maestro` | `Deporte_o_Prueba` | `Calificacion`

---

## 🔑 Configuración de Google Cloud (Service Account)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto y habilita la API de **Google Sheets API**.
3. Ve a **IAM & Admin > Cuentas de servicio** y crea una nueva Service Account.
4. Genera una nueva clave en formato **JSON** y descárgala.
5. Abre tu hoja de Google Sheets y **compártela con el correo de la cuenta de servicio** (ej. `tu-service-account@proyecto.iam.gserviceaccount.com`) otorgándole permisos de **Editor**.
6. Copia el **ID de la hoja de cálculo** (se encuentra en la URL: `https://docs.google.com/spreadsheets/d/TU_SPREADSHEET_ID/edit`).

---

## ⚙️ Variables de Entorno (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto (o configúralo en Vercel):

```env
GOOGLE_CLIENT_EMAIL="tu-service-account@proyecto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID="TU_SPREADSHEET_ID_AQUI"
```

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000 en el navegador.
```

### Credenciales Demo de Prueba:
- **Maestro:** `maestro@colmexi.edu.mx` / Contraseña: `123`
- **Alumno:** `alumno@colmexi.edu.mx` / Contraseña: `123`

---

## 🚀 Despliegue en GitHub y Vercel

### Paso 1: Subir el proyecto a GitHub
```bash
git init
git add .
git commit -m "Initial commit TrackCM Colegio Mexicano"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/trackcm-educacion-fisica.git
git push -u origin main
```

### Paso 2: Desplegar en Vercel
1. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New" > "Project"**.
3. Importa el repositorio `trackcm-educacion-fisica`.
4. En el apartado **Environment Variables**, agrega:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SPREADSHEET_ID`
5. Haz clic en **Deploy**. ¡Listo! Tu aplicación quedará publicada en producción con SSL automático.

---

© 2026 Colegio Mexicano. Desarrollado para el Departamento de Educación Física.
