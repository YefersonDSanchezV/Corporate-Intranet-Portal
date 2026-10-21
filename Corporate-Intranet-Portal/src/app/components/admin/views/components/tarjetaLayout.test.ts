import test from "node:test";
import assert from "node:assert/strict";
import type { CampoTarjeta, FotoMarco, ZonaProtegida } from "../../../../api/plantillas";
import {
  FRENTE_DEFECTO,
  altoDisponiblePx,
  avisosDe,
  componerTarjeta,
  crearMedidorAproximado,
  disponerTexto,
  encuadreFrente,
  obstaculosDe,
  reorganizarComposicion,
  resolverCampo,
  tocaObstaculo,
  zonaCapaFrontalEnLienzo,
  zonaDeCapaFrontal,
  zonasActivas,
  type DisposicionTexto,
  type EntradaComposicion,
} from "./tarjetaLayout.ts";

// Pruebas del motor de composición de textos: no necesitan navegador porque la
// medición entra como parámetro. El medidor aproximado cuenta cada carácter como
// media unidad de fuente, de modo que los resultados son exactos y repetibles.

const LIENZO = { ancho: 1000, alto: 1000 };
const medir = crearMedidorAproximado(0.5);
const ANCHO_DISPONIBLE = (80 / 100) * LIENZO.ancho;

function campo(extra: Partial<CampoTarjeta> = {}): CampoTarjeta {
  return {
    visible: true,
    x: 50,
    y: 50,
    ancho: 80,
    fuente: 5,
    color: "#000000",
    alineacion: "center",
    negrita: false,
    cursiva: false,
    mayusculas: false,
    familia: "sans",
    ...extra,
  };
}

function componer(texto: string, extra: Partial<CampoTarjeta> = {}, altoMaxPx?: number): DisposicionTexto {
  return disponerTexto({
    texto,
    campo: campo(extra),
    anchoLienzo: LIENZO.ancho,
    altoLienzo: LIENZO.alto,
    medir,
    altoMaxPx,
  });
}

test("un nombre corto se dibuja en una línea con el tamaño preferido", () => {
  const d = componer("ANA GÓMEZ");

  assert.equal(d.lineas.length, 1);
  assert.equal(d.lineas[0].texto, "ANA GÓMEZ");
  assert.equal(d.tamanoPct, 5);
  assert.equal(d.ajustado, false);
  assert.equal(d.noCabe, false);
});

test("un nombre extenso se reparte en varias líneas sin salirse del ancho", () => {
  const d = componer("YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO DE LA CRUZ");

  assert.ok(d.lineas.length > 1, `esperaba varias líneas, obtuve ${d.lineas.length}`);
  for (const linea of d.lineas) {
    assert.ok(
      linea.ancho <= ANCHO_DISPONIBLE + 0.5,
      `"${linea.texto}" mide ${linea.ancho}px y el ancho disponible es ${ANCHO_DISPONIBLE}px`,
    );
  }
  assert.equal(d.noCabe, false);
  assert.equal(d.ajustado, false);
});

test("el ancho editable cambia realmente el reparto en líneas", () => {
  const texto = "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO";

  const holgado = componer(texto, { ancho: 90 });
  const estrecho = componer(texto, { ancho: 30 });

  assert.ok(
    estrecho.lineas.length > holgado.lineas.length,
    `con 30% esperaba más líneas (${estrecho.lineas.length}) que con 90% (${holgado.lineas.length})`,
  );
});

test("una palabra que no se puede partir obliga a reducir la fuente", () => {
  const d = componer("CONSTANTINOPLAEXTRAORDINARIAMENTELARGO");

  assert.equal(d.lineas.length, 1);
  assert.equal(d.ajustado, true);
  assert.equal(d.noCabe, false);
  assert.ok(d.tamanoPct < 5, `debía reducirse por debajo del 5%, quedó en ${d.tamanoPct}%`);
  assert.ok(d.lineas[0].ancho <= ANCHO_DISPONIBLE + 0.5);
});

test("avisa cuando el texto no cabe ni con el tamaño mínimo", () => {
  const d = componer("X".repeat(80));

  assert.equal(d.ajustado, true);
  assert.equal(d.noCabe, true);

  const avisos = avisosDe({ nombre: d });
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].campo, "nombre");
  assert.equal(avisos[0].tipo, "no-cabe");
});

test("con el ajuste automático desactivado no se reduce la fuente", () => {
  const d = componer("X".repeat(80), { autoAjustar: false });

  assert.equal(d.ajustado, false);
  assert.equal(d.tamanoPct, 5);
  assert.equal(d.noCabe, true);
});

test("respeta el espacio vertical disponible frente a otros elementos", () => {
  const texto = "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO DE LA CRUZ";

  const justo = componer(texto, { ancho: 30 }, 200);
  assert.equal(justo.ajustado, true, "debía reducir la fuente para entrar en 200px");
  assert.equal(justo.noCabe, false);
  assert.ok(justo.caja.alto <= 200.5, `el bloque mide ${justo.caja.alto}px`);

  const imposible = componer(texto, { ancho: 30 }, 30);
  assert.equal(imposible.noCabe, true);
});

test("el interlineado separa las líneas y aumenta el alto del bloque", () => {
  const texto = "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO";

  const normal = componer(texto, { ancho: 30, interlineado: 1.18 });
  const amplio = componer(texto, { ancho: 30, interlineado: 2 });

  assert.equal(normal.lineas.length, amplio.lineas.length);
  assert.ok(amplio.altoTotal > normal.altoTotal);
  assert.ok(Math.abs(amplio.altoLinea / amplio.tamanoPx - 2) < 1e-9);
});

test("las mayúsculas se aplican antes de medir", () => {
  const d = componer("ana gómez", { mayusculas: true });

  assert.equal(d.lineas[0].texto, "ANA GÓMEZ");
});

test("el alineado mueve el ancla a los extremos de la caja", () => {
  const izquierda = componer("ANA", { alineacion: "left" });
  const derecha = componer("ANA", { alineacion: "right" });
  const centro = componer("ANA");

  assert.equal(izquierda.ancla, "start");
  assert.equal(izquierda.x, 100);
  assert.equal(derecha.ancla, "end");
  assert.equal(derecha.x, 900);
  assert.equal(centro.ancla, "middle");
  assert.equal(centro.x, 500);
});

test("el bloque no se sale del lienzo cuando cabe", () => {
  for (const y of [10, 25, 50, 75, 90]) {
    const d = componer("YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO DE LA CRUZ", { y });
    if (d.noCabe) continue;
    assert.ok(d.caja.y >= -0.5, `y=${y}: la caja empieza en ${d.caja.y}px`);
    assert.ok(d.caja.y + d.caja.alto <= LIENZO.alto + 0.5, `y=${y}: la caja termina en ${d.caja.y + d.caja.alto}px`);
  }
});

test("la composición es determinista", () => {
  assert.deepEqual(componer("MARÍA DEL CARMEN RODRÍGUEZ"), componer("MARÍA DEL CARMEN RODRÍGUEZ"));
});

test("el ancho configurado nunca deja el texto fuera de la tarjeta", () => {
  // Caso real de la plantilla de navidad: X=78% con ancho 80%.
  const d = componer("YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO", {
    x: 78,
    ancho: 80,
    fuente: 3.7,
    fuenteMin: 2.22,
  });

  assert.ok(d.caja.x >= -0.5, `la caja empieza en ${d.caja.x}px`);
  assert.ok(d.caja.x + d.caja.ancho <= LIENZO.ancho + 0.5, `la caja termina en ${d.caja.x + d.caja.ancho}px`);
  for (const linea of d.lineas) {
    assert.ok(
      linea.ancho <= d.caja.ancho + 0.5,
      `"${linea.texto}" mide ${linea.ancho}px y su caja solo ${d.caja.ancho}px`,
    );
  }
  // El punto de anclaje elegido por el administrador no se mueve con el alineado central.
  assert.equal(d.ancla, "middle");
  assert.equal(d.x, 780);
});

test("el alineado a la izquierda recorta la caja por el borde izquierdo", () => {
  const d = componer("PALABRA PALABRA PALABRA PALABRA", { x: 20, ancho: 80, alineacion: "left" });

  // La caja original (20% ± 40%) se salía por la izquierda: queda pegada al borde.
  assert.ok(d.caja.x >= -0.5, `la caja empieza en ${d.caja.x}px`);
  assert.equal(d.x, 0);
  assert.equal(d.ancla, "start");
});

test("un campo dentro de la tarjeta conserva su ancho configurado", () => {
  const d = componer("ANA", { x: 50, ancho: 80 });

  assert.equal(d.caja.x, 100);
  assert.equal(d.caja.ancho, 800);
  assert.equal(d.x, 500);
});

test("resolverCampo completa el rango de ajuste y lo mantiene coherente", () => {
  const sinExtremos = resolverCampo(campo({ fuente: 4.6 }));

  assert.equal(sinExtremos.autoAjustar, true);
  assert.equal(sinExtremos.interlineado, 1.18);
  assert.ok(Math.abs(sinExtremos.fuenteMin - 2.76) < 1e-9, `fuenteMin=${sinExtremos.fuenteMin}`);
  assert.equal(sinExtremos.fuenteMax, 4.6);

  const incoherente = resolverCampo(campo({ fuente: 2, fuenteMin: 8, fuenteMax: 6 }));

  assert.ok(incoherente.fuenteMin <= incoherente.fuente);
  assert.ok(incoherente.fuente <= incoherente.fuenteMax);
});

test("altoDisponiblePx limita con el borde del vecino, no con su centro", () => {
  // Vecino por debajo a 100px cuya mitad ocupa 20px: su borde superior queda a 80px
  // del centro, así que el bloque puede crecer 160px en total.
  assert.equal(altoDisponiblePx(500, 1000, [{ centroY: 600, medioAlto: 20 }]), 160);
  // Se toma el vecino más restrictivo.
  assert.equal(
    altoDisponiblePx(500, 1000, [
      { centroY: 800, medioAlto: 0 },
      { centroY: 620, medioAlto: 30 },
    ]),
    180,
  );
  // Sin vecinos manda el lienzo.
  assert.equal(altoDisponiblePx(500, 1000, []), 1000);
  assert.equal(altoDisponiblePx(50, 1000, []), 100);
  // Nunca devuelve cero, para que un campo pegado al borde siga siendo visible.
  assert.equal(altoDisponiblePx(0, 1000, []), 40);
});

test("la plantilla por defecto no encoge un nombre de dos líneas más de lo necesario", () => {
  // Configuración de fábrica: nombre al 72% con 4.6%, cargo al 79% con 3%.
  const alto = 1000;
  const centroNombre = 720;
  const altoLineaCargo = ((3 / 100) * alto) / 2;
  const disponible = altoDisponiblePx(centroNombre, alto, [{ centroY: 790, medioAlto: altoLineaCargo }]);

  const d = componer(
    "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO DE LA CRUZ",
    { y: 72, fuente: 4.6, fuenteMin: 2.76 },
    disponible,
  );
  assert.ok(!d.noCabe);
  assert.ok(d.caja.alto <= disponible + 0.5, `el bloque mide ${d.caja.alto}px y dispone de ${disponible}px`);
  // Cuando menos, sigue siendo legible: por encima del mínimo configurado.
  assert.ok(d.tamanoPct >= 2.76, `el tamaño quedó en ${d.tamanoPct}%`);
});

// ============================================ zonas protegidas y superposiciones

function zona(extra: Partial<ZonaProtegida> = {}): ZonaProtegida {
  return {
    id: "gorro",
    nombre: "Gorro navideño",
    forma: "rectangulo",
    x: 50,
    y: 20,
    ancho: 40,
    alto: 20,
    activa: true,
    ...extra,
  };
}

function marco(extra: Partial<FotoMarco> = {}): FotoMarco {
  return {
    visible: true,
    forma: "circulo",
    x: 50,
    y: 82,
    ancho: 30,
    alto: 30,
    borde: true,
    colorBorde: "#FFFFFF",
    grosorBorde: 3.5,
    ...extra,
  };
}

function entrada(
  opciones: {
    campos?: Partial<Record<"nombre" | "cargo" | "fecha", CampoTarjeta>>;
    textos?: Partial<Record<"nombre" | "cargo" | "fecha", string>>;
    zonas?: ZonaProtegida[];
    marcoFoto?: FotoMarco | null;
  } = {},
): EntradaComposicion {
  return {
    ancho: LIENZO.ancho,
    alto: LIENZO.alto,
    campos: {
      nombre: campo({ visible: false }),
      cargo: campo({ visible: false }),
      fecha: campo({ visible: false }),
      ...opciones.campos,
    },
    textos: { nombre: "", cargo: "", fecha: "", ...opciones.textos },
    marco: opciones.marcoFoto ?? null,
    zonas: opciones.zonas ?? [],
    medir,
  };
}

test("una zona protegida activa limita la altura del texto que tiene debajo", () => {
  // Zona de 100 a 300 px de alto; el nombre queda por encima y no puede invadirla.
  const composicion = componerTarjeta(
    entrada({
      campos: { nombre: campo({ y: 35, fuente: 8 }) },
      textos: { nombre: "YEFFERSON DAVID SANCHEZ VILLAMIL" },
      zonas: [zona()],
    }),
  );

  const nombre = composicion.disposiciones.nombre;
  assert.ok(nombre, "el nombre debería estar colocado");
  assert.ok(nombre.caja.y >= 300 - 0.5, `el texto empieza en ${nombre.caja.y}px y la zona llega a 300px`);
  assert.ok(
    !composicion.avisos.some((aviso) => aviso.tipo === "colision-zona"),
    "no debería haber colisión con la zona",
  );
});

test("una zona protegida desactivada no se tiene en cuenta", () => {
  const composicion = componerTarjeta(
    entrada({
      campos: { nombre: campo({ y: 35, fuente: 8 }) },
      textos: { nombre: "YEFFERSON DAVID SANCHEZ VILLAMIL" },
      zonas: [zona({ activa: false })],
    }),
  );

  assert.equal(zonasActivas([zona({ activa: false })]).length, 0);
  assert.ok(
    !composicion.avisos.some((aviso) => aviso.tipo === "colision-zona"),
    "una zona inactiva no debe generar avisos",
  );
});

test("avisa cuando el texto se superpone a la foto aunque se reduzca al mínimo", () => {
  const foto = marco({ x: 50, y: 50, ancho: 80, alto: 80 });
  const composicion = componerTarjeta(
    entrada({
      campos: { nombre: campo({ y: 50, fuente: 6, fuenteMin: 5.9 }) },
      textos: { nombre: "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO" },
      marcoFoto: foto,
    }),
  );

  assert.ok(
    composicion.avisos.some((aviso) => aviso.tipo === "colision-foto"),
    "debería avisar de la superposición con la foto",
  );
  assert.ok(
    composicion.avisos.some((aviso) => aviso.campo === "nombre"),
    "el aviso debe señalar el campo implicado",
  );
});

test("detecta dos textos superpuestos en lugar de dibujarlos en silencio", () => {
  const composicion = componerTarjeta(
    entrada({
      campos: {
        nombre: campo({ y: 50, fuente: 5 }),
        cargo: campo({ y: 50, fuente: 5 }),
      },
      textos: { nombre: "ANA GÓMEZ", cargo: "ANALISTA" },
    }),
  );

  assert.ok(
    composicion.avisos.some((aviso) => aviso.tipo === "colision-texto"),
    "debería avisar de los dos textos superpuestos",
  );
});

test("un círculo no colisiona por las esquinas vacías de su caja", () => {
  const circulo = {
    nombre: "la foto",
    forma: "circulo" as const,
    caja: { x: 0, y: 0, ancho: 100, alto: 100 },
  };
  assert.equal(tocaObstaculo({ x: 0, y: 0, ancho: 10, alto: 10 }, circulo), false);
  assert.equal(tocaObstaculo({ x: 40, y: 40, ancho: 10, alto: 10 }, circulo), true);
});

test("los obstáculos incluyen la foto y las zonas activas", () => {
  const obstaculos = obstaculosDe(marco(), [zona(), zona({ id: "b", activa: false })], 1000, 1000);

  assert.equal(obstaculos.length, 2);
  assert.equal(obstaculos[0].nombre, "la foto");
  assert.equal(obstaculos[0].forma, "circulo");
  assert.equal(obstaculos[1].nombre, "Gorro navideño");
});

// ============================================ reorganización automática

test("reorganizar saca el nombre de la zona protegida conservando el tamaño de letra", () => {
  const datos = entrada({
    campos: { nombre: campo({ x: 50, y: 20, ancho: 60, fuente: 5 }) },
    textos: { nombre: "ANA GÓMEZ" },
    zonas: [zona({ ancho: 100 })],
    marcoFoto: marco({ x: 50, y: 82 }),
  });

  const antes = componerTarjeta(datos);
  assert.ok(
    antes.avisos.some((aviso) => aviso.tipo === "colision-zona"),
    "el punto de partida debe tener un conflicto, si no la prueba no mide nada",
  );

  const propuesta = reorganizarComposicion(datos);
  const cambio = propuesta.cambios.nombre;
  assert.ok(cambio, "debería proponer mover el nombre");
  assert.ok(cambio.y >= 32, `se propuso y=${cambio.y}%, todavía dentro de la zona`);
  assert.equal(cambio.fuente, 5, "no hacía falta reducir la letra");
  assert.equal(propuesta.valida, true);
  assert.deepEqual(propuesta.composicion.avisos, []);
});

test("reorganizar reduce la letra solo cuando no hay hueco libre", () => {
  // Una franja estrecha entre dos zonas: cabe el texto, pero no al tamaño preferido.
  const datos = entrada({
    campos: { nombre: campo({ x: 50, y: 55, ancho: 60, fuente: 9 }) },
    textos: { nombre: "YEFFERSON DAVID SANCHEZ VILLAMIL OSORIO" },
    zonas: [
      zona({ id: "arriba", x: 50, y: 25, ancho: 100, alto: 20 }),
      zona({ id: "abajo", x: 50, y: 85, ancho: 100, alto: 20 }),
    ],
  });

  const propuesta = reorganizarComposicion(datos);

  assert.equal(propuesta.valida, true, `quedaron avisos: ${JSON.stringify(propuesta.composicion.avisos)}`);
  assert.ok(propuesta.cambios.nombre, "debería proponer un cambio");
  assert.ok(
    propuesta.cambios.nombre.fuente <= 9,
    "nunca debe aumentar la letra por encima de la elegida",
  );
  assert.ok(
    propuesta.explicaciones.length > 0,
    "debe explicar qué hizo para que el administrador lo revise",
  );
});

test("sin sitio posible lo explica y no deja la tarjeta sin avisos", () => {
  const datos = entrada({
    campos: { nombre: campo({ y: 50 }) },
    textos: { nombre: "ANA GÓMEZ" },
    zonas: [zona({ x: 50, y: 50, ancho: 100, alto: 100 })],
  });

  const propuesta = reorganizarComposicion(datos);

  assert.equal(propuesta.valida, false);
  assert.ok(
    propuesta.explicaciones.some((linea) => linea.includes("No se encontró")),
    `explicaciones: ${JSON.stringify(propuesta.explicaciones)}`,
  );
  assert.ok(propuesta.composicion.avisos.length > 0);
});

test("la reorganización es determinista", () => {
  const datos = entrada({
    campos: { nombre: campo({ x: 50, y: 20, ancho: 60, fuente: 5 }) },
    textos: { nombre: "ANA GÓMEZ" },
    zonas: [zona()],
    marcoFoto: marco(),
  });

  assert.deepEqual(reorganizarComposicion(datos), reorganizarComposicion(datos));
});

test("deja intacta la composición que ya es válida", () => {
  const datos = entrada({
    campos: { nombre: campo({ x: 50, y: 60, ancho: 60, fuente: 5 }) },
    textos: { nombre: "ANA GÓMEZ" },
    zonas: [zona()],
  });

  const propuesta = reorganizarComposicion(datos);

  assert.deepEqual(propuesta.cambios, {});
  assert.equal(propuesta.valida, true);
});

test("la zona de la capa frontal no rompe fuera del navegador", async () => {
  // Sin DOM no se puede leer el alfa: debe devolver null en lugar de lanzar.
  assert.equal(await zonaDeCapaFrontal(""), null);
  assert.equal(await zonaDeCapaFrontal("data:image/png;base64,AAAA"), null);
});

// ============================================ capa frontal: posición y tamaño

test("la capa frontal se dibuja dentro de su recuadro respetando la proporción", () => {
  // Lienzo de 1000x1000, recuadro de 40x20 % en el centro (400x200 px). La imagen
  // cuadrada de 500 px se encaja en el alto (200 px) y queda centrada.
  const caja = encuadreFrente({ visible: true, x: 50, y: 50, ancho: 40, alto: 20 }, 500, 500, 1000, 1000);

  assert.equal(caja.ancho, 200);
  assert.equal(caja.alto, 200);
  // Centrada en horizontal dentro del recuadro (300 + 100 de margen a cada lado).
  assert.equal(caja.x, 400);
  assert.equal(caja.y, 400);
});

test("sin recuadro propio la capa frontal ocupa el lienzo completo", () => {
  const caja = encuadreFrente(null, 2600, 2600, 1000, 1000);

  assert.equal(caja.x, 0);
  assert.equal(caja.y, 0);
  assert.equal(caja.ancho, 1000);
  assert.equal(caja.alto, 1000);
});

test("mover el recuadre mueve también el adorno dibujado", () => {
  const zona = { x: 50, y: 50, ancho: 20, alto: 20, anchoPx: 1000, altoPx: 1000, visible: true };

  const enLienzo = zonaCapaFrontalEnLienzo(zona, { visible: true, x: 50, y: 50, ancho: 100, alto: 100 }, 1000, 1000);
  assert.ok(enLienzo);
  assert.equal(Math.round(enLienzo.x), 50);
  assert.equal(Math.round(enLienzo.y), 50);
  assert.equal(Math.round(enLienzo.ancho), 20);

  // Al encoger el recuadro, el adorno se encoge con él y mantiene su posición.
  const reducido = zonaCapaFrontalEnLienzo(zona, { visible: true, x: 50, y: 50, ancho: 50, alto: 50 }, 1000, 1000);
  assert.ok(reducido);
  assert.equal(Math.round(reducido.ancho), 10);
  assert.equal(Math.round(reducido.x), 50);
});

test("una capa frontal sin contenido visible no genera zona", () => {
  const zona = { x: 0, y: 0, ancho: 0, alto: 0, anchoPx: 100, altoPx: 100, visible: false };

  assert.equal(zonaCapaFrontalEnLienzo(zona, FRENTE_DEFECTO, 1000, 1000), null);
  assert.equal(zonaCapaFrontalEnLienzo(null, FRENTE_DEFECTO, 1000, 1000), null);
});
