const fs = require('fs');
const path = require('path');

require('dotenv').config();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DATASET_PATH = path.join(__dirname, '../dataset/netflix_titles_cleaned.json');

async function fetchMovies() {
  let movies = [];
  
  // Load existing if possible
  if (fs.existsSync(DATASET_PATH)) {
    try {
        movies = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
    } catch(e) {}
  }

  try {
    let newCount = 0;
    // fetch around 40 pages * 20 = 800 movies
    for (let page = 1; page <= 40; page++) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&sort_by=popularity.desc&page=${page}`;
      console.log(`Fetching Indian movies page ${page}...`);
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results) {
        for (const r of data.results) {
            // Check if already exists
            if (!movies.some(m => m.show_id === `tmdb_in_${r.id}` || m.title === r.title)) {
                movies.push({
                    show_id: `tmdb_in_${r.id}`,
                    type: "Movie",
                    title: r.title,
                    director: "Unknown Director",
                    cast: "Unknown Cast",
                    country: "India",
                    date_added: r.release_date || "January 1, 2020",
                    release_year: r.release_date ? parseInt(r.release_date.substring(0,4)) : 2020,
                    rating: r.adult ? "R" : "PG-13",
                    duration: "120 min",
                    listed_in: "Action & Adventure, Comedies, Dramas, International Movies",
                    description: r.overview || "No description available",
                    added_year: r.release_date ? parseInt(r.release_date.substring(0,4)) : 2020,
                    added_month: "January",
                    cleaned_genres: ["Action & Adventure", "Comedies", "Dramas", "International Movies"],
                    normalized_country: "India"
                });
                newCount++;
            }
        }
      }
    }

    // Dump to dataset/netflix_titles_cleaned.json
    fs.writeFileSync(DATASET_PATH, JSON.stringify(movies, null, 2));
    console.log(`Added ${newCount} new Indian titles. Total movies now: ${movies.length}`);

  } catch(e) {
    console.error(e);
  }
}

fetchMovies();
