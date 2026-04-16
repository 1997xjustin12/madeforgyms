import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGym } from '../context/GymContext';
import Navbar from '../components/Navbar';

function fmtTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function toLocalDate(date) {
  return date.toISOString().split('T')[0];
}

export default function AdminAttendance() {
  const { members } = useGym();
  const [selectedDate, setSelectedDate] = useState(toLocalDate(new Date()));
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);

  const getMemberPhoto = (memberId) =>
    members.find((m) => m.id === memberId)?.photo || null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('checked_in_at', `${selectedDate}T00:00:00`)
        .lte('checked_in_at', `${selectedDate}T23:59:59`)
        .order('checked_in_at', { ascending: true });
      if (!error) setRecords(data || []);
      setLoading(false);
    };
    load();
  }, [selectedDate]);

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toLocalDate(d));
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(toLocalDate(d));
  };

  const isToday = selectedDate === toLocalDate(new Date());

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 sm:pb-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance</h1>
            <p className="text-slate-400 text-sm">Daily gym visit log</p>
          </div>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevDay}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar size={15} className="text-orange-400" />
              <p className="text-white font-semibold text-sm">{displayDate}</p>
              {isToday && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Today</span>
              )}
            </div>
          </div>

          <button
            onClick={nextDay}
            disabled={isToday}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Date picker shortcut */}
        <div className="flex justify-center">
          <input
            type="date"
            value={selectedDate}
            max={toLocalDate(new Date())}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-slate-300 text-sm rounded-xl px-4 py-2 outline-none transition-colors"
          />
        </div>

        {/* Stats */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Users size={22} className="text-orange-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{records.length}</p>
            <p className="text-slate-400 text-sm">
              {records.length === 1 ? 'member visited' : 'members visited'} {isToday ? 'today' : 'this day'}
            </p>
          </div>
        </div>

        {/* Attendance list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-14">
            <Users size={36} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">No check-ins recorded</p>
            <p className="text-slate-600 text-sm mt-1">for {displayDate}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((rec, i) => (
              <div
                key={rec.id}
                className="flex items-center gap-4 bg-slate-800 border border-slate-700/50 rounded-2xl px-4 py-3"
              >
                {/* Number */}
                <span className="text-slate-600 text-sm font-mono w-5 text-right shrink-0">{i + 1}</span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-orange-500/20 shrink-0 flex items-center justify-center">
                  {getMemberPhoto(rec.member_id) ? (
                    <img
                      src={getMemberPhoto(rec.member_id)}
                      alt={rec.member_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-400 font-bold text-sm">
                      {rec.member_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <p className="flex-1 text-white font-semibold text-sm truncate">{rec.member_name}</p>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
                  <Clock size={12} />
                  {fmtTime(rec.checked_in_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
