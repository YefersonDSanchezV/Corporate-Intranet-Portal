# Composición automática de las tarjetas de cumpleaños

Este documento explica cómo se colocan la foto, el nombre, el cargo y la fecha sobre el
arte de una plantilla, cómo se protegen los adornos (por ejemplo el gorro navideño) y cómo
se configura todo desde la intranet.

## 1. Idea general

El arte de la plantilla (fondo, textos institucionales, adornos) **no se modifica nunca**.
Encima se dibuja una capa SVG con los datos variables. Todas las posiciones y tamaños se
guardan en **porcentaje** del lienzo, así que la tarjeta se ve igual a cualquier resolución.

Orden de capas:

```
arte base  ->  foto  ->  capa frontal (gorro, marco ilustrado)  ->  textos
```

La composición la calcula un motor **determinista** que mide el ancho real del texto con la
misma tipografía con la que lo dibuja el SVG. No se estima por número de caracteres: eso era
lo que hacía que los nombres largos se salieran del arte.

Archivos clave (en `Corporate-Intranet-Portal/src/app/components/admin/views/components/`):

| Archivo | Responsabilidad |
| --- | --- |
| `tarjetaLayout.ts` | Motor: medición, ajuste de líneas, obstáculos, colisiones y reorganización. |
| `tarjetaFoto.ts` | Geometría de la foto: marco, zoom y desplazamiento acotado. |
| `TarjetaCumplePreview.tsx` | Dibuja la tarjeta con el resultado del motor. |
| `EditorTarjetaCumple.tsx` | Editor: marco, textos, zonas protegidas y panel de composición. |

## 2. Qué hace el motor

Para cada campo visible y con contenido:

1. Calcula la caja horizontal disponible (`cajaHorizontal`). El `ancho` configurado es un
   **máximo**: si la caja se saliera del lienzo se recorta conservando el ancla (centro, o
   borde izquierdo/derecho si el texto está alineado a un lado).
2. Calcula el alto disponible (`altoDisponiblePx`) a partir del borde más cercano de: los
   textos vecinos, la foto y las zonas protegidas. Solo cuentan los obstáculos que se cruzan
   con el texto en horizontal.
3. Reparte el texto en líneas (`envolverTexto`) midiendo cada palabra.
4. Si no cabe, reduce la letra hasta `fuenteMin` (solo si `autoAjustar` está activo). Nunca
   reduce indefinidamente ni deja el texto fuera de su caja.
5. Si ni con el mínimo cabe, devuelve `noCabe` y el editor muestra un aviso.

Después, `componerTarjeta` detecta superposiciones y devuelve la lista de avisos:

| Tipo | Significado |
| --- | --- |
| `no-cabe` | El texto no entra ni con el tamaño mínimo. |
| `fuera-tarjeta` | El bloque se sale por arriba o por abajo. |
| `colision-foto` | El texto tapa la foto. |
| `colision-zona` | El texto tapa una zona protegida. |
| `colision-texto` | Dos textos se superponen. |

Los avisos se muestran bajo la vista previa y en el panel del campo. **No hay superposición
silenciosa**: si el motor no puede resolverlo, lo dice.

## 3. Zonas protegidas

Una zona protegida es una parte del arte que ningún dato puede tapar: el gorro navideño, un
logo, un marco ilustrado. Se guardan dentro de la configuración de la plantilla
(`genplanconfig`, campo JSON), sin tabla nueva:

```json
{
  "id": "gorro",
  "nombre": "Gorro navideño",
  "x": 82, "y": 12,
  "ancho": 26, "alto": 18,
  "forma": "rectangulo",
  "activa": true,
  "automatica": false
}
```

`x`/`y` son el **centro** de la zona; `ancho`/`alto` su tamaño, todo en % del lienzo.

### 3.1 Zona automática de la capa frontal

Si la plantilla tiene capa frontal (el PNG con transparencia que va sobre la foto), el sistema
lee su canal alfa y deduce qué parte del lienzo ocupa. Esa zona se añade automáticamente a las
protegidas, marcada como `automatica`.

Así el gorro queda protegido sin que nadie lo marque, y siempre coincide con la imagen real:
si se reemplaza la capa frontal, la zona se recalcula sola. Si la capa frontal cubre casi toda
la tarjeta (más del 55 % de la superficie), no se protege entera, porque no es un adorno
puntual y no dejaría sitio para los textos. El resultado se guarda en caché por imagen y no se
persiste.

#### Por qué el gorro tiene que ser capa frontal

En el arte original de diciembre el gorro está **dibujado dentro del PNG**: la foto se inserta
encima y lo tapa, así que el funcionario aparecía sin gorro (solo se veía el borde rojo por
encima del marco). Un adorno que debe quedar *sobre* la foto no puede estar horneado en el arte
base: tiene que ser un PNG con transparencia que se dibuje en esa capa.

La capa frontal se sube desde **Plantillas de Cumpleaños → Cambiar capa frontal**. En el caso
de diciembre se generó a partir del propio arte: se recortó el gorro (rojo + forro + pompón)
dejándolo con transparencia y se subió como `gorro-navideno.png` (2600×2600, el mismo lienzo
que la plantilla). El resultado es que el gorro se dibuja sobre la foto y, además, queda
protegido automáticamente (zona detectada: centro 77,7 % / 28 %, 19 % × 17,8 %).

Si en otra plantilla hay adornos dibujados en el arte base, el procedimiento es el mismo:
recortarlos con transparencia y subirlos como capa frontal. La alternativa es marcar la zona
a mano, pero entonces el adorno sigue debajo de la foto.

### 3.2 Colocar la capa frontal (moverla y cambiar su tamaño)

La capa frontal es un **elemento más de la tarjeta**: se puede mover y cambiar de tamaño
como el marco de la foto o los textos. En el editor, *Composición → Capa frontal →
Colocar la capa frontal* muestra su recuadro sobre la tarjeta, con un tirador en la
esquina para cambiar el tamaño y los valores exactos (X, Y, ancho y alto, en %).

La imagen se dibuja **completa dentro del recuadro respetando su proporción** (encaje
interior, centrada). Por eso se puede subir cualquier PNG —no hace falta que tenga el
mismo tamaño que la plantilla— y colocarlo donde haga falta. *Volver al tamaño completo*
devuelve la capa a ocupar el lienzo entero, que es el comportamiento de las plantillas
que ya la tenían.

La zona protegida automática sigue a la capa: se deduce del canal alfa de la imagen y se
traslada con el recuadro, de modo que los textos nunca se ponen encima del adorno.

### 3.3 Zonas protegidas manuales

Para adornos **integrados en el arte base** (el gorro dibujado en el propio PNG, un logo, un
laurel) el administrador marca la zona a mano desde el editor:

1. Panel **Composición** → **Zonas protegidas** → *Añadir zona protegida*.
2. Arrastre la zona sobre el adorno y ajuste su tamaño con el punto de la esquina.

Las zonas manuales se activan o desactivan sin borrarse, y se ven dibujadas sobre la tarjeta
mientras se edita la plantilla.

### 3.4 Editar una plantilla que ya está en uso

En el listado de **Plantillas de Cumpleaños**, cada plantilla tiene la acción *Editar
composición*: abre el editor con el arte que ya está guardado (no hay que volver a subirlo)
para corregir la posición de los datos o añadir una zona protegida. Al terminar se pulsa
*Guardar composición*, que solo actualiza el JSON de configuración (`genplanconfig`); el arte,
la capa frontal y los cumpleaños ya asignados no se tocan.

Es la vía para proteger el gorro de una plantilla que lleva tiempo en uso: antes había que
borrarla y volver a cargarla, y el borrado se bloquea si ya está asignada a un cumpleaños.

## 4. Reorganización automática (sin IA)

Botón **Reorganizar automáticamente**. Es determinista y no necesita ningún servicio externo:

1. **Fase 1** – busca, para cada texto (nombre → cargo → fecha), el hueco libre más cercano a su
   posición actual donde quepa **con el tamaño de letra elegido**. Nunca agranda la letra ni
   mueve lo que ya es válido.
2. **Fase 2** – solo para lo que no cupo: acepta reducir la letra hasta `fuenteMin`, eligiendo
   el sitio donde quede lo más grande posible.
3. Lo que no consigue lo explica en el panel y deja los avisos visibles.

La propuesta se muestra **antes de aplicarse**, con sus explicaciones y el resultado de la
validación. El administrador decide con *Aplicar* o *Descartar*. El botón **Restablecer
composición original** devuelve los textos a la posición y el tamaño con los que se abrió el
editor.

## 5. Agente de IA (opcional)

El agente **no sustituye** al motor: recibe los datos ya medidos y solo propone ajustes
numéricos. La aplicación los vuelve a validar con el motor y, si dejan cualquier superposición,
el botón *Aplicar* queda bloqueado y se explica por qué.

- Si no hay proveedor configurado, el botón **ni aparece** y todo funciona con la
  reorganización determinista.
- Las credenciales viven **solo en el backend**; el navegador nunca las ve.
- No se envía el texto de las personas: solo la longitud, el número de palabras y las medidas
  reales.
- La sugerencia se muestra en un panel con estilo propio (violeta), distinto del azul de los
  cambios ya aplicados por el motor.

### 5.1 Configuración del proveedor

Variables de entorno del backend (todas opcionales):

| Variable | Descripción |
| --- | --- |
| `INTRANET_CUMPLE_IA_URL` | URL del proveedor. Vacía = agente desactivado. |
| `INTRANET_CUMPLE_IA_API_KEY` | Clave que se envía como `Authorization: Bearer`. |
| `INTRANET_CUMPLE_IA_MODELO` | Identificador del modelo; se envía en el cuerpo. |
| `INTRANET_CUMPLE_IA_TIEMPO_MAX_SEGUNDOS` | Tiempo máximo de espera (por defecto 20). |

### 5.2 Contrato del proveedor

`POST <INTRANET_CUMPLE_IA_URL>` con:

```json
{
  "modelo": "modelo-prueba",
  "sistema": "<instrucciones de composición>",
  "entrada": {
    "ancho": 2600,
    "alto": 2600,
    "campos": [
      { "campo": "nombre", "caracteres": 36, "palabras": 5,
        "x": 78, "y": 64.76, "ancho": 80, "fuente": 3.7,
        "lineas": 2, "anchoMaxLinea": 74.2, "noCabe": false }
    ],
    "obstaculos": [
      { "nombre": "la foto", "forma": "circulo",
        "x": 59.7, "y": 23.0, "ancho": 33.3, "alto": 33.3 }
    ]
  }
}
```

Debe responder:

```json
{
  "explicacion": "Muevo el nombre 4% hacia abajo para dejar libre el gorro.",
  "ajustes": [
    { "campo": "nombre", "x": 78, "y": 68.5, "ancho": 80, "fuente": 3.7, "motivo": "..." }
  ],
  "observaciones": ["..."]
}
```

El backend acota los valores (0–100 %, fuente 0.8–20 %), descarta campos desconocidos y limita a
3 ajustes y 5 observaciones. Si el proveedor falla, responde algo incomprensible o tarda
demasiado, el endpoint responde `204` y la interfaz sigue con su propio algoritmo: **la tarjeta
nunca depende de la IA**.

## 6. Modelo de configuración

Todo se guarda en el JSON de `genplanconfig` (columna `genplanconfig` de `genplantillacumple`),
validado al leer y al escribir por `ConfigTarjeta.normalizar()`. **No hace falta migración**: los
campos nuevos tienen valores por defecto y las plantillas antiguas se leen igual.

```json
{
  "nombre": { "visible": true, "x": 78, "y": 64.76, "ancho": 80, "fuente": 3.7,
              "color": "#FFFFFF", "alineacion": "center", "negrita": true,
              "cursiva": false, "mayusculas": true, "familia": "serif",
              "interlineado": 1.18, "autoAjustar": true,
              "fuenteMin": 2.22, "fuenteMax": 3.7 },
  "cargo": { "...": "..." },
  "fecha": { "...": "..." },
  "fotoMarco": { "visible": true, "forma": "circulo", "x": 76.4, "y": 39.6,
                 "ancho": 33.3, "alto": 33.3, "borde": true,
                 "colorBorde": "#FFFFFF", "grosorBorde": 3.5 },
  "zonasProtegidas": [ { "id": "gorro", "nombre": "Gorro navideño" } ],
  "frenteMarco": { "visible": true, "x": 50, "y": 50, "ancho": 100, "alto": 100 }
}
```

`frenteMarco` es el recuadro donde se dibuja la capa frontal (centro y tamaño, en % del
lienzo). Si no se informa, la capa ocupa el lienzo completo, que es el comportamiento de
las plantillas que ya la tenían.

Campos de ajuste por texto:

| Campo | Significado |
| --- | --- |
| `fuente` | Tamaño preferido, % del alto. |
| `fuenteMin` | Mínimo al que puede bajar el ajuste automático. |
| `fuenteMax` | Tope superior (se respeta, pero el motor solo reduce). |
| `autoAjustar` | Si es `false`, el texto nunca se reduce: se avisa. |
| `interlineado` | Múltiplo del tamaño de letra (0.8–2.5). |

Límites del backend: hasta 12 zonas por plantilla, configuración de hasta 8 000 caracteres,
coordenadas 0–100, `ancho`/`alto` de zona mayores que 0 y formas `rectangulo`/`circulo`.

## 7. Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/layout-cumple/agente` | Indica si hay proveedor de IA (`disponible`). |
| `POST` | `/api/layout-cumple/sugerencia` | Sugerencia del agente; `204` si no hay proveedor. |
| `PUT` | `/api/plantillas-cumpleanios/{id}/config` | Guarda la composición de una plantilla ya creada. |

El resto se reutiliza de `/api/plantillas-cumpleanios` (alta, capa frontal, borrado). La
composición automática se calcula en el navegador porque es el único que conoce las fuentes
reales de renderizado; el backend no duplica ese cálculo.

`PUT .../{id}/config` recibe `{"config": "<json>"}`, normaliza el documento igual que en el alta
(marca obligatoria, tope de 12 zonas, coordenadas 0–100) y sincroniza las columnas de posición
de la foto con el marco guardado.

## 8. Pruebas

- `Corporate-Intranet-Portal` → `npm test`: **38 pruebas** (30 del motor: medición, ajuste,
  zonas, colisiones, reorganización y determinismo; 8 de la geometría de la foto: proporción,
  zoom y límites del desplazamiento).
- `intranet-backend` → `.\mvnw.cmd -B clean test`: **71 pruebas**, incluidas `ConfigTarjetaTest`
  (zonas y normalización), `AgenteLayoutCumpleServiceTest` (agente desactivado, respuestas
  saneadas) y `PlantillaCumpleaniosServiceTest` (guardado de la composición con zonas).

Las pruebas del frontend no necesitan navegador: la medición entra como parámetro, así que se
usa un medidor aproximado y los resultados son exactos y repetibles. La única parte que exige
navegador es la lectura del canal alfa de la capa frontal; se verificó con Chrome headless
sobre un PNG generado (adorno localizado → zona correcta; capa transparente o que llena el
lienzo → sin zona; imagen inválida → sin error).

## 9. Limitaciones conocidas

- El motor solo **reduce** la letra: nunca la agranda por encima de lo configurado.
- La protección de la capa frontal usa el rectángulo que ocupa su contenido visible (no su
  contorno exacto). Es conservadora: puede dejar algo más de margen del necesario.
- Si no hay ninguna composición válida, el resultado se deja con los avisos a la vista; el
  sistema no inventa una posición fuera de la tarjeta.
- No hay exportación a imagen: la tarjeta se muestra como SVG en el navegador. La vista previa
  y lo que se ve en pantalla usan exactamente el mismo motor, así que no pueden diferir.
