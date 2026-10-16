import type { User } from "../contexts/AuthContext";

export interface BirthdayInfo {
  id: string;
  nombreCompleto: string;
  fechaNacimiento: string; // ISO yyyy-MM-dd original
  fechaCumpleanos: string; // ISO yyyy-MM-dd año actual
  edad: number; // edad que cumple este año
  area: string; // cargo del sistema o cargo libre escrito (manual)
  username: string;
  diasRestantes: number; // 0 = hoy, >0 próximos, <0 ya pasó (distancia al próximo)
  esHoy: boolean;
  /** Origen del registro: automático (usuario del sistema) o manual (botón Nuevo). */
  origen: "sistema" | "manual";
  /** Oid del registro manual en el backend (solo origen manual persistido). */
  manualOid?: number;
}

export const EDAD_MINIMA = 14;
export const EDAD_MAXIMA = 100;

function parseLocalDate(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { y, m: mo, d };
}

export function isValidBirthDate(iso: string | undefined | null): boolean {
  if (!iso) return false;
  const p = parseLocalDate(iso);
  if (!p) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(p.y, p.m - 1, p.d);
  if (!(fecha < hoy)) return false; // debe ser anterior a hoy
  let edad = hoy.getFullYear() - p.y;
  const cumpleEsteAnio = new Date(hoy.getFullYear(), p.m - 1, Math.min(p.d, 28));
  // ajuste fino: si aún no ha cumplido este año, la edad actual es edad-1; validamos rango con la que cumplirá
  void cumpleEsteAnio;
  if (
    hoy.getMonth() < p.m - 1 ||
    (hoy.getMonth() === p.m - 1 && hoy.getDate() < p.d)
  ) {
    edad -= 1;
    // edad actual; pero también aceptamos si la que cumplirá está en rango
    const cumple = hoy.getFullYear() - p.y;
    if (cumple < EDAD_MINIMA || cumple > EDAD_MAXIMA) return false;
  }
  return edad >= EDAD_MINIMA - 1 && edad <= EDAD_MAXIMA;
}

function birthdayThisYear(p: { y: number; m: number; d: number }, year: number): Date {
  let d = p.d;
  if (p.m === 2 && p.d === 29) {
    const leap = new Date(year, 1, 29).getMonth() === 1;
    if (!leap) d = 28;
  }
  return new Date(year, p.m - 1, d);
}

function toISODate(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function userToBirthday(user: User, hoy = new Date()): BirthdayInfo | null {
  if (!user?.birthDate || user.status !== "active") return null;
  if (!isValidBirthDate(user.birthDate)) return null;
  const p = parseLocalDate(user.birthDate);
  if (!p) return null;
  const year = hoy.getFullYear();
  const fechaCumple = birthdayThisYear(p, year);
  const edad = year - p.y;

  const startHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const startCumple = new Date(fechaCumple.getFullYear(), fechaCumple.getMonth(), fechaCumple.getDate());
  const diffMs = startCumple.getTime() - startHoy.getTime();
  const diasRestantes = Math.round(diffMs / 86400000);
  const esHoy = diasRestantes === 0;

  return {
    id: user.id || user.username,
    nombreCompleto: user.fullName,
    fechaNacimiento: user.birthDate.slice(0, 10),
    fechaCumpleanos: toISODate(fechaCumple),
    edad,
    area: user.position || user.department || "",
    username: user.username,
    diasRestantes,
    esHoy,
    origen: "sistema",
  };
}

export interface ManualBirthdayEntry {
  nombreCompleto: string;
  fechaNacimiento: string; // ISO yyyy-MM-dd
  cargo: string; // texto libre, independiente del catálogo del sistema
  manualOid?: number;
  localId?: string;
}

/** Convierte un registro manual (cargo libre) a la misma forma de la tabla. */
export function manualToBirthday(entry: ManualBirthdayEntry, hoy = new Date()): BirthdayInfo | null {
  if (!entry?.fechaNacimiento || !isValidBirthDate(entry.fechaNacimiento)) return null;
  if (!entry.nombreCompleto?.trim() || !entry.cargo?.trim()) return null;
  const p = parseLocalDate(entry.fechaNacimiento);
  if (!p) return null;
  const year = hoy.getFullYear();
  const fechaCumple = birthdayThisYear(p, year);
  const edad = year - p.y;

  const startHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const startCumple = new Date(fechaCumple.getFullYear(), fechaCumple.getMonth(), fechaCumple.getDate());
  const diasRestantes = Math.round((startCumple.getTime() - startHoy.getTime()) / 86400000);

  return {
    id: entry.manualOid != null ? `manual-${entry.manualOid}` : entry.localId ?? `manual-${entry.nombreCompleto}-${entry.fechaNacimiento}`,
    nombreCompleto: entry.nombreCompleto.trim(),
    fechaNacimiento: entry.fechaNacimiento.slice(0, 10),
    fechaCumpleanos: toISODate(fechaCumple),
    edad,
    area: entry.cargo.trim(),
    username: "",
    diasRestantes,
    esHoy: diasRestantes === 0,
    origen: "manual",
    manualOid: entry.manualOid,
  };
}

export function buildBirthdays(users: User[], hoy = new Date()): BirthdayInfo[] {
  return users
    .map((u) => userToBirthday(u, hoy))
    .filter((b): b is BirthdayInfo => b !== null)
    .sort((a, b) => {
      const pa = parseLocalDate(a.fechaCumpleanos)!;
      const pb = parseLocalDate(b.fechaCumpleanos)!;
      if (pa.m !== pb.m) return pa.m - pb.m;
      if (pa.d !== pb.d) return pa.d - pb.d;
      return a.nombreCompleto.localeCompare(b.nombreCompleto, "es");
    });
}

/** Próximo cumpleaños (este año o el siguiente) para ordenar "quién sigue". */
export function diasHastaProximo(b: BirthdayInfo, hoy = new Date()): number {
  if (b.diasRestantes >= 0) return b.diasRestantes;
  // ya pasó este año: días hasta el del próximo año
  const p = parseLocalDate(b.fechaCumpleanos);
  if (!p) return 999;
  const next = birthdayThisYear({ y: p.y, m: p.m, d: p.d }, hoy.getFullYear() + 1);
  const startHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((next.getTime() - startHoy.getTime()) / 86400000);
}
