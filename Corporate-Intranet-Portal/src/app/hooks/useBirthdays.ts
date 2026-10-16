import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usersApi, type BackendCumpleanosManualResponse, type BackendCumpleanosResponse, type ManualBirthdayBody } from "../api/users";
import { apiAvailable } from "../api/client";
import { buildBirthdays, manualToBirthday, type BirthdayInfo, type ManualBirthdayEntry } from "../utils/birthdays";

const LOCAL_KEY = "manual_birthdays";

interface LocalManual extends ManualBirthdayEntry {
  localId: string;
}

function readLocal(): LocalManual[] {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (!saved) return [];
    const arr = JSON.parse(saved);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function mapBackend(b: BackendCumpleanosResponse, hoy = new Date()): BirthdayInfo {
  const startHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fc = new Date(`${b.fechaCumpleanos}T00:00:00`);
  const dias = Math.round((new Date(fc.getFullYear(), fc.getMonth(), fc.getDate()).getTime() - startHoy.getTime()) / 86400000);
  return {
    id: `sistema-${b.oid}`,
    nombreCompleto: b.nombreCompleto,
    fechaNacimiento: b.fechaNacimiento.slice(0, 10),
    fechaCumpleanos: b.fechaCumpleanos.slice(0, 10),
    edad: b.edadQueCumple,
    area: b.cargoNombre ?? "",
    username: b.username,
    diasRestantes: dias,
    esHoy: dias === 0,
    origen: "sistema",
  };
}

function mapManualBackend(b: BackendCumpleanosManualResponse, hoy = new Date()): BirthdayInfo | null {
  return manualToBirthday(
    { nombreCompleto: b.nombreCompleto, fechaNacimiento: b.fechaNacimiento.slice(0, 10), cargo: b.cargo, manualOid: b.oid },
    hoy
  );
}

/**
 * Fuente del módulo de cumpleaños: automáticos (usuarios del sistema)
 * + manuales (botón "Nuevo cumpleaños", cargo en texto libre).
 * Los manuales se guardan en el servidor y, sin conexión, en localStorage.
 */
export function useBirthdays() {
  const { users } = useAuth();
  const [backend, setBackend] = useState<BackendCumpleanosResponse[] | null>(null);
  const [backendManual, setBackendManual] = useState<BackendCumpleanosManualResponse[] | null>(null);
  const [localManual, setLocalManual] = useState<LocalManual[]>(() => readLocal());
  const [loading, setLoading] = useState(true);

  const refreshManual = useCallback(async () => {
    try {
      if (!(await apiAvailable())) return false;
      const data = await usersApi.manualBirthdays.list();
      setBackendManual(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await apiAvailable())) return;
        try {
          const data = await usersApi.birthdays();
          if (!cancelled) setBackend(data);
        } catch {
          // fallback local (AuthContext)
        }
        await refreshManual();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshManual]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(localManual));
    } catch {
      // almacenamiento no disponible
    }
  }, [localManual]);

  const birthdays = useMemo<BirthdayInfo[]>(() => {
    const automaticos = backend ? backend.map((b) => mapBackend(b)) : buildBirthdays(users);
    const manuales: BirthdayInfo[] = backendManual
      ? backendManual.map((b) => mapManualBackend(b)).filter((b): b is BirthdayInfo => b !== null)
      : localManual.map((b) => manualToBirthday(b)).filter((b): b is BirthdayInfo => b !== null);
    const todos = [...automaticos, ...manuales];
    const vistos = new Set<string>();
    return todos
      .filter((b) => {
        const key = `${b.nombreCompleto.toLowerCase()}|${b.fechaNacimiento}`;
        if (b.origen === "sistema") return true;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      })
      .sort((a, b) => {
        const pa = a.fechaCumpleanos.split("-").map(Number);
        const pb = b.fechaCumpleanos.split("-").map(Number);
        if (pa[1] !== pb[1]) return pa[1] - pb[1];
        if (pa[2] !== pb[2]) return pa[2] - pb[2];
        return a.nombreCompleto.localeCompare(b.nombreCompleto, "es");
      });
  }, [backend, backendManual, localManual, users]);

  const addManual = useCallback(async (body: ManualBirthdayBody): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (await apiAvailable()) {
        await usersApi.manualBirthdays.create(body);
        await refreshManual();
        return { ok: true };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar en el servidor";
      // Sin permiso o error de validación: no usar respaldo local para no duplicar
      if (msg.includes("403") || msg.includes("401") || msg.includes("400")) return { ok: false, error: msg };
    }
    setLocalManual((prev) => [...prev, { ...body, localId: `local-${Date.now()}` }]);
    return { ok: true };
  }, [refreshManual]);

  const updateManual = useCallback(async (b: BirthdayInfo, body: ManualBirthdayBody): Promise<{ ok: boolean; error?: string }> => {
    if (b.origen !== "manual") return { ok: false, error: "Solo se pueden editar registros manuales" };
    if (b.manualOid != null) {
      try {
        await usersApi.manualBirthdays.update(b.manualOid, body);
        await refreshManual();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "No se pudo actualizar" };
      }
    }
    setLocalManual((prev) => prev.map((m) => (m.localId === b.id ? { ...m, ...body } : m)));
    return { ok: true };
  }, [refreshManual]);

  const removeManual = useCallback(async (b: BirthdayInfo): Promise<{ ok: boolean; error?: string }> => {
    if (b.origen !== "manual") return { ok: false, error: "Solo se pueden eliminar registros manuales" };
    if (b.manualOid != null) {
      try {
        await usersApi.manualBirthdays.remove(b.manualOid);
        await refreshManual();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "No se pudo eliminar" };
      }
    }
    setLocalManual((prev) => prev.filter((m) => m.localId !== b.id));
    return { ok: true };
  }, [refreshManual]);

  return { birthdays, loading, desdeBackend: backend !== null, addManual, updateManual, removeManual, refreshManual };
}
