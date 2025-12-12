# Guía de Migración de Properties

Esta guía te ayudará a migrar y optimizar tu archivo `properties.json`.

## Archivos Creados

### 1. Tipos TypeScript
**`types/properties.ts`**
- Definiciones de tipos para todas las estructuras de datos
- Type guards para validación en tiempo de ejecución
- Interfaces para filtros y paginación

### 2. JSON Schema
**`schemas/properties-schema.json`**
- Schema JSON completo para validación
- Reglas de validación para todos los campos
- Patrones para URLs, áreas, y otros campos

### 3. Scripts

#### Validación: `scripts/validate-properties.js`
Valida la estructura y datos del archivo properties.json

**Uso:**
```bash
# Validar el archivo por defecto (data/properties.json)
node scripts/validate-properties.js

# Validar un archivo específico
node scripts/validate-properties.js data/categories/propiedades.json
```

**Checks realizados:**
- ✅ Estructura de datos completa
- ✅ Campos requeridos presentes
- ✅ Tipos de datos correctos
- ✅ URLs válidas
- ✅ IDs únicos
- ⚠️  Precios sospechosos (puede indicar error)
- ⚠️  Descripciones muy cortas
- ℹ️  Información sobre monedas y configuraciones

#### Migración: `scripts/migrate-properties.js`
Migra el archivo grande a archivos más pequeños por categoría

**Uso:**
```bash
# Ver qué haría sin hacer cambios (dry-run)
node scripts/migrate-properties.js --dry-run

# Migrar con todas las validaciones y backup
node scripts/migrate-properties.js --validate --backup

# Migrar con optimizaciones
node scripts/migrate-properties.js --validate --backup --optimize

# Migrar sin crear backup (no recomendado)
node scripts/migrate-properties.js --no-backup
```

**Opciones:**
- `--dry-run`: Muestra qué se haría sin hacer cambios
- `--validate`: Valida los datos antes de migrar
- `--backup`: Crea backup del archivo original (default: true)
- `--split`: Divide en archivos por categoría (default: true)
- `--optimize`: Aplica optimizaciones de URLs y datos

## Proceso de Migración Recomendado

### Paso 1: Validar Datos Actuales
```bash
node scripts/validate-properties.js
```

Revisa los errores y warnings. Corrige los errores críticos antes de continuar.

### Paso 2: Hacer Dry Run
```bash
node scripts/migrate-properties.js --dry-run --validate
```

Esto te mostrará:
- Tamaño actual del archivo
- Cuántos archivos se crearán
- Tamaño estimado de cada archivo
- Posibles problemas

### Paso 3: Migrar con Backup
```bash
node scripts/migrate-properties.js --validate --backup --optimize
```

Esto creará:
- `data/properties.backup-[timestamp].json` - Backup del original
- `data/properties-index.json` - Archivo de índice (5-10KB)
- `data/categories/propiedades.json` - Propiedades (150KB)
- `data/categories/oficinas.json` - Oficinas (15KB)
- `data/categories/solares.json` - Solares (120KB)
- `data/migration-report.json` - Reporte de la migración

### Paso 4: Actualizar el Código JavaScript

#### Opción A: Mantener Compatibilidad (Recomendado)

Mantén el archivo `properties.json` original y agrega soporte para cargar por categorías:

```javascript
class PropertiesManager {
    constructor() {
        this.propertiesData = null;
        this.useOptimizedLoading = true; // Flag para nuevo sistema
        this.init();
    }

    async init() {
        if (this.useOptimizedLoading && await this.checkOptimizedFiles()) {
            await this.loadOptimized();
        } else {
            // Fallback al archivo original
            await this.loadLegacy();
        }
    }

    async checkOptimizedFiles() {
        try {
            const response = await fetch('data/properties-index.json');
            return response.ok;
        } catch {
            return false;
        }
    }

    async loadOptimized() {
        // Cargar solo el índice primero
        const index = await fetch('data/properties-index.json').then(r => r.json());
        this.propertiesData = {
            categories: {},
            featured: index.featured
        };

        // Cargar categoría según se necesite
        // Por ejemplo, para la página actual
        const currentCategory = this.getCurrentCategory();
        if (currentCategory) {
            await this.loadCategory(currentCategory, index);
        }
    }

    async loadCategory(categoryName, index) {
        const categoryInfo = index.categories[categoryName];
        const response = await fetch(`data/${categoryInfo.dataUrl}`);
        const categoryData = await response.json();

        this.propertiesData.categories[categoryName] = categoryData;
    }

    async loadLegacy() {
        const response = await fetch('data/properties.json');
        this.propertiesData = await response.json();
    }

    getCurrentCategory() {
        // Detectar categoría según la página actual
        if (window.location.pathname.includes('propiedades')) return 'propiedades';
        if (window.location.pathname.includes('oficinas')) return 'oficinas';
        if (window.location.pathname.includes('solares')) return 'solares';
        return null;
    }
}
```

#### Opción B: Sistema Completamente Nuevo

Si prefieres reemplazar completamente el sistema:

1. Renombra `properties.json` a `properties-legacy.json`
2. Usa solo los nuevos archivos
3. Actualiza todas las referencias en el código

### Paso 5: Testing

1. **Test en local:**
   ```bash
   # Inicia un servidor local
   npx http-server -p 8080
   ```

2. **Verifica cada página:**
   - [ ] Página principal (featured properties)
   - [ ] Página de propiedades
   - [ ] Página de oficinas
   - [ ] Página de solares
   - [ ] Detalles de propiedades

3. **Verifica funcionalidad:**
   - [ ] Filtros funcionan correctamente
   - [ ] Paginación funciona
   - [ ] Búsquedas funcionan
   - [ ] Imágenes se cargan correctamente
   - [ ] Links a detalles funcionan

### Paso 6: Deploy

1. Sube los nuevos archivos a tu servidor/CDN
2. Mantén el archivo `properties.json` original como fallback
3. Monitorea errores en los primeros días
4. Si todo funciona bien, puedes eliminar el archivo original después de 1-2 semanas

## Optimizaciones Aplicadas (con --optimize)

### 1. Normalización de URLs
**Antes:**
```json
{
  "image": "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/1.png",
  "gallery": [
    "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/1.png",
    "https://lowest.nyc3.cdn.digitaloceanspaces.com/Propiedades/2/2.png"
  ]
}
```

**Después:**
```json
{
  "imageBase": "Propiedades/2",
  "image": "1.png",
  "gallery": ["1.png", "2.png"]
}
```

En el código:
```javascript
function buildImageUrl(property) {
  const cdnBase = 'https://lowest.nyc3.cdn.digitaloceanspaces.com';
  return `${cdnBase}/${property.imageBase}/${property.image}`;
}
```

**Beneficio:** Reduce el tamaño del archivo en ~30-40KB

### 2. Featured como Referencias
**Antes:** Duplica toda la información de la propiedad
**Después:** Solo guarda ID y categoría

```json
{
  "featured": [
    { "id": "prop-santiago-001", "category": "propiedades" },
    { "id": "prop-luxury-001", "category": "propiedades" }
  ]
}
```

**Beneficio:** Reduce redundancia, facilita actualizaciones

## Rollback Plan

Si algo sale mal:

```bash
# 1. Detener el sitio (opcional)

# 2. Restaurar desde backup
cp data/properties.backup-[timestamp].json data/properties.json

# 3. Eliminar archivos nuevos (opcional)
rm -rf data/categories/
rm data/properties-index.json

# 4. Reiniciar el sitio
```

## Mantenimiento Futuro

### Agregar Nueva Propiedad

**Opción 1:** Editar archivo de categoría directamente
```bash
# Editar el archivo correspondiente
vim data/categories/propiedades.json

# Validar
node scripts/validate-properties.js data/categories/propiedades.json

# Actualizar índice si es necesario
node scripts/update-index.js
```

**Opción 2:** Editar archivo completo y re-generar
```bash
# Editar el archivo completo (si lo mantienes)
vim data/properties-full.json

# Re-generar archivos divididos
node scripts/migrate-properties.js --no-backup
```

### Validación Continua

Agrega a tu CI/CD o como git pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/bash
node scripts/validate-properties.js
if [ $? -ne 0 ]; then
    echo "❌ Properties validation failed!"
    exit 1
fi
```

## Troubleshooting

### Error: "Failed to fetch properties-index.json"
- Verifica que el archivo existe en `data/properties-index.json`
- Verifica permisos del archivo
- Verifica que el servidor está sirviendo archivos JSON correctamente

### Error: "Category data not loading"
- Verifica que los archivos en `data/categories/` existen
- Verifica las URLs en `properties-index.json`
- Abre DevTools y revisa Network tab

### Imágenes no se cargan después de optimización
- Verifica que `imageBase` está configurado correctamente
- Verifica que tu código está usando `buildImageUrl()` o similar
- Verifica que el CDN está accesible

### Propiedades duplicadas en Featured
- Esto es normal en la versión sin optimizar
- Usa `--optimize` para convertir a referencias

## Preguntas Frecuentes

**P: ¿Debo hacer la migración?**
R: Si tu archivo es >200KB y notas lentitud en la carga inicial, sí. Si no tienes problemas de rendimiento, puedes esperar.

**P: ¿Puedo revertir los cambios?**
R: Sí, el script crea backups automáticos. Además, puedes mantener ambos sistemas en paralelo.

**P: ¿Necesito modificar mucho código?**
R: Con la Opción A (compatibilidad), los cambios son mínimos. La mayoría del código sigue funcionando igual.

**P: ¿Qué pasa con el SEO?**
R: No hay impacto en SEO. Los datos se cargan igual, solo que más rápido.

**P: ¿Funciona con TypeScript?**
R: Sí, incluye tipos TypeScript completos en `types/properties.ts`.

## Soporte

Para problemas o preguntas:
1. Revisa la documentación en `docs/optimization-plan.md`
2. Ejecuta el script con `--dry-run` para ver qué pasaría
3. Revisa los logs de validación
