# Plan de Optimización: properties.json

## Análisis de la Estructura Actual

### Estadísticas del Archivo
- **Tamaño**: 292KB (~7,669 líneas)
- **Propiedades totales**: 83 propiedades únicas
  - Propiedades residenciales: 77
  - Oficinas: 3
  - Solares: 82 ubicaciones (múltiples lotes por ubicación)

### Estructura Actual
```json
{
  "categories": {
    "propiedades": {
      "name": "...",
      "description": "...",
      "properties": [...]  // 77 propiedades
    },
    "oficinas": {
      "name": "...",
      "description": "...",
      "properties": [...]  // 3 propiedades
    },
    "solares": {
      "name": "...",
      "description": "...",
      "isListFormat": true,
      "data": [...]  // 82 ubicaciones
    }
  },
  "featured": [...]  // 3 propiedades destacadas
}
```

## Inconsistencias Identificadas

### 1. Estructura Heterogénea
- ❌ `propiedades` y `oficinas` usan `properties[]`
- ❌ `solares` usa `data[]` con estructura diferente
- ✅ **Solución**: Mantener estructuras separadas pero con nomenclatura consistente

### 2. Campos Opcionales Inconsistentes
**Propiedades con campos variables:**
- `showPrice` (opcional, no todas las propiedades lo tienen)
- `gallery` (opcional, ~60% de propiedades)
- `payment_plan` (opcional, ~40% de propiedades)
- `apartment_types` (opcional, ~30% de propiedades)
- `delivery` (opcional, ~20% de propiedades)
- `units` (opcional, algunas propiedades)

### 3. Tipos de Datos Mixtos
- `solar.area_m2`: puede ser `number` o `"CONSULTAR"`
- `solar.precio_usd_m2`: puede ser `number` o `"CONSULTAR"`
- `property.price`: siempre `number`, pero `showPrice: false` oculta el precio

### 4. Duplicación de Datos
- Las propiedades en `featured[]` son referencias duplicadas que ya existen en las categorías
- Galerías con 15-20 URLs de imágenes por propiedad

## Estrategia de Optimización

### Opción A: División por Categoría (RECOMENDADA)
**Ventajas**:
- ✅ Carga inicial más rápida (solo metadata)
- ✅ Facilita el mantenimiento por categoría
- ✅ Compatible con lazy loading
- ✅ Reduce el tamaño de bundle inicial

**Estructura propuesta**:
```
data/
├── properties-index.json        (5KB - metadata + featured)
├── categories/
│   ├── propiedades.json        (150KB)
│   ├── oficinas.json           (15KB)
│   └── solares.json            (120KB)
└── cache/
    └── properties-full.json    (generado - para backward compatibility)
```

**properties-index.json** (carga inicial):
```json
{
  "version": "2.0",
  "lastUpdated": "2025-01-15T00:00:00Z",
  "categories": {
    "propiedades": {
      "name": "Propiedades",
      "description": "...",
      "count": 77,
      "dataUrl": "categories/propiedades.json"
    },
    "oficinas": {
      "name": "Oficinas",
      "description": "...",
      "count": 3,
      "dataUrl": "categories/oficinas.json"
    },
    "solares": {
      "name": "Solares",
      "description": "...",
      "count": 82,
      "dataUrl": "categories/solares.json"
    }
  },
  "featured": [
    // Referencias a propiedades destacadas (solo IDs y datos mínimos)
  ]
}
```

### Opción B: División por Paginación
```
data/
├── properties-meta.json
├── propiedades/
│   ├── page-1.json (20 propiedades)
│   ├── page-2.json (20 propiedades)
│   └── ...
```
**Desventaja**: Más complejo para filtros y búsquedas

### Opción C: Mantenimiento del Archivo Único
**Solo optimización interna**:
- Normalizar estructura de datos
- Eliminar duplicaciones
- Comprimir URLs con base path

**Estimación de reducción**: 292KB → 220KB (24% reducción)

## Recomendación Final: Opción A + Optimizaciones

### Implementación en Fases

#### Fase 1: Estructura Optimizada (Semana 1)
1. ✅ Crear tipos TypeScript
2. ✅ Crear JSON Schema para validación
3. Normalizar datos existentes
4. Dividir en archivos por categoría

#### Fase 2: Actualizar Código (Semana 2)
1. Crear loader con caché
2. Actualizar `PropertiesManager` para lazy loading
3. Mantener backward compatibility

#### Fase 3: Optimizaciones Adicionales (Opcional)
1. Implementar CDN con compresión
2. Generar thumbnails optimizados
3. Implementar búsqueda con índice

## Mejoras Propuestas

### 1. Normalización de URLs de Imágenes
**Antes**:
```json
{
  "image": "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/1.png",
  "gallery": [
    "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/1.png",
    "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/2.png",
    ...
  ]
}
```

**Después**:
```json
{
  "imageBase": "Propiedades/2",
  "image": "1.png",
  "gallery": ["1.png", "2.png", "3.png", ...]
}
```
+ Configuración global:
```json
{
  "cdnBase": "https://lowest.nyc3.cdn.digitaloceanspaces.com"
}
```

**Reducción estimada**: 30-40KB

### 2. Optimización de Featured
**En lugar de duplicar propiedades completas**:
```json
{
  "featured": [
    { "categoryId": "propiedades", "propertyId": "prop-santiago-001" },
    { "categoryId": "propiedades", "propertyId": "prop-luxury-001" },
    { "categoryId": "solares", "locationId": "altos-de-arroyo-hondo-ii" }
  ]
}
```

### 3. Índice de Búsqueda
Crear un índice ligero para búsquedas sin cargar todos los datos:
```json
{
  "searchIndex": [
    {
      "id": "prop-santiago-001",
      "title": "Apartamentos de Alto Estándar en Santiago",
      "location": "Santiago",
      "type": "Apartamentos",
      "price": 230000,
      "category": "propiedades"
    }
  ]
}
```

## Plan de Migración

### Compatibilidad con Código Existente
1. Mantener `data/properties.json` como fallback (o generar automáticamente)
2. Crear adaptador que detecte qué sistema usar
3. Migración gradual sin downtime

### Validación de Datos
```bash
# Validar estructura antes de deploy
npm run validate-properties

# Generar archivo full si es necesario
npm run build-properties-full
```

## Beneficios Esperados

### Rendimiento
- ⚡ Carga inicial: 292KB → 5KB (98% reducción)
- ⚡ Tiempo de carga: ~800ms → ~50ms
- ⚡ First Contentful Paint mejorado

### Mantenibilidad
- 📝 Edición más fácil (archivos más pequeños)
- 🔍 Búsqueda y filtrado más rápidos
- ✅ Validación automática con schema

### Escalabilidad
- 📈 Fácil agregar nuevas categorías
- 🔄 Soporte para actualizaciones incrementales
- 💾 Caché más efectivo

## Próximos Pasos

1. ✅ Revisar y aprobar este plan
2. Ejecutar script de migración (en desarrollo)
3. Validar datos migrados
4. Actualizar código JS para usar nueva estructura
5. Testing en ambiente de staging
6. Deploy gradual a producción

## Estimación de Tiempo

- Migración de datos: 2-3 horas
- Actualización de código: 4-6 horas
- Testing y validación: 2-3 horas
- **Total**: 1-2 días de trabajo

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos durante migración | Baja | Alto | Backup completo antes de migrar |
| Incompatibilidad con código existente | Media | Alto | Mantener backward compatibility |
| Errores en producción | Media | Alto | Deploy gradual + rollback plan |
| Cambios en URLs de CDN | Baja | Medio | Validar todas las URLs |

## Preguntas para Decidir

1. ¿Prefieres mantener compatibilidad total con el archivo actual? (Opción C)
2. ¿O estás dispuesto a hacer cambios en el código JS para mejor rendimiento? (Opción A)
3. ¿Qué tan importante es la carga inicial rápida vs simplicidad de mantenimiento?
4. ¿Hay algún sistema de build/deploy que debamos considerar?
