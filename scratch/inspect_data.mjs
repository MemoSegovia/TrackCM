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

const { getRegistrosAtletismo, getRegistrosCualitativos } = await import('../src/lib/googleSheets.ts');

async function main() {
  const atl = await getRegistrosAtletismo();
  const pruebasAtl = new Set(atl.map((r) => r.Prueba));
  console.log('Pruebas en Registros_Atletismo:', Array.from(pruebasAtl));

  const cual = await getRegistrosCualitativos();
  const pruebasCual = new Set(cual.map((r) => r.Deporte_o_Prueba));
  console.log('Pruebas en Registros_Cualitativos:', Array.from(pruebasCual));
}

main().catch(console.error);
