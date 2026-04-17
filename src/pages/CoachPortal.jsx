import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';
import { Search, X, Dumbbell, ChevronRight, Users } from 'lucide-react';
import GymLogo from '../components/GymLogo';
import { useGym } from '../context/GymContext';

function getMemberStatus(endDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = new Date(endDate); end.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(end, today);
  if (daysLeft < 0)  return { label: 'Expired',              color: 'text-red-400',    bg: 'bg-red-500/15'    };
  if (daysLeft <= 5) return { label: `Expires in ${daysLeft}d`, color: 'text-orange-400', bg: 'bg-orange-500/15' };
  return               { label: `${daysLeft} days left`,     color: 'text-green-400',  bg: 'bg-green-500/15'  };
}

export default function CoachPortal() {
  const { code }   = useParams();
  const navigate   = useNavigate();
  const { gymSlug, gymId } = useGym();

  const [instructor, setInstructor] = useState(null);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [query, setQuery]           = useState('');
  const [pastOpen, setPastOpen]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: inst, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('gym_id', gymId)
        .eq('access_code', code.toUpperCase())
        .single();

      if (error || !inst) { setNotFound(true); setLoading(false); return; }
      setInstructor(inst);

      const { data: mems } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', gymId)
        .eq('instructor_id', inst.id)
        .order('name', { ascending: true });

      setMembers(mems || []);
      setLoading(false);
    };
    load();
  }, [code, gymId]);

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const filtered = members.filter((m) =>
    !query ||
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.contact_number || '').includes(query)
  );
  const activeFiltered = filtered.filter((m) => {
    if (!m.coaching_end_date) return true;
    return new Date(m.coaching_end_date).setHours(0, 0, 0, 0) >= todayMs;
  });
  const pastFiltered = filtered.filter((m) => {
    if (!m.coaching_end_date) return false;
    return new Date(m.coaching_end_date).setHours(0, 0, 0, 0) < todayMs;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <Dumbbell size={40} className="text-slate-500" />
      <p className="text-white font-bold text-lg">Invalid portal link</p>
      <p className="text-slate-400 text-sm">This coach portal link is not valid or has been reset.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <GymLogo size={36} />
          <span className="font-bold text-white">Coach Portal</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Instructor profile card */}
        <div className="bg-slate-800 rounded-2xl border border-yellow-500/20 p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700 shrink-0">
            {instructor.photo_url ? (
              <img src={instructor.photo_url} alt={instructor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold text-2xl">
                {instructor.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight">{instructor.name}</p>
            {instructor.specialty && <p className="text-yellow-400 text-sm">{instructor.specialty}</p>}
            {instructor.bio && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{instructor.bio}</p>}
          </div>
        </div>

        {/* Members section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <h2 className="text-white font-semibold">
              My Members <span className="text-slate-500 font-normal text-sm">({activeFiltered.length})</span>
            </h2>
          </div>

          {/* Search */}
          {members.length > 3 && (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/60 text-white rounded-xl pl-9 pr-9 py-2.5 outline-none text-sm placeholder:text-slate-600 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Active member list */}
          {activeFiltered.length === 0 && pastFiltered.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <p className="text-slate-400">
                {members.length === 0 ? 'No members assigned yet' : 'No members found'}
              </p>
            </div>
          ) : activeFiltered.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <p className="text-slate-400 text-sm">No active coaching members</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeFiltered.map((member) => {
                const { label, color, bg } = getMemberStatus(member.membership_end_date);
                return (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/${gymSlug}/coach/${code}/member/${member.id}`)}
                    className="w-full bg-slate-800 hover:bg-slate-750 active:bg-slate-700 rounded-2xl border border-slate-700/50 p-3.5 flex items-center gap-3 text-left transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${color}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{member.name}</p>
                      <p className="text-slate-400 text-xs capitalize">{member.membership_type} plan</p>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>
                        {label}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Past / expired coaching members */}
          {pastFiltered.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setPastOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 rounded-2xl border border-slate-700/40 text-left"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  <span className="text-slate-400 text-sm font-semibold">Past Members</span>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{pastFiltered.length}</span>
                </div>
                <ChevronRight size={15} className={`text-slate-500 transition-transform duration-200 ${pastOpen ? 'rotate-90' : ''}`} />
              </button>

              {pastOpen && (
                <div className="mt-1 space-y-2">
                  {pastFiltered.map((member) => {
                    const coachEnd = member.coaching_end_date
                      ? new Date(member.coaching_end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : null;
                    return (
                      <div
                        key={member.id}
                        className="w-full bg-slate-800/50 rounded-2xl border border-slate-700/30 p-3.5 flex items-center gap-3 opacity-70"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-lg text-slate-500">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 font-semibold text-sm">{member.name}</p>
                          {member.coaching_plan && <p className="text-slate-500 text-xs">{member.coaching_plan}</p>}
                          {coachEnd && <p className="text-slate-600 text-xs mt-0.5">Coaching ended {coachEnd}</p>}
                        </div>
                        <span className="text-xs text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded-full shrink-0">Expired</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
