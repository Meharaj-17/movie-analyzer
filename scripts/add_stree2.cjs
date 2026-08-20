const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '../dataset/netflix_titles_cleaned.json');

let movies = [];
if (fs.existsSync(DATASET_PATH)) {
    movies = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
}

movies.push({
    show_id: `tmdb_in_custom_stree2`,
    type: "Movie",
    title: "Stree 2",
    director: "Amar Kaushik",
    cast: "Rajkummar Rao, Shraddha Kapoor, Pankaj Tripathi, Abhishek Banerjee",
    country: "India",
    date_added: "2024-08-15",
    release_year: 2024,
    rating: "PG-13",
    duration: "140 min",
    listed_in: "Comedies, Horror Movies, International Movies",
    description: "The town of Chanderi is being haunted again. This time, women are mysteriously abducted by a terrifying headless entity. Once again, it's up to Vicky and his friends to save their town and its women.",
    added_year: 2024,
    added_month: "August",
    cleaned_genres: ["Comedies", "Horror Movies", "International Movies"],
    normalized_country: "India"
});

fs.writeFileSync(DATASET_PATH, JSON.stringify(movies, null, 2));
console.log("Added Stree 2");
