import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Share2,
  Heart,
  X,
  Check,
  CalendarRange,
  Clock,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Award,
  Link
} from "lucide-react";
import { Movie } from "../types.js";
import { getMoviePosterUrl, is100crMovie } from "../App.js";

interface SocialLoungeProps {
  moviesList: Movie[];
  watchlist: string[];
  addToWatchlist: (title: string) => void;
  removeFromWatchlist: (title: string) => void;
}

interface WatchParty {
  id: string;
  movieTitle: string;
  dateTime: string;
  hostName: string;
  notes: string;
}

export default function SocialLounge({
  moviesList,
  watchlist,
  addToWatchlist,
  removeFromWatchlist
}: SocialLoungeProps) {
  // Swipe State
  const [swipePool, setSwipePool] = useState<Movie[]>([]);
  const [swipeIdx, setSwipeIdx] = useState(0);
  const [p1Likes, setP1Likes] = useState<string[]>([]);
  const [p2Likes, setP2Likes] = useState<string[]>([]);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);
  const [groupSize, setGroupSize] = useState<2 | 3>(2);
  const [p3Likes, setP3Likes] = useState<string[]>([]);

  // Watch Party State
  const [watchParties, setWatchParties] = useState<WatchParty[]>([]);
  const [newParty, setNewParty] = useState({
    movieTitle: "",
    dateTime: "",
    hostName: "",
    notes: ""
  });
  const [showPartyForm, setShowPartyForm] = useState(false);

  // Link Copied State
  const [copied, setCopied] = useState(false);

  // Movie DNA Matching presets and states
  const friendPresets = [
    { name: "Rahul", label: "Rahul (Action & Thriller Buff)", genres: ["Action & Adventure", "Thrillers", "Sci-Fi & Fantasy"], favRating: "🔥" },
    { name: "Priya", label: "Priya (Drama & Romance Fan)", genres: ["Dramas", "Romantic Movies", "International Movies"], favRating: "🔥" },
    { name: "Ankit", label: "Ankit (Arthouse & Docu Geek)", genres: ["Documentaries", "Independent Movies", "Sports Movies"], favRating: "😐" },
  ];

  const [selectedFriend, setSelectedFriend] = useState<typeof friendPresets[0] | null>(null);
  const [compatScore, setCompatScore] = useState<number | null>(null);
  const [sharedGenres, setSharedGenres] = useState<string[]>([]);
  const [compatVerdict, setCompatVerdict] = useState<string>("");
  const [customFriendName, setCustomFriendName] = useState("");
  const [customFriendGenre, setCustomFriendGenre] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  const calculateUserAGenres = (): string[] => {
    const userLikes = JSON.parse(localStorage.getItem("user_likes") || "[]");
    const favs = [...userLikes, ...watchlist];
    
    if (favs.length === 0) {
      return ["Action & Adventure", "Dramas"];
    }
    
    const genreCounts: { [genre: string]: number } = {};
    favs.forEach(title => {
      const match = moviesList.find(m => m.title.toLowerCase() === title.toLowerCase());
      if (match) {
        const genres = match.listed_in.split(",").map(g => g.trim());
        genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });
    
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  };

  const runDNAMatch = (friend: typeof friendPresets[0]) => {
    setIsMatching(true);
    setSelectedFriend(friend);
    
    setTimeout(() => {
      const userGenres = calculateUserAGenres();
      const common = userGenres.filter(g => friend.genres.some(fg => fg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(fg.toLowerCase())));
      
      const scoreSeed = friend.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + (userGenres[0] || "").charCodeAt(0);
      const flavorOffset = (scoreSeed % 11) + 5; // stable offset
      const computed = Math.min(98, Math.max(45, 50 + (common.length * 15) + flavorOffset));
      
      setCompatScore(computed);
      setSharedGenres(common.length > 0 ? common : [userGenres[0] || "Dramas"]);
      
      if (computed >= 80) {
        setCompatVerdict("Popcorn Soulmates! 🍿 You share high cinema synergy and will rarely fight over the remote.");
      } else if (computed >= 65) {
        setCompatVerdict("Cozy Co-Watchers 🎬 Good vibes! There is plenty of crossover, though some compromises will be made.");
      } else {
        setCompatVerdict("Parallel Portals 🌌 You explore entirely different cinematic universes. Perfect for introducing each other to fresh perspectives!");
      }
      setIsMatching(false);
    }, 1200);
  };

  const handleCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFriendName || !customFriendGenre) return;
    const customFriend = {
      name: customFriendName,
      label: `${customFriendName} (Custom Taste)`,
      genres: [customFriendGenre],
      favRating: "🔥"
    };
    runDNAMatch(customFriend);
  };

  // Load Watch Parties & Initialize Tinder Swipe pool
  useEffect(() => {
    const savedParties = localStorage.getItem("watch_parties");
    if (savedParties) {
      setWatchParties(JSON.parse(savedParties));
    }

    if (moviesList.length > 0) {
      // Pick top blockbuster and premium movies for swiping
      const blockbusters = moviesList.filter(m => is100crMovie(m.title) || m.release_year >= 2018);
      setSwipePool(blockbusters.slice(0, 30));
    }
  }, [moviesList]);

  // Handle swipes (Likes/Dislikes)
  const handleSwipe = (liked: boolean, player: 1 | 2 | 3) => {
    if (swipeIdx >= swipePool.length) return;

    const currentMovie = swipePool[swipeIdx];

    if (player === 1) {
      if (liked) setP1Likes(prev => [...prev, currentMovie.title]);
    } else if (player === 2) {
      if (liked) setP2Likes(prev => [...prev, currentMovie.title]);
    } else {
      if (liked) setP3Likes(prev => [...prev, currentMovie.title]);
    }

    // Advance index once all current players have voted on this movie
    const p1Voted = true; // Player 1 always votes first or they take turns
    // For simplicity of local single-device flow, we offer Player 1 and Player 2 buttons
  };

  const submitLocalVote = (liked1: boolean, liked2: boolean, liked3 = false) => {
    if (swipeIdx >= swipePool.length) return;
    const currentMovie = swipePool[swipeIdx];

    const updatedP1 = liked1 ? [...p1Likes, currentMovie.title] : p1Likes;
    const updatedP2 = liked2 ? [...p2Likes, currentMovie.title] : p2Likes;
    const updatedP3 = liked3 ? [...p3Likes, currentMovie.title] : p3Likes;

    if (liked1) setP1Likes(updatedP1);
    if (liked2) setP2Likes(updatedP2);
    if (groupSize === 3 && liked3) setP3Likes(updatedP3);

    // Check Match
    const p1HasLiked = liked1;
    const p2HasLiked = liked2;
    const p3HasLiked = groupSize === 3 ? liked3 : true;

    if (p1HasLiked && p2HasLiked && p3HasLiked) {
      setMatchedMovie(currentMovie);
    } else {
      setSwipeIdx(prev => prev + 1);
    }
  };

  const resetSwiper = () => {
    setSwipeIdx(0);
    setP1Likes([]);
    setP2Likes([]);
    setP3Likes([]);
    setMatchedMovie(null);
  };

  // Watch Party handlers
  const handleAddWatchParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParty.movieTitle || !newParty.dateTime || !newParty.hostName) return;

    const party: WatchParty = {
      id: Date.now().toString(),
      movieTitle: newParty.movieTitle,
      dateTime: newParty.dateTime,
      hostName: newParty.hostName,
      notes: newParty.notes
    };

    const updated = [party, ...watchParties];
    setWatchParties(updated);
    localStorage.setItem("watch_parties", JSON.stringify(updated));

    // Reset party form
    setNewParty({
      movieTitle: "",
      dateTime: "",
      hostName: "",
      notes: ""
    });
    setShowPartyForm(false);
  };

  const deleteWatchParty = (id: string) => {
    const updated = watchParties.filter(p => p.id !== id);
    setWatchParties(updated);
    localStorage.setItem("watch_parties", JSON.stringify(updated));
  };

  // Generate shareable link
  const copyWatchlistLink = () => {
    if (watchlist.length === 0) {
      alert("Add some movies to your watchlist first before sharing!");
      return;
    }
    const encrypted = btoa(JSON.stringify(watchlist));
    const url = `${window.location.origin}${window.location.pathname}?watchlist=${encrypted}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8" id="social-lounge-root">
      {/* Social Title & Watchlist Exporter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141418]/40 border border-white/5 p-6 rounded-2xl">
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400 animate-pulse" />
            Social Cine-Lounge
          </h3>
          <p className="text-sm text-slate-400">
            Co-curate lists, organize watch events, and solve disputes instantly with Group Decision Mode.
          </p>
        </div>

        {/* Share Watchlist Link Button */}
        <button
          onClick={copyWatchlistLink}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 self-start md:self-center shadow-lg shadow-indigo-950/20"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? "Link Copied! 🍿" : "Copy Shared Watchlist Link"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Tinder Swipe Group Decision Mode */}
        <div className="lg:col-span-7 bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-6 relative">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-display font-bold text-md text-white">Group Decision Mode</h4>
              <p className="text-xs text-slate-400">Can't agree on a movie? Swipe together to find a match!</p>
            </div>
            
            {/* Player size selector */}
            <div className="flex bg-black/40 p-1 border border-white/10 rounded-lg">
              <button
                onClick={() => { setGroupSize(2); resetSwiper(); }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${groupSize === 2 ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                2 Players
              </button>
              <button
                onClick={() => { setGroupSize(3); resetSwiper(); }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold ${groupSize === 3 ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                3 Players
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {matchedMovie ? (
              <motion.div
                key="matched"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="text-center py-8 space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-indigo-400 mx-auto animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] text-indigo-400 font-mono font-black uppercase tracking-widest">
                    Decision Settled! Match Found! 🎉
                  </h5>
                  <h4 className="text-2xl font-black text-white">{matchedMovie.title}</h4>
                  <p className="text-xs text-slate-400 font-mono">Everybody swiped RIGHT!</p>
                </div>

                <div className="flex justify-center gap-3">
                  <img
                    src={getMoviePosterUrl(matchedMovie.title, matchedMovie.type, matchedMovie.cleaned_genres || matchedMovie.listed_in.split(","))}
                    alt={matchedMovie.title}
                    referrerPolicy="no-referrer"
                    className="w-32 h-44 object-cover rounded-xl border border-white/10 shadow-lg"
                  />
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      addToWatchlist(matchedMovie.title);
                      alert(`Added "${matchedMovie.title}" to your watchlist!`);
                    }}
                    className="py-2 px-4 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs font-bold transition-all border border-indigo-500/20"
                  >
                    Add to Watchlist
                  </button>
                  <button
                    onClick={resetSwiper}
                    className="py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold transition-all border border-white/5"
                  >
                    Swipe Again
                  </button>
                </div>
              </motion.div>
            ) : swipeIdx < swipePool.length ? (
              <motion.div
                key={swipeIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Tinder Card Stack wrapper */}
                <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col md:flex-row">
                  <img
                    src={getMoviePosterUrl(swipePool[swipeIdx].title, swipePool[swipeIdx].type, swipePool[swipeIdx].cleaned_genres || swipePool[swipeIdx].listed_in.split(","))}
                    alt={swipePool[swipeIdx].title}
                    referrerPolicy="no-referrer"
                    className="w-full md:w-44 h-56 md:h-64 object-cover"
                  />
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded">
                        {swipePool[swipeIdx].type}
                      </span>
                      <h5 className="font-display font-black text-white text-lg mt-1">{swipePool[swipeIdx].title}</h5>
                      <span className="text-[10px] text-slate-500 block leading-tight">{swipePool[swipeIdx].listed_in}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {swipePool[swipeIdx].description}
                    </p>

                    <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                      <span>Ref ID: {swipeIdx + 1}/{swipePool.length}</span>
                      <span>{swipePool[swipeIdx].duration}</span>
                    </div>
                  </div>
                </div>

                {/* Local Decision Controller interface */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
                  <div className="text-center text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    Bespoke Controller: Multi-User Ballot
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Person 1 controls */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">🍿 Player 1:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitLocalVote(false, true, groupSize === 3)}
                          className="p-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-600/40"
                          title="Player 1 Skips"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => submitLocalVote(true, true, groupSize === 3)}
                          className="p-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-600/40"
                          title="Player 1 Likes"
                        >
                          Like
                        </button>
                      </div>
                    </div>

                    {/* Person 2 controls */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">🎬 Player 2:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitLocalVote(true, false, groupSize === 3)}
                          className="p-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-600/40"
                          title="Player 2 Skips"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => submitLocalVote(true, true, groupSize === 3)}
                          className="p-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-600/40"
                          title="Player 2 Likes"
                        >
                          Like
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standard Global quick action bar */}
                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => submitLocalVote(false, false, false)}
                      className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl transition-all"
                    >
                      All Skip 👎
                    </button>
                    <button
                      onClick={() => submitLocalVote(true, true, groupSize === 3)}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl transition-all"
                    >
                      All Like 👍
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Swiped through all available blockbusters! Use Reset Swiper to swipe again.
                <button
                  onClick={resetSwiper}
                  className="mt-3 block mx-auto py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-indigo-400 border border-white/5 transition-all"
                >
                  Reset Swiper
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Watch Party Scheduler */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-bold text-md text-white">Watch Parties</h4>
                <p className="text-xs text-slate-400">Schedule watch party events with friends.</p>
              </div>
              <button
                onClick={() => setShowPartyForm(!showPartyForm)}
                className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all flex items-center gap-1"
              >
                <CalendarRange className="w-3.5 h-3.5" /> Party
              </button>
            </div>

            <AnimatePresence>
              {showPartyForm && (
                <motion.form
                  onSubmit={handleAddWatchParty}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-3 overflow-hidden text-left"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Movie or TV Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Baahubali 2"
                      value={newParty.movieTitle}
                      onChange={(e) => setNewParty({ ...newParty, movieTitle: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newParty.dateTime}
                      onChange={(e) => setNewParty({ ...newParty, dateTime: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Host Name / Organizer</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={newParty.hostName}
                      onChange={(e) => setNewParty({ ...newParty, hostName: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Lounge Notes</label>
                    <textarea
                      placeholder="Include join link or snacks instructions..."
                      value={newParty.notes}
                      onChange={(e) => setNewParty({ ...newParty, notes: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 h-16 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Confirm Party Event
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {watchParties.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  No parties scheduled. Create one and invite friends!
                </div>
              ) : (
                watchParties.map((p) => {
                  const pDate = new Date(p.dateTime);
                  const isUpcoming = pDate.getTime() > Date.now();
                  
                  return (
                    <div
                      key={p.id}
                      className="bg-black/30 border border-white/5 p-4 rounded-xl flex items-start justify-between relative group text-left"
                    >
                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${isUpcoming ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"}`}>
                            {isUpcoming ? "Upcoming Watch" : "Past Event"}
                          </span>
                          <h5 className="font-display font-black text-white text-sm">{p.movieTitle}</h5>
                          <p className="text-[10px] text-indigo-400 font-mono">Organized by {p.hostName}</p>
                        </div>

                        <div className="flex gap-3 text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {pDate.toLocaleDateString()} {pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {p.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-black/20 p-2 border border-white/5 rounded-lg leading-relaxed">
                            "{p.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteWatchParty(p.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Party"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Movie DNA Matching */}
          <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
            <div>
              <h4 className="font-display font-bold text-md text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> Movie DNA Matching
              </h4>
              <p className="text-xs text-slate-400">Compare your taste profile with friends to get compatibility scores.</p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2 text-left">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Compare with Friends</span>
              <div className="grid grid-cols-3 gap-2">
                {friendPresets.map((f) => (
                  <button
                    key={f.name}
                    disabled={isMatching}
                    onClick={() => runDNAMatch(f)}
                    className={`py-1.5 px-2 text-[11px] font-semibold border rounded-xl text-center transition-all cursor-pointer ${
                      selectedFriend?.name === f.name
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-black/30 border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.name} 👥
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Friend Matcher */}
            <form onSubmit={handleCustomMatch} className="bg-black/20 p-3.5 border border-white/5 rounded-xl space-y-2.5 text-left">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Custom Friend DNA</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Friend name"
                  value={customFriendName}
                  onChange={(e) => setCustomFriendName(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                <select
                  value={customFriendGenre}
                  onChange={(e) => setCustomFriendGenre(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select genre</option>
                  <option value="Action & Adventure">Action 💥</option>
                  <option value="Dramas">Drama 🎭</option>
                  <option value="Comedies">Comedy 😂</option>
                  <option value="Horror Movies">Horror 👻</option>
                  <option value="Documentaries">Documentaries 🔎</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isMatching || !customFriendName || !customFriendGenre}
                className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                Sync Custom Friend
              </button>
            </form>

            {/* Results Animation and Card */}
            <AnimatePresence mode="wait">
              {isMatching && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-black/40 border border-white/5 rounded-xl p-6 text-center space-y-3"
                >
                  <div className="w-10 h-10 border-2 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-indigo-400 font-mono animate-pulse">Analyzing shared cinema metrics...</p>
                </motion.div>
              )}

              {!isMatching && compatScore !== null && selectedFriend && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-500/20 rounded-xl p-4 text-center space-y-3"
                >
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    DNA Compatibility Result
                  </div>
                  
                  <div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-400">
                      {compatScore}% Compatible
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-1">
                      Matched with {selectedFriend.name}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-black/40 border border-white/5 p-3 rounded-lg">
                    {compatVerdict}
                  </p>

                  <div className="text-[11px] text-slate-400 font-mono">
                    🧬 Shared Vibe: <span className="text-indigo-400 font-bold">{sharedGenres.join(", ")}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
