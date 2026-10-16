import { useEffect, useState } from "react";
import { History, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { announcementsApi } from "../api/announcements";
import type { AnnouncementHistoryEntry } from "../api/mappers";

interface AnnouncementHistoryProps {
  announcementId: string;
}

const FIELD_LABELS: Record<string, string> = {
  titulo: "Título",
  areaInforma: "Área que informa",
  descripcion: "Descripción",
  fechaInicio: "Fecha de inicio",
  fechaFin: "Fecha de fin",
};

const DATE_FIELDS = new Set(["fechaInicio", "fechaFin"]);

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (DATE_FIELDS.has(field)) {
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? String(value) : format(d, "dd/MM/yyyy HH:mm", { locale: es });
  }
  return String(value);
}

interface Change {
  field: string;
  label: string;
  before: string;
  after: string;
}

function computeChanges(entry: AnnouncementHistoryEntry): Change[] {
  if (!entry.after) return [];
  const before = entry.before || {};
  const after = entry.after;
  return Object.keys(FIELD_LABELS)
    .filter((field) => String(before[field] ?? "") !== String(after[field] ?? ""))
    .map((field) => ({
      field,
      label: FIELD_LABELS[field],
      before: formatValue(field, before[field]),
      after: formatValue(field, after[field]),
    }));
}

export function AnnouncementHistory({ announcementId }: AnnouncementHistoryProps) {
  const [entries, setEntries] = useState<AnnouncementHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await announcementsApi.history(announcementId);
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [announcementId]);

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-[#0778AC]" />
        <h4 className="text-sm font-bold text-gray-700">Historial de ediciones</h4>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando historial...</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-400">Sin ediciones registradas.</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {entries.map((entry) => {
            const changes = computeChanges(entry);
            return (
              <div key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 min-w-0">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title={entry.username}>{entry.username}</span>
                  </span>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">
                    {format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>
                {changes.length === 0 ? (
                  <p className="text-[11px] text-gray-400">Sin cambios en los datos del anuncio.</p>
                ) : (
                  <ul className="space-y-1">
                    {changes.map((c) => (
                      <li key={c.field} className="text-[11px] text-gray-600 break-words">
                        <span className="font-semibold text-gray-700">{c.label}:</span>{" "}
                        <span className="line-through text-gray-400">{c.before}</span>
                        <span className="text-gray-400"> → </span>
                        <span className="text-gray-800">{c.after}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
