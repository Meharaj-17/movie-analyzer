import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Tv,
  Calendar,
  Clock,
  Trash2,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2
} from "lucide-react";
import { Movie } from "../types.js";

interface UtilityHooksProps {
  moviesList: Movie[];
}

interface OTTTrack {
  movieTitle: string;
  provider: string;
  status: string;
  checkDate: string;
}

interface UpcomingMovie {
  id: string;
  title: string;
  releaseDate: string;
  genre: string;
  cast: string;
  hype: string;
}

export default function UtilityHooks({ moviesList }: UtilityHooksProps) {
  const [trackedOTTMovies, setTrackedOTTMovies] = useState<OTTTrack[]>([]);
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackProvider, setNewTrackProvider] = useState("Netflix");
  const [countdownTimers, setCountdownTimers] = useState<Record<string, string>>({});

  // Live social hype trackers
  const [hypeVotes, setHypeVotes] = useState<Record<string, number>>({
    u1: 12450,
    u2: 8940,
    u3: 5410,
    u4: 3120,
  });
  const [userHyped, setUserHyped] = useState<Record<string, boolean>>({});

  // Prediction Game tied to real box office
  const predictionsList = [
    { id: "p1", question: "Will Pushpa 2: The Rule cross ₹150 Crore nett on Day 1 in India?", options: ["Yes, absolute record", "No, max ₹120 Crore"] },
    { id: "p2", question: "Will War 2 score a higher domestic lifetime total than Pathaan?", options: ["Yes, Hrithik + NTR will fly", "No, Pathaan is king"] },
  ];

  const [userPredictions, setUserPredictions] = useState<Record<string, string>>({});
  const [predictionVotes, setPredictionVotes] = useState<Record<string, { yes: number, no: number }>>({
    p1: { yes: 7420, no: 1840 },
    p2: { yes: 4120, no: 3980 }
  });

  const handleHypeClick = (id: string) => {
    if (userHyped[id]) return;
    setHypeVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
    setUserHyped(prev => ({ ...prev, [id]: true }));
    alert("🔥 Hype logged! Your token has been certified. Share this upcoming blockbuster!");
  };

  const handlePredictVote = (id: string, option: "yes" | "no") => {
    if (userPredictions[id]) return;
    setUserPredictions(prev => ({ ...prev, [id]: option }));
    setPredictionVotes(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [option]: prev[id][option] + 1
      }
    }));
    alert("🗳️ Prediction registered! Points will be rewarded after box office verification.");
  };

  // Upcoming regional/global cinema list
  const upcomingCinemas: UpcomingMovie[] = [
    {
      id: "u1",
      title: "Ramayana: Part 1",
      releaseDate: "2026-12-25T00:00:00",
      genre: "Fantasy / Mythology / Action",
      cast: "Ranbir Kapoor, Sai Pallavi, Yash",
      hype: "India's Most Ambitious Mythological Magnum Opus"
    },
    {
      id: "u2",
      title: "War 2",
      releaseDate: "2026-08-14T00:00:00",
      genre: "Spy / Action / Adventure",
      cast: "Hrithik Roshan, Jr. NTR, Kiara Advani",
      hype: "YRF Spy Universe High-Octane Faceoff"
    },
    {
      id: "u3",
      title: "Alpha",
      releaseDate: "2026-11-20T00:00:00",
      genre: "Action / Spy",
      cast: "Alia Bhatt, Sharvari, Bobby Deol",
      hype: "First Female-Led Spy Actioner"
    },
    {
      id: "u4",
      title: "Spirit",
      releaseDate: "2027-04-30T00:00:00",
      genre: "Action / Crime / Thriller",
      cast: "Prabhas, Trisha, Saif Ali Khan",
      hype: "Prabhas & Vanga's Ultra-Violent Cop Action Drama"
    }
  ];

  // Load tracked OTT movies on mount
  useEffect(() => {
    const saved = localStorage.getItem("tracked_ott");
    if (saved) {
      setTrackedOTTMovies(JSON.parse(saved));
    } else {
      // Seed default track alerts for demo
      const defaults: OTTTrack[] = [
        {
          movieTitle: "Baahubali: The Beginning",
          provider: "Netflix",
          status: "Currently Streaming",
          checkDate: new Date().toLocaleDateString()
        },
        {
          movieTitle: "Jawan",
          provider: "Prime Video",
          status: "Coming Soon (July 24)",
          checkDate: new Date().toLocaleDateString()
        }
      ];
      setTrackedOTTMovies(defaults);
      localStorage.setItem("tracked_ott", JSON.stringify(defaults));
    }
  }, []);

  // Live countdown timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const updated: Record<string, string> = {};
      upcomingCinemas.forEach((movie) => {
        const diff = new Date(movie.releaseDate).getTime() - Date.now();
        if (diff <= 0) {
          updated[movie.id] = "Released Now!";
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          updated[movie.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
      });
      setCountdownTimers(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add OTT Track alert
  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle) return;

    let simulatedStatus = "Coming Soon";
    let providerToUse = newTrackProvider;

    try {
      const res = await fetch(`/api/streaming?title=${encodeURIComponent(newTrackTitle)}`);
      if (res.ok) {
         const data = await res.json();
         if (data.providers && data.providers.length > 0) {
            providerToUse = data.providers[0]; // Take the first provider found
            simulatedStatus = data.status;
         } else {
            simulatedStatus = data.status;
         }
      }
    } catch (e) {
      console.error(e);
    }

    const track: OTTTrack = {
      movieTitle: newTrackTitle,
      provider: providerToUse,
      status: simulatedStatus,
      checkDate: new Date().toLocaleDateString()
    };

    const updated = [track, ...trackedOTTMovies];
    setTrackedOTTMovies(updated);
    localStorage.setItem("tracked_ott", JSON.stringify(updated));
    setNewTrackTitle("");

    // Set reminder alerts active banner in App
    localStorage.setItem("has_active_alerts", "true");
  };

  const deleteTrack = (title: string) => {
    const updated = trackedOTTMovies.filter((t) => t.movieTitle !== title);
    setTrackedOTTMovies(updated);
    localStorage.setItem("tracked_ott", JSON.stringify(updated));
  };

  const setReleaseAlert = (title: string) => {
    alert(`Reminder Alert Configured! You will receive a web browser alert as soon as "${title}" hits theaters/digital! 🔔🍿`);
  };

  return (
    <div className="space-y-8" id="utility-hooks-root">
      {/* Intro Block */}
      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400 animate-bounce" />
            Cinema Tracker & Countdowns
          </h3>
          <p className="text-sm text-slate-400">
            Configure streaming availability monitors, track upcoming blockbusters, and set alerts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: OTT Availability Tracker */}
        <div className="lg:col-span-7 bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-md space-y-6 text-left">
          <div>
            <h4 className="font-display font-black text-white text-md">OTT Streaming Tracker</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Subscribe to a movie. Our scheduler will query database index and alert you when available on OTT.
            </p>
          </div>

          <form onSubmit={handleAddTrack} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Movie Title (e.g. Jawan, Leo...)"
              value={newTrackTitle}
              onChange={(e) => setNewTrackTitle(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
              required
            />
            <select
              value={newTrackProvider}
              onChange={(e) => setNewTrackProvider(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
            >
              <option value="Netflix">Netflix</option>
              <option value="Prime Video">Prime Video</option>
              <option value="Hotstar">Hotstar</option>
              <option value="JioCinema">JioCinema</option>
            </select>
            <button
              type="submit"
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Bell className="w-3.5 h-3.5" /> Track Movie
            </button>
          </form>

          <div className="space-y-3">
            {trackedOTTMovies.map((track, idx) => (
              <div
                key={idx}
                className="bg-black/30 border border-white/5 p-4 rounded-xl flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-white text-sm">{track.movieTitle}</h5>
                    <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                      {track.provider}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {track.status}
                    </span>
                    <span>Last query: {track.checkDate}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTrack(track.movieTitle)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove Monitor Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Upcoming Blockbusters Countdown */}
        <div className="lg:col-span-5 bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-md space-y-5 text-left">
          <div>
            <h4 className="font-display font-black text-white text-md">Upcoming Blockbusters</h4>
            <p className="text-xs text-slate-400 mt-0.5">Stay on top of monumental upcoming releases with active hype counters.</p>
          </div>

          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
            {upcomingCinemas.map((movie) => {
              const currentHype = hypeVotes[movie.id] || 3000;
              const hasHyped = userHyped[movie.id];
              // Calculate a dynamic percentage for hype visual bar
              const maxHypeExpected = 15000;
              const percent = Math.min(100, Math.round((currentHype / maxHypeExpected) * 100));

              return (
                <div
                  key={movie.id}
                  className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-3 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl animate-pulse" />
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-display font-black text-white text-sm">{movie.title}</h5>
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase shrink-0">
                        {percent}% Hype
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-400 font-mono">{movie.genre}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">Cast: {movie.cast}</p>
                  </div>

                  {/* Hype Meter Gauge */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Waiting Audience</span>
                      <span className="text-indigo-400 font-bold">{currentHype.toLocaleString()} cinephiles</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400"
                      />
                    </div>
                  </div>

                  {/* Live ticker block */}
                  <div className="bg-black/40 border border-white/5 py-2 px-3 rounded-lg flex items-center justify-between font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Countdown:
                    </span>
                    <span className="text-xs text-indigo-400 font-bold tracking-tight">
                      {countdownTimers[movie.id] || "Calculating..."}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHypeClick(movie.id)}
                      disabled={hasHyped}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
                        hasHyped
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                          : "bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/20 cursor-pointer"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" /> {hasHyped ? "Hyped! 🔥" : "Upvote Hype"}
                    </button>
                    <button
                      onClick={() => setReleaseAlert(movie.title)}
                      className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 transition-all flex items-center justify-center"
                    >
                      <Bell className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Box Office Prediction Game */}
      <div className="bg-gradient-to-br from-[#141418] via-[#101014] to-indigo-950/20 border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 text-left">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 animate-pulse" /> Box Office Prediction Game
            </div>
            <h4 className="font-display font-black text-white text-xl mt-1">Predict & Unlock Rewards 🏆</h4>
            <p className="text-xs text-slate-400">Put your cinematic instincts to the test on real box office targets!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictionsList.map((p) => {
            const votes = predictionVotes[p.id] || { yes: 100, no: 100 };
            const userVote = userPredictions[p.id];
            const total = votes.yes + votes.no;
            const yesPercent = Math.round((votes.yes / total) * 100);
            const noPercent = 100 - yesPercent;

            return (
              <div key={p.id} className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Target Pool Live</span>
                  <h5 className="font-display font-bold text-white text-sm leading-snug">{p.question}</h5>
                </div>

                {!userVote ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handlePredictVote(p.id, "yes")}
                      className="py-2.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      {p.options[0]}
                    </button>
                    <button
                      onClick={() => handlePredictVote(p.id, "no")}
                      className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      {p.options[1]}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-black/40 border border-white/5 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-indigo-400">Your Choice: {userVote === "yes" ? "Option A" : "Option B"}</span>
                      <span className="text-slate-500">Votes Syncing...</span>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{p.options[0]}</span>
                          <span className="font-bold text-indigo-400">{yesPercent}% ({votes.yes.toLocaleString()})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${yesPercent}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{p.options[1]}</span>
                          <span className="font-bold text-slate-300">{noPercent}% ({votes.no.toLocaleString()})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="bg-slate-600 h-full rounded-full" style={{ width: `${noPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
