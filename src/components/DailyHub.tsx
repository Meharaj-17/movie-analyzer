import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Flame,
  Calendar,
  HelpCircle,
  CheckCircle2,
  Share2,
  Play,
  Award,
  ChevronRight,
  Smile,
  Zap,
  Heart,
  Volume2,
  Shuffle,
  EyeOff,
  Eye,
  Film
} from "lucide-react";
import { Movie } from "../types.js";
import { getMoviePosterUrl, is100crMovie } from "../App.js";

interface DailyHubProps {
  moviesList: Movie[];
  inspectMovie: (title: string) => void;
  setTab: (tab: any) => void;
  setFilters: (filters: any) => void;
  filters: any;
  userLikes: string[];
}

export default function DailyHub({
  moviesList,
  inspectMovie,
  setTab,
  setFilters,
  filters,
  userLikes
}: DailyHubProps) {
  // Streak State
  const [streak, setStreak] = useState<{ count: number; lastDate: string }>({
    count: 0,
    count_badges: 0,
    lastDate: ""
  } as any);
  const [checkedInToday, setCheckedInToday] = useState(false);

  // Daily Pick State
  const [dailyPick, setDailyPick] = useState<Movie | null>(null);

  // On This Day State
  const [onThisDayMovie, setOnThisDayMovie] = useState<Movie | null>(null);

  // Quiz State
  const [quizQuestion, setQuizQuestion] = useState<{
    plot: string;
    options: string[];
    answer: string;
    movie: Movie;
  } | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState("");

  // Blind Pick State
  const [blindPick, setBlindPick] = useState<Movie | null>(null);
  const [isBlindPickRevealed, setIsBlindPickRevealed] = useState(false);

  // Double Feature State
  const [doubleFeature, setDoubleFeature] = useState<{
    title: string;
    description: string;
    movieA: Movie;
    movieB: Movie;
  } | null>(null);

  // Load Streaks & Daily State
  useEffect(() => {
    // 1. Streak Loader
    const storedStreak = localStorage.getItem("movie_streak");
    const todayStr = new Date().toDateString();
    if (storedStreak) {
      const parsed = JSON.parse(storedStreak);
      setStreak(parsed);
      setCheckedInToday(parsed.lastDate === todayStr);
    }

    // 2. Quiz Score Loader
    const storedQuizScore = localStorage.getItem("quiz_score");
    if (storedQuizScore) {
      setQuizScore(parseInt(storedQuizScore, 10));
    }
  }, []);

  // Set Daily Pick & On This Day (seeded by date so it's stable throughout the day)
  useEffect(() => {
    if (moviesList.length === 0) return;

    const today = new Date();
    const daySeed = today.getDate() + today.getMonth() * 31 + today.getFullYear();

    // Pick based on seed
    // Try to pick a premium/popular movie if possible
    const blockbusters = moviesList.filter(m => is100crMovie(m.title));
    const pool = blockbusters.length > 0 ? blockbusters : moviesList;
    const pickIdx = daySeed % pool.length;
    setDailyPick(pool[pickIdx]);

    // On This Day: find a movie added in current month, or older classic
    const currentMonthName = today.toLocaleString("default", { month: "long" });
    const monthlyMovies = moviesList.filter(m => m.date_added?.toLowerCase().includes(currentMonthName.toLowerCase()));
    if (monthlyMovies.length > 0) {
      setOnThisDayMovie(monthlyMovies[(daySeed * 7) % monthlyMovies.length]);
    } else {
      setOnThisDayMovie(moviesList[(daySeed * 7) % moviesList.length]);
    }

    // Initialize daily quiz
    generateQuizQuestion(daySeed);

    // Initialize blind pick and double feature
    if (!blindPick) {
      const randMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
      setBlindPick(randMovie);
    }
    if (!doubleFeature) {
      generateDoubleFeature();
    }
  }, [moviesList]);

  // Generate a thematic double feature
  const generateDoubleFeature = () => {
    if (moviesList.length < 5) return;
    const movieA = moviesList[Math.floor(Math.random() * moviesList.length)];
    const genreA = movieA.listed_in.split(",")[0].trim();
    const potentialMatches = moviesList.filter(
      m => m.title !== movieA.title && 
           m.listed_in.toLowerCase().includes(genreA.toLowerCase())
    );
    const movieB = potentialMatches.length > 0 
      ? potentialMatches[Math.floor(Math.random() * potentialMatches.length)]
      : moviesList[Math.floor(Math.random() * moviesList.length)];

    let doubleTitle = "Mystic Cinematic Journeys";
    let doubleDesc = "A handpicked thematic double-bill designed to take you on a journey through contrasting styles and storytelling.";
    
    const lowerGenre = genreA.toLowerCase();
    if (lowerGenre.includes("action") || lowerGenre.includes("thriller") || lowerGenre.includes("adventure")) {
      const themes = [
        { t: "Rage & Redemption Night", d: "High-stakes battles, raw determination, and explosive cinematic justice." },
        { t: "Adrenaline & Suspense Overdose", d: "Edge-of-your-seat pacing where survival hangs on a razor-thin narrative thread." },
        { t: "The Shadow Vigilante Double-Bill", d: "Gritty anti-heroes taking matters into their own hands under the cover of night." }
      ];
      const selected = themes[Math.floor(Math.random() * themes.length)];
      doubleTitle = selected.t;
      doubleDesc = selected.d;
    } else if (lowerGenre.includes("comedy")) {
      const themes = [
        { t: "Uncontrollable Giggles & Goofballs", d: "Lighthearted fun, witty banter, and hilarious misadventures." },
        { t: "Chuckle & Chill Marathon", d: "The perfect feel-good remedy of laughter, eccentric families, and warm hearts." }
      ];
      const selected = themes[Math.floor(Math.random() * themes.length)];
      doubleTitle = selected.t;
      doubleDesc = selected.d;
    } else if (lowerGenre.includes("drama") || lowerGenre.includes("romantic") || lowerGenre.includes("romance")) {
      const themes = [
        { t: "Heartstrings & Heavy Tears", d: "Raw human connection, emotional depth, and beautifully complex relationships." },
        { t: "Love, Fate & Melancholy Night", d: "Swoon-worthy moments blended with bitter-sweet realities of destiny." }
      ];
      const selected = themes[Math.floor(Math.random() * themes.length)];
      doubleTitle = selected.t;
      doubleDesc = selected.d;
    } else if (lowerGenre.includes("documentar")) {
      const themes = [
        { t: "Truth Stranger Than Fiction", d: "Eye-opening stories, unmasking realities, and spectacular real-world achievements." }
      ];
      const selected = themes[Math.floor(Math.random() * themes.length)];
      doubleTitle = selected.t;
      doubleDesc = selected.d;
    }

    setDoubleFeature({
      title: doubleTitle,
      description: doubleDesc,
      movieA,
      movieB
    });
  };

  const rollBlindPick = () => {
    if (moviesList.length === 0) return;
    const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
    setBlindPick(randomMovie);
    setIsBlindPickRevealed(false);
  };

  // Generate guess the plot quiz question
  const generateQuizQuestion = (seedOffset = 0) => {
    if (moviesList.length < 5) return;
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 41 + today.getFullYear() + seedOffset;

    // Pick a movie with a long descriptive plot
    const descriptives = moviesList.filter(m => m.description && m.description.length > 60);
    const targetIdx = seed % descriptives.length;
    const targetMovie = descriptives[targetIdx];

    // Pick 3 random incorrect options
    const optionsSet = new Set<string>();
    optionsSet.add(targetMovie.title);

    let securityCounter = 0;
    while (optionsSet.size < 4 && securityCounter < 100) {
      const randMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
      if (randMovie.title !== targetMovie.title) {
        optionsSet.add(randMovie.title);
      }
      securityCounter++;
    }

    // Shuffle options
    const optionsArray = Array.from(optionsSet);
    const shuffledOptions = optionsArray.sort(() => (seed % 10 > 5 ? 0.5 - Math.random() : Math.random() - 0.5));

    setQuizQuestion({
      plot: targetMovie.description,
      options: shuffledOptions,
      answer: targetMovie.title,
      movie: targetMovie
    });
    setSelectedQuizAnswer(null);
    setIsAnswerCorrect(null);
    setQuizFeedback("");
  };

  // Perform Daily check-in
  const handleCheckIn = () => {
    const todayStr = new Date().toDateString();
    let newCount = streak.count;

    if (streak.lastDate === "") {
      newCount = 1;
    } else {
      const lastDateObj = new Date(streak.lastDate);
      const todayObj = new Date(todayStr);
      const diffTime = Math.abs(todayObj.getTime() - lastDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newCount += 1;
      } else if (diffDays > 1) {
        newCount = 1; // Reset streak if missed day
      }
    }

    const updated = { count: newCount, lastDate: todayStr };
    localStorage.setItem("movie_streak", JSON.stringify(updated));
    setStreak(updated);
    setCheckedInToday(true);

    // Set check-in count for gamification badges
    localStorage.setItem("check_in_count", newCount.toString());
  };

  // Check quiz answer
  const handleQuizAnswer = (option: string) => {
    if (!quizQuestion || selectedQuizAnswer !== null) return;

    setSelectedQuizAnswer(option);
    const correct = option === quizQuestion.answer;
    setIsAnswerCorrect(correct);

    if (correct) {
      const newScore = quizScore + 10;
      setQuizScore(newScore);
      localStorage.setItem("quiz_score", newScore.toString());
      setQuizFeedback("Splendid guess! You earned 10 points. 🎉");
      
      // Save completed quizzes for badges
      const storedCount = localStorage.getItem("correct_quizzes") || "0";
      localStorage.setItem("correct_quizzes", (parseInt(storedCount, 10) + 1).toString());
    } else {
      setQuizFeedback(`Oops! The correct movie was "${quizQuestion.answer}".`);
    }
  };

  // Mood selector map
  const moods = [
    { name: "Chill 😴", label: "Chill", desc: "Relaxing dramas, romantic, and light-hearted comedies", filter: "Comedies, Romantic, Dramas, Kids, Family" },
    { name: "Intense ⚡", label: "Intense", desc: "High-octane actions, spine-chilling thrillers, and horror", filter: "Action & Adventure, Thrillers, Horror, Crime Movies" },
    { name: "Emotional 🥺", label: "Emotional", desc: "Heartfelt dramas, deep bios, and touching narratives", filter: "Dramas, Romantic Movies, Documentaries" },
    { name: "Laugh 😂", label: "Laugh", desc: "Side-splitting stand-ups and hilarious comedies", filter: "Comedies, Stand-Up Comedy" }
  ];

  const applyMoodFilter = (genreFilter: string, moodLabel: string) => {
    // Navigate to Search with preset filters
    setFilters({
      ...filters,
      genre: genreFilter.split(",")[0].trim(), // Pick primary
      query: ""
    });
    setTab("search");
  };

  const shareScore = () => {
    const text = `I scored ${quizScore} points in the Netflix Daily Movie Quiz! Test your cinema knowledge too! 🎬🍿`;
    navigator.clipboard.writeText(text);
    alert("Shareable text copied to clipboard! Share it with your friends!");
  };

  return (
    <div className="space-y-8" id="daily-hub-root">
      {/* Top Header Row with Streak Widget */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Your Daily Cinema Ritual
          </h3>
          <p className="text-sm text-slate-400">
            Open every day to collect your recommendations, test your cinema intellect, and build your movie streak.
          </p>
        </div>

        {/* Streak & Check-in Panel */}
        <div className="md:col-span-4 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden shadow-lg shadow-indigo-900/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-8 h-8 ${checkedInToday ? "text-amber-500 animate-bounce" : "text-slate-500"}`} />
            <div>
              <div className="text-lg font-black text-white">{streak.count} Day Streak</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {checkedInToday ? "Daily ritual checked!" : "Check in to keep alive!"}
              </div>
            </div>
          </div>

          {!checkedInToday ? (
            <button
              onClick={handleCheckIn}
              className="w-full mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs transition-all shadow-md shadow-amber-500/10"
            >
              Check-In Today
            </button>
          ) : (
            <div className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-4 h-4" /> Locked for today. See you tomorrow!
            </div>
          )}
        </div>
      </div>

      {/* Main Grid for widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Daily Pick & On This Day */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Pick Banner (Netflix style but lighter) */}
          {dailyPick && (
            <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden relative shadow-xl group">
              <div className="h-[260px] relative">
                <img
                  src={getMoviePosterUrl(dailyPick.title, dailyPick.type, dailyPick.cleaned_genres || dailyPick.listed_in.split(","))}
                  alt={dailyPick.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-[#141418]/50 to-transparent" />
                <div className="absolute top-4 left-4 bg-red-600 text-white font-mono font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded shadow-lg flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-current" /> Daily Pick
                </div>
              </div>

              <div className="p-6 relative -mt-16 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-indigo-400">{dailyPick.listed_in}</span>
                  <h4 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {dailyPick.title}
                  </h4>
                  <div className="flex gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span className="text-amber-500 font-bold">{dailyPick.rating}</span>
                    <span>{dailyPick.duration}</span>
                    <span>Released: {dailyPick.release_year}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {dailyPick.description}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => inspectMovie(dailyPick.title)}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Inspect Cinema
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* On This Day Nostalgia Blockbuster */}
          {onThisDayMovie && (
            <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-xl" />
              <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4" /> Historical Nostalgia
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <img
                  src={getMoviePosterUrl(onThisDayMovie.title, onThisDayMovie.type, onThisDayMovie.cleaned_genres || onThisDayMovie.listed_in.split(","))}
                  alt={onThisDayMovie.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-28 object-cover rounded-xl shadow-md shrink-0 border border-white/10"
                />
                <div className="space-y-2 flex-1 text-center md:text-left">
                  <h5 className="font-display font-black text-white text-md">
                    {onThisDayMovie.title} ({onThisDayMovie.release_year})
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {onThisDayMovie.description}
                  </p>
                  <button
                    onClick={() => inspectMovie(onThisDayMovie.title)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mx-auto md:mx-0 transition-colors"
                  >
                    Dive into nostalgia <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Weekly Quiz & Mood Check-In */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mood Check-In */}
          <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
            <div>
              <h4 className="font-display font-bold text-md text-white">How are you feeling today?</h4>
              <p className="text-xs text-slate-400">Select your mood for instant bespoke recommendations.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => applyMoodFilter(m.filter, m.label)}
                  className="bg-black/30 border border-white/10 hover:border-indigo-500/40 hover:bg-black/60 p-3 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {m.name}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Weekly Quiz */}
          {quizQuestion && (
            <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-white/5 p-5 rounded-2xl shadow-md space-y-4 relative">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-indigo-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" /> Weekly Quiz Arena
                </div>
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                  Score: {quizScore} pts
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Guess the Movie Plot:</span>
                <p className="text-xs text-slate-300 italic bg-black/40 border border-white/5 p-3.5 rounded-xl leading-relaxed">
                  "{quizQuestion.plot}"
                </p>
              </div>

              <div className="space-y-2">
                {quizQuestion.options.map((option, idx) => {
                  const isSelected = selectedQuizAnswer === option;
                  const isCorrectAnswer = option === quizQuestion.answer;
                  let btnStyle = "bg-black/20 border-white/5 text-slate-300 hover:bg-black/40";

                  if (selectedQuizAnswer !== null) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-emerald-950/50 border-emerald-500 text-emerald-400";
                    } else if (isSelected) {
                      btnStyle = "bg-red-950/50 border-red-500 text-red-400";
                    } else {
                      btnStyle = "bg-black/10 border-white/5 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedQuizAnswer !== null}
                      onClick={() => handleQuizAnswer(option)}
                      className={`w-full text-left py-2 px-3 border rounded-xl text-xs transition-all font-medium flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {selectedQuizAnswer !== null && isCorrectAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {quizFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-black/40 rounded-xl text-xs border border-white/5 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{quizFeedback}</span>
                      <button
                        onClick={shareScore}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold text-[10px] transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                    <button
                      onClick={() => generateQuizQuestion(Math.floor(Math.random() * 500))}
                      className="w-full mt-1 py-1.5 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg font-bold text-[10px] transition-all border border-indigo-500/20"
                    >
                      Play Next Quiz Question
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Randomized Blind Pick (Surprise Me) */}
          {blindPick && (
            <div className="bg-[#141418]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-pink-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <Shuffle className="w-4 h-4 animate-spin-slow" /> Blind Pick Cinema
                </div>
                <button
                  onClick={rollBlindPick}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  title="Roll another blind pick"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative h-48 rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center p-4">
                {/* Cryptic Hint & Blur Overlay */}
                {!isBlindPickRevealed ? (
                  <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 bg-gradient-to-br from-pink-950/25 via-black/85 to-[#141418] backdrop-blur-sm">
                    <div className="flex justify-between items-start">
                      <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded text-[10px] font-mono">
                        Cryptic Hint Card
                      </span>
                      <EyeOff className="w-4 h-4 text-pink-400/60" />
                    </div>
                    <p className="text-xs text-slate-300 text-center leading-relaxed italic line-clamp-4 select-none px-2">
                      "{blindPick.description ? blindPick.description.replace(new RegExp(blindPick.title, 'gi'), '████████') : 'No description available for this mystery selection.'}"
                    </p>
                    <button
                      onClick={() => setIsBlindPickRevealed(true)}
                      className="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-black shadow-lg shadow-pink-500/10 transition-all cursor-pointer"
                    >
                      Reveal Movie
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-10 flex flex-col justify-between p-4 bg-[#141418]"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={getMoviePosterUrl(blindPick.title, blindPick.type, blindPick.cleaned_genres || blindPick.listed_in.split(","))}
                        alt={blindPick.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-24 object-cover rounded border border-white/10 shadow shrink-0"
                      />
                      <div className="space-y-1 overflow-hidden">
                        <span className="text-[9px] font-mono text-pink-400 font-bold uppercase tracking-wider bg-pink-950/30 px-1.5 py-0.5 rounded">
                          {blindPick.type}
                        </span>
                        <h5 className="font-display font-black text-white text-xs truncate">
                          {blindPick.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed">
                          {blindPick.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => inspectMovie(blindPick.title)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Inspect Title
                      </button>
                      <button
                        onClick={rollBlindPick}
                        className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Roll Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Double Feature Generator */}
      {doubleFeature && (
        <div className="bg-gradient-to-r from-indigo-950/30 via-[#141418]/90 to-purple-950/30 border border-indigo-500/10 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest animate-pulse">
                <Film className="w-4 h-4" /> Curated Double Feature Ticket
              </div>
              <h4 className="font-display font-black text-white text-xl tracking-tight mt-1">
                {doubleFeature.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {doubleFeature.description}
              </p>
            </div>
            
            <button
              onClick={generateDoubleFeature}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" /> Re-roll Double Bill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Center Split Ticket Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 border-r border-dashed border-white/10 -translate-x-1/2 z-0" />
            
            {/* Movie A */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl flex gap-4 items-center hover:border-indigo-500/20 transition-all">
              <img
                src={getMoviePosterUrl(doubleFeature.movieA.title, doubleFeature.movieA.type, doubleFeature.movieA.cleaned_genres || doubleFeature.movieA.listed_in.split(","))}
                alt={doubleFeature.movieA.title}
                referrerPolicy="no-referrer"
                className="w-20 h-28 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
              />
              <div className="space-y-1 flex-1 overflow-hidden">
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">Part I • Feature Presentation</span>
                <h5 className="font-display font-bold text-white text-sm truncate">{doubleFeature.movieA.title}</h5>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{doubleFeature.movieA.description}</p>
                <button
                  onClick={() => inspectMovie(doubleFeature.movieA.title)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold pt-1 flex items-center gap-1 transition-all cursor-pointer"
                >
                  Inspect Feature
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Movie B */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl flex gap-4 items-center hover:border-purple-500/20 transition-all">
              <img
                src={getMoviePosterUrl(doubleFeature.movieB.title, doubleFeature.movieB.type, doubleFeature.movieB.cleaned_genres || doubleFeature.movieB.listed_in.split(","))}
                alt={doubleFeature.movieB.title}
                referrerPolicy="no-referrer"
                className="w-20 h-28 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
              />
              <div className="space-y-1 flex-1 overflow-hidden">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">Part II • Late-Night Companion</span>
                <h5 className="font-display font-bold text-white text-sm truncate">{doubleFeature.movieB.title}</h5>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{doubleFeature.movieB.description}</p>
                <button
                  onClick={() => inspectMovie(doubleFeature.movieB.title)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold pt-1 flex items-center gap-1 transition-all cursor-pointer"
                >
                  Inspect Feature
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
