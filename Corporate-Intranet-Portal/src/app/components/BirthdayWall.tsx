import { Cake, MessageSquare, Send, User } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Birthday {
  id: string;
  name: string;
  date: string;
  area: string;
}

interface Comment {
  id: string;
  userName: string;
  text: string;
  date: Date;
}

export function BirthdayWall() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const todayBirthdays = useMemo(() => {
    const saved = localStorage.getItem("admin_birthdays");
    if (!saved) return [];
    const birthdays: Birthday[] = JSON.parse(saved);
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    return birthdays.filter(b => {
      const bDate = new Date(b.date);
      return bDate.getMonth() === todayMonth && bDate.getDate() === todayDay;
    });
  }, []);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userName: user.fullName,
      text: newComment,
      date: new Date()
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-[#0778AC]/10 overflow-hidden flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 text-white flex items-center gap-2">
        <Cake className="w-5 h-5" />
        <h3 className="font-bold">Muro de Cumpleaños</h3>
      </div>

      {/* Birthday List */}
      <div className="p-4 bg-[#f0f4f8] border-b-2 border-gray-100">
        <p className="text-xs font-bold text-[#0778AC] uppercase mb-3 flex items-center gap-2">
          <Cake className="w-3 h-3" /> 
          {todayBirthdays.length > 0 
            ? `Celebrando hoy (${todayBirthdays.length})` 
            : "Celebrados de hoy y pronto:"}
        </p>
        <div className="space-y-3">
          {todayBirthdays.length > 0 ? (
            todayBirthdays.map((b, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-[#CF3438]/30 transition-colors">
                <div className="bg-[#f0f4f8] p-2 rounded-full">
                  <User className="w-4 h-4 text-[#0778AC]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{b.name}</p>
                  <p className="text-[10px] text-[#CF3438] font-bold mt-0.5">
                    {format(new Date(b.date), "dd 'de' MMMM", { locale: es })} · {b.area || "General"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4 text-xs italic">No hay cumpleaños registrados para hoy</p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">¡Sé el primero en felicitar!</p>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-[#0778AC] mb-1">{c.userName}</p>
              <p className="text-xs text-gray-700">{c.text}</p>
              <p className="text-[9px] text-gray-400 mt-1">{c.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <form onSubmit={handleAddComment} className="p-3 bg-gray-50 border-t-2 border-gray-100 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#0778AC] transition-all"
        />
        <button
          type="submit"
          className="bg-[#CF3438] hover:bg-[#a01f24] text-white p-2 rounded-full transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}