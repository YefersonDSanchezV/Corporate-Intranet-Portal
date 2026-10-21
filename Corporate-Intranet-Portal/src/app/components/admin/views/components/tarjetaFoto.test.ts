import test from "node:test";
import assert from "node:assert/strict";
import type { PosicionFoto } from "../../../../api/plantillas";
import { acotarOffset, encuadreFoto, limiteOffset } from "./tarjetaFoto.ts";

// Geometría de la foto: el reencuadre nunca puede dejar huecos dentro del marco.

const MARCO = { x: 50, y: 50, ancho: 40, alto: 40 };

function posicion(extra: Partial<PosicionFoto> = {}): PosicionFoto {
  return { px: 50, py: 50, ancho: 40, alto: 40, redondo: true, ...extra };
}

test("sin zoom la foto cubre exactamente el marco", () => {
  const e = encuadreFoto(MARCO, posicion(), 1000, 1000);

  assert.deepEqual(e.marco, { x: 300, y: 300, ancho: 400, alto: 400 });
  assert.deepEqual(e.imagen, { x: 300, y: 300, ancho: 400, alto: 400 });
  assert.equal(e.zoom, 1);
});

test("el zoom agranda la imagen manteniéndola centrada en el marco", () => {
  const e = encuadreFoto(MARCO, posicion({ zoom: 2 }), 1000, 1000);

  assert.equal(e.imagen.ancho, 800);
  assert.equal(e.imagen.alto, 800);
  // Centrada: sobresale 200 px por cada lado del marco de 400.
  assert.equal(e.imagen.x, 100);
  assert.equal(e.imagen.y, 100);
});

test("un zoom inválido se trata como 1", () => {
  assert.equal(encuadreFoto(MARCO, posicion({ zoom: 0 }), 1000, 1000).zoom, 1);
  assert.equal(encuadreFoto(MARCO, posicion({ zoom: -3 }), 1000, 1000).zoom, 1);
});

test("el desplazamiento se acota según el zoom", () => {
  assert.equal(limiteOffset(1), 0);
  assert.equal(limiteOffset(2), 50);
  assert.equal(limiteOffset(3), 100);

  assert.equal(acotarOffset(80, 1), 0);
  assert.equal(acotarOffset(80, 2), 50);
  assert.equal(acotarOffset(-80, 2), -50);
  assert.equal(acotarOffset(10, 2), 10);
});

test("con el desplazamiento al máximo la imagen sigue cubriendo el marco", () => {
  const e = encuadreFoto(MARCO, posicion({ zoom: 2, offsetX: 999, offsetY: -999 }), 1000, 1000);

  assert.ok(e.imagen.x <= e.marco.x + 0.001, "la imagen debe empezar antes que el marco");
  assert.ok(
    e.imagen.x + e.imagen.ancho >= e.marco.x + e.marco.ancho - 0.001,
    "la imagen debe terminar después que el marco",
  );
  assert.ok(e.imagen.y <= e.marco.y + 0.001);
  assert.ok(e.imagen.y + e.imagen.alto >= e.marco.y + e.marco.alto - 0.001);
});

test("un marco pequeño y descentrado se respeta igual", () => {
  const e = encuadreFoto({ x: 80, y: 20, ancho: 20, alto: 30 }, posicion(), 1000, 500);

  assert.deepEqual(e.marco, { x: 700, y: 25, ancho: 200, alto: 150 });
  assert.deepEqual(e.imagen, e.marco);
});

test("sin marco utiliza la posición de foto guardada (plantillas antiguas)", () => {
  const e = encuadreFoto(null, posicion({ px: 25, py: 75, ancho: 10, alto: 10 }), 1000, 1000);

  assert.deepEqual(e.marco, { x: 200, y: 700, ancho: 100, alto: 100 });
});

test("un marco sin datos no rompe la tarjeta", () => {
  const e = encuadreFoto(null, null, 1000, 1000);

  assert.ok(e.marco.ancho > 0 && e.marco.alto > 0);
  assert.equal(e.zoom, 1);
});
