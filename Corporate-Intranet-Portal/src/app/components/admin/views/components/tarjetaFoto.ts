import type { PosicionFoto } from "../../../../api/plantillas";

/**
 * Geometría de la foto dentro de la tarjeta.
 *
 * <p>El marco lo fija la plantilla (normalmente un círculo del arte). La foto se coloca
 * siempre cubriéndolo y el zoom/desplazamiento solo la mueven <b>por dentro</b>: el
 * desplazamiento se acota según el zoom para que el marco nunca quede vacío.</p>
 *
 * <p>Módulo puro y sin React, para poder probarlo sin navegador.</p>
 */

/** Límite de desplazamiento de la foto dentro del marco, según el zoom (%). */
export function limiteOffset(zoom: number): number {
  return ((Math.max(1, zoom) - 1) / 2) * 100;
}

/** Acota el desplazamiento al máximo que permite el zoom actual. */
export function acotarOffset(valor: number, zoom: number): number {
  const limite = limiteOffset(zoom);
  return Math.min(limite, Math.max(-limite, valor));
}

/** Marco visible de la foto, en % del lienzo. */
export interface MarcoFotoPct {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface CajaPx {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface EncuadreFoto {
  /** Rectángulo del marco, en px. */
  marco: CajaPx;
  /** Rectángulo que ocupa la imagen (con zoom), en px. */
  imagen: CajaPx;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Calcula el marco y la imagen en px. El resultado cumple siempre dos condiciones:
 * el zoom nunca es menor que 1 y la imagen cubre el marco por completo.
 */
export function encuadreFoto(
  marcoPct: MarcoFotoPct | null | undefined,
  posicion: PosicionFoto | null | undefined,
  anchoLienzo: number,
  altoLienzo: number,
): EncuadreFoto {
  const centroX = marcoPct?.x ?? posicion?.px ?? 50;
  const centroY = marcoPct?.y ?? posicion?.py ?? 50;
  const anchoMarco = Math.max(1, marcoPct?.ancho ?? posicion?.ancho ?? 30);
  const altoMarco = Math.max(1, marcoPct?.alto ?? posicion?.alto ?? 30);

  const marco: CajaPx = {
    x: ((centroX - anchoMarco / 2) / 100) * anchoLienzo,
    y: ((centroY - altoMarco / 2) / 100) * altoLienzo,
    ancho: (anchoMarco / 100) * anchoLienzo,
    alto: (altoMarco / 100) * altoLienzo,
  };

  const zoom = Math.max(1, posicion?.zoom ?? 1);
  const offsetX = acotarOffset(posicion?.offsetX ?? 0, zoom);
  const offsetY = acotarOffset(posicion?.offsetY ?? 0, zoom);

  const anchoImagen = marco.ancho * zoom;
  const altoImagen = marco.alto * zoom;
  const margenX = (anchoImagen - marco.ancho) / 2;
  const margenY = (altoImagen - marco.alto) / 2;

  return {
    marco,
    zoom,
    offsetX,
    offsetY,
    imagen: {
      x: marco.x - margenX + (offsetX / 100) * marco.ancho,
      y: marco.y - margenY + (offsetY / 100) * marco.alto,
      ancho: anchoImagen,
      alto: altoImagen,
    },
  };
}
