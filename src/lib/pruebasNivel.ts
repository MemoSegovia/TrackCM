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
 * Retorna la lista de pruebas habilitadas según el Nivel Escolar seleccionado:
 * - Kinder: 50m Velocidad, 200m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Primaria Menor: 75m Velocidad, 200m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Primaria Mayor: 75m Velocidad, 600m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Secundaria: 75m Velocidad, 100m Velocidad, 800m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 * - Preparatoria: 75m Velocidad, 100m Velocidad, 800m Resistencia, Salto, Lanzamiento, Salto de Cuerda, Orden y Control, ABC
 */
export function getPruebasByNivel(nivelRaw?: string): OptionPrueba[] {
  const normNivel = normalizeNivelName(nivelRaw);

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
      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        { value: '200m Resistencia', label: '200m Resistencia', category: 'resistencia' },
        { value: 'Salto', label: 'Salto', category: 'campo' },
        { value: 'Lanzamiento', label: 'Lanzamiento', category: 'campo' },
        { value: 'Salto de Cuerda', label: 'Salto de Cuerda', category: 'evaluacion' },
        { value: 'Orden y Control', label: 'Orden y Control', category: 'evaluacion' },
        { value: 'ABC', label: 'ABC', category: 'evaluacion' },
      ];

    case 'Primaria Mayor':
      return [
        { value: '75m Velocidad', label: '75m Velocidad', category: 'velocidad' },
        { value: '600m Resistencia', label: '600m Resistencia', category: 'resistencia' },
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
