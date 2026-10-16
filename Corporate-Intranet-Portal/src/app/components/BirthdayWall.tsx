import { Cake, ChevronLeft, ChevronRight, MessageSquare, Send, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAdminAccess } from "./admin/useAdminAccess";
import { useBirthdays } from "../hooks/useBirthdays";
import { useMuroChat } from "../hooks/useMuroChat";
import { diasHastaProximo } from "../utils/birthdays";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function BirthdayWall() {
  const { user } = useAuth();
  const { can } = useAdminAccess();
  const { birthdays } = useBirthdays();
  const {
    messages, loading, sending, sendError, hasMore, loadingOlder,
    nombreInvitado, guardarNombre,
    send, remove, loadOlder, propio,
  } = useMuroChat();
  const [newComment, setNewComment] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pegadoAbajo = useRef(true);

  const todayBirthdays = useMemo(() => birthdays.filter((b) => b.esHoy), [birthdays]);

  // Carrusel de los que cumplen hoy: de dos en dos, avanzando de derecha a izquierda
  const POR_PAGINA = 2;
  const paginasHoy = useMemo(() => {
    const pags: typeof todayBirthdays[] = [];
    for (let i = 0; i < todayBirthdays.length; i += POR_PAGINA) {
      pags.push(todayBirthdays.slice(i, i + POR_PAGINA));
    }
    return pags;
  }, [todayBirthdays]);
  const [paginaHoy, setPaginaHoy] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    setPaginaHoy(0);
  }, [todayBirthdays.length]);

  useEffect(() => {
    if (paginasHoy.length <= 1 || pausado) return;
    const t = setInterval(() => {
      setPaginaHoy((p) => (p + 1) % paginasHoy.length);
    }, 5000);
    return () => clearInterval(t);
  }, [paginasHoy.length, pausado]);

  // Próximos solo cuando hoy nadie cumple
  const upcoming = useMemo(
    () => {
      if (todayBirthdays.length > 0) return [];
      return birthdays
        .filter((b) => !b.esHoy)
        .map((b) => ({ b, dias: diasHastaProximo(b) }))
        .filter((x) => x.dias > 0 && x.dias <= 30)
        .sort((a, b) => a.dias - b.dias)
        .slice(0, 5)
        .map((x) => x.b);
    },
    [birthdays, todayBirthdays.length]
  );

  const puedeBorrar = useMemo(
    () => can("calendario-cumpleanios", "eliminar"),
    [can]
  );

  // Auto-scroll solo si el usuario estaba pegado abajo
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pegadoAbajo.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;
    pegadoAbajo.current = true;
    const ok = await send(newComment);
    if (ok) setNewComment("");
  };

  const handleDelete = async (oid: number, autor: string) => {
    if (!window.confirm(`¿Eliminar el mensaje de ${autor}?`)) return;
    await remove(oid);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-[#0778AC]/10 overflow-hidden flex flex-col h-[480px] lg:h-[540px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 text-white flex items-center gap-2 shrink-0">
        <Cake className="w-5 h-5" />
        <h3 className="font-bold">Muro de Cumpleaños</h3>
      </div>

      {/* Birthday List */}
      <div className="p-4 bg-[#f0f4f8] border-b-2 border-gray-100 shrink-0">
        <p className="text-xs font-bold text-[#0778AC] uppercase mb-3 flex items-center gap-2">
          <Cake className="w-3 h-3" />
          {todayBirthdays.length > 0
            ? `Celebrando hoy (${todayBirthdays.length})`
            : "Próximos cumpleaños:"}
        </p>
        {todayBirthdays.length > 0 ? (
          <div
            className="relative"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
          >
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${paginaHoy * 100}%)` }}
              >
                {paginasHoy.map((pagina, i) => (
                  <div key={i} className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pagina.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg shadow-sm border border-[#CF3438]/30 transition-colors">
                        <div className="bg-[#f0f4f8] p-2 rounded-full">
                          <User className="w-4 h-4 text-[#0778AC]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 leading-tight truncate">{b.nombreCompleto}</p>
                          <p className="text-[10px] text-[#CF3438] font-bold mt-0.5">
                            Cumple {b.edad} años · {format(parseISO(b.fechaNacimiento), "dd/MM/yyyy")}
                          </p>
                          {b.area && <p className="text-[10px] text-gray-400 truncate">{b.area}</p>}
                        </div>
                        <span className="text-[10px] bg-[#CF3438] text-white px-2 py-0.5 rounded-full font-bold shrink-0">HOY</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {paginasHoy.length > 1 && (
              <>
                <button
                  onClick={() => setPaginaHoy((p) => (p - 1 + paginasHoy.length) % paginasHoy.length)}
                  aria-label="Anteriores"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 bg-white shadow-md rounded-full p-1 text-[#0778AC] hover:bg-[#0778AC] hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaginaHoy((p) => (p + 1) % paginasHoy.length)}
                  aria-label="Siguientes"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 bg-white shadow-md rounded-full p-1 text-[#0778AC] hover:bg-[#0778AC] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex justify-center gap-1.5 mt-2">
                  {paginasHoy.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPaginaHoy(i)}
                      aria-label={`Ir a la página ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === paginaHoy ? "w-5 bg-[#CF3438]" : "w-1.5 bg-gray-300 hover:bg-gray-400"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : upcoming.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-[#CF3438]/30 transition-colors">
                <div className="bg-[#f0f4f8] p-2 rounded-full">
                  <User className="w-4 h-4 text-[#0778AC]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{b.nombreCompleto}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    {format(parseISO(b.fechaCumpleanos), "dd 'de' MMMM", { locale: es })} · Cumple {b.edad} · Nac. {format(parseISO(b.fechaNacimiento), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-2 text-xs italic">No hay cumpleaños registrados para hoy</p>
        )}
      </div>

      {/* Comments Section (chat persistente del día) */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-[100px] max-h-[280px] overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
        {hasMore && (
          <button
            onClick={loadOlder}
            disabled={loadingOlder}
            className="mx-auto block text-[11px] font-semibold text-[#0778AC] hover:underline disabled:opacity-50"
          >
            {loadingOlder ? "Cargando..." : "Cargar mensajes anteriores"}
          </button>
        )}
        {loading ? (
          <p className="text-gray-400 text-center py-6 text-xs italic">Cargando mensajes del día...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">¡Sé el primero en felicitar!</p>
          </div>
        ) : (
          messages.map((c) => (
            <div
              key={c.tempId ?? c.oid}
              className={`rounded-lg p-3 border ${c.pendiente ? "bg-blue-50/50 border-blue-100 opacity-70" : "bg-gray-50 border-gray-100"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-[#0778AC]">{c.autorNombre}</p>
                {(propio(c) || puedeBorrar) && !c.pendiente && c.oid > 0 && (
                  <button
                    onClick={() => handleDelete(c.oid, c.autorNombre)}
                    title="Eliminar mensaje"
                    aria-label="Eliminar mensaje"
                    className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{c.texto}</p>
              <p className="text-[9px] text-gray-400 mt-1">
                {(() => {
                  try {
                    return format(new Date(c.fecha), "HH:mm");
                  } catch {
                    return "";
                  }
                })()}
                {c.pendiente ? " · enviando..." : ""}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {sendError && (
        <p className="px-4 py-1.5 bg-red-50 text-red-600 text-[11px] border-t border-red-100 shrink-0">{sendError}</p>
      )}
      {!user && (
        <div className="px-3 pt-3 bg-gray-50 border-t-2 border-gray-100 shrink-0">
          <input
            type="text"
            value={nombreInvitado}
            onChange={(e) => guardarNombre(e.target.value)}
            maxLength={60}
            placeholder="Escribe tu nombre para participar..."
            className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#0778AC] transition-all"
          />
        </div>
      )}
      <form onSubmit={handleAddComment} className="p-3 bg-gray-50 border-t-2 border-gray-100 flex gap-2 items-center shrink-0">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
          placeholder="Escribe un mensaje..."
          disabled={sending || (!user && !nombreInvitado.trim())}
          className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#0778AC] transition-all disabled:bg-gray-100"
        />
        <span className="text-[9px] text-gray-400 w-8 text-right">{newComment.length}/500</span>
        <button
          type="submit"
          disabled={sending || !newComment.trim() || (!user && !nombreInvitado.trim())}
          className="bg-[#CF3438] hover:bg-[#a01f24] disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
