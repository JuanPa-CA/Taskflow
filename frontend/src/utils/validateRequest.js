export const CATEGORIAS_VALIDAS = [
  'Información',
  'Soporte',
  'Documento',
  'Consulta',
  'Actualización'
]

export const PRIORIDADES_VALIDAS = ['Alta', 'Media', 'Baja']

export const validateRequest = (datos) => {
  const errores = {}

  if (!datos.titulo || datos.titulo.trim().length === 0) {
    errores.titulo = 'El título es obligatorio'
  } else if (datos.titulo.trim().length < 3) {
    errores.titulo = 'El título debe tener al menos 3 caracteres'
  }

  if (!datos.descripcion || datos.descripcion.trim().length === 0) {
    errores.descripcion = 'La descripción es obligatoria'
  } else if (datos.descripcion.trim().length < 5) {
    errores.descripcion = 'La descripción debe tener al menos 5 caracteres'
  }

  if (!datos.categoria) {
    errores.categoria = 'La categoría es obligatoria'
  } else if (!CATEGORIAS_VALIDAS.includes(datos.categoria)) {
    errores.categoria = 'Categoría no válida'
  }

  if (!datos.prioridad) {
    errores.prioridad = 'La prioridad es obligatoria'
  } else if (!PRIORIDADES_VALIDAS.includes(datos.prioridad)) {
    errores.prioridad = 'Prioridad no válida'
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  }
}