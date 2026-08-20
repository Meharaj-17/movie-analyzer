/**
 * Generates an insightful, highly engaging reason of why a movie/show is worth watching,
 * based on its genres, title, and type. Fully customized for both popular titles and dynamic fallback content.
 */
export function getWhyWatchInsight(title: string, type: string, genresInput: string[] | string): string {
  const genres = Array.isArray(genresInput)
    ? genresInput
    : genresInput.split(",").map((g) => g.trim());

  const lowercaseTitle = title.toLowerCase();

  // Curated, premium insights for popular or high-profile movies
  if (lowercaseTitle.includes("baahubali")) {
    return "A legendary milestone in Indian cinema. It delivers unmatched mythical world-building, breathtaking battle sequences, and an emotionally gripping saga of royalty, sacrifice, and pure heroism.";
  }
  if (lowercaseTitle.includes("jawan")) {
    return "A high-octane mass action spectacle featuring a stellar double-role performance, sharp social messaging, and blockbuster combat sequences that define premium commercial cinema.";
  }
  if (lowercaseTitle.includes("3 idiots")) {
    return "A heartwarming masterpiece that brilliantly tackles the pressures of educational systems with humor, friendship, and unforgettable life lessons. A must-watch for all generations.";
  }
  if (lowercaseTitle.includes("dangal")) {
    return "An extraordinarily powerful sports drama filled with raw determination, emotional complexity, and phenomenal performances. It stands as one of the most inspiring true stories ever put on screen.";
  }
  if (lowercaseTitle.includes("stranger things")) {
    return "A spectacular nostalgia-fueled sci-fi epic. It pairs masterclass retro synth vibes and supernatural horror with one of the most lovable and well-developed ensemble casts on television.";
  }
  if (lowercaseTitle.includes("squid game")) {
    return "A dark, intense social thriller that grips you from the very first minute. Its high-stakes survival games serve as a masterfully constructed, deeply unsettling critique of modern society.";
  }
  if (lowercaseTitle.includes("wednesday")) {
    return "A delightfully macabre gothic mystery starring a brilliant Jenna Ortega. It's the perfect blend of sarcastic humor, detective storytelling, and spellbinding dark academia atmosphere.";
  }
  if (lowercaseTitle.includes("ramayana")) {
    return "An ambitious, visually spectacular modern adaptation of the greatest epic of virtue and duty, rendering mythical warfare and timeless mythology with ground-breaking visual grandeur.";
  }
  if (lowercaseTitle.includes("war 2")) {
    return "A monumental spy-universe faceoff bringing together legendary superstars in a high-octane global chess game of elite warfare, stunning choreography, and mind-bending action.";
  }
  if (lowercaseTitle.includes("alpha")) {
    return "A historic, female-led action thriller breaking new ground in spy-universe storytelling, featuring stellar high-intensity stunt-work and exceptional suspenseful espionage.";
  }
  if (lowercaseTitle.includes("spirit")) {
    return "A fierce, gritty, and uncompromising cop thriller directed by the master of raw cinematic intensity, delivering a powerhouse performance and pulse-pounding, high-stakes action.";
  }

  // Dynamic genres-based insights for the rest of the database
  const matchesGenre = (keyword: string) =>
    genres.some((g) => g.toLowerCase().includes(keyword.toLowerCase()));

  if (matchesGenre("Action") || matchesGenre("Thriller")) {
    return "A masterclass in suspense and high-intensity pacing, delivering stellar combat choreography and adrenaline-pumping stakes that will keep you on the absolute edge of your seat.";
  }
  if (matchesGenre("Sci-Fi") || matchesGenre("Fantasy") || matchesGenre("Anime") || matchesGenre("Mythology")) {
    return "An extraordinarily imaginative adventure that pushes the boundaries of creative storytelling, offering rich lore, stellar visual concepts, and a truly mind-bending world to escape into.";
  }
  if (matchesGenre("Drama") || matchesGenre("Romantic") || matchesGenre("Romance")) {
    return "A deeply moving, emotionally resonant cinematic experience filled with powerful, nuanced performances and a compelling human story that will linger in your mind long after the credits.";
  }
  if (matchesGenre("Comedy") || matchesGenre("Comedies")) {
    return "A brilliant blend of clever wit, excellent timing, and lighthearted charm. It delivers a perfect therapeutic escape and a highly entertaining watch that guarantees smiles.";
  }
  if (matchesGenre("Documentaries") || matchesGenre("Docuseries")) {
    return "A thought-provoking, beautifully researched deep-dive that uncovers fascinating real-world truths with captivating depth and exceptional investigative precision.";
  }
  if (matchesGenre("Horror")) {
    return "A chilling, masterfully atmospheric horror piece that excels at building deep, psychological dread and highly memorable frights that won't let you sleep tonight.";
  }
  if (matchesGenre("International") || matchesGenre("Indian")) {
    return "An authentic, culturally rich film that offers a refreshing global perspective, combining highly expressive acting with a beautifully told, universally resonant story.";
  }

  // Fallback
  return "A beautifully crafted, highly engaging cinematic gem that seamlessly blends sharp writing with captivating performances to deliver an absolutely unforgettable viewing experience.";
}
