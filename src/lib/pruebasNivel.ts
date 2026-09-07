export interface OptionPrueba {
  value: string;
  label: string;
  category: 'velocidad' | 'resistencia' | 'campo' | 'evaluacion';
}

export function normalizeNivelName(nivelRaw?: string): string {
  if (!nivelRaw) return 'General';
  const clean = nivelRaw.toLowerCase().trim();
  if (clean.includes('kinder')) return 'Kinder';
  if (clean.includes('primaria menor')) return 'Primaria Menor';
  if (clean.includes('primaria mayor')) return 'Primaria Mayor';
  if (clean.includes('secundaria')) return 'Secundaria';
  if (clean.includes('preparatoria') || clean.includes('prepa') || clean.includes('bachillerato')) return 'Preparatoria';
  return 'General';
}

/**
 * Retorna la lista de pruebas habilitadas según el Nivel Escolar y Grado seleccionado:
 * - Kinder: 50m Velocidad, 200m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Primaria Menor: 75m Velocidad, 200m Resistencia (1° y 2°) / 400m Resistencia (3°), Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Primaria Mayor: 75m Velocidad, 400m Resistencia (4°) / 600m Resistencia (5° y 6°), Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Secundaria: 75m Velocidad, 100m Velocidad, 800m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Preparatoria: 75m Velocidad, 100m Velocidad, 800m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 */
export function getPruebasByNivel(nivelRaw?: string, gradoRaw?: string): OptionPrueba[] {
  const normNivel = normalizeNivelName(nivelRaw);
  const cleanGrado = (gradoRaw || '').replace(/[^0-9]/g, '');

  switch (normNivel) {
    case 'Kinder':
      return [
        { value: '50m Velocidad', label: '50m Velocidad', category: 'velocidad' },
        { value: '200m Resistencia', label: '200m Resistencia', category: 'resistencia' },
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    case 'Primaria Menor':
      // 3° Grado: 400m Resistencia. 1° y 2°: 200m Resistencia.
      const resPruebasPMenor: OptionPrueba[] = [];
      if (cleanGrado === '3') {
        resPruebasPMenor.push({ value: '400m Resistencia', label: '400m Resistencia', category: 'resistencia' });
      } else if (cleanGrado === '1' || cleanGrado === '2') {
        resPruebasPMenor.push({ value: '200m Resistencia', label: '200m Resistencia', category: 'resistencia' });
      } else {
        resPruebasPMenor.push({ value: '200m Resistencia', label: '200m Resistencia (1° y 2°)', category: 'resistencia' });
        resPruebasPMenor.push({ value: '400m Resistencia', label: '400m Resistencia (3°)', category: 'resistencia' });
      }

      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        ...resPruebasPMenor,
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    case 'Primaria Mayor':
      // 4° Grado: 400m Resistencia. 5° y 6°: 600m Resistencia.
      const resPruebasPMayor: OptionPrueba[] = [];
      if (cleanGrado === '4') {
        resPruebasPMayor.push({ value: '400m Resistencia', label: '400m Resistencia', category: 'resistencia' });
      } else if (cleanGrado === '5' || cleanGrado === '6') {
        resPruebasPMayor.push({ value: '600m Resistencia', label: '600m Resistencia', category: 'resistencia' });
      } else {
        resPruebasPMayor.push({ value: '400m Resistencia', label: '400m Resistencia (4°)', category: 'resistencia' });
        resPruebasPMayor.push({ value: '600m Resistencia', label: '600m Resistencia (5° y 6°)', category: 'resistencia' });
      }

      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        ...resPruebasPMayor,
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    case 'Secundaria':
      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        { value: '100m Velocidad', label: '100m Velocidad', category: 'velocidad' },
        { value: '800m Resistencia', label: '800m Resistencia', category: 'resistencia' },
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    case 'Preparatoria':
      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        { value: '100m Velocidad', label: '100m Velocidad', category: 'velocidad' },
        { value: '800m Resistencia', label: '800m Resistencia', category: 'resistencia' },
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    default:
      return [
        { value: '50m Velocidad', label: '50m Velocidad (Kinder)', category: 'velocidad' },
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        { value: '100m Velocidad', label: '100m Velocidad', category: 'velocidad' },
        { value: '200m Resistencia', label: '200m Resistencia', category: 'resistencia' },
        { value: '400m Resistencia', label: '400m Resistencia', category: 'resistencia' },
        { value: '600m Resistencia', label: '600m Resistencia', category: 'resistencia' },
        { value: '800m Resistencia', label: '800m Resistencia', category: 'resistencia' },
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];
  }
}

export function getGradosByNivel(nivelRaw?: string): Array<{ value: string; label: string }> {
  const norm = normalizeNivelName(nivelRaw);

  switch (norm) {
    case 'Kinder':
      return [{ value: '3', label: '3° Grado (K3)' }];
    case 'Primaria Menor':
      return [
        { value: '1', label: '1° Grado' },
        { value: '2', label: '2° Grado' },
        { value: '3', label: '3° Grado' },
      ];
    case 'Primaria Mayor':
      return [
        { value: '4', label: '4° Grado' },
        { value: '5', label: '5° Grado' },
        { value: '6', label: '6° Grado' },
      ];
    case 'Secundaria':
      return [
        { value: '7', label: '7° Grado (1° Sec)' },
        { value: '8', label: '8° Grado (2° Sec)' },
        { value: '9', label: '9° Grado (3° Sec)' },
      ];
    case 'Preparatoria':
      return [
        { value: '10', label: '10° Grado (1° Prep)' },
        { value: '11', label: '11° Grado (2° Prep)' },
        { value: '12', label: '12° Grado (3° Prep)' },
      ];
    default:
      return [
        { value: '1', label: '1° Grado' },
        { value: '2', label: '2° Grado' },
        { value: '3', label: '3° Grado' },
        { value: '4', label: '4° Grado' },
        { value: '5', label: '5° Grado' },
        { value: '6', label: '6° Grado' },
        { value: '7', label: '7° Grado' },
        { value: '8', label: '8° Grado' },
        { value: '9', label: '9° Grado' },
        { value: '10', label: '10° Grado' },
        { value: '11', label: '11° Grado' },
        { value: '12', label: '12° Grado' },
      ];
  }
}
