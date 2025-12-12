# 🎯 Mejoras al Script de Validación

## ¿Qué Cambió?

El script `validate-properties.js` ahora incluye **análisis avanzado** para ayudarte a:
1. Detectar nombres similares (posibles duplicados)
2. Identificar campos a estandarizar
3. Encontrar precios y datos a confirmar con dueños
4. Ver mejores prácticas para trabajar el JSON

## 🚀 Uso

```bash
# Validar el archivo
npm run validate

# O directamente
node scripts/validate-properties.js

# Guardar reporte completo
npm run validate > mi-reporte.txt
```

## 📊 Resultados de Tu Validación Actual

### ✅ Estado General
- **0 errores críticos** - Todo OK para commit
- **34 warnings** - No bloquean, pero deberían revisarse
- **17 pares de nombres similares** - Revisar si son duplicados
- **3 campos a estandarizar** - Para mejor consistencia
- **25 preguntas para dueños** - Datos a confirmar

---

## 🔍 1. NOMBRES SIMILARES DETECTADOS

El script encontró **17 pares** de propiedades con nombres muy parecidos.

### Ejemplos principales:

**Patrón detectado: "Apartamento de Oportunidad en [ubicación]"**
- La Julia: 3 propiedades con nombre similar (83% similitud)
- Bella Vista: 2 propiedades con nombre similar
- Naco: 3 propiedades con nombre similar

**Posibles acciones:**
1. ✅ Si son propiedades diferentes, agregar más detalles al título:
   - "Apartamento de Oportunidad en Naco" → "Apartamento 2H/2B en Naco - Piso 5"
   - "Apartamento de Oportunidad en La Julia" → "Apartamento Familiar en La Julia con Vista"

2. ✅ Si son duplicados, eliminar uno y conservar el mejor

**Torres en Naco:**
- "Torre Moderna en Naco - Bloque A"
- "Torre Moderna en Naco - Segunda Torre"
- "Torre Moderna en Naco - Tercera Torre"

👉 Estos parecen diferentes torres del mismo proyecto - **OK**, pero confirmar

---

## 📋 2. CAMPOS A ESTANDARIZAR

### A. Badge (55 valores únicos) ⚠️ MUCHA VARIACIÓN

**Actualmente hay 55 badges diferentes:**
- "Entrega Inmediata"
- "Proyecto Exclusivo"
- "Proyecto Innovador"
- ... y 52 más

**Sugerencia:** Reducir a 5-10 categorías estándar:
```json
// Badges recomendados:
"Destacado"          // Para propiedades premium
"Nuevo"              // Recién agregadas
"Entrega Inmediata"  // Listas para ocupar
"Oportunidad"        // Precio especial
"Preventa"           // En construcción
"Vendido"            // Ya vendidas (mantener para historial)
```

**Plan de acción:**
1. Revisar todos los badges actuales
2. Mapear cada uno a una categoría estándar
3. Actualizar en bloque

### B. Type (12 tipos diferentes) ⚠️ INCONSISTENCIAS

**Tipos actuales:**
- "Apartamento" vs "Apartamentos" (plural/singular)
- "Apartamento de Lujo" vs "Apartamentos de Lujo"
- "Oficina" vs "Oficinas"

**Sugerencia:** Estandarizar a singular:
```json
// Tipos recomendados:
"Apartamento"
"Apartamento de Lujo"
"Penthouse"
"Villa"
"Oficina"
"Loft"
"Proyecto Mixto"
"Multifamiliar"
```

### C. Estatus Legal en Solares 🔴 REQUIERE CORRECCIÓN

**Problema:** Algunos solares tienen "CON TITULO" (sin tilde)
**Correcto:** "CON TÍTULO" (con tilde)

**Valores válidos:**
- "CON TÍTULO"
- "DESLINDADO"
- "SIN DESLINDAR"
- "EN PROCESO"

**Acción:** Buscar y reemplazar "CON TITULO" → "CON TÍTULO"

---

## ❓ 3. PREGUNTAS PARA CONFIRMAR CON DUEÑOS

### A. Propiedades en DOP (3 propiedades)

Estas están en Pesos Dominicanos, no USD:

1. **propiedades[78]** "Villa en Cap Cana con Piscina"
   - Precio: 45,000,000 DOP
   - Ubicación: Cap Cana

2. **propiedades[79]** "Apartamento en Piantini - Moderno"
   - Precio: 18,500,000 DOP
   - Ubicación: Piantini

3. **propiedades[80]** "Penthouse en Naco con Terraza"
   - Precio: 32,000,000 DOP
   - Ubicación: Naco

**Pregunta:** ¿Es correcto que estén en DOP? La mayoría están en USD.
**Acción:** Si son excepciones válidas, está OK. Solo confirmar.

### B. Áreas Faltantes (17 propiedades con "N/A")

**Propiedades sin área definida:**
- prop-bella-vista-sur-001: "N/A"
- prop-el-cacique-001: "Proyecto Aprobado"
- prop-ensanche-isabelita-001: "N/A"
- ... y 14 más

**Acción:** Obtener las áreas reales de los dueños

### C. Precios de Solares Confusos (15 solares) 🔴 IMPORTANTE

**Problema:** Parece que guardaste el **precio total** en lugar del **precio por m²**

**Ejemplos:**
- **Herrera:** $122,000,000 por m² → Probablemente sea el precio total
  - Si área = 1,000 m², el real sería $122,000/m²

- **Calle Emma Balaguer:** $75,000,000 por m²
  - Si área = 500 m², el real sería $150,000/m²

- **Gaspar Hernández:** $11,600,000 por m²
  - Si área = 10,000 m², el real sería $1,160/m²

**Reporte completo guardado en:** `validation-report.txt`

**Acción:**
1. Verificar cada solar con precio > $50,000/m²
2. Si es precio total: dividir por área para obtener precio real por m²
3. Actualizar en el JSON

### D. Propiedades Duplicadas Potenciales

Ver sección de "Nombres Similares" arriba. Hay 25 pares a revisar.

---

## 💡 4. MEJORES PRÁCTICAS IMPLEMENTADAS

El script ahora te da guías automáticas:

### **Estadísticas de tu archivo:**
- ✅ 95% de propiedades tienen galería (muy bien!)
- ⚠️  49% tienen campo `showPrice` definido (considerar agregar a todas)

### **Guía para agregar nuevas propiedades:**
1. Copiar propiedad similar como plantilla
2. Cambiar ID (formato: `prop-[ubicacion]-[numero]`)
3. Rellenar campos requeridos
4. Subir imágenes al CDN primero
5. **Ejecutar:** `npm run validate`
6. Corregir errores
7. Commit con mensaje claro

### **Guía para precios:**
- ✅ USD por defecto
- ✅ Solo DOP si es explícitamente necesario
- ✅ Para solares: guardar **precio por m²**, no total
- ✅ Evitar redondear demasiado

---

## 🎯 Plan de Acción Recomendado

### PRIORIDAD ALTA 🔴
1. **Corregir estatus legal solares** (buscar/reemplazar)
   ```bash
   # En tu editor, buscar: "CON TITULO"
   # Reemplazar por: "CON TÍTULO"
   ```

2. **Verificar precios de solares** (15 solares con precios muy altos)
   - Revisar cada uno en `validation-report.txt`
   - Corregir si es precio total en lugar de por m²

3. **Obtener áreas faltantes** (17 propiedades con "N/A")
   - Contactar dueños
   - Actualizar cuando tengas los datos

### PRIORIDAD MEDIA 🟡
4. **Revisar nombres similares** (17 pares)
   - Confirmar si son duplicados o diferentes
   - Si son diferentes, hacer títulos más descriptivos

5. **Confirmar propiedades en DOP** (3 propiedades)
   - Verificar que sea correcto usar DOP

### PRIORIDAD BAJA 🟢
6. **Estandarizar badges** (55 → ~10 categorías)
   - Planificar categorías estándar
   - Mapear y actualizar en bloque

7. **Estandarizar types** (12 → ~8 tipos)
   - Unificar singular/plural
   - Consolidar variaciones

---

## 📝 Cómo Usar el Reporte

### Ver reporte completo:
```bash
npm run validate > reporte.txt
cat reporte.txt
```

### Ver solo errores críticos:
```bash
npm run validate 2>&1 | grep "❌"
```

### Ver solo nombres similares:
```bash
npm run validate 2>&1 | grep -A 3 "NOMBRES SIMILARES"
```

### Ver solo preguntas para dueños:
```bash
npm run validate 2>&1 | grep -A 50 "PREGUNTAS PARA CONFIRMAR"
```

---

## 🔄 Flujo de Trabajo Recomendado

```bash
# 1. Antes de editar
git pull

# 2. Editar properties.json
vim data/properties.json

# 3. Validar cambios
npm run validate

# 4. Si hay errores, corregir y volver al paso 3

# 5. Commit
git add data/properties.json
git commit -m "Update properties: [descripción]"

# 6. Push
git push
```

---

## 📊 Estructura Recomendada de Ahora en Adelante

### Para Propiedades:
```json
{
  "id": "prop-ubicacion-numero",
  "title": "Título Descriptivo Específico",
  "price": 250000,
  "showPrice": true,
  "currency": "USD",
  "location": "Ubicación, Ciudad",
  "type": "Apartamento",
  "area": "120 m²",
  "image": "url-imagen-principal",
  "description": "Descripción detallada...",
  "features": ["Feature 1", "Feature 2"],
  "status": "Disponible",
  "badge": "Destacado",
  "gallery": ["img1", "img2", "..."],
  "payment_plan": { /* opcional */ },
  "apartment_types": [ /* opcional */ ]
}
```

### Para Solares:
```json
{
  "ubicacion": "Nombre Claro y Consistente",
  "solares": [
    {
      "area_m2": 1000,
      "frente_m": 20,
      "fondo_m": 50,
      "precio_usd_m2": 1500,  // PRECIO POR M², no total!
      "estatus_legal": "CON TÍTULO"  // Con tilde!
    }
  ]
}
```

---

## ❓ Preguntas Frecuentes

**P: ¿Debo corregir todos los warnings?**
R: Los warnings no son críticos, pero mejorar la consistencia ayuda a largo plazo.

**P: ¿Cómo sé si dos propiedades son duplicadas?**
R: Revisa el reporte de nombres similares. Si tienen >90% similitud, probablemente sean duplicados.

**P: ¿Puedo ignorar las mejores prácticas?**
R: Sí, pero seguirlas hace el mantenimiento más fácil a futuro.

**P: ¿Cada cuánto debo ejecutar la validación?**
R: Antes de cada commit. Considéralo parte de tu checklist.

---

## 📞 Próximos Pasos

1. **HOY**: Revisar el `validation-report.txt` generado
2. **Esta semana**: Corregir prioridades ALTAS
3. **Próximas semanas**: Trabajar en prioridades MEDIAS y BAJAS
4. **Siempre**: Ejecutar `npm run validate` antes de commit

**Reporte completo guardado en:** `validation-report.txt`

---

**¿Preguntas?** El reporte completo tiene todos los detalles.
**¿Necesitas ayuda?** Revisa las secciones específicas arriba.
