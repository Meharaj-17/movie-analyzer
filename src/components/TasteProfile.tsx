import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Award,
  Flame,
  Bookmark,
  Sparkles,
  BarChart3,
  Calendar,
  Heart,
  Smile,
  ShieldAlert,
  Zap,
  Target,
  Share2,
  Clock,
  Compass,
  Film,
  Undo2
} from "lucide-react";
import { Movie } from "../types.js";
import { getMoviePosterUrl, is100crMovie } from "../App.js";
import { getWhyWatchInsight } from "../utils/movieInsights.js";

interface TasteProfileProps {
  moviesList: Movie[];
  userLikes: string[]; // movie titles with Fire 🔥
  userMehs: string[];  // movie titles with Meh 😐
  userSleeps: string[]; // movie titles with Sleep 💤
  handleReaction: (title: string, type: "fire" | "meh" | "sleep") => void;
  removeReaction?: (title: string) => void;
}

interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

export default function TasteProfile({
  moviesList,
  userLikes,
  userMehs,
  userSleeps,
  handleReaction,
  removeReaction
}: TasteProfileProps) {
  const [favoriteGenres, setFavoriteGenres] = useState<GenreStats[]>([]);
  const [badges, setBadges] = useState<{
    id: string;
    title: string;
    desc: string;
    unlocked: boolean;
    color: string;
    icon: any;
  }[]>([]);

  // Calculate Wrapped statistics dynamically based on user likes
  useEffect(() => {
    // 1. Aggregated Favorite Genres calculation
    const genreCounts: Record<string, number> = {};
    let totalLikedCount = 0;

    // Use movies they liked with 🔥
    userLikes.forEach((title) => {
      const movie = moviesList.find((m) => m.title.toLowerCase() === title.toLowerCase());
      if (movie) {
        const genres = movie.cleaned_genres || movie.listed_in.split(",");
        genres.forEach((g) => {
          const cleanG = g.trim();
          genreCounts[cleanG] = (genreCounts[cleanG] || 0) + 1;
          totalLikedCount++;
        });
      }
    });

    // Fallback standard catalog breakdown if they haven't rated anything yet to show beautiful template
    if (totalLikedCount === 0) {
      const demoCounts = {
        "Action & Adventure": 8,
        "Dramas": 6,
        "International Movies": 5,
        "Comedies": 4,
        "Sci-Fi & Fantasy": 3
      };
      const totalDemo = 26;
      const parsedDemo = Object.entries(demoCounts).map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalDemo) * 100)
      }));
      setFavoriteGenres(parsedDemo);
    } else {
      const parsed = Object.entries(genreCounts)
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: Math.round((count / totalLikedCount) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setFavoriteGenres(parsed);
    }

    // 2. Compute Badge Unlocks
    const has100cr = userLikes.some((title) => is100crMovie(title));
    const uniqueGenres = new Set<string>();
    userLikes.forEach((title) => {
      const m = moviesList.find((x) => x.title.toLowerCase() === title.toLowerCase());
      if (m) {
        const genres = m.cleaned_genres || m.listed_in.split(",");
        genres.forEach((g) => uniqueGenres.add(g.trim()));
      }
    });

    const isBaahubaliFan = userLikes.some((t) => t.toLowerCase().includes("baahubali"));
    const totalRated = userLikes.length + userMehs.length + userSleeps.length;

    // Get streak count from localStorage
    const storedStreak = localStorage.getItem("movie_streak");
    let streakCount = 0;
    if (storedStreak) {
      streakCount = JSON.parse(storedStreak).count || 0;
    }

    const badgeList = [
      {
        id: "1",
        title: "100 Crore Club Explorer",
        desc: "Liked or reacted to a 100 Crore Indian blockbuster.",
        unlocked: has100cr,
        color: "from-amber-500 to-yellow-500 text-black",
        icon: Award
      },
      {
        id: "2",
        title: "Variety Master",
        desc: "Liked movies from 3 or more separate cinema genres.",
        unlocked: uniqueGenres.size >= 3,
        color: "from-indigo-500 to-purple-500 text-white",
        icon: Sparkles
      },
      {
        id: "3",
        title: "Mega Watcher",
        desc: "Reacted or rated 5+ titles in your local database.",
        unlocked: totalRated >= 5,
        color: "from-teal-500 to-emerald-500 text-white",
        icon: Flame
      },
      {
        id: "4",
        title: "Certified Baahubali Fan",
        desc: "Reacted 🔥 to either Baahubali or Baahubali 2 Conclusion.",
        unlocked: isBaahubaliFan,
        color: "from-red-500 to-rose-500 text-white",
        icon: Heart
      },
      {
        id: "5",
        title: "Streak Champion",
        desc: "Maintained a daily login check-in streak of 3+ days.",
        unlocked: streakCount >= 3,
        color: "from-indigo-600 to-violet-600 text-white",
        icon: Target
      }
    ];

    setBadges(badgeList);
  }, [userLikes, userMehs, userSleeps, moviesList]);

  const totalInteractions = userLikes.length + userMehs.length + userSleeps.length;

  return (
    <div className="space-y-8" id="taste-profile-root">
      {/* Intro Header */}
      <div className="text-left space-y-1 bg-indigo-950/20 border border-indigo-500/10 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Cinema Taste Wrapped
        </h3>
        <p className="text-sm text-slate-400">
          A dynamic visualization of your cinematic preferences, genre distribution, and earned achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Spotify Wrapped Genre Breakdown */}
        <div className="lg:col-span-7 bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-md space-y-6 text-left">
          <div>
            <h4 className="font-display font-black text-white text-md">Your Genre Fingerprint</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {userLikes.length === 0
                ? "Showing global standard averages. React 🔥 to movies to customize this Wrapped report!"
                : `Calculated from your ${userLikes.length} favorite movies.`}
            </p>
          </div>

          <div className="space-y-4">
            {favoriteGenres.map((g, idx) => (
              <div key={g.genre} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400">#{idx + 1}</span> {g.genre}
                  </span>
                  <span className="text-slate-400">{g.percentage}% preferred</span>
                </div>
                <div className="w-full bg-black/40 border border-white/5 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${g.percentage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-center">
            <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
              <span className="text-lg font-black text-indigo-400">{userLikes.length}</span>
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mt-1">Loved 🔥</span>
            </div>
            <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
              <span className="text-lg font-black text-slate-400">{userMehs.length}</span>
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mt-1">Meh 😐</span>
            </div>
            <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
              <span className="text-lg font-black text-indigo-600">{userSleeps.length}</span>
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mt-1">Snoozed 💤</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Earned Badges */}
        <div className="lg:col-span-5 bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-md space-y-5 text-left">
          <div>
            <h4 className="font-display font-black text-white text-md">Cinema Badges & Achievements</h4>
            <p className="text-xs text-slate-400 mt-0.5">Earn badges by exploring the catalog and rating movies.</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                    badge.unlocked
                      ? "bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border-indigo-500/30"
                      : "bg-black/30 border-white/5 opacity-50"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${badge.unlocked ? "bg-gradient-to-tr " + badge.color : "bg-white/5 text-slate-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-center">
                      <h5 className={`text-xs font-bold ${badge.unlocked ? "text-white" : "text-slate-400"}`}>
                        {badge.title}
                      </h5>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${badge.unlocked ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-black/50 text-slate-600 border border-white/5"}`}>
                        {badge.unlocked ? "Earned" : "Locked"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cinematic Time Capsule */}
      <div className="bg-gradient-to-br from-[#1c1917]/80 via-[#141418]/90 to-indigo-950/20 border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-xl mt-6">
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-pink-400 font-mono font-bold text-xs uppercase tracking-widest">
              <Calendar className="w-4 h-4" /> Cinematic Time Capsule
            </div>
            <h4 className="font-display font-black text-white text-xl mt-1">Your July in Movies 🚀</h4>
            <p className="text-xs text-slate-400">An auto-generated retro snapshot of your exploration metrics this month.</p>
          </div>

          <button
            onClick={() => {
              const ratedCount = userLikes.length + userMehs.length + userSleeps.length;
              const totalMins = (userLikes.length + userMehs.length) * 135;
              const topGenre = favoriteGenres[0]?.genre || "Universal Cinema";
              const vibe = topGenre.toLowerCase().includes("action") ? "The Adrenaline Seeker ⚡" : "The Drama Virtuoso 🎭";
              const text = `🎥 My July 2026 Cinematic Time Capsule:\n⏳ Explored ${ratedCount} titles • Watch Time: ${totalMins} mins\n🧬 Top Genre: ${topGenre}\n👑 Vibe: ${vibe}\n\nTrace your movie DNA with the Netflix Smart Recommender! 🍿`;
              navigator.clipboard.writeText(text);
              alert("Your Time Capsule copy card is in your clipboard! Go ahead and share it with friends!");
            }}
            className="px-4 py-2 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/30 text-pink-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Capsule Wrapped
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Time Spent */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
            <div className="p-2 w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Estimated Watch Time</span>
              <span className="text-xl font-black text-white mt-1">
                {((userLikes.length + userMehs.length) * 135)} mins
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Calculated from rated titles</p>
            </div>
          </div>

          {/* Card 2: Top Genre */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
            <div className="p-2 w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Core Genre Anchor</span>
              <span className="text-xl font-black text-white mt-1 truncate block">
                {favoriteGenres[0]?.genre || "Universal"}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Your most rated category</p>
            </div>
          </div>

          {/* Card 3: Cine-Vibe Title */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
            <div className="p-2 w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Your Cinematic Vibe</span>
              <span className="text-xl font-black text-white mt-1 block truncate">
                {favoriteGenres[0]?.genre?.toLowerCase().includes("action") ? "Adrenaline Rush" : "Dramatic Soul"}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Spotify Wrapped style flavor</p>
            </div>
          </div>

          {/* Card 4: Milestone */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
            <div className="p-2 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Achievements Met</span>
              <span className="text-xl font-black text-white mt-1">
                {badges.filter(b => b.unlocked).length} Badges
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Unlocked user milestones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Hall of Fame (Loved Movies) Section */}
      <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-xl mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-left mb-5">
          <div className="flex items-center gap-1.5 text-red-400 font-mono font-bold text-xs uppercase tracking-widest">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" /> Your Movie Hall of Fame
          </div>
          <h4 className="font-display font-black text-white text-lg mt-1">Classics You Loved 🔥</h4>
          <p className="text-xs text-slate-400">
            A curated summary of your premium favorites, customized with deep cinema insights explaining exactly why each masterpiece is worth your screen time.
          </p>
        </div>

        {userLikes.length === 0 ? (
          <div>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-4 text-left">
              💡 React 🔥 (Love) to movies in Search or Recommendations to start filling your personal Hall of Fame! Showing top-tier starter classics below:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "3 Idiots", listed_in: "Comedies, Dramas, International Movies", type: "Movie", country: "India" },
                { title: "Stranger Things", listed_in: "TV Sci-Fi & Fantasy, TV Dramas, TV Thrillers", type: "TV Show", country: "United States" },
                { title: "Baahubali: The Beginning", listed_in: "Action & Adventure, International Movies, Sci-Fi & Fantasy", type: "Movie", country: "India" },
                { title: "Wednesday", listed_in: "TV Comedies, TV Sci-Fi & Fantasy, TV Mysteries", type: "TV Show", country: "United States" }
              ].map((item, idx) => {
                const demoMovie = moviesList.find(m => m.title.toLowerCase() === item.title.toLowerCase()) || {
                  title: item.title,
                  type: item.type,
                  listed_in: item.listed_in,
                  cleaned_genres: item.listed_in.split(","),
                  country: item.country
                } as Movie;
                return (
                  <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-20 h-28 bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img
                        src={getMoviePosterUrl(demoMovie.title, demoMovie.type, demoMovie.cleaned_genres || demoMovie.listed_in.split(","))}
                        alt={demoMovie.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-2 text-left flex-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-white text-sm line-clamp-1">{demoMovie.title}</h5>
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            Starter
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{demoMovie.country} • {demoMovie.type}</span>
                      </div>
                      
                      <div className="bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl">
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">🍿 Why It's Worth Watching</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          "{getWhyWatchInsight(demoMovie.title, demoMovie.type, demoMovie.cleaned_genres || demoMovie.listed_in.split(","))}"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userLikes.map((title, idx) => {
              const movie = moviesList.find(m => m.title.toLowerCase() === title.toLowerCase()) || {
                title: title,
                type: "Movie",
                listed_in: "Dramas",
                cleaned_genres: ["Dramas"],
                country: "Unknown"
              } as Movie;
              return (
                <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-20 h-28 bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img
                      src={getMoviePosterUrl(movie.title, movie.type, movie.cleaned_genres || movie.listed_in.split(","))}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-2 text-left flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="font-bold text-white text-sm line-clamp-1">{movie.title}</h5>
                        <span className="text-[10px] text-slate-500 font-mono">{movie.country} • {movie.type}</span>
                      </div>
                      {removeReaction && (
                        <button
                          onClick={() => {
                            removeReaction(movie.title);
                            alert(`Removed "${movie.title}" from your Hall of Fame.`);
                          }}
                          className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold cursor-pointer transition-all shrink-0"
                          title="Remove from Loved list"
                        >
                          Remove 🔥
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">🍿 Why It's Worth Watching</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "{getWhyWatchInsight(movie.title, movie.type, movie.cleaned_genres || movie.listed_in.split(","))}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Regret Radar Section */}
      <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden shadow-xl mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-left mb-5">
          <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-indigo-400 animate-pulse" /> Regret Radar
          </div>
          <h4 className="font-display font-black text-white text-lg mt-1">Re-evaluate Your Skips 🔄</h4>
          <p className="text-xs text-slate-400">Did you react Meh (😐) or Snoozed (💤) in a rush? Overrule your past self and give these hidden gems a second chance!</p>
        </div>

        {userMehs.length === 0 && userSleeps.length === 0 ? (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center text-slate-500 space-y-1">
            <Smile className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-400">Your Regret Radar is clean!</p>
            <p className="text-[11px]">No movies have been relegated to Meh or Snooze folders yet. Rate titles in search/recommender to populate skips!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...userMehs.map(t => ({ title: t, type: "meh" })), ...userSleeps.map(t => ({ title: t, type: "sleep" }))].map((item, idx) => {
              const movie = moviesList.find(m => m.title.toLowerCase() === item.title.toLowerCase());
              return (
                <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-12 h-16 bg-slate-900 border border-white/10 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {movie ? (
                        <img
                          src={getMoviePosterUrl(movie.title, movie.type, movie.cleaned_genres || movie.listed_in.split(","))}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                          🎬
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs line-clamp-1">{item.title}</h5>
                      <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.type === "meh" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {item.type === "meh" ? "Meh 😐" : "Snoozed 💤"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleReaction(item.title, "fire");
                      }}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-bold border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Forgive & Love 🔥
                    </button>
                    {removeReaction && (
                      <button
                        onClick={() => {
                          removeReaction(item.title);
                          alert(`✨ Cleared your reaction for "${item.title}". It returns to the normal pool!`);
                        }}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
