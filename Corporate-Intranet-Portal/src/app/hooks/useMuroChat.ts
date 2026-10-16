import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { muroApi, type MuroMensaje } from "../api/muro";
import { apiAvailable } from "../api/client";

export interface ChatMessage extends MuroMensaje {
  tempId?: string;
  pendiente?: boolean;
}

const MAX_MENSAJES = 100;
const POLLING_MS = 5000;
const COOLDOWN_MS = 3000;
const NOMBRE_KEY = "muro_nombre";

function merge(prev: ChatMessage[], incoming: MuroMensaje[]): ChatMessage[] {
  if (incoming.length === 0) return prev;
  const oids = new Set(prev.map((m) => m.oid));
  const nuevos = incoming.filter((m) => !oids.has(m.oid));
  if (nuevos.length === 0) return prev;
  return [...prev, ...nuevos].slice(-MAX_MENSAJES);
}

/**
 * Chat del Muro de Cumpleaños: carga inicial + SSE instantáneo con
 * catch-up por oid al reconectar y fallback a polling si SSE falla.
 * Tope de 100 mensajes en memoria para no congelar el DOM.
 */
export function useMuroChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [modo, setModo] = useState<"sse" | "polling" | "off">("off");
  const [nombreInvitado, setNombreInvitado] = useState(() => {
    try {
      return localStorage.getItem(NOMBRE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const maxOid = useRef(0);
  const ultimoEnvio = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

  const registrarMax = useCallback((lista: ChatMessage[]) => {
    for (const m of lista) {
      if (m.oid > maxOid.current) maxOid.current = m.oid;
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!(await apiAvailable())) return;
        const data = await muroApi.ultimos();
        if (cancelled) return;
        setMessages(data.slice(-MAX_MENSAJES));
        registrarMax(data);
        setHasMore(data.length >= 50);
      } catch {
        // sin backend: muro vacío, se muestra aviso
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registrarMax]);

  // SSE con fallback a polling
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let errores = 0;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const aPolling = () => {
      if (cancelled || pollId) return;
      setModo("polling");
      const sondear = async () => {
        try {
          const data = await muroApi.nuevos(maxOid.current);
          if (cancelled || data.length === 0) return;
          setMessages((prev) => {
            const next = merge(prev, data);
            registrarMax(next);
            return next;
          });
        } catch {
          // reintenta en el siguiente ciclo
        }
      };
      void sondear();
      pollId = setInterval(sondear, POLLING_MS);
    };

    (async () => {
      if (!(await apiAvailable())) return;
      if (cancelled) return;
      try {
        es = new EventSource(muroApi.streamUrl());
        setModo("sse");
        es.addEventListener("mensaje", (ev) => {
          try {
            const m = JSON.parse((ev as MessageEvent).data) as MuroMensaje;
            setMessages((prev) => {
              // reconcilia optimista del propio mensaje
              const idx = prev.findIndex(
                (x) => x.pendiente && x.texto === m.texto && x.autorNombre === m.autorNombre
              );
              let next: ChatMessage[];
              if (idx >= 0) {
                next = [...prev];
                next[idx] = { ...m };
              } else {
                next = merge(prev, [m]);
              }
              registrarMax(next);
              return next;
            });
          } catch {
            // mensaje malformado: se ignora
          }
        });
        es.addEventListener("eliminado", (ev) => {
          try {
            const oid = Number(JSON.parse((ev as MessageEvent).data));
            setMessages((prev) => prev.filter((m) => m.oid !== oid));
          } catch {
            // se ignora
          }
        });
        es.addEventListener("cierre", () => {
          maxOid.current = 0;
          setMessages([]);
          setHasMore(false);
        });
        es.onerror = () => {
          errores += 1;
          if (errores >= 3) {
            es?.close();
            es = null;
            aPolling();
          }
        };
      } catch {
        aPolling();
      }
    })();

    return () => {
      cancelled = true;
      es?.close();
      if (pollId) clearInterval(pollId);
    };
  }, [registrarMax]);

  const send = useCallback(async (texto: string): Promise<boolean> => {
    const limpio = texto.trim();
    setSendError("");
    if (!limpio || sending) return false;
    const u = userRef.current;
    const nombre = u ? u.fullName : nombreInvitado.trim();
    if (!nombre) {
      setSendError("Escribe tu nombre para participar en el muro.");
      return false;
    }
    if (nombre.length > 60) {
      setSendError("El nombre no puede exceder 60 caracteres.");
      return false;
    }
    if (limpio.length > 500) {
      setSendError("El mensaje no puede exceder 500 caracteres.");
      return false;
    }
    const ahora = Date.now();
    if (ahora - ultimoEnvio.current < COOLDOWN_MS) {
      setSendError("Espera unos segundos antes de enviar otro mensaje.");
      return false;
    }
    const tempId = `temp-${ahora}`;
    const optimista: ChatMessage = {
      oid: -ahora,
      tempId,
      autorOid: u && u.id ? Number(u.id) || null : null,
      autorNombre: nombre,
      texto: limpio,
      fecha: new Date().toISOString(),
      pendiente: true,
    };
    setSending(true);
    setMessages((prev) => [...prev, optimista].slice(-MAX_MENSAJES));
    try {
      const real = await muroApi.publicar(limpio, u ? undefined : nombre);
      ultimoEnvio.current = Date.now();
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.tempId === tempId);
        let next: ChatMessage[];
        if (idx >= 0) {
          next = [...prev];
          next[idx] = { ...real };
        } else {
          next = merge(prev, [real]);
        }
        registrarMax(next);
        return next;
      });
      return true;
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      setSendError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
      return false;
    } finally {
      setSending(false);
    }
  }, [registrarMax, sending, nombreInvitado]);

  const guardarNombre = useCallback((nombre: string) => {
    const limpio = nombre.slice(0, 60);
    setNombreInvitado(limpio);
    try {
      localStorage.setItem(NOMBRE_KEY, limpio);
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  const remove = useCallback(async (oid: number): Promise<boolean> => {
    setMessages((prev) => prev.filter((m) => m.oid !== oid));
    try {
      await muroApi.eliminar(oid);
      return true;
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "No se pudo eliminar el mensaje.");
      try {
        const data = await muroApi.ultimos();
        setMessages(data.slice(-MAX_MENSAJES));
        maxOid.current = 0;
        registrarMax(data);
      } catch {
        // se mantiene el estado local
      }
      return false;
    }
  }, [registrarMax]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder) return;
    const primero = messages.find((m) => m.oid > 0)?.oid;
    if (primero == null) return;
    setLoadingOlder(true);
    try {
      const data = await muroApi.anteriores(primero);
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => {
        const oids = new Set(prev.map((m) => m.oid));
        const viejos = data.filter((m) => !oids.has(m.oid));
        return [...viejos, ...prev].slice(-MAX_MENSAJES);
      });
      setHasMore(data.length >= 30);
    } catch {
      // se mantiene el estado local
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, messages]);

  const propio = useCallback((m: ChatMessage) => {
    const u = userRef.current;
    return !!u && m.autorOid != null && String(m.autorOid) === u.id;
  }, []);

  return useMemo(() => ({
    messages, loading, sending, sendError, hasMore, loadingOlder, modo,
    nombreInvitado, guardarNombre,
    send, remove, loadOlder, propio,
  }), [messages, loading, sending, sendError, hasMore, loadingOlder, modo, nombreInvitado, guardarNombre, send, remove, loadOlder, propio]);
}
