/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import { Movie } from "../types.js";

const DATASET_DIR = path.join(process.cwd(), "dataset");
const DATASET_PATH = path.join(DATASET_DIR, "netflix_titles.csv");
const CLEANED_CACHE_PATH = path.join(DATASET_DIR, "netflix_titles_cleaned.json");

// High-quality sample database for Netflix titles
const SAMPLE_NETFLIX_TITLES = [
  // TV Shows
  ["s1", "TV Show", "Stranger Things", "The Duffer Brothers", "Winona Ryder, David Harbour, Millie Bobby Brown, Finn Wolfhard, Gaten Matarazzo, Caleb McLaughlin, Noah Schnapp, Sadie Sink", "United States", "July 15, 2016", "2022", "TV-14", "4 Seasons", "TV Sci-Fi & Fantasy, TV Dramas, TV Thrillers", "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl."],
  ["s2", "TV Show", "Wednesday", "Tim Burton", "Jenna Ortega, Gwendoline Christie, Riki Lindhome, Jamie McShane, Hunter Doohan, Percy Hynes White", "United States", "November 23, 2022", "2022", "TV-14", "1 Season", "TV Comedies, TV Sci-Fi & Fantasy, TV Mysteries", "Smart, sarcastic and a little dead inside, Wednesday Addams investigates a murder spree while making new friends — and foes — at Nevermore Academy."],
  ["s3", "TV Show", "Squid Game", "Hwang Dong-hyuk", "Lee Jung-jae, Park Hae-soo, Wi Ha-jun, Oh Young-soo, Jung Ho-yeon, Heo Sung-tae", "South Korea", "September 17, 2021", "2021", "TV-MA", "1 Season", "International TV Shows, TV Dramas, TV Thrillers", "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes."],
  ["s4", "TV Show", "Breaking Bad", "Vince Gilligan", "Bryan Cranston, Aaron Paul, Anna Gunn, Dean Norris, Betsy Brandt, RJ Mitte, Bob Odenkirk", "United States", "August 2, 2013", "2013", "TV-MA", "5 Seasons", "Crime TV Shows, TV Dramas, TV Thrillers", "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future."],
  ["s5", "TV Show", "Black Mirror", "Charlie Brooker", "Jesse Plemons, Cristin Milioti, Jimmi Simpson, Michaela Coel, Bryce Dallas Howard, Alice Eve", "United Kingdom", "June 5, 2019", "2019", "TV-MA", "5 Seasons", "British TV Shows, TV Sci-Fi & Fantasy, TV Thrillers", "This sci-fi anthology series explores a twisted, high-tech near-future where humanity's greatest innovations and darkest instincts collide."],
  ["s6", "TV Show", "Cobra Kai", "Jon Hurwitz", "Ralph Macchio, William Zabka, Courtney Henggeler, Xolo Maridueña, Tanner Buchanan, Mary Mouser", "United States", "January 1, 2021", "2021", "TV-14", "5 Seasons", "TV Action & Adventure, TV Comedies, TV Dramas", "Decades after the tournament that changed their lives, the rivalry between Johnny and Daniel reignites in this sequel to the Karate Kid films."],
  ["s7", "TV Show", "The Crown", "Peter Morgan", "Olivia Colman, Helena Bonham Carter, Tobias Menzies, Claire Foy, Matt Smith, Vanessa Kirby", "United Kingdom", "November 15, 2020", "2020", "TV-MA", "4 Seasons", "British TV Shows, TV Dramas, International TV Shows", "Based on historical events, this dramatization tells the story of Queen Elizabeth II and the political and personal events that shaped her reign."],
  ["s8", "TV Show", "Lucifer", "Nathan Hope", "Tom Ellis, Lauren German, Kevin Alejandro, D.B. Woodside, Lesley-Ann Brandt, Scarlett Estevez", "United States", "May 28, 2021", "2021", "TV-14", "6 Seasons", "Crime TV Shows, TV Sci-Fi & Fantasy, TV Dramas", "Bored with being the Lord of Hell, the devil relocates to Los Angeles, opens a nightclub and chooses to help a homicide detective solve bizarre murders."],
  ["s9", "TV Show", "Narcos", "Andrés Baiz", "Wagner Moura, Boyd Holbrook, Pedro Pascal, Joanna Christie, Maurice Compte, André Mattos", "Colombia, United States", "September 1, 2017", "2017", "TV-MA", "3 Seasons", "Crime TV Shows, TV Dramas, International TV Shows", "A gritty, raw, action-packed look at the rise of Colombia's drug cartels and the law enforcement effort to stop them, chronicling the life of Pablo Escobar."],
  ["s10", "TV Show", "Money Heist", "Jesús Colmenar", "Úrsula Corberó, Álvaro Morte, Itziar Ituño, Pedro Alonso, Paco Tous, Alba Flores, Miguel Herrán", "Spain", "December 3, 2021", "2021", "TV-MA", "5 Seasons", "Spanish-Language TV Shows, Crime TV Shows, TV Thrillers", "Eight thieves take hostages and lock themselves in the Royal Mint of Spain as a criminal mastermind manipulates the police to carry out his master plan."],
  ["s11", "TV Show", "Dark", "Baran bo Odar", "Louis Hofmann, Oliver Masucci, Jördis Triebel, Maja Schöne, Karoline Eichhorn, Sebastian Rudolph", "Germany", "June 27, 2020", "2020", "TV-MA", "3 Seasons", "International TV Shows, TV Sci-Fi & Fantasy, TV Mysteries", "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery that spans three generations in a small town."],
  ["s12", "TV Show", "The Witcher", "Alik Sakharov", "Henry Cavill, Anya Chalotra, Freya Allan, Joey Batey, MyAnna Buring, Mimî M. Khayisa", "United States, Poland", "December 17, 2021", "2021", "TV-MA", "2 Seasons", "TV Action & Adventure, TV Sci-Fi & Fantasy, TV Dramas", "Geralt of Rivia, a mutated monster-hunter for hire, journeys toward his destiny in a turbulent world where people often prove more wicked than beasts."],
  ["s13", "TV Show", "BoJack Horseman", "Raphael Bob-Waksberg", "Will Arnett, Aaron Paul, Amy Sedaris, Alison Brie, Paul F. Tompkins", "United States", "October 25, 2019", "2019", "TV-MA", "6 Seasons", "TV Comedies", "Meet the most beloved sitcom horse of the '90s, 20 years later. He's a curmudgeon with a heart of... not quite gold, but something like copper."],
  ["s14", "TV Show", "Mindhunter", "David Fincher", "Jonathan Groff, Holt McCallany, Anna Torv, Hannah Gross, Cotter Smith", "United States", "August 16, 2019", "2019", "TV-MA", "2 Seasons", "Crime TV Shows, TV Dramas, TV Mysteries", "In the late 1970s, two FBI agents expand criminal science by delving into the psychology of murder and getting uneasily close to all-too-real monsters."],
  ["s15", "TV Show", "Ozark", "Jason Bateman", "Jason Bateman, Laura Linney, Sofia Hublitz, Skylar Gaertner, Julia Garner", "United States", "January 21, 2022", "2022", "TV-MA", "4 Seasons", "Crime TV Shows, TV Dramas", "A financial adviser drags his family from Chicago to the Missouri Ozarks, where he must launder $500 million in five years to appease a cartel boss."],
  ["s16", "TV Show", "Peaky Blinders", "Colm McCarthy", "Cillian Murphy, Sam Neill, Helen McCrory, Paul Anderson, Annabelle Wallis, Sophie Rundle", "United Kingdom", "June 10, 2022", "2022", "TV-MA", "6 Seasons", "British TV Shows, Crime TV Shows, TV Dramas", "A notorious gang in 1919 Birmingham, England, is led by the fierce Tommy Shelby, a crime boss set on moving up in the world no matter what the cost."],
  ["s17", "TV Show", "Alice in Borderland", "Shinsuke Sato", "Kento Yamazaki, Tao Tsuchiya, Nijiro Murakami, Keita Machida, Sho Aoyagi", "Japan", "December 22, 2022", "2022", "TV-MA", "2 Seasons", "International TV Shows, TV Action & Adventure, TV Sci-Fi & Fantasy", "An aimless gamer and his two friends find themselves in a parallel Tokyo, where they are forced to compete in a series of sadistic games to survive."],
  ["s18", "TV Show", "Cyberpunk: Edgerunners", "Hiroyuki Imaishi", "Zach Aguilar, Kenichiro Ohashi, Aoi Yuki, Hiroki Touchi, Michiko Kaiden", "Japan, United States", "September 13, 2022", "2022", "TV-MA", "1 Season", "Anime Series, TV Action & Adventure, TV Sci-Fi & Fantasy", "In a dystopia riddled with corruption and cybernetic implants, a talented but reckless street kid strives to become a mercenary outlaw — an edgerunner."],
  ["s19", "TV Show", "Heartstopper", "Euros Lyn", "Kit Connor, Joe Locke, William Gao, Yasmin Finney, Corinna Brown, Kizzy Edgell", "United Kingdom", "April 22, 2022", "2022", "TV-14", "1 Season", "British TV Shows, Romantic TV Shows, TV Dramas", "Teens Charlie and Nick discover their unlikely friendship might be something more as they navigate school and young love in this coming-of-age series."],
  ["s20", "TV Show", "Sex Education", "Ben Taylor", "Asa Butterfield, Gillian Anderson, Ncuti Gatwa, Emma Mackey, Connor Swindells", "United Kingdom", "September 17, 2021", "2021", "TV-MA", "3 Seasons", "British TV Shows, TV Comedies, TV Dramas", "Insecure Otis has all the answers when it comes to sex advice, thanks to his therapist mom. So rebel Maeve proposes a school sex-therapy clinic."],
  ["s21", "TV Show", "Elite", "Ramón Salazar", "María Pedraza, Itzan Escamilla, Miguel Bernardeau, Miguel Herrán, Jaime Lorente", "Spain", "June 18, 2021", "2021", "TV-MA", "4 Seasons", "Spanish-Language TV Shows, TV Dramas, TV Mysteries", "When three working-class teens enroll in an exclusive private school in Spain, the clash between them and the wealthy students leads to a shocking murder."],
  ["s22", "TV Show", "Sweet Home", "Lee Eung-bok", "Song Kang, Lee Jin-uk, Lee Si-young, Lee Do-hyun, Kim Nam-hee, Ko Min-si", "South Korea", "December 18, 2020", "2020", "TV-MA", "1 Season", "International TV Shows, TV Horror, TV Sci-Fi & Fantasy", "As humans turn into savage monsters and wreak terror, one troubled teen and his apartment neighbors fight to survive — and to hold on to their humanity."],
  ["s23", "TV Show", "Love, Death & Robots", "Tim Miller", "Scott Whyte, Nolan North, Matthew Yang King, Chris Cox, Emily O'Brien", "United States", "May 20, 2022", "2022", "TV-MA", "3 Seasons", "TV Sci-Fi & Fantasy, TV Action & Adventure, TV Horror", "Terrifying beasts, wicked surprises and dark comedy converge in this NSFW anthology of animated stories presented by Tim Miller and David Fincher."],
  ["s24", "TV Show", "Castlevania", "Sam Deats", "Richard Armitage, James Callis, Alejandra Reynoso, Tony Amendola, Matt Frewer", "United States", "May 13, 2021", "2021", "TV-MA", "4 Seasons", "TV Action & Adventure, Anime Series, TV Sci-Fi & Fantasy", "A vampire hunter fights to save a besieged city from an army of otherworldly beasts controlled by Dracula himself. Inspired by the classic video game."],
  ["s25", "TV Show", "Formula 1: Drive to Survive", "Martin Webb", "Lewis Hamilton, Max Verstappen, Daniel Ricciardo, Sebastian Vettel", "United Kingdom, United States", "March 11, 2022", "2022", "TV-MA", "4 Seasons", "Docuseries, International TV Shows, Sports TV Shows", "Drivers, managers and team owners live life in the fast lane — both on and off the track — during one cutthroat season of Formula 1 racing."],
  ["s26", "TV Show", "Chef's Table", "David Gelb", "Massimo Bottura, Niki Nakayama, Magnus Nilsson, Francis Mallmann", "United States", "September 2, 2016", "2016", "TV-MA", "6 Seasons", "Docuseries, Food & Travel", "Go inside the kitchens and minds of six international chefs who are redefining gourmet cuisine in this Emmy-nominated culinary docuseries."],
  ["s27", "TV Show", "Our Planet", "Alastair Fothergill", "David Attenborough", "United Kingdom", "April 5, 2019", "2019", "TV-G", "1 Season", "Docuseries, Science & Nature TV", "Experience our planet's natural beauty and examine how climate change impacts all living creatures in this ambitious documentary of spectacular scope."],
  ["s28", "TV Show", "High Score", "France Costrel", "Charles Martinet, Nolan Bushnell, Tom Kalinske", "United States", "August 19, 2020", "2020", "TV-14", "1 Season", "Docuseries, History Shows", "This docuseries traces the history of classic video games, featuring insights from the innovators who brought these worlds and characters to life."],

  // Movies
  ["s29", "Movie", "Extraction", "Sam Hargrave", "Chris Hemsworth, Rudhraksh Jaiswal, Randeep Hooda, Golshifteh Farahani, Pankaj Tripathi", "United States", "April 24, 2020", "2020", "R", "117 min", "Action & Adventure, Thrillers", "A hardened mercenary's mission becomes a soul-searching race to survive when he's sent into Bangladesh to rescue a drug lord's kidnapped son."],
  ["s30", "Movie", "Glass Onion: A Knives Out Mystery", "Rian Johnson", "Daniel Craig, Edward Norton, Janelle Monáe, Kathryn Hahn, Leslie Odom Jr., Kate Hudson, Dave Bautista", "United States", "December 23, 2022", "2022", "PG-13", "139 min", "Comedies, Dramas, Thrillers", "World-famous detective Benoit Blanc heads to Greece to peel back the layers of a mystery involving a tech billionaire and his eclectic crew of friends."],
  ["s31", "Movie", "Roma", "Alfonso Cuarón", "Yalitza Aparicio, Marina de Tavira, Diego Cortina Autrey, Carlos Peralta", "Mexico, United States", "December 14, 2018", "2018", "R", "135 min", "Dramas, Independent Movies, International Movies", "A vibrant, compassionate, and deeply personal portrait of a domestic worker in 1970s Mexico City, based on the filmmaker Alfonso Cuaron's childhood memories."],
  ["s32", "Movie", "The Irishman", "Martin Scorsese", "Robert De Niro, Al Pacino, Joe Pesci, Harvey Keitel, Ray Romano, Bobby Cannavale", "United States", "November 27, 2019", "2019", "R", "209 min", "Dramas, Crime Movies", "Hitman Frank Sheeran looks back at the secrets he kept as a loyal member of the Bufalino crime family in this acclaimed Martin Scorsese film."],
  ["s33", "Movie", "Red Notice", "Rawson Marshall Thurber", "Dwayne Johnson, Ryan Reynolds, Gal Gadot, Ritu Arya, Chris Diamantopoulos", "United States", "November 12, 2021", "2021", "PG-13", "117 min", "Action & Adventure, Comedies", "An FBI profiler chasing the world's most wanted art thief becomes his reluctant partner in crime to catch an elusive crook who's always one step ahead."],
  ["s34", "Movie", "Bird Box", "Susanne Bier", "Sandra Bullock, Trevante Rhodes, John Malkovich, Sarah Paulson, Jacki Weaver", "United States", "December 21, 2018", "2018", "R", "124 min", "Dramas, Sci-Fi & Fantasy, Thrillers", "Five years after an ominous unseen presence drives most of society to suicide, a survivor and her two children desperate to reach safety make a perilous blindfolded journey."],
  ["s35", "Movie", "Enola Holmes", "Harry Bradbeer", "Millie Bobby Brown, Henry Cavill, Sam Claflin, Helena Bonham Carter, Louis Partridge", "United Kingdom", "September 23, 2020", "2020", "PG-13", "124 min", "Children & Family Movies, Comedies, Dramas", "While searching for her missing mother, intrepid teen Enola Holmes uses her sleuthing skills to outsmart big brother Sherlock and help a runaway lord."],
  ["s36", "Movie", "All Quiet on the Western Front", "Edward Berger", "Felix Kammerer, Albrecht Schuch, Aaron Hilmer, Moritz Klaus, Edin Hasanovic", "Germany, United States", "October 28, 2022", "2022", "R", "148 min", "Action & Adventure, Dramas, International Movies", "When 17-year-old Paul joins the Western Front in World War I, his initial excitement is soon shattered by the grim reality of life in the trenches."],
  ["s37", "Movie", "Army of the Dead", "Zack Snyder", "Dave Bautista, Ella Purnell, Omari Hardwick, Ana de la Reguera, Theo Rossi", "United States", "May 21, 2021", "2021", "R", "148 min", "Action & Adventure, Horror Movies, Sci-Fi & Fantasy", "Following a zombie outbreak in Las Vegas, a group of mercenaries takes the ultimate gamble, venturing into the quarantine zone to pull off the greatest heist ever attempted."],
  ["s38", "Movie", "Guillermo del Toro's Pinocchio", "Guillermo del Toro, Mark Gustafson", "Ewan McGregor, David Bradley, Gregory Mann, Ron Perlman, Finn Wolfhard, Cate Blanchett", "Mexico, United States", "December 9, 2022", "2022", "PG", "117 min", "Children & Family Movies, Music & Musicals, Animation", "Academy Award-winning filmmaker Guillermo del Toro reimagines the classic puppet tale of a wooden boy brought to life in this stunning stop-motion musical."],
  ["s39", "Movie", "Klaus", "Sergio Pablos", "Jason Schwartzman, J.K. Simmons, Rashida Jones, Will Sasso, Joan Cusack", "Spain", "November 15, 2019", "2019", "PG", "97 min", "Children & Family Movies, Comedies, Animation", "A selfish postman and a reclusive toymaker form an unlikely friendship, delivering joy to a cold, dark town that desperately needs it in this heartwarming animation."],
  ["s40", "Movie", "Hustle", "Jeremiah Zagar", "Adam Sandler, Juancho Hernangómez, Queen Latifah, Ben Foster, Robert Duvall", "United States", "June 8, 2022", "2022", "R", "118 min", "Comedies, Dramas, Sports Movies", "When a down-on-his-luck basketball scout discovers an extraordinary player abroad, he brings him to the US without team approval, risking his career for a shot at the NBA."],
  ["s41", "Movie", "Marriage Story", "Noah Baumbach", "Scarlett Johansson, Adam Driver, Laura Dern, Alan Alda, Ray Liotta", "United States", "December 6, 2019", "2019", "R", "137 min", "Dramas, Independent Movies", "An Academy Award-winning, incisive and compassionate look at a marriage breaking up and a family staying together, from writer-director Noah Baumbach."],
  ["s42", "Movie", "Uncut Gems", "Josh Safdie, Benny Safdie", "Adam Sandler, Lakeith Stanfield, Julia Fox, Kevin Garnett, Idina Menzel", "United States", "January 29, 2020", "2020", "R", "135 min", "Dramas, Thrillers", "With his debts mounting and angry collectors closing in, a fast-talking New York City jeweler risks everything in hope of staying afloat and alive."],
  ["s43", "Movie", "Tick, Tick... Boom!", "Lin-Manuel Miranda", "Andrew Garfield, Alexandra Shipp, Robin de Jesús, Vanessa Hudgens, Joshua Henry", "United States", "November 19, 2021", "2021", "PG-13", "115 min", "Dramas, Music & Musicals", "On the brink of his 30th birthday, a promising young theater composer navigates love, friendship and the pressures of life as an artist in New York City."],
  ["s44", "Movie", "The Gray Man", "Anthony Russo, Joe Russo", "Ryan Gosling, Chris Evans, Ana de Armas, Jessica Henwick, Regé-Jean Page, Billy Bob Thornton", "United States", "July 22, 2022", "2022", "PG-13", "129 min", "Action & Adventure, Thrillers", "When a shadowy CIA asset uncovers agency secrets, he triggers a global manhunt by assassins, led by a sociopathic former colleague who will stop at nothing."],
  ["s45", "Movie", "Purple Hearts", "Elizabeth Allen Rosenbaum", "Sofia Carson, Nicholas Galitzine, Chosen Jacobs, John Harlan Kim, Kat Cunning", "United States", "July 29, 2022", "2022", "PG-13", "122 min", "Dramas, Romantic Movies, Music & Musicals", "Despite their many differences, a struggling singer-songwriter and a troubled Marine agree to marry solely for military benefits. But tragedy soon turns their fake marriage real."],
  ["s46", "Movie", "Black Crab", "Adam Berg", "Noomi Rapace, Jakob Oftebro, Erik Enge, Dar Salim, Ardalan Esmaili", "Sweden", "March 18, 2022", "2022", "TV-MA", "114 min", "Action & Adventure, International Movies, Thrillers", "In a post-apocalyptic world, a reluctant soldier embarking on a desperate mission must skate across a frozen sea to deliver a top-secret package that could end the war."],
  ["s47", "Movie", "Troll", "Roar Uthaug", "Ine Marie Wilmann, Kim Falck, Mads Sjøgård Pettersen, Gard B. Eidsvold", "Norway", "December 1, 2022", "2022", "PG-13", "103 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "When an ancient giant troll is awakened by an explosion in a Norwegian mountain, a fearless paleontologist is appointed to stop it from wreaking deadly havoc."],
  ["s48", "Movie", "My Octopus Teacher", "Pippa Ehrlich, James Reed", "Craig Foster", "South Africa", "September 7, 2020", "2020", "TV-G", "85 min", "Documentaries, International Movies", "A filmmaker forges an unusual friendship with an octopus living in a South African kelp forest, learning as the animal shares the mysteries of her world."],
  ["s49", "Movie", "The Social Dilemma", "Jeff Orlowski", "Skyler Gisondo, Kara Hayward, Vincent Kartheiser", "United States", "September 9, 2020", "2020", "PG-13", "94 min", "Documentaries", "This documentary-drama hybrid explores the dangerous human impact of social networking, with tech experts sounding the alarm on their own creations."],
  ["s50", "Movie", "Leave the World Behind", "Sam Esmail", "Julia Roberts, Ethan Hawke, Mahershala Ali, Myha'la, Kevin Bacon, Farrah Mackenzie", "United States", "December 8, 2023", "2023", "R", "141 min", "Dramas, Thrillers, Sci-Fi & Fantasy", "A family's getaway to a luxurious rental home takes an ominous turn when a cyberattack knocks out their devices — and two strangers appear at their door."],
  ["s51", "Movie", "Society of the Snow", "J.A. Bayona", "Enzo Vogrincic, Agustín Pardella, Matías Recalt, Esteban Bigliardi", "Spain, Uruguay", "January 4, 2024", "2024", "R", "144 min", "Action & Adventure, Dramas, International Movies", "In 1972, a Uruguayan rugby team's plane crashes in the heart of the Andes. To survive in one of the world's most hostile environments, they must resort to extreme measures."],
  ["s52", "Movie", "Damsel", "Juan Carlos Fresnadillo", "Millie Bobby Brown, Ray Winstone, Robin Wright, Angela Bassett, Nick Robinson", "United States", "March 8, 2024", "2024", "PG-13", "110 min", "Action & Adventure, Sci-Fi & Fantasy", "A dutiful damsel agrees to marry a handsome prince, only to find the royal family has recruited her as a sacrifice to repay an ancient debt, throwing her into a cave with a fire-breathing dragon."],
  ["s53", "Movie", "Extraction 2", "Sam Hargrave", "Chris Hemsworth, Golshifteh Farahani, Tornike Gogrichiani, Demetre Kavelashvili", "United States", "June 16, 2023", "2023", "R", "123 min", "Action & Adventure, Thrillers", "Back from the brink of death, highly skilled commando Tyler Rake takes on another dangerous mission: extracting the battered family of a ruthless Georgian gangster from prison."],
  ["s54", "Movie", "Lift", "F. Gary Gray", "Kevin Hart, Gugu Mbatha-Raw, Vincent D'Onofrio, Úrsula Corberó, Billy Magnussen", "United States", "January 12, 2024", "2024", "PG-13", "107 min", "Action & Adventure, Comedies", "An international heist crew, led by a master thief, races to lift $500 million in gold from a passenger plane flying at 40,000 feet before the government can shoot it down."],
  ["s55", "Movie", "Beverly Hills Cop: Axel F", "Mark Molloy", "Eddie Murphy, Joseph Gordon-Levitt, Kevin Bacon, Judge Reinhold, John Ashton", "United States", "July 3, 2024", "2024", "R", "118 min", "Action & Adventure, Comedies", "Detroit detective Axel Foley returns to Beverly Hills to investigate a threat against his daughter's life, teaming up with a new partner and old pals to uncover a conspiracy."],
  ["s56", "Movie", "Rebel Ridge", "Jeremy Saulnier", "Aaron Pierre, Don Johnson, AnnaSophia Robb, David Denman, Emory Cohen", "United States", "September 6, 2024", "2024", "R", "131 min", "Action & Adventure, Dramas, Thrillers", "A former Marine grapples with a web of small-town corruption when a simple encounter with local police spirals into a violent standoff over his cousin's bail money."],
  ["s57", "Movie", "Kadaver", "Jarand Herdal", "Gitte Witt, Thomas Gullestad, Thorbjørn Harr", "Norway", "October 22, 2020", "2020", "TV-MA", "86 min", "Horror Movies, Thrillers, International Movies", "In the aftermath of a nuclear disaster, a starving family is invited to a theatrical play at a hotel, where the audience is offered a free meal, but soon players and spectators start disappearing."],
  ["s58", "Movie", "The Platform", "Galder Gaztelu-Urrutia", "Ivan Massagué, Antonia San Juan, Zorion Eguileor", "Spain", "March 20, 2020", "2020", "TV-MA", "94 min", "Horror Movies, Sci-Fi & Fantasy, International Movies", "In a dystopian prison, a concrete slab with food descends floor by floor. The inmates above eat bountifully, leaving those below starving and desperate, triggering a brutal struggle for survival."],
  ["s59", "Movie", "Call", "Lee Chung-hyun", "Park Shin-hye, Jun Jong-seo, Kim Sung-ryung", "South Korea", "November 27, 2020", "2020", "TV-MA", "112 min", "Horror Movies, Thrillers, International Movies", "Connected by phone in the same home but 20 years apart, a serial killer puts another woman's past — and life — on the line to change her own fate."],
  ["s60", "Movie", "Bird Box Barcelona", "Álex Pastor, David Pastor", "Mario Casas, Georgina Campbell, Diego Calva", "Spain", "July 14, 2023", "2023", "R", "111 min", "Horror Movies, Sci-Fi & Fantasy, Thrillers", "As a mysterious force decimates the world's population, Sebastian navigates his own survival journey through the desolate streets of Barcelona in this spin-off sequel."],
  ["s61", "Movie", "The Mitchells vs. the Machines", "Mike Rianda", "Abbi Jacobson, Danny McBride, Maya Rudolph, Mike Rianda, Eric André", "United States", "April 30, 2021", "2021", "PG", "114 min", "Children & Family Movies, Comedies, Animation", "A quirky, dysfunctional family's road trip is interrupted by a global robot apocalypse, making them humanity's last, unlikely hope for survival."],
  ["s62", "Movie", "All Quiet on the Western Front (1930)", "Lewis Milestone", "Louis Wolheim, Lew Ayres, John Wray", "United States", "August 1, 2021", "1930", "PG-13", "133 min", "Classic Movies, Dramas", "This Oscar-winning classic chronicles the disillusionment of young German soldiers recruited during World War I, highlighting the tragic futility of modern warfare."],
  ["s63", "Movie", "The Great Hack", "Karim Amer, Jehane Noujaim", "Brittany Kaiser, David Carroll, Paul-Olivier Dehaye", "United States, United Kingdom", "July 24, 2019", "2019", "TV-MA", "139 min", "Documentaries", "Explore how a data company named Cambridge Analytica came to symbolize the dark side of social media in the wake of the 2016 US presidential election."],
  ["s64", "Movie", "The Devil All the Time", "Antonio Campos", "Tom Holland, Bill Skarsgård, Riley Keough, Jason Clarke, Sebastian Stan, Robert Pattinson", "United States", "September 16, 2020", "2020", "R", "138 min", "Dramas, Thrillers", "In postwar Knockemstiff, Ohio, a young man devoted to protecting his loved ones must fight off sinister characters including an unholy preacher, a twisted couple and a corrupt sheriff."],
  ["s65", "Movie", "Apollo 10 1/2: A Space Age Childhood", "Richard Linklater", "Milo Coy, Jack Black, Zachary Levi, Glenn Powell", "United States", "April 1, 2022", "2022", "PG-13", "97 min", "Dramas, Animation", "A man narrates stories of his life as a 10-year-old boy in 1969 Houston, weaving nostalgic tales of childhood with a fantastical account of a journey to the moon."],
  ["s66", "TV Show", "Sacred Games", "Anurag Kashyap, Vikramaditya Motwane", "Saif Ali Khan, Nawazuddin Siddiqui, Radhika Apte, Pankaj Tripathi", "India", "July 6, 2018", "2018", "TV-MA", "2 Seasons", "Crime TV Shows, International TV Shows, TV Dramas", "A link in their pasts leads an honest cop to a fugitive gang boss, whose cryptic warning spurs the officer on a quest to save Mumbai from cataclysm."],
  ["s67", "TV Show", "Delhi Crime", "Richie Mehta", "Shefali Shah, Rajesh Tailang, Rasika Dugal, Adil Hussain", "India", "March 22, 2019", "2019", "TV-MA", "2 Seasons", "Crime TV Shows, International TV Shows, TV Dramas", "Following a heinous assault, Deputy Commissioner of Police Vartika Chaturvedi leads a grueling search for the culprits in this Emmy-winning series."],
  ["s68", "Movie", "RRR (Hindi)", "S.S. Rajamouli", "N.T. Rama Rao Jr., Ram Charan, Ajay Devgn, Alia Bhatt, Shriya Saran", "India", "May 20, 2022", "2022", "TV-MA", "187 min", "Action & Adventure, International Movies, Dramas", "A fearless warrior on a perilous mission comes face-to-face with a gritty cop serving the British forces in this epic saga set in pre-independent India."],
  ["s69", "Movie", "3 Idiots", "Rajkumar Hirani", "Aamir Khan, Kareena Kapoor, R. Madhavan, Sharman Joshi, Boman Irani, Omi Vaidya", "India", "August 1, 2017", "2009", "PG-13", "170 min", "Comedies, Dramas, International Movies", "Two college friends look for their long-lost buddy and recall their student days under the tyrannical rule of their strict engineering college director."],
  ["s70", "Movie", "Lagaan", "Ashutosh Gowariker", "Aamir Khan, Gracy Singh, Rachel Shelley, Paul Blackthorne, Suhasini Mulay", "India", "January 10, 2021", "2001", "PG", "224 min", "Dramas, International Movies, Sports Movies", "In Victorian India, a resilient farmer accepts a wager from an arrogant British officer to play a friendly cricket game to waive his village's high taxes."],
  ["s71", "Movie", "Dangal", "Nitesh Tiwari", "Aamir Khan, Sakshi Tanwar, Fatima Sana Shaikh, Sanya Malhotra, Zaira Wasim, Suhani Bhatnagar", "India", "December 23, 2016", "2016", "PG-13", "161 min", "Dramas, International Movies, Sports Movies", "A former wrestler struggles to train his daughters to compete in the Commonwealth Games and achieve the golden medal he never could."],
  ["s72", "Movie", "Taare Zameen Par", "Aamir Khan", "Aamir Khan, Darsheel Safary, Tanay Chheda, Tisca Chopra, Vipin Sharma", "India", "December 21, 2007", "2007", "PG", "162 min", "Dramas, International Movies", "An unconventional art teacher inspires an 8-year-old dyslexic boy to find his true potential after being sent to boarding school."],
  ["s73", "Movie", "Gangs of Wasseypur", "Anurag Kashyap", "Manoj Bajpayee, Nawazuddin Siddiqui, Richa Chadda, Huma Qureshi, Tigmanshu Dhulia", "India", "August 2, 2012", "2012", "R", "321 min", "Action & Adventure, Cult Movies, Dramas, International Movies", "A multi-generational revenge saga revolving around the coal mafia of Dhanbad, tracing the fierce power struggles and blood feuds."],
  ["s74", "Movie", "Baahubali: The Beginning", "S.S. Rajamouli", "Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah Bhatia, Ramya Krishna, Sathyaraj", "India", "July 10, 2015", "2015", "TV-14", "159 min", "Action & Adventure, International Movies, Sci-Fi & Fantasy", "A young man raises a massive rebellion against an oppressive tyrant in a mythical ancient kingdom, discovering his royal heritage."],
  ["s75", "Movie", "Jawan", "Atlee", "Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone, Priyamani, Sanya Malhotra", "India", "September 7, 2023", "2023", "TV-MA", "169 min", "Action & Adventure, International Movies", "A high-octane action thriller outlining a man's quest to correct the wrongs in society with a team of skilled women."],
  ["s76", "TV Show", "Kota Factory", "Raghav Subbu", "Jitendra Kumar, Mayur More, Ranjan Raj, Alam Khan, Ahsaas Channa", "India", "September 24, 2021", "2021", "TV-MA", "3 Seasons", "International TV Shows, TV Comedies, TV Dramas", "Dedicated to students preparing for tough competitive exams, a young student navigates the academic pressures and adolescent life of Kota's coaching centers."],
  ["s77", "TV Show", "The Railway Men", "Shiv Rawail", "R. Madhavan, Kay Kay Menon, Divyenndu, Babil Khan", "India", "November 18, 2023", "2023", "TV-MA", "1 Season", "International TV Shows, TV Dramas", "In the wake of the deadly 1984 Bhopal gas tragedy, brave railway workers risk their lives to rescue trapped citizens in a heroic survival operation."],
  ["s78", "Movie", "PK", "Rajkumar Hirani", "Aamir Khan, Anushka Sharma, Sushant Singh Rajput, Sanjay Dutt, Boman Irani", "India", "December 18, 2014", "2014", "PG-13", "152 min", "Comedies, Dramas, International Movies", "A humanoid alien stranded on Earth loses his communication device and questions religious dogmas and superstitions in search of it."],
  ["s79", "Movie", "Drishyam", "Nishikant Kamat", "Ajay Devgn, Tabu, Shriya Saran, Ishita Dutta, Rajat Kapoor, Rishabh Chaddha", "India", "July 31, 2015", "2015", "TV-14", "163 min", "Dramas, International Movies, Thrillers", "A common cable operator takes extreme, brilliant measures to shield his family from the wrath of law enforcement after an accidental crime."],
  ["s80", "Movie", "Andhadhun", "Sriram Raghavan", "Ayushmann Khurrana, Tabu, Radhika Apte, Anil Dhawan, Zakir Hussain", "India", "October 5, 2018", "2018", "TV-MA", "139 min", "Comedies, International Movies, Thrillers", "A visually impaired pianist gets entangled in a wealthy former actor's murder mystery, resulting in a dark, comic series of chaotic turns."],
  ["s81", "Movie", "Dil Chahta Hai", "Farhan Akhtar", "Aamir Khan, Saif Ali Khan, Akshaye Khanna, Preity Zinta, Sonali Kulkarni", "India", "August 10, 2001", "2001", "PG", "185 min", "Comedies, Dramas, International Movies", "Three childhood friends navigate their different perspectives on relationships and love, and find their bond tested as they grow up."],
  ["s82", "Movie", "Kabhi Khushi Kabhie Gham", "Karan Johar", "Amitabh Bachchan, Jaya Bachchan, Shah Rukh Khan, Kajol, Hrithik Roshan, Kareena Kapoor", "India", "December 14, 2001", "2001", "TV-14", "210 min", "Dramas, International Movies", "An elite family is fractured when their adopted son marries a middle-class woman, prompting his younger brother to attempt a reconciliation years later."],
  ["s83", "TV Show", "She", "Imtiaz Ali", "Aaditi Pohankar, Vijay Varma, Vishwas Kini, Kishore Kumar G.", "India", "March 20, 2020", "2022", "TV-MA", "2 Seasons", "Crime TV Shows, International TV Shows, TV Dramas", "An underappreciated female police constable goes undercover as a sex worker to bust a major narcotics ring, discovering her own hidden power."],
  ["s84", "TV Show", "Guns & Gulaabs", "Raj & DK", "Rajkummar Rao, Dulquer Salmaan, Adarsh Gourav, Gulshan Devaiah", "India", "August 18, 2023", "2023", "TV-MA", "1 Season", "International TV Shows, TV Comedies, TV Dramas", "In a lawless town ruled by a cartel, a lovesick mechanic, a reluctant heir, and an honest cop get sucked into a chaotic drug deal gone wrong."],
  ["s85", "Movie", "Kaho Naa... Pyaar Hai", "Rakesh Roshan", "Hrithik Roshan, Ameesha Patel, Anupam Kher, Dalip Tahil, Farida Jalal", "India", "January 14, 2000", "2000", "TV-14", "177 min", "Action & Adventure, International Movies, Romantic Movies", "A young singer is murdered after witnessing a crime, but his grieving lover meets a lookalike in New Zealand who helps her seek justice."],
  ["s86", "Movie", "Minnal Murali (Malayalam)", "Basil Joseph", "Tovino Thomas, Guru Somasundaram, Femina George, Shelly Nabu Kumar", "India", "December 24, 2021", "2021", "TV-14", "159 min", "Action & Adventure, Comedies, International Movies, Sci-Fi & Fantasy", "An ordinary tailor gains superpower after being struck by lightning, but must protect his village from an unexpected and bitter supervillain who emerged from the same strike."],
  ["s87", "Movie", "Kantara (Kannada)", "Rishab Shetty", "Rishab Shetty, Sapthami Gowda, Kishore, Achyuth Kumar", "India", "November 24, 2022", "2022", "TV-MA", "149 min", "Action & Adventure, Dramas, International Movies, Sci-Fi & Fantasy", "A fiery champion of forest rights clash with a strict officer, triggering an ancient, mythological battle between humans, nature, and ancestral guardian spirits."],
  ["s88", "Movie", "Super Deluxe (Tamil)", "Thiagarajan Kumararaja", "Vijay Sethupathi, Fahadh Faasil, Samantha Ruth Prabhu, Ramya Krishnan", "India", "March 29, 2019", "2019", "TV-MA", "176 min", "Comedies, Cult Movies, Dramas, Thrillers", "An angry kid, a transgender woman returning to her family, an unfaithful wife, and a bunch of curious teenagers find their lives colliding in bizarre, dark comedic circumstances on a fateful day."],
  ["s89", "Movie", "Jai Bhim (Tamil)", "T. J. Gnanavel", "Suriya, Lijomol Jose, Manikandan, Rajisha Vijayan, Prakash Raj", "India", "November 2, 2021", "2021", "TV-MA", "164 min", "Dramas, Independent Movies, International Movies", "A brave human rights lawyer fights a courageous legal battle in the high court for an innocent tribal woman whose husband has been falsely accused and tortured in police custody."],
  ["s90", "Movie", "Kumbalangi Nights (Malayalam)", "Madhu C. Narayanan", "Shane Nigam, Soubin Shahir, Fahadh Faasil, Sreenath Bhasi", "India", "May 10, 2019", "2019", "TV-MA", "135 min", "Comedies, Dramas, International Movies, Romantic Movies", "Four dysfunctional brothers living in a dilapidated house in Kumbalangi find their relationship put to test when love, jealousy, and a chilling antagonist enter their lives."],
  ["s91", "Movie", "K.G.F: Chapter 1 (Kannada)", "Prashanth Neel", "Yash, Srinidhi Shetty, Ramachandra Raju, Archana Jois", "India", "December 21, 2018", "2018", "TV-14", "156 min", "Action & Adventure, Crime Movies, Dramas, International Movies", "An ambitious young street fighter pledges to acquire absolute power and wealth, leading him into the brutal, gold-mining cartels of Kolar Gold Fields as an undercover savior."],
  ["s92", "Movie", "Sairat (Marathi)", "Nagraj Manjule", "Rinku Rajguru, Akash Thosar, Tanaji Galgunde, Arbaz Shaikh", "India", "April 29, 2016", "2016", "TV-14", "174 min", "Dramas, International Movies, Music & Musicals, Romantic Movies", "A rich upper-caste girl falls intensely in love with a smart lower-caste boy, sparking a fierce rebellion against deep social structures that threatens their survival."],
  ["s93", "Movie", "Carry on Jatta 2 (Punjabi)", "Smeep Kang", "Gippy Grewal, Sonam Bajwa, Gurpreet Ghuggi, Jaswinder Bhalla", "India", "June 1, 2018", "2018", "PG", "150 min", "Comedies, International Movies, Romantic Movies", "A charming orphan dreams of moving to Canada but faces chaotic family confusion and hilarious lies when he tries to win over his dream girl under a false identity."],
  ["s94", "Movie", "Pather Panchali (Bengali)", "Satyajit Ray", "Subir Banerjee, Kanu Banerjee, Karuna Banerjee, Uma Dasgupta", "India", "August 26, 1955", "1955", "PG", "115 min", "Classic Movies, Dramas, International Movies", "The immortal, poetic masterpiece of Indian cinema tracing the simple childhood joys, struggles, and deep tragedies of young Apu and his family in a rural Bengal village."],
  ["s95", "Movie", "Drishyam 2 (Malayalam)", "Jeethu Joseph", "Mohanlal, Meena, Ansiba Hassan, Esther Anil, Asha Sarath", "India", "February 19, 2021", "2021", "TV-14", "152 min", "Dramas, International Movies, Thrillers", "Six years after the case was closed, a sharp police investigation reopens the tragic night, forcing Georgekutty to construct an even more brilliant scheme to protect his family."],
  ["s96", "Movie", "Jersey (Telugu)", "Gowtam Tinnanuri", "Nani, Shraddha Srinath, Ronit Kamra, Sathyaraj", "India", "April 19, 2019", "2019", "PG", "160 min", "Dramas, International Movies, Sports Movies", "A talented but failed cricketer in his late thirties decides to return to the sport, driven by the desire to fulfill his young son's simple wish for an official team jersey."],
  ["s97", "Movie", "Eega (Telugu)", "S.S. Rajamouli", "Nani, Samantha Ruth Prabhu, Sudeep", "India", "July 6, 2012", "2012", "PG-13", "134 min", "Action & Adventure, Comedies, Sci-Fi & Fantasy, International Movies", "Reincarnated as a common housefly, a murdered man teams up with his former lover to seek revenge on his wealthy, powerful killer and protect her from his advances."],
  ["s98", "Movie", "Sivaji: The Boss (Tamil)", "S. Shankar", "Rajinikanth, Shriya Saran, Suman, Vivek, Manivannan", "India", "June 15, 2007", "2007", "TV-14", "185 min", "Action & Adventure, Comedies, International Movies", "An NRI software architect returns to India to offer free education and healthcare, but when corrupt politicians ruin his dream, he fights back with high-octane wit and swagger."],
  ["s99", "Movie", "Stree (Hindi)", "Amar Kaushik", "Rajkummar Rao, Shraddha Kapoor, Pankaj Tripathi, Aparshakti Khurana, Abhishek Banerjee", "India", "August 31, 2018", "2018", "TV-14", "128 min", "Comedies, Horror Movies, International Movies", "In a small town, men live in fear of an angry female spirit who kidnaps lone men at night during annual festivals, until a talented tailor joins forces with a mysterious woman."],
  ["s100", "Movie", "Tumbbad (Hindi)", "Rahi Anil Barve", "Sohum Shah, Jyoti Malshe, Anita Date-Kelkar", "India", "October 12, 2018", "2018", "TV-MA", "104 min", "Horror Movies, Sci-Fi & Fantasy, International Movies, Cult Movies", "A greedy man seeks a mythical, cursed treasure hidden inside an ancient, decaying mansion in rural Maharashtra, encountering a terrifying fallen god who guards the gold."],
  ["s101", "Movie", "The Elephant Whisperers (Tamil)", "Kartiki Gonsalves", "Bomman, Bellie", "India", "December 8, 2022", "2022", "PG", "40 min", "Documentaries, International Movies", "An indigenous couple in South India devote their lives to caring for an orphaned baby elephant named Raghu, forging an incredibly deep bond with the animal in this Oscar-winning documentary."],
  ["s102", "TV Show", "House of Secrets: The Burari Deaths", "Leena Yadav, Anubhav Chopra", "Various Investigators", "India", "October 8, 2021", "2021", "TV-MA", "1 Season", "Docuseries, Crime TV Shows, International TV Shows", "A chilling, investigative docuseries exploring the unsettling truths and complex psychological underpinnings behind the mysterious deaths of 11 family members in Delhi."],
  ["s103", "Movie", "Mahanati (Telugu)", "Nag Ashwin", "Keerthy Suresh, Dulquer Salmaan, Samantha Ruth Prabhu, Vijay Deverakonda", "India", "May 9, 2018", "2018", "PG", "177 min", "Dramas, International Movies, Romantic Movies", "The magnificent biography of legendary South Indian actress Savitri, chronicling her meteoric rise to super-stardom and her subsequent tragic personal downfall."],
  ["s104", "Movie", "Chokher Bali (Bengali)", "Rituparno Ghosh", "Aishwarya Rai Bachchan, Prasenjit Chatterjee, Raima Sen, Lily Chakravarty", "India", "August 8, 2003", "2003", "TV-14", "167 min", "Dramas, International Movies, Romantic Movies", "Based on Rabindranath Tagore's classic novel, a beautiful, young widow is caught in a web of deceit, forbidden romance, and emotional manipulation within a conservative household."],
  ["s105", "Movie", "Sholay", "Ramesh Sippy", "Dharmendra, Amitabh Bachchan, Sanjeev Kumar, Hema Malini, Jaya Bhaduri, Amjad Khan", "India", "August 15, 1975", "1975", "PG", "162 min", "Action & Adventure, Classic Movies, International Movies", "In this classic of Indian cinema, a retired police officer hires two colorful outlaws to capture a notorious, ruthless bandit terrorizing a small village."],
  ["s106", "Movie", "Dilwale Dulhania Le Jayenge", "Aditya Chopra", "Shah Rukh Khan, Kajol, Amrish Puri, Anupam Kher, Farida Jalal", "India", "October 20, 1995", "1995", "PG", "181 min", "Classic Movies, Comedies, International Movies, Romantic Movies", "A young Indian man and woman fall in love during a European vacation, but he must win over her traditional father in India before she is wed to another."],
  ["s107", "Movie", "Swades", "Ashutosh Gowariker", "Shah Rukh Khan, Gayatri Joshi, Kishori Ballal, Rajesh Vivek", "India", "December 17, 2004", "2004", "PG", "189 min", "Dramas, International Movies", "A successful, patriotic NASA scientist returns to his native village in India to find his childhood nanny, sparking a deep journey of self-discovery and civic empowerment."],
  ["s108", "Movie", "Zindagi Na Milegi Dobara", "Zoya Akhtar", "Hrithik Roshan, Abhay Deol, Farhan Akhtar, Katrina Kaif, Kalki Koechlin", "India", "July 15, 2011", "2011", "TV-14", "155 min", "Comedies, Dramas, International Movies, Romantic Movies", "Three childhood friends embark on a bachelor trip to Spain, taking part in life-altering adventure sports and resolving long-standing emotional conflicts."],
  ["s109", "Movie", "Queen", "Vikas Bahl", "Kangana Ranaut, Rajkummar Rao, Lisa Haydon, Jeffrey Ho", "India", "March 7, 2014", "2014", "TV-MA", "146 min", "Comedies, Dramas, International Movies", "A simple, traditional Delhi girl decides to go on her European honeymoon alone after her fiancé cancels their wedding, discovering her independent spirit."],
  ["s110", "Movie", "Barfi!", "Anurag Basu", "Ranbir Kapoor, Priyanka Chopra, Ileana D'Cruz, Saurabh Shukla", "India", "September 14, 2012", "2012", "PG", "151 min", "Comedies, Dramas, International Movies, Romantic Movies", "Three young people learn that love can neither be defined nor contained by society's norms of physical abilities, in this heartwarming tale set in Darjeeling."],
  ["s111", "Movie", "Bajrangi Bhaijaan", "Kabir Khan", "Salman Khan, Kareena Kapoor, Harshaali Malhotra, Nawazuddin Siddiqui", "India", "July 17, 2015", "2015", "PG", "163 min", "Action & Adventure, Comedies, International Movies, Dramas", "A devout, warm-hearted Indian man takes on a courageous, perilous journey to reunite a mute six-year-old Pakistani girl with her parents in her homeland."],
  ["s112", "Movie", "Uri: The Surgical Strike", "Aditya Dhar", "Vicky Kaushal, Paresh Rawal, Yami Gautam, Mohit Raina", "India", "January 11, 2019", "2019", "TV-MA", "138 min", "Action & Adventure, International Movies, Dramas", "Following a cowardly attack on their base, the Indian military's special forces execute a highly stealthy, high-precision surgical strike to avenge their brothers."],
  ["s113", "Movie", "My Name Is Khan", "Karan Johar", "Shah Rukh Khan, Kajol, Jimmy Shergill, Zarina Wahab", "India", "February 12, 2010", "2010", "PG-13", "165 min", "Dramas, International Movies, Romantic Movies", "An Indian man with Asperger's syndrome embarks on a journey across America to speak to the President, in a touching quest to repair his family's honor."],
  ["s114", "Movie", "Baahubali 2: The Conclusion", "S.S. Rajamouli", "Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah Bhatia, Ramya Krishna", "India", "April 28, 2017", "2017", "TV-14", "167 min", "Action & Adventure, International Movies, Sci-Fi & Fantasy", "When Mahendra Baahubali learns the truth behind the tragic death of his father, he raises an unstoppable army to dethrone the wicked Bhallaladeva."],
  ["s115", "Movie", "K.G.F: Chapter 2", "Prashanth Neel", "Yash, Sanjay Dutt, Raveena Tandon, Srinidhi Shetty, Prakash Raj", "India", "April 14, 2022", "2022", "TV-MA", "168 min", "Action & Adventure, Crime Movies, Dramas, International Movies", "In the blood-drenched Kolar Gold Fields, Rocky's name strikes fear into his enemies. While his allies look up to him, the government sees him as a threat to law and order."],
  ["s116", "Movie", "Pushpa: The Rise", "Sukumar", "Allu Arjun, Rashmika Mandanna, Fahadh Faasil, Jagadeesh Prathap Bandari", "India", "December 17, 2021", "2021", "TV-MA", "179 min", "Action & Adventure, Crime Movies, Dramas, International Movies", "A bold laborer rises through the ranks of a red sandalwood smuggling syndicate, making dangerous enemies and changing the power dynamics of the forest."],
  ["s117", "Movie", "Vikram", "Lokesh Kanagaraj", "Kamal Haasan, Vijay Sethupathi, Fahadh Faasil, Kalidas Jayaram", "India", "June 3, 2022", "2022", "TV-MA", "175 min", "Action & Adventure, Thrillers, International Movies", "A special ops squad is tasked with investigating a series of murders by a masked group of vigilantes, unearthing a massive narcotics syndicate."],
  ["s118", "Movie", "Asuran", "Vetrimaaran", "Dhanush, Manju Warrier, Teejay Arunasalam, Ken Karunas", "India", "October 4, 2019", "2019", "TV-MA", "141 min", "Action & Adventure, Dramas, International Movies", "A peaceful, humble farmer is forced to flee into the forest with his family to protect his hot-headed teenage son, who avenged his brother's brutal murder."],
  ["s119", "Movie", "Premam", "Alphonse Puthren", "Nivin Pauly, Sai Pallavi, Madonna Sebastian, Anupama Parameswaran", "India", "May 29, 2015", "2015", "PG", "156 min", "Comedies, Dramas, International Movies, Romantic Movies", "Trace the life, romantic adventures, and emotional evolution of George from his high school days, through college, and finally into adulthood."],
  ["s120", "Movie", "Bangalore Days", "Anjali Menon", "Dulquer Salmaan, Nivin Pauly, Nazriya Nazim, Fahadh Faasil, Parvathy Thiruvothu", "India", "May 30, 2014", "2014", "PG", "171 min", "Comedies, Dramas, International Movies, Romantic Movies", "Three close cousins fulfill their childhood dream of moving to the vibrant city of Bangalore, navigating life's ups, downs, and unexpected romances."],
  ["s121", "Movie", "Charlie", "Martin Prakkat", "Dulquer Salmaan, Parvathy Thiruvothu, Aparna Gopinath, Nedumudi Venu", "India", "December 24, 2015", "2015", "PG", "129 min", "Dramas, International Movies, Romantic Movies", "To escape an arranged marriage, a free-spirited young woman rents a room and uncovers sketches left by the previous tenant, embarking on a quest to find him."],
  ["s122", "Movie", "Kirik Party", "Rishab Shetty", "Rakshit Shetty, Rashmika Mandanna, Samyuktha Hegde, Achyuth Kumar", "India", "December 30, 2016", "2016", "PG", "165 min", "Comedies, Dramas, International Movies", "A fun-loving engineering student's perspective on life and responsibility is deeply altered after a series of playful events and a profound tragedy."],
  ["s123", "Movie", "Lucifer (Malayalam Film)", "Prithviraj Sukumaran", "Mohanlal, Vivek Oberoi, Manju Warrier, Tovino Thomas, Indrajith Sukumaran", "India", "March 28, 2019", "2019", "TV-MA", "175 min", "Action & Adventure, International Movies, Dramas", "When the sudden death of a beloved political leader leaves a massive power vacuum, a mysterious, powerful lieutenant steps in to guard the family's legacy."],
  ["s124", "Movie", "Article 15", "Anubhav Sinha", "Ayushmann Khurrana, Nassar, Manoj Pahwa, Sayani Gupta, Kumud Mishra", "India", "June 28, 2019", "2019", "TV-MA", "130 min", "Dramas, Thrillers, International Movies", "An upright, foreign-educated police officer is posted to a rural village, where he confronts deep-rooted social injustices and caste-based discrimination."],
  ["s125", "Movie", "Shershaah", "Vishnuvardhan", "Sidharth Malhotra, Kiara Advani, Shiv Panditt, Nikitin Dheer", "India", "August 12, 2021", "2021", "TV-14", "135 min", "Action & Adventure, Dramas, International Movies", "The heroic, inspiring biography of Captain Vikram Batra, who sacrificed his life to capture crucial peaks during the historic 1999 Kargil War."],
  ["s126", "Movie", "Animal", "Sandeep Reddy Vanga", "Ranbir Kapoor, Anil Kapoor, Bobby Deol, Rashmika Mandanna, Triptii Dimri", "India", "December 1, 2023", "2023", "TV-MA", "201 min", "Action & Adventure, Dramas, Thrillers, International Movies", "The fierce, obsessive relationship between a tycoon father and his troubled son spirals into a violent, blood-drenched saga of revenge and absolute loyalty."],
  ["s127", "Movie", "Leo", "Lokesh Kanagaraj", "Vijay, Sanjay Dutt, Arjun Sarja, Trisha Krishnan", "India", "October 19, 2023", "2023", "TV-MA", "164 min", "Action & Adventure, Thrillers, International Movies", "A peaceful, mild-mannered cafe owner in Himachal Pradesh becomes the target of a dangerous drug cartel, who claim he is a legendary gangster from their past."],
  ["s128", "Movie", "Jailer", "Nelson Dilipkumar", "Rajinikanth, Vinayakan, Ramya Krishnan, Vasanth Ravi, Tamannaah Bhatia", "India", "August 10, 2023", "2023", "TV-MA", "168 min", "Action & Adventure, Comedies, Thrillers, International Movies", "A retired prison warden embarks on a relentless, high-stakes hunt to find his missing policeman son, unleashing his own hidden, dark, and lethal skills."],
  ["s129", "Movie", "Salaar: Ceasefire", "Prashanth Neel", "Prabhas, Prithviraj Sukumaran, Shruti Haasan, Jagapathi Babu", "India", "December 22, 2023", "2023", "TV-MA", "175 min", "Action & Adventure, Dramas, Thrillers", "In the lawless, heavily fortified city-state of Khansaar, two childhood friends become the fiercest of allies, only to eventually find themselves as bitter rivals."],
  ["s130", "Movie", "Sardar Udham", "Shoojit Sircar", "Vicky Kaushal, Shaun Scott, Stephen Hogan, Amol Parashar", "India", "October 16, 2021", "2021", "TV-MA", "164 min", "Dramas, International Movies", "A poignant, meticulously detailed biographical drama tracing the revolutionary journey of Sardar Udham Singh, who spent two decades seeking justice for the Jallianwala Bagh massacre."],
  ["s131", "Movie", "Drishyam 2 (Hindi)", "Abhishek Pathak", "Ajay Devgn, Tabu, Shriya Saran, Akshaye Khanna, Ishita Dutta", "India", "November 18, 2022", "2022", "TV-14", "140 min", "Dramas, Thrillers, International Movies", "Seven years after the original case, a highly determined inspector reopens the investigation, challenging Vijay Salgaonkar to execute an even more transient plan."],
  ["s132", "Movie", "Kantara: Legend of the Forest", "Rishab Shetty", "Rishab Shetty, Sapthami Gowda, Kishore, Achyuth Kumar", "India", "October 14, 2022", "2022", "TV-MA", "150 min", "Action & Adventure, Dramas, International Movies", "A fiery tribal champion clashes with a strict forest officer, triggering a legendary war between humans, nature, and ancient, supernatural guardian spirits in a coastal village."],
  ["s133", "Movie", "Dunki", "Rajkumar Hirani", "Shah Rukh Khan, Taapsee Pannu, Boman Irani, Vicky Kaushal, Anil Grover", "India", "December 21, 2023", "2023", "TV-14", "161 min", "Comedies, Dramas, International Movies", "Five simple friends from a Punjab village embark on a challenging, illegal journey via the backdoor route to reach London, guided by a brave soldier who vows to protect them."],
  ["s134", "Movie", "Pathaan", "Siddharth Anand", "Shah Rukh Khan, Deepika Padukone, John Abraham, Dimple Kapadia, Ashutosh Rana", "India", "January 25, 2023", "2023", "TV-14", "146 min", "Action & Adventure, International Movies", "A patriotic Indian secret agent must stop a rogue former agent from unleashing a deadly biological weapon across the country."],
  ["s135", "Movie", "Kalki 2898 AD", "Nag Ashwin", "Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone, Disha Patani", "India", "June 27, 2024", "2024", "TV-14", "181 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "A modern avatar of Vishnu, a mythical protector, descends to Earth to protect a pregnant woman who carries a child destined to save humanity in a dystopian future."],
  ["s136", "Movie", "Laapataa Ladies", "Kiran Rao", "Pratibha Ranta, Sparsh Shrivastava, Nitanshi Goel, Chhaya Kadam, Ravi Kishan", "India", "March 1, 2024", "2024", "TV-PG", "122 min", "Comedies, Dramas, International Movies", "Two young brides get accidentally swapped during a chaotic train journey, leading to a touching and hilarious search for self-reliance and empowerment in rural India."],
  ["s137", "Movie", "Kahaani", "Sujoy Ghosh", "Vidya Balan, Parambrata Chatterjee, Nawazuddin Siddiqui, Indraneil Sengupta", "India", "March 9, 2012", "2012", "TV-MA", "122 min", "Thrillers, Dramas, International Movies", "A pregnant software engineer arrives in Kolkata from London during the Durga Puja festival in relentless search of her missing husband, unearthing a web of government conspiracies."],
  ["s138", "Movie", "Ghajini", "A.R. Murugadoss", "Aamir Khan, Asin, Jiah Khan, Pradeep Rawat", "India", "December 25, 2008", "2008", "TV-MA", "185 min", "Action & Adventure, Dramas, Thrillers", "A wealthy businessman suffering from short-term memory loss uses polaroids, tattoos, and notes to track down the ruthless gangster who brutally murdered his lover."],
  ["s139", "Movie", "Mughal-E-Azam", "K. Asif", "Prithviraj Kapoor, Dilip Kumar, Madhubala, Durga Khote", "India", "August 5, 1960", "1960", "TV-PG", "197 min", "Classic Movies, Dramas, International Movies, Romantic Movies", "The legendary, grand cinematic epic of the tragic love affair between Prince Salim, the Mughal heir, and Anarkali, a beautiful court dancer, which sparks a devastating war between father and son."],
  ["s140", "Movie", "Devdas", "Sanjay Leela Bhansali", "Shah Rukh Khan, Aishwarya Rai Bachchan, Madhuri Dixit, Jackie Shroff", "India", "July 12, 2002", "2002", "TV-14", "185 min", "Dramas, Romantic Movies, International Movies", "A wealthy law graduate spirals into self-destruction and alcoholism when his traditional family prevents him from marrying his childhood sweetheart and neighbor."],
  ["s141", "Movie", "Chak De! India", "Shimit Amin", "Shah Rukh Khan, Vidya Malvade, Sagarika Ghatge, Shilpa Shukla", "India", "August 10, 2007", "2007", "TV-PG", "150 min", "Dramas, Sports Movies, International Movies", "A disgraced former hockey star accepts the impossible challenge of coaching the highly dysfunctional and divided Indian national women's hockey team to world cup glory."],
  ["s142", "Movie", "Gully Boy", "Zoya Akhtar", "Ranveer Singh, Alia Bhatt, Siddhant Chaturvedi, Kalki Koechlin, Vijay Raaz", "India", "February 14, 2019", "2019", "TV-14", "154 min", "Dramas, Music & Musicals, International Movies", "An aspiring young street rapper from the slums of Mumbai channels his anger, struggles, and dreams into poetic lyrics, rising through the underground hip-hop scene."],
  ["s143", "Movie", "Sita Ramam", "Hanu Raghavapudi", "Dulquer Salmaan, Mrunal Thakur, Rashmika Mandanna, Sumanth", "India", "August 5, 2022", "2022", "TV-14", "163 min", "Dramas, Romantic Movies, International Movies", "An orphaned army lieutenant serving in Kashmir receives anonymous romantic letters from a mysterious woman named Sita, sparking a search that culminates in a tragic, timeless love story."],
  ["s144", "Movie", "Manjummel Boys", "Chidambaram", "Soubin Shahir, Sreenath Bhasi, Balu Varghese, Ganapathi", "India", "February 22, 2024", "2024", "TV-14", "135 min", "Action & Adventure, Dramas, International Movies", "A group of close-knit friends from Kerala embark on a fun trip to Kodaikanal, but their holiday turns into a horrific survival ordeal when one of them falls into the treacherous Guna Caves."],
  ["s145", "Movie", "Aavesham", "Jithu Madhavan", "Fahadh Faasil, Hipzster, Mithun Jai Shankar, Roshan Shanavas", "India", "April 11, 2024", "2024", "TV-MA", "158 min", "Action & Adventure, Comedies, International Movies", "Three college students who move to Bengaluru find themselves bullied by seniors, prompting them to seek the friendship and protection of a highly eccentric, local gangster named Ranga."],
  ["s146", "Movie", "Premalu", "Girish A.D.", "Naslen K. Gafoor, Mamitha Baiju, Shyam Mohan, Althaf Salim", "India", "February 9, 2024", "2024", "TV-PG", "156 min", "Comedies, Romantic Movies, International Movies", "An average, directionless graduate moves to Hyderabad for a gate course, where he falls head over heels for a confident, highly ambitious IT employee, resulting in a chaotic rom-com."],
  ["s147", "Movie", "Soorarai Pottru (Tamil)", "Sudha Kongara", "Suriya, Aparna Balamurali, Paresh Rawal, Mohan Babu", "India", "November 12, 2020", "2020", "TV-14", "149 min", "Dramas, International Movies", "A young, determined visionary from a remote village sets out to accomplish a daring dream: launching a low-cost airline accessible to common and underprivileged citizens."],
  ["s148", "Movie", "Ponniyin Selvan: Part I (Tamil)", "Mani Ratnam", "Vikram, Aishwarya Rai Bachchan, Jayam Ravi, Karthi, Trisha Krishnan", "India", "September 30, 2022", "2022", "TV-14", "167 min", "Action & Adventure, Dramas, International Movies", "In the 10th century Chola dynasty, royal heirs face grave dangers and a massive, treacherous coup organized by plotting vassals and a mysterious female vigilante."],
  ["s149", "Movie", "Ponniyin Selvan: Part II (Tamil)", "Mani Ratnam", "Vikram, Aishwarya Rai Bachchan, Jayam Ravi, Karthi, Trisha Krishnan", "India", "April 28, 2023", "2023", "TV-14", "164 min", "Action & Adventure, Dramas, International Movies", "Arulmozhi Varman returns from the dead to defend the Chola empire from plotting rebels and the deep personal vengeance of Nandini, a calculating queen."],
  ["s150", "Movie", "Sita Ramam (Telugu)", "Hanu Raghavapudi", "Dulquer Salmaan, Mrunal Thakur, Rashmika Mandanna, Sumanth", "India", "August 5, 2022", "2022", "TV-14", "163 min", "Dramas, Romantic Movies, International Movies", "The Telugu original version of the legendary, heartwarming romantic tragedy about Lieutenant Ram and Sita Mahalakshmi, spanning decades and borders."],
  ["s151", "Movie", "777 Charlie (Kannada)", "Kiranraj K.", "Rakshit Shetty, Sangeetha Sringeri, Raj B. Shetty, Bobby Simha", "India", "June 10, 2022", "2022", "TV-PG", "164 min", "Children & Family Movies, Comedies, Dramas", "A lonely, antisocial factory worker leading a cold, routine life finds his entire perspective altered and warmed after a high-spirited, runaway Labrador pup enters his home."],
  ["s152", "Movie", "Hi Nanna (Telugu)", "Shouryuv", "Nani, Mrunal Thakur, Baby Kiara Khanna, Jayaram", "India", "December 7, 2023", "2023", "TV-PG", "155 min", "Dramas, Romantic Movies, International Movies", "A caring, single-father photographer's life gets deeply and beautifully altered when a mysterious, kind woman helps him and his six-year-old daughter who has a health condition."],
  ["s153", "Movie", "Dasara (Telugu)", "Srikanth Odela", "Nani, Keerthy Suresh, Dheekshith Shetty, Shine Tom Chacko", "India", "March 30, 2023", "2023", "TV-MA", "156 min", "Action & Adventure, Dramas, International Movies", "Set in the dusty Veerlapally coal mines, three close childhood friends navigate love, caste disparities, and extreme violence when a tragic incident occurs at the village bar."],
  ["s154", "Movie", "Major", "Sashi Kiran Tikka", "Adivi Sesh, Sobhita Dhulipala, Saiee Manjrekar, Prakash Raj", "India", "June 3, 2022", "2022", "TV-14", "149 min", "Action & Adventure, Dramas, International Movies", "The heroic, inspiring biography of Major Sandeep Unnikrishnan, who bravely fought and sacrificed his life to rescue hostages during the tragic 2008 Mumbai Taj Hotel attacks."],
  ["s155", "Movie", "Kartikeya 2 (Telugu)", "Chandoo Mondeti", "Nikhil Siddharth, Anupama Parameswaran, Anupam Kher, Srinivasa Reddy", "India", "August 13, 2022", "2022", "TV-14", "145 min", "Action & Adventure, Sci-Fi & Fantasy, Thrillers", "An inquisitive, logical doctor gets dragged into a dangerous adventure to retrieve an ancient, legendary anklet belonging to Lord Krishna that holds deep secrets for humanity."],
  ["s156", "Movie", "Yeh Jawaani Hai Deewani", "Ayan Mukerji", "Ranbir Kapoor, Deepika Padukone, Aditya Roy Kapur, Kalki Koechlin", "India", "May 31, 2013", "2013", "TV-14", "160 min", "Comedies, Dramas, International Movies, Romantic Movies", "A simple, introverted girl falls in love with a free-spirited, travel-loving classmate during a trekking trip to Manali, but their lives diverge when he leaves to pursue a career abroad."],
  ["s157", "Movie", "Rockstar", "Imtiaz Ali", "Ranbir Kapoor, Nargis Fakhri, Shammi Kapoor, Kumud Mishra", "India", "November 11, 2011", "2011", "TV-MA", "159 min", "Dramas, Music & Musicals, Romantic Movies", "A simple college student's obsession with experiencing a broken heart in order to channel deep artistic expression turns him into a volatile, self-destructive rockstar."],
  ["s158", "Movie", "Tamasha", "Imtiaz Ali", "Ranbir Kapoor, Deepika Padukone, Piyush Mishra, Javed Sheikh", "India", "November 27, 2015", "2015", "TV-14", "139 min", "Dramas, Romantic Movies, International Movies", "An average, corporate-bound employee struggles to break free from his routine life and discover his true creative storyteller identity, inspired by a woman he met in Corsica."],
  ["s159", "Movie", "Hera Pheri", "Priyadarshan", "Akshay Kumar, Suniel Shetty, Paresh Rawal, Tabu", "India", "March 31, 2000", "2000", "TV-PG", "156 min", "Comedies, Classic Movies, International Movies", "Three flatmates living in extreme poverty get involved in a hilarious, high-stakes ransom phone call due to a misdialed number, attempting to outsmart a kidnapper."],
  ["s160", "Movie", "Phir Hera Pheri", "Neeraj Vora", "Akshay Kumar, Suniel Shetty, Paresh Rawal, Bipasha Basu, Rimi Sen", "India", "June 9, 2006", "2006", "TV-14", "153 min", "Comedies, International Movies", "The three gold-hearted simpletons who became rich find themselves broke again after being scammed by a fake investment firm, leading to chaotic encounters with a stuttering gangster."],
  ["s161", "Movie", "Bhool Bhulaiyaa", "Priyadarshan", "Akshay Kumar, Vidya Balan, Shiney Ahuja, Ameesha Patel, Paresh Rawal", "India", "October 12, 2007", "2007", "TV-14", "159 min", "Comedies, Horror Movies, Thrillers", "An NRI couple decides to stay in their ancestral palace, ignoring warnings about a vengeful female spirit, which prompts a psychiatrist to arrive and solve the chilling mystery."],
  ["s162", "Movie", "Kahaani (Hindi)", "Sujoy Ghosh", "Vidya Balan, Parambrata Chatterjee, Nawazuddin Siddiqui, Indraneil Sengupta", "India", "March 9, 2012", "2012", "TV-MA", "122 min", "Thrillers, Dramas, International Movies", "A pregnant software engineer arrives in Kolkata from London during the Durga Puja festival in search of her missing husband, unearthing a dark network of espionage."],
  ["s163", "Movie", "The Lunchbox", "Ritesh Batra", "Irrfan Khan, Nimrat Kaur, Nawazuddin Siddiqui, Lillete Dubey", "India", "September 20, 2013", "2013", "PG", "104 min", "Dramas, Romantic Movies, International Movies", "A rare mistake by Mumbai's highly efficient lunchbox delivery system connects a lonely, retiring widower accountant with an ignored young housewife through letters in a tiffin box."],
  ["s164", "Movie", "Om Shanti Om", "Farah Khan", "Shah Rukh Khan, Deepika Padukone, Arjun Rampal, Shreyas Talpade, Kirron Kher", "India", "November 9, 2007", "2007", "TV-14", "162 min", "Comedies, Dramas, Romantic Movies, International Movies", "A small-time junior artist of the 1970s is killed trying to save his dream actress, only to be reincarnated as a top superstar of modern times, setting out to seek justice for her."],
  ["s165", "Movie", "Kuch Kuch Hota Hai", "Karan Johar", "Shah Rukh Khan, Kajol, Rani Mukerji, Salman Khan", "India", "October 16, 1998", "1998", "TV-PG", "177 min", "Classic Movies, Comedies, Dramas, Romantic Movies", "Before her death, a woman leaves letters to her young daughter, asking her to reunite her father with his college best friend who was secretly in love with him."],
  ["s166", "Movie", "Kal Ho Naa Ho", "Nikkhil Advani", "Shah Rukh Khan, Preity Zinta, Saif Ali Khan, Jaya Bachchan", "India", "November 28, 2003", "2003", "TV-14", "186 min", "Comedies, Dramas, Romantic Movies, International Movies", "A cheerful, terminally ill young man attempts to bring joy and color to a gloomy, struggling NRI family in New York, trying to matchmake his lover with her best friend before he dies."],
  ["s167", "Movie", "Veer-Zaara", "Yash Chopra", "Shah Rukh Khan, Preity Zinta, Rani Mukerji, Amitabh Bachchan, Hema Malini", "India", "November 12, 2004", "2004", "TV-14", "192 min", "Dramas, Romantic Movies, International Movies", "An Indian pilot and a Pakistani politician's daughter fall in love, leading to his imprisonment in a Pakistani jail for 22 years, until an idealistic lawyer takes his case."],
  ["s168", "Movie", "Udta Punjab", "Abhishek Chaubey", "Shahid Kapoor, Kareena Kapoor, Alia Bhatt, Diljit Dosanjh", "India", "June 17, 2016", "2016", "TV-MA", "148 min", "Dramas, Thrillers, International Movies", "A rockstar, a migrant laborer, a doctor, and a policeman collide in a dark, gritty exploration of the massive drug abuse crisis gripping the state of Punjab."],
  ["s169", "Movie", "Piku", "Shoojit Sircar", "Amitabh Bachchan, Deepika Padukone, Irrfan Khan, Moushumi Chatterjee", "India", "May 8, 2015", "2015", "TV-14", "122 min", "Comedies, Dramas, International Movies", "A quirky, warm road trip from Delhi to Kolkata connects an independent, headstrong architect, her hypochondriac, constipation-obsessed aging father, and a cab company owner."],
  ["s170", "Movie", "Pink", "Aniruddha Roy Chowdhury", "Amitabh Bachchan, Taapsee Pannu, Kirti Kulhari, Angad Bedi", "India", "September 16, 2016", "2016", "TV-MA", "136 min", "Dramas, Thrillers, International Movies", "When three independent young women are falsely charged with solicitation and attempted murder by influential men, a retired lawyer defends them, exploring consent."],
  ["s171", "Movie", "Hanu-Man (Telugu)", "Prasanth Varma", "Teja Sajja, Amritha Aiyer, Varalaxmi Sarathkumar, Vinay Rai", "India", "January 12, 2024", "2024", "TV-14", "158 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "A petty thief from a remote village accidentally gains the ancient, godly superpowers of Lord Hanuman, setting out to protect his people from a greedy corporate supervillain."],
  ["s172", "Movie", "Guntur Kaaram (Telugu)", "Trivikram Srinivas", "Mahesh Babu, Sreeleela, Meenakshi Chaudhary, Ramya Krishna", "India", "January 12, 2024", "2024", "TV-14", "159 min", "Action & Adventure, Comedies, Dramas, International Movies", "A charismatic, spicy red-chilli merchant from Guntur gets involved in a political family feud when his estranged mother, a powerful minister, asks him to sign a declaration of disassociation."],
  ["s173", "Movie", "Devara: Part 1 (Telugu)", "Koratala Siva", "N.T. Rama Rao Jr., Janhvi Kapoor, Saif Ali Khan, Prakash Raj", "India", "September 27, 2024", "2024", "TV-14", "178 min", "Action & Adventure, Dramas, Thrillers", "In a coastal land of smuggling clans, a fearless hero decides to stop the illegal operations, making dangerous enemies and forcing his timid son to take his place."],
  ["s174", "Movie", "Arjun Reddy (Telugu)", "Sandeep Reddy Vanga", "Vijay Deverakonda, Shalini Pandey, Rahul Ramakrishna, Jia Sharma", "India", "August 25, 2017", "2017", "TV-MA", "182 min", "Dramas, Romantic Movies, International Movies", "A brilliant, short-tempered medical student spirals into extreme alcoholism, self-destruction, and substance abuse after his beloved girlfriend is forced to marry another."],
  ["s175", "Movie", "Master (Tamil)", "Lokesh Kanagaraj", "Vijay, Vijay Sethupathi, Malavika Mohanan, Andrea Jeremiah", "India", "January 13, 2021", "2021", "TV-MA", "179 min", "Action & Adventure, Thrillers, International Movies", "An alcoholic college professor is posted to a juvenile detention facility, where he clashes with a ruthless gangster who uses the inmates as scapegoats for his criminal activities."],
  ["s176", "Movie", "Theri (Tamil)", "Atlee", "Vijay, Samantha Ruth Prabhu, Amy Jackson, Mahendran", "India", "April 14, 2016", "2016", "TV-14", "158 min", "Action & Adventure, Dramas, International Movies", "An honest, loving former police officer goes into hiding as a quiet bakery owner to protect his young daughter, but his dangerous past catches up with him."],
  ["s177", "Movie", "Mersal (Tamil)", "Atlee", "Vijay, S. J. Suryah, Kajal Aggarwal, Samantha Ruth Prabhu, Nithya Menen", "India", "October 18, 2017", "2017", "TV-14", "169 min", "Action & Adventure, Thrillers, International Movies", "A magician and his lookalike doctor brother find themselves at the center of an investigation as they target corrupt healthcare systems to avenge their father's tragic death."],
  ["s178", "Movie", "Vikram Vedha (Tamil)", "Pushkar-Gayathri", "Madhavan, Vijay Sethupathi, Varalaxmi Sarathkumar, Kathir", "India", "July 21, 2017", "2017", "TV-MA", "147 min", "Action & Adventure, Crime Movies, Thrillers", "An upright, ruthless police officer is locked in a high-stakes psychological game with a notorious gangster who surrenders and narrates moral riddles that challenge his sense of justice."],
  ["s179", "Movie", "Enthiran (Robot) (Tamil)", "S. Shankar", "Rajinikanth, Aishwarya Rai Bachchan, Danny Denzongpa, Santhanam", "India", "October 1, 2010", "2010", "TV-PG", "165 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "A brilliant scientist creates a highly advanced humanoid robot named Chitti, but chaos ensues when the robot gets upgraded with human emotions and falls in love with the creator's fiancé."],
  ["s180", "Movie", "2.0 (Tamil)", "S. Shankar", "Rajinikanth, Akshay Kumar, Amy Jackson, Adil Hussain", "India", "November 29, 2018", "2018", "TV-14", "147 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "When cell phones start flying out of people's hands across Chennai due to an angry avian researcher's spirit, a scientist is forced to reactivate his dismantled humanoid robot Chitti."],
  ["s181", "Movie", "Anniyan (Tamil)", "S. Shankar", "Vikram, Sadha, Nedumudi Venu, Vivek, Prakash Raj", "India", "June 17, 2005", "2005", "TV-14", "181 min", "Action & Adventure, Thrillers, International Movies", "An upright, disappointed consumer lawyer suffering from multiple personality disorder creates two alter egos: a high-fashion model and a vigilante who executes corrupt citizens according to ancient texts."],
  ["s182", "Movie", "Laapataa Ladies (Hindi)", "Kiran Rao", "Pratibha Ranta, Sparsh Shrivastava, Nitanshi Goel, Chhaya Kadam, Ravi Kishan", "India", "March 1, 2024", "2024", "TV-PG", "122 min", "Comedies, Dramas, International Movies", "A warm, critically acclaimed story of two brides lost during their train journey, celebrating female empowerment and sisterhood."],
  ["s183", "Movie", "Sarkar (Tamil)", "A.R. Murugadoss", "Vijay, Keerthy Suresh, Varalaxmi Sarathkumar, Radha Ravi", "India", "November 6, 2018", "2018", "TV-14", "162 min", "Action & Adventure, Dramas, International Movies", "An elite corporate corporate NRI returns to India to cast his democratic vote, only to find it was already cast illegally, prompting him to launch a crusade against corrupt political systems."],
  ["s184", "Movie", "Thiruchitrambalam (Tamil)", "Mithran R. Jawahar", "Dhanush, Nithya Menen, Bharathiraja, Prakash Raj, Priya Bhavani Shankar, Raashii Khanna", "India", "August 18, 2022", "2022", "TV-14", "138 min", "Comedies, Dramas, International Movies, Romantic Movies", "A delivery driver navigates life, grief, and romance while living with his strict policeman father and wise grandfather, finding solace in his childhood best friend."],
  ["s185", "Movie", "Thiruchitrambalam", "Mithran R. Jawahar", "Dhanush, Nithya Menen, Bharathiraja, Prakash Raj, Priya Bhavani Shankar, Raashii Khanna", "India", "August 18, 2022", "2022", "TV-14", "138 min", "Comedies, Dramas, International Movies, Romantic Movies", "A delivery driver navigates life, grief, and romance while living with his strict policeman father and wise grandfather, finding solace in his childhood best friend."],
  ["s186", "Movie", "VIP (Velaiilla Pattadhari) (Tamil)", "Velraj", "Dhanush, Amala Paul, Vivek, Saranya Ponvannan, Samuthirakani", "India", "July 18, 2014", "2014", "TV-14", "133 min", "Action & Adventure, Comedies, Dramas, International Movies", "An unemployed engineering graduate struggles to find a job while facing pressure from his family, until a tragedy inspires him to build his own career and fight corruption in the construction industry."],
  ["s187", "Movie", "Premam (Malayalam)", "Alphonse Puthren", "Nivin Pauly, Sai Pallavi, Madonna Sebastian, Anupama Parameswaran", "India", "May 29, 2015", "2015", "TV-14", "156 min", "Comedies, Dramas, International Movies, Romantic Movies", "A young man experiences love at three different stages of his life, from high school infatuation to college romance and adult maturity, finding his true soulmate along the way."],
  ["s188", "Movie", "Bangalore Days (Malayalam)", "Anjali Menon", "Dulquer Salmaan, Nivin Pauly, Nazriya Nazim, Fahadh Faasil, Parvathy Thiruvothu", "India", "May 30, 2014", "2014", "TV-14", "171 min", "Comedies, Dramas, International Movies, Romantic Movies", "Three close cousins move to Bangalore to pursue their dreams, navigating career struggles, marriages, and heartbreak while finding support in their unbreakable family bond."],
  ["s189", "Movie", "Vaaranam Aayiram (Tamil)", "Gautham Vasudev Menon", "Suriya, Simran, Sameera Reddy, Divya Spandana", "India", "November 14, 2008", "2008", "TV-14", "168 min", "Dramas, Romantic Movies, International Movies", "An army officer remembers his relationship with his father, who served as a guiding light and anchor through his struggles, heartbreaks, and self-discovery over the years."],
  ["s190", "Movie", "OK Kanmani (Tamil)", "Mani Ratnam", "Dulquer Salmaan, Nithya Menen, Prakash Raj, Leela Samson", "India", "April 17, 2015", "2015", "TV-14", "139 min", "Comedies, Dramas, Romantic Movies, International Movies", "A young couple in Mumbai enters a live-in relationship to avoid marital pressure, but their modern values are tested when they witness the deep, enduring love of their elderly landlords."],
  ["s191", "Movie", "Stree 2 (Hindi)", "Amar Kaushik", "Shraddha Kapoor, Rajkummar Rao, Pankaj Tripathi, Abhishek Banerjee", "India", "August 15, 2024", "2024", "TV-14", "147 min", "Comedies, Horror Movies, International Movies", "The residents of Chanderi are terrorized once again, this time by a headless entity named Sarkata, forcing Vicky and his friends to call upon their beloved Stree for protection."],
  ["s192", "Movie", "Gadar 2 (Hindi)", "Anil Sharma", "Sunny Deol, Ameesha Patel, Utkarsh Sharma", "India", "August 11, 2023", "2023", "TV-14", "170 min", "Action & Adventure, Dramas, International Movies", "During the Indo-Pakistani War of 1971, Tara Singh ventures deep into Pakistan to rescue his captured son Charanjeet, unleashing his legendary patriotism and strength."],
  ["s193", "Movie", "2018 (Malayalam Film)", "Jude Anthany Joseph", "Tovino Thomas, Kunchacko Boban, Asif Ali, Vineeth Sreenivasan", "India", "May 5, 2023", "2023", "TV-14", "150 min", "Action & Adventure, Dramas, International Movies", "The first Malayalam film to surpass the 200 Crore mark, showcasing the incredible resilience, courage, and unity of Kerala's citizens during the devastating 2018 floods."],
  ["s194", "Movie", "Pushpa 2: The Rule (Telugu)", "Sukumar", "Allu Arjun, Rashmika Mandanna, Fahadh Faasil", "India", "December 5, 2024", "2024", "TV-MA", "181 min", "Action & Adventure, Crime Movies, Dramas", "Pushpa Raj establishes absolute supremacy over the red sandalwood smuggling trade, clashing with the ruthless SP Bhanwar Singh Shekhawat in a mega-grossing sequel."],
  ["s195", "Movie", "RRR (Telugu)", "S.S. Rajamouli", "N.T. Rama Rao Jr., Ram Charan, Ajay Devgn, Alia Bhatt", "India", "March 25, 2022", "2022", "TV-MA", "187 min", "Action & Adventure, Dramas, International Movies", "The legendary Telugu epic about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s."],
  ["s196", "Movie", "Kabir Singh (Hindi)", "Sandeep Reddy Vanga", "Shahid Kapoor, Kiara Advani, Suresh Oberoi", "India", "June 21, 2019", "2019", "TV-MA", "172 min", "Dramas, Romantic Movies, International Movies", "A brilliant but self-destructive house surgeon goes down a path of extreme anger, alcohol, and drug abuse after his girlfriend is forced to marry another man."],
  ["s197", "Movie", "3 Idiots (Hindi)", "Rajkumar Hirani", "Aamir Khan, Kareena Kapoor, R. Madhavan, Sharman Joshi", "India", "December 25, 2009", "2009", "PG-13", "170 min", "Comedies, Dramas, International Movies", "Two engineering students search for their long-lost, brilliant friend who inspired them to think outside the box and follow their true passions instead of rat races."],
  ["s198", "Movie", "K.G.F: Chapter 2 (Kannada)", "Prashanth Neel", "Yash, Sanjay Dutt, Raveena Tandon, Srinidhi Shetty", "India", "April 14, 2022", "2022", "TV-MA", "168 min", "Action & Adventure, Crime Movies, Dramas", "Rocky, now the undisputed king of Kolar Gold Fields, must defend his empire from the ruthless Adheera and the powerful Prime Minister Ramika Sen."],
  ["s199", "Movie", "Baahubali 2: The Conclusion (Telugu)", "S.S. Rajamouli", "Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah Bhatia, Ramya Krishna", "India", "April 28, 2017", "2017", "TV-14", "167 min", "Action & Adventure, Dramas, International Movies", "When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom."],
  ["s200", "Movie", "Baahubali: The Beginning (Telugu)", "S.S. Rajamouli", "Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah Bhatia", "India", "July 10, 2015", "2015", "TV-14", "159 min", "Action & Adventure, Dramas, International Movies", "A young, adventurous man in ancient India helps his love rescue her queen from a tyrannical ruler of a majestic kingdom, discovering his royal lineage along the way."],
  ["s201", "Movie", "Kalki 2898 AD (Telugu)", "Nag Ashwin", "Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone, Disha Patani", "India", "June 27, 2024", "2024", "TV-MA", "180 min", "Action & Adventure, Sci-Fi & Fantasy, International Movies", "In a post-apocalyptic world ruled by a supreme totalitarian entity, a modern avatar of Lord Vishnu descends to earth to protect the unborn child of a lab subject, clashing with powerful bounty hunters."],
  ["s202", "Movie", "Leo (Tamil)", "Lokesh Kanagaraj", "Vijay, Sanjay Dutt, Arjun Sarja, Trisha Krishnan, Gautham Vasudev Menon", "India", "October 19, 2023", "2023", "TV-MA", "164 min", "Action & Adventure, Thrillers, International Movies", "A mild-mannered cafe owner and animal rescuer in Himachal Pradesh becomes a local hero, but his sudden fame triggers dangerous elements who claim he is a feared, long-lost gangster named Leo Das."],
  ["s203", "Movie", "Jailer (Tamil)", "Nelson Dilipkumar", "Rajinikanth, Vinayakan, Ramya Krishnan, Vasanth Ravi, Tamannaah Bhatia", "India", "August 10, 2023", "2023", "TV-MA", "168 min", "Action & Adventure, Comedies, Thrillers", "A retired, gentle prison warden goes on an absolute rampage to find and avenge his police officer son, who went missing while investigating an idol smuggling syndicate, unleashing his lethal dark past."],
  ["s204", "Movie", "Jawan (Hindi)", "Atlee", "Shah Rukh Khan, Nayanthara, Vijay Sethupathi, Deepika Padukone", "India", "September 7, 2023", "2023", "TV-14", "169 min", "Action & Adventure, Dramas, International Movies", "A high-octane action thriller about a father and son who are determined to rectify the social, economic, and political injustices plaguing their country, with the help of a highly skilled female commando squad."],
  ["s205", "Movie", "Pathaan (Hindi)", "Siddharth Anand", "Shah Rukh Khan, Deepika Padukone, John Abraham", "India", "January 25, 2023", "2023", "TV-14", "146 min", "Action & Adventure, Thrillers, International Movies", "An exiled RAW agent named Pathaan is called back to active duty to take down a rogue former colleague who plans to unleash a deadly biological weapon across India with a mercenary outfit."],
  ["s206", "Movie", "Dangal (Hindi)", "Nitesh Tiwari", "Aamir Khan, Sakshi Tanwar, Fatima Sana Shaikh, Sanya Malhotra", "India", "December 23, 2016", "2016", "TV-PG", "161 min", "Dramas, Sports Movies, International Movies", "An elite former amateur wrestler fails to win gold for India, prompting him to break social stereotypes and train his daughters to become world-class, champion gold-medal wrestlers."],
  ["s207", "Movie", "Animal (Hindi)", "Sandeep Reddy Vanga", "Ranbir Kapoor, Anil Kapoor, Bobby Deol, Rashmika Mandanna, Triptii Dimri", "India", "December 1, 2023", "2023", "TV-MA", "201 min", "Action & Adventure, Crime Movies, Dramas", "The complex, obsessive relationship between a steel magnate and his volatile, devoted son who embarks on a violent, bloody crusade of vengeance against rival cartels threatening his father's life."],
  ["s208", "Movie", "Kantara (Kannada)", "Rishab Shetty", "Rishab Shetty, Sapthami Gowda, Kishore", "India", "September 30, 2022", "2022", "TV-14", "150 min", "Dramas, Thrillers, International Movies", "A local rebel champion in a coastal village clashes with an uncompromising forest officer, leading to a spiritual confrontation where the village's protective deity possesses him to deliver justice."],
  ["s209", "Movie", "Manjummel Boys (Malayalam)", "Chidambaram", "Soubin Shahir, Sreenath Bhasi, Balu Varghese, Ganapathi S. Poduval", "India", "February 22, 2024", "2024", "TV-14", "135 min", "Dramas, Thrillers, International Movies", "Based on an incredible true story, a group of high-spirited friends from Kerala go on a vacation to Kodaikanal, where one of them accidentally falls into the forbidden, dangerous Guna Caves."],
  ["s210", "Movie", "Vikram (Tamil)", "Lokesh Kanagaraj", "Kamal Haasan, Vijay Sethupathi, Fahadh Faasil, Suriya", "India", "June 3, 2022", "2022", "TV-MA", "175 min", "Action & Adventure, Thrillers, International Movies", "A special ops team is assigned to investigate a masked vigilante group executing drug lords, leading them to a legendary black-ops commander who went into deep hiding decades ago."],
  ["s211", "Movie", "Master (Tamil)", "Lokesh Kanagaraj", "Vijay, Vijay Sethupathi, Malavika Mohanan, Arjun Das", "India", "January 13, 2021", "2021", "TV-14", "179 min", "Action & Adventure, Dramas, International Movies", "An alcoholic, charismatic professor is sent to a juvenile detention home for a three-month tenure, clashing with a ruthless gangster who uses the young inmates to shield his criminal empire."],
  ["s212", "Movie", "Salaar: Part 1 - Ceasefire (Telugu)", "Prashanth Neel", "Prabhas, Prithviraj Sukumaran, Shruti Haasan, Jagapathi Babu", "India", "December 22, 2023", "2023", "TV-MA", "175 min", "Action & Adventure, Crime Movies, Dramas", "In the dystopian, highly-fortified city-state of Khansaar, a prince recruits his long-lost, lethally skilled childhood friend to help him secure his throne against internal coups and armies."],
  ["s213", "Movie", "Bajrangi Bhaijaan (Hindi)", "Kabir Khan", "Salman Khan, Harshaali Malhotra, Kareena Kapoor Khan, Nawazuddin Siddiqui", "India", "July 17, 2015", "2015", "TV-PG", "159 min", "Comedies, Dramas, International Movies", "A kind-hearted, devout Indian man embarks on an emotional, illegal journey across the border to reunite a mute six-year-old Pakistani girl with her parents in her homeland."],
  ["s214", "Movie", "Sultan (Hindi)", "Ali Abbas Zafar", "Salman Khan, Anushka Sharma, Randeep Hooda", "India", "July 6, 2016", "2016", "TV-14", "170 min", "Dramas, Sports Movies, International Movies", "A middle-aged local wrestling champion tries to make a professional comeback after personal tragedy, fighting his own ego and physical limits to win back the respect of his true love."],
  ["s215", "Movie", "PK (Hindi)", "Rajkumar Hirani", "Aamir Khan, Anushka Sharma, Sushant Singh Rajput, Sanjay Dutt", "India", "December 19, 2014", "2014", "TV-14", "153 min", "Comedies, Sci-Fi & Fantasy, International Movies", "An innocent, curious alien lands on Earth but loses his communication device, embarking on a quest to find it that leads him to question humanity's religious dogmas and blind beliefs."],
  ["s216", "Movie", "Ponniyin Selvan: Part 1 (Tamil)", "Mani Ratnam", "Vikram, Aishwarya Rai Bachchan, Jayam Ravi, Karthi, Trisha Krishnan", "India", "September 30, 2022", "2022", "TV-14", "167 min", "Action & Adventure, Dramas, International Movies", "The grand cinematic adaptation of Kalki's legendary historical novel, chronicling the early life of prince Arulmozhi Varman who would rise to become the great Chola Emperor Rajaraja I."],
  ["s217", "Movie", "K.G.F: Chapter 1 (Kannada)", "Prashanth Neel", "Yash, Srinidhi Shetty, Ramachandra Raju", "India", "December 21, 2018", "2018", "TV-MA", "156 min", "Action & Adventure, Crime Movies, Dramas", "A legendary assassin disguised as a slave infiltrates the heavily guarded, brutal Kolar Gold Fields to assassinate the tyrannical heir, sparking a revolution among the oppressed workers."]
];

// Helper to escape CSV fields
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Generates the sample CSV file
export function ensureDatasetExists(): void {
  if (!fs.existsSync(DATASET_DIR)) {
    fs.mkdirSync(DATASET_DIR, { recursive: true });
  }

  let shouldOverwrite = false;
  if (fs.existsSync(DATASET_PATH)) {
    try {
      const content = fs.readFileSync(DATASET_PATH, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length - 1 !== SAMPLE_NETFLIX_TITLES.length) {
        shouldOverwrite = true;
      }
    } catch (e) {
      shouldOverwrite = true;
    }
  } else {
    shouldOverwrite = true;
  }

  if (shouldOverwrite) {
    console.log("Generating dataset/netflix_titles.csv sample with expanded movies...");
    const header = "show_id,type,title,director,cast,country,date_added,release_year,rating,duration,listed_in,description";
    const rows = SAMPLE_NETFLIX_TITLES.map((row) => row.map(escapeCSVField).join(","));
    const content = [header, ...rows].join("\n");
    fs.writeFileSync(DATASET_PATH, content, "utf-8");
    if (fs.existsSync(CLEANED_CACHE_PATH)) {
      try {
        fs.unlinkSync(CLEANED_CACHE_PATH);
      } catch (e) {
        console.error("Failed to delete stale cache:", e);
      }
    }
    console.log(`Successfully wrote ${SAMPLE_NETFLIX_TITLES.length} sample records to ${DATASET_PATH}`);
  }
}

// Custom state-machine CSV line parser to handle quotes, commas, and escaped quotes properly
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim());
  return result;
}

// Stop words for text normalization
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
  "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from",
  "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
  "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in",
  "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor",
  "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats",
  "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll",
  "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we",
  "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while",
  "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve",
  "your", "yours", "yourself", "yourselves"
]);

// Normalizes and tokenizes text (lowercasing, stripping punctuation, removing stop words)
export function normalizeText(text: string): string[] {
  if (!text) return [];
  // Lowercase & remove punctuation
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split into words & filter stop words & empty strings
  return cleaned
    .split(" ")
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

// Standard Month names
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Helper to dynamically inject real-time highly-anticipated upcoming blockbusters so they are searchable/recommendable
function injectUpcomingMovies(movies: Movie[]): Movie[] {
  const upcomingRealMovies: Movie[] = [
    {
      show_id: "u1",
      type: "Movie",
      title: "Ramayana: Part 1",
      director: "Nitesh Tiwari",
      cast: "Ranbir Kapoor, Sai Pallavi, Yash",
      country: "India",
      date_added: "December 25, 2026",
      release_year: 2026,
      rating: "PG-13",
      duration: "165 min",
      listed_in: "Action & Adventure, Sci-Fi & Fantasy, International Movies",
      description: "An ancient prince of Ayodhya goes on an epic journey across mythical lands to rescue his beloved wife from an all-powerful, terrifying demon king.",
      added_year: 2026,
      added_month: "December",
      cleaned_genres: ["Action & Adventure", "Sci-Fi & Fantasy", "International Movies", "Mythology"],
      normalized_country: "India"
    },
    {
      show_id: "u2",
      type: "Movie",
      title: "War 2",
      director: "Ayan Mukerji",
      cast: "Hrithik Roshan, Jr. NTR, Kiara Advani",
      country: "India",
      date_added: "August 14, 2026",
      release_year: 2026,
      rating: "UA",
      duration: "155 min",
      listed_in: "Action & Adventure, Thrillers",
      description: "Two of the world's most elite, lethal secret agents face off in a high-octane global battle of survival, strategy, and pure combat.",
      added_year: 2026,
      added_month: "August",
      cleaned_genres: ["Action & Adventure", "Thrillers"],
      normalized_country: "India"
    },
    {
      show_id: "u3",
      type: "Movie",
      title: "Alpha",
      director: "Shiv Rawail",
      cast: "Alia Bhatt, Sharvari, Bobby Deol",
      country: "India",
      date_added: "November 20, 2026",
      release_year: 2026,
      rating: "TV-14",
      duration: "145 min",
      listed_in: "Action & Adventure, Thrillers",
      description: "A highly-trained female operative goes rogue on a dangerous, covert mission in the shadows to neutralize a catastrophic global syndicate.",
      added_year: 2026,
      added_month: "November",
      cleaned_genres: ["Action & Adventure", "Thrillers"],
      normalized_country: "India"
    },
    {
      show_id: "u4",
      type: "Movie",
      title: "Spirit",
      director: "Sandeep Reddy Vanga",
      cast: "Prabhas, Trisha, Saif Ali Khan",
      country: "India",
      date_added: "April 30, 2027",
      release_year: 2027,
      rating: "R",
      duration: "180 min",
      listed_in: "Action & Adventure, Crime Movies, Thrillers",
      description: "A fierce, uncompromising police officer wages a brutal one-man war against a powerful, corrupt criminal syndicate in the dark heart of the city.",
      added_year: 2027,
      added_month: "April",
      cleaned_genres: ["Action & Adventure", "Crime Movies", "Thrillers"],
      normalized_country: "India"
    }
  ];

  let modified = false;
  upcomingRealMovies.forEach(u => {
    if (!movies.some(m => m.title.toLowerCase() === u.title.toLowerCase())) {
      movies.push(u);
      modified = true;
    }
  });

  if (modified) {
    try {
      fs.writeFileSync(CLEANED_CACHE_PATH, JSON.stringify(movies, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write cleaned dataset cache on injection:", e);
    }
  }

  return movies;
}

// Cleans and parses the entire CSV dataset
export function loadAndCleanDataset(): Movie[] {
  ensureDatasetExists();

  // Try to load from cleaned cache first for performance and hot restarts
  if (fs.existsSync(CLEANED_CACHE_PATH)) {
    try {
      const data = fs.readFileSync(CLEANED_CACHE_PATH, "utf-8");
      const cached = JSON.parse(data) as Movie[];
      if (cached && cached.length > 0) {
        return injectUpcomingMovies(cached);
      }
    } catch (e) {
      console.warn("Cleaned cache could not be loaded, re-parsing CSV...", e);
    }
  }

  const fileContent = fs.readFileSync(DATASET_PATH, "utf-8");
  // Split by newline but handle potential carriage returns or embedded newlines in descriptions
  // For simplicity and stability, we split lines by standard newlines but verify field count
  const lines = fileContent.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV dataset is empty or invalid!");
  }

  // Header verification
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const expectedHeaders = [
    "show_id", "type", "title", "director", "cast", "country", 
    "date_added", "release_year", "rating", "duration", "listed_in", "description"
  ];

  // Map header index for safety
  const headerIdx = expectedHeaders.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);

  const movies: Movie[] = [];
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    // If the number of fields is less than expected, it might be a malformed row or split line
    if (fields.length < expectedHeaders.length) {
      continue;
    }

    // Extract fields dynamically using header mapping, with defaults
    const getField = (name: string, fallback: string): string => {
      const idx = headerIdx[name];
      return idx >= 0 && idx < fields.length && fields[idx] ? fields[idx] : fallback;
    };

    const show_id = getField("show_id", `s_gen_${i}`);
    const typeVal = getField("type", "Movie") as "Movie" | "TV Show";
    const title = getField("title", "Untitled Content");
    const director = getField("director", "Unknown Director");
    const cast = getField("cast", "Unknown Cast");
    const country = getField("country", "Unknown Country");
    const date_added = getField("date_added", "");
    const release_year = parseInt(getField("release_year", "2020"), 10) || 2020;
    const rating = getField("rating", "TV-MA");
    const duration = getField("duration", typeVal === "Movie" ? "90 min" : "1 Season");
    const listed_in = getField("listed_in", "Uncategorized");
    const description = getField("description", "No description available.");

    // Remove duplicates by show_id and title (Kaggle dataset cleanup)
    const titleKey = `${typeVal}_${title.toLowerCase()}`;
    if (seenIds.has(show_id) || seenTitles.has(titleKey)) {
      continue;
    }
    seenIds.add(show_id);
    seenTitles.add(titleKey);

    // Standardize genres (listed_in)
    const cleaned_genres = listed_in
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    // Normalize country names (take primary/first country)
    const normalized_country = country.split(",")[0].trim() || "Unknown Country";

    // Convert date_added and extract year/month
    let added_year: number | undefined;
    let added_month: string | undefined;

    if (date_added) {
      // Matches standard Netflix date formats: "September 25, 2021" or " 25-Sep-21"
      const parts = date_added.trim().replace(/"/g, "").split(/[\s,]+/);
      if (parts.length >= 3) {
        // e.g. ["September", "25", "2021"]
        const monthStr = parts[0];
        const yearStr = parts[parts.length - 1];
        const yearInt = parseInt(yearStr, 10);
        if (!isNaN(yearInt)) {
          added_year = yearInt;
        }
        if (MONTHS.includes(monthStr)) {
          added_month = monthStr;
        }
      } else if (date_added.includes("-")) {
        // e.g. "25-Sep-21"
        const parts = date_added.split("-");
        if (parts.length === 3) {
          const yearShort = parseInt(parts[2], 10);
          if (!isNaN(yearShort)) {
            added_year = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          }
          const mAbbr = parts[1].toLowerCase();
          const foundMonth = MONTHS.find((m) => m.toLowerCase().startsWith(mAbbr));
          if (foundMonth) {
            added_month = foundMonth;
          }
        }
      }
    }

    // Fallbacks if date extraction failed
    if (!added_year) {
      added_year = release_year; // Fallback to release year
    }
    if (!added_month) {
      added_month = "January"; // Default month
    }

    movies.push({
      show_id,
      type: typeVal,
      title,
      director,
      cast,
      country,
      date_added,
      release_year,
      rating,
      duration,
      listed_in,
      description,
      added_year,
      added_month,
      cleaned_genres,
      normalized_country,
    });
  }

  // Cache cleaned dataset for speedy execution
  try {
    fs.writeFileSync(CLEANED_CACHE_PATH, JSON.stringify(movies, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write cleaned dataset cache:", e);
  }

  return injectUpcomingMovies(movies);
}
