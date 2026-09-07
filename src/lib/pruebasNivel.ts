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
