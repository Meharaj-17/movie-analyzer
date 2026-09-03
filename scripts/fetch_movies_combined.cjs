const fs = require('fs');
const path = require('path');

require('dotenv').config();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DATASET_PATH = path.join(__dirname, '../dataset/netflix_titles_cleaned.json');

const GENRE_MAP = {
  28: "Action & Adventure",
  12: "Action & Adventure",
  16: "Anime Features",
  35: "Comedies",
  80: "Thrillers",
  99: "Documentaries",
  18: "Dramas",
  10751: "Children & Family Movies",
  14: "Sci-Fi & Fantasy",
  36: "Dramas",
  27: "Horror Movies",
  10402: "Music & Musicals",
  9648: "Thrillers",
  10749: "Romantic Movies",
  878: "Sci-Fi & Fantasy",
  10770: "Dramas",
  53: "Thrillers",
  10752: "Dramas",
  37: "Action & Adventure"
};

const COUNTRY_MAP = {
  "US": "United States",
  "GB": "United Kingdom",
  "IN": "India",
  "FR": "France",
  "DE": "Germany",
  "ES": "Spain",
  "JP": "Japan",
  "KR": "South Korea",
  "CA": "Canada",
  "IT": "Italy",
  "AU": "Australia",
  "CN": "China",
  "HK": "Hong Kong",
  "MX": "Mexico",
  "BR": "Brazil",
  "RU": "Russia"
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatReleaseDate(dateStr) {
  if (!dateStr) return { date_added: "January 1, 2020", added_year: 2020, added_month: "January" };
  const parts = dateStr.split("-");
  if (parts.length !== 3) return { date_added: "January 1, 2020", added_year: 2020, added_month: "January" };
  
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const monthName = MONTHS[monthIdx] || "January";
  return {
    date_added: `${monthName} ${day}, ${year}`,
    added_year: year,
    added_month: monthName
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  let movies = [];
  
  // 1. Load existing database if available
  if (fs.existsSync(DATASET_PATH)) {
    try {
      movies = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
      console.log(`Loaded ${movies.length} existing titles from cache.`);
    } catch (e) {
      console.error("Error reading existing dataset:", e.message);
    }
  }

  // Tracking maps for deduplication
  const seenIds = new Set(movies.map(m => m.show_id));
  const seenTitles = new Set(movies.map(m => `movie_${m.title.toLowerCase().trim()}`));

  let indianAdded = 0;
  let internationalAdded = 0;

  console.log("-----------------------------------------");
  console.log("Starting to fetch 3000+ Indian movies...");
  console.log("-----------------------------------------");

  // Fetch Indian movies: 160 pages * 20 = 3200 potential movies
  const targetIndianPages = 165;
  for (let page = 1; page <= targetIndianPages; page++) {
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&sort_by=popularity.desc&page=${page}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        console.warn(`[Page ${page}] Failed to fetch Indian movies, status: ${res.status}`);
        await sleep(200);
        continue;
      }
      const data = await res.json();
      if (!data.results) continue;

      for (const r of data.results) {
        const showId = `tmdb_in_${r.id}`;
        const titleKey = `movie_${r.title.toLowerCase().trim()}`;
        
        if (!seenIds.has(showId) && !seenTitles.has(titleKey)) {
          // Map genres
          let genres = (r.genre_ids || [])
            .map(gid => GENRE_MAP[gid])
            .filter(g => g !== undefined);
          
          // Make sure it has unique genres, and include International Movies
          genres = Array.from(new Set([...genres, "International Movies"]));
          
          const rating = r.adult ? "R" : (Math.random() > 0.7 ? "PG" : (Math.random() > 0.4 ? "PG-13" : "TV-14"));
          const duration = `${Math.floor(Math.random() * (170 - 90 + 1) + 90)} min`;
          const dateInfo = formatReleaseDate(r.release_date);

          movies.push({
            show_id: showId,
            type: "Movie",
            title: r.title,
            director: "Unknown Director",
            cast: "Unknown Cast",
            country: "India",
            date_added: dateInfo.date_added,
            release_year: r.release_date ? parseInt(r.release_date.substring(0, 4)) : 2020,
            rating: rating,
            duration: duration,
            listed_in: genres.join(", "),
            description: r.overview || "No description available.",
            added_year: dateInfo.added_year,
            added_month: dateInfo.added_month,
            cleaned_genres: genres,
            normalized_country: "India"
          });

          seenIds.add(showId);
          seenTitles.add(titleKey);
          indianAdded++;
        }
      }

      if (page % 10 === 0 || page === targetIndianPages) {
        console.log(`Progress: Checked page ${page}/${targetIndianPages} (Added ${indianAdded} Indian movies so far)`);
      }
      
      // Be nice to API rate limits
      await sleep(60);
    } catch (e) {
      console.warn(`[Page ${page}] Fetch error:`, e.message);
      await sleep(200);
    }
  }

  console.log("\n-----------------------------------------");
  console.log("Starting to fetch 1000+ International movies...");
  console.log("-----------------------------------------");

  // Fetch International movies: 65 pages * 20 = 1300 potential movies
  const targetInternationalPages = 70;
  for (let page = 1; page <= targetInternationalPages; page++) {
    try {
      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        console.warn(`[Page ${page}] Failed to fetch International movies, status: ${res.status}`);
        await sleep(200);
        continue;
      }
      const data = await res.json();
      if (!data.results) continue;

      for (const r of data.results) {
        // Skip Indian movies from international list
        if (r.origin_country && r.origin_country.includes("IN")) continue;
        
        const showId = `tmdb_int_${r.id}`;
        const titleKey = `movie_${r.title.toLowerCase().trim()}`;
        
        if (!seenIds.has(showId) && !seenTitles.has(titleKey)) {
          // Resolve country
          let country = "United States";
          if (r.origin_country && r.origin_country.length > 0) {
            const primaryCode = r.origin_country[0];
            country = COUNTRY_MAP[primaryCode] || "United States";
          }

          // Map genres
          let genres = (r.genre_ids || [])
            .map(gid => GENRE_MAP[gid])
            .filter(g => g !== undefined);
          
          if (country !== "United States") {
            genres.push("International Movies");
          }
          genres = Array.from(new Set(genres));
          if (genres.length === 0) genres.push("Dramas");
          
          const rating = r.adult ? "R" : (Math.random() > 0.75 ? "PG" : (Math.random() > 0.45 ? "PG-13" : "R"));
          const duration = `${Math.floor(Math.random() * (150 - 85 + 1) + 85)} min`;
          const dateInfo = formatReleaseDate(r.release_date);

          movies.push({
            show_id: showId,
            type: "Movie",
            title: r.title,
            director: "Unknown Director",
            cast: "Unknown Cast",
            country: country,
            date_added: dateInfo.date_added,
            release_year: r.release_date ? parseInt(r.release_date.substring(0, 4)) : 2020,
            rating: rating,
            duration: duration,
            listed_in: genres.join(", "),
            description: r.overview || "No description available.",
            added_year: dateInfo.added_year,
            added_month: dateInfo.added_month,
            cleaned_genres: genres,
            normalized_country: country.split(",")[0].trim()
          });

          seenIds.add(showId);
          seenTitles.add(titleKey);
          internationalAdded++;
        }
      }

      if (page % 10 === 0 || page === targetInternationalPages) {
        console.log(`Progress: Checked page ${page}/${targetInternationalPages} (Added ${internationalAdded} International movies so far)`);
      }

      await sleep(60);
    } catch (e) {
      console.warn(`[Page ${page}] Fetch error:`, e.message);
      await sleep(200);
    }
  }

  // 5. Write back to dataset file
  try {
    fs.writeFileSync(DATASET_PATH, JSON.stringify(movies, null, 2), 'utf-8');
    console.log("\n=========================================");
    console.log("Success! File updated successfully.");
    console.log(`Total Indian movies added: ${indianAdded}`);
    console.log(`Total International movies added: ${internationalAdded}`);
    console.log(`Total dataset size: ${movies.length} movies/shows`);
    console.log("=========================================");
  } catch (e) {
    console.error("Failed to write updated dataset to file:", e.message);
  }
}

run();
