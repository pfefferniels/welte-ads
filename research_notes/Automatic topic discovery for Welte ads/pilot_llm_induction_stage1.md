# Pilot: LLM-based inductive topic discovery — Stage 1 (blind generation)

*Pilot run on 24 Oct 2026. The "LLM" is Claude (Opus), working by hand, without an API pipeline. Stage 1 was written **blind**: before this file was saved I had not opened the project's taxonomy (`tei/shared/encoding.xml`), the annotated spans (`segs.json`), `ads.json` or any other project file that names topics.*

## 1. Set-up and procedure

**Input.** `ads_blind.json`: 195 ads (en 66, de 38, nl 22, es 14, sv 14, da 12, fr 11, no 9, pl 4, pt 2, ru 2, ca 1), 1905–1929, with `text` (the editor's transcription with other products left out) and `figs` (the editor's prose descriptions of the illustrations; 96 ads have at least one). I read every ad in file order, in chunks.

**Procedure (TopicGPT-style, done by hand).**

1. *Generation.* I went through the ads in order and kept a running list of labels. I added a new label only when no existing one fitted. The list reached about 65 candidate labels by the end of the corpus.
2. *Refinement.* I merged near-duplicates. For example, "phantom fingers", "zitieren / summon" and "uncanny" became C2; "culmination of progress" was folded into "perfection" (F2); "novelty" was folded into "sensational invention" (F1); "autograph rolls" was folded into "artist verification" (A6); and "composer plays own work" was folded into the concert topic (G5). I dropped candidates found in fewer than 3 ads (§5). I also moved purely informational content to a separate list (§4).
3. *Granularity.* I settled on **40 leaf topics in 10 groups (A–J)**. This is a judgement call. A coarser cut of about 15 would keep roughly the group level; a finer cut would split A1, C1, D1 and F2.
4. *Assignment / counting.* Each ad was coded for each topic. I coded while reading (notes per ad). Then I ran a keyword recall check: regexes in the 12 languages for each topic, followed by a manual decision on every keyword hit I had not already coded. Many hits were false positives and were rejected. This makes the counts more complete than coding from memory, but they are still **approximate (my estimate: ±10–15 % per topic)**. They also depend on how strictly each coding rule is applied: for example, does a bare "wonderful instrument" count as C1? A precision pass, in which I re-checked every coded ad without keyword support, removed 14 wrong assignments, among them one non-existent ad ID.
5. One ad can carry many topics: 5.5 per ad on average, median 5. Seven ads carry **no** rhetorical topic at all; they are purely functional (used-instrument sales and agency notices: ad044, 050, 054, 057, 063, 166, 173).

**Quotations** below are verbatim from the blinded transcription. Spacing is normalised where words had run together in transcription (e.g. "es zu glauben" for "eszu glauben"), and English glosses are mine. Full ad-ID lists per topic are in Appendix A.

## 2. Overview of the induced topics

| Group | Topic | ≈ ads |
|---|---|---|
| **A. What the reproduction achieves** | A1 Faithful reproduction | 93 |
| | A2 Individual nuance & personality | 52 |
| | A3 The artist's soul / living art | 17 |
| | A4 Not mechanical (vs. player pianos) | 25 |
| | A5 Presence illusion ("as if he sat at your piano") | 31 |
| | A6 Artist verification: self-recognition & autograph | 22 |
| **B. Time and memory** | B1 Immortality & posterity | 42 |
| | B2 The counterfactual past ("if only for Liszt/Chopin") | 10 |
| **C. Wonder and the uncanny** | C1 Wonder, miracle, magic, astonishment | 72 (≈40 strong) |
| | C2 Phantom hands & summoned spirits | 27 |
| | C3 Hearing is believing (test it yourself) | 18 |
| **D. Home and social life** | D1 The great pianists in your home, at your command | 68 |
| | D2 Effortless — no skill needed | 22 |
| | D3 Domestic comfort & intimacy | 22 |
| | D4 Entertaining guests | 12 |
| | D5 Status, refinement & culture | 13 |
| | D6 Furniture & ornament | 12 |
| **E. Authority and proof** | E1 Quoted testimonials | 43 |
| | E2 Collective acclaim & world fame | 38 |
| | E3 Institutional recognition (conservatories, medals) | 14 |
| | E4 Royal & aristocratic patronage | 11 |
| | E5 Satisfied owners / social proof | 10 |
| **F. The invention and its rank** | F1 Sensational, epoch-making (new) invention | 50 |
| | F2 Perfection & superlatives (incl. culmination of progress) | 74 |
| | F3 Uniqueness & superiority over rivals | 38 |
| | F4 Originality & priority (the original, the first, patents) | 21 |
| | F5 Photography analogy (and phonograph comparison) | 9 |
| | F6 Heritage & founder legend | 8 |
| | F7 Electricity & technical modernity | 36 (mostly descriptor-level) |
| **G. Uses and versatility** | G1 Education & study | 18 |
| | G2 Uses beyond the private home (accompaniment, stage, hotels, hospitals) | 8 |
| | G3 Dual use & unobtrusive integration | 30 |
| | G4 Breadth of repertoire & moods | 17 |
| | G5 The machine as concert performer | 28 |
| **H. Narrative imagery** | H1 Evocative scenes | 7 |
| **I. Value and occasion** | I1 Within everyone's reach | 9 |
| | I2 Quality & durability | 8 |
| | I3 Gift & seasonal occasion | 7 |
| **J. Paratextual motifs** | J1 The modest name | 9 |
| | J2 National & local pride | 13 |

## 3. Topic definitions, coding rules and examples

### A. What the reproduction achieves

**A1 Faithful reproduction** (≈93). *Rule:* the ad explicitly claims that the reproduction is accurate, exact, faithful, true, natural, complete or "the actual/original playing". A bare "reproduces the playing of …" without such a qualifier is not enough.
- ad000 (en, 1913): "The Welte-Mignon faithfully reproduces the individual interpretation of the greatest Pianists"
- ad069 (nl, 1927): "Het Electrische Reproductie-Instrument Welte-Mignon geeft natuurgetrouw het handspel der groote kunstenaars weer." — *renders the hand-playing of the great artists true to nature.*
- ad144 (en, 1928): "Every shade and degree of accent, rhythm, and tone is duplicated perfectly and exactly as the Artist rendered it—nothing is added, nothing lost."

*Note:* this is the core claim and appears in every market and period. Because it is near-ubiquitous, it carries little information as a topic; its subtypes A2–A6 are more distinctive.

**A2 Individual nuance & personality** (≈52). *Rule:* names specific performance parameters (touch, phrasing, pedalling, dynamics, tempo, shading, tone colour) or the player's individuality, personality or character as what is reproduced.
- ad008 (de, 1910): "das Klavierspiel eines Künstlers mit all' seinen persönlichen Eigenschaften - des Anschlags, der Phrasierung, des Pedalgebrauchs etc. zu verewigen" — *to immortalise an artist's playing with all its personal qualities: touch, phrasing, use of the pedal.*
- ad159 (sv, 1908): "återgifver det karaktäristiska hos hvarje pianist, hans anslag, nyansering, tempo- och pedalbehandling" — *renders what is characteristic of each pianist: his touch, nuancing, tempo and pedal treatment.*
- ad210 (pl, 1906): "z całą indywidualną lekkością uderzenia i tak dynamicznemi jak i rytmicznemi odcieniami" — *with all the individual lightness of touch and the dynamic and rhythmic shadings.*

**A3 The artist's soul / living art** (≈17). *Rule:* the instrument is said to capture the soul, spirit, inner life, feelings or "living" quality of the performer. This is a spiritual register, distinct from the technical register of A2.
- ad035 (en, 1912): "The Welte-Mignon Autograph Piano Is the Living Soul of the Artist"
- ad180 (de, 1918): "Die auswechselbare Notenrolle ist die Musikseele des Meisters." — *the exchangeable roll is the master's musical soul.*
- ad201 (es, 1917): "interpreta, con la mayor exactitud y alma, la música de los grandes pianistas" — *interprets with the greatest exactness and soul the music of the great pianists.*

**A4 Not mechanical** (≈25). *Rule:* the instrument is set apart from mechanical, automatic or player-piano playing ("not a surrogate", "human", "forget the mechanical"). This includes refuting the prejudice that it is mechanical.
- ad009 (de, 1905): "Das Reproduktionsklavier hat nichts gemein mit mechanischen Spielapparaten wie Pianola, Phonola etc. … es handelt sich also nicht um ein Surrogat, sondern um eine vollwertige Vertretung" — *nothing in common with mechanical players like Pianola, Phonola …; not a surrogate but a fully valid stand-in.*
- ad180 (de, 1918): "Welte-Mignon spielt menschlich, deshalb künstlerisch. Ihm haftet nichts von der kalten Regelmässigkeit eines automatischen Klaviers an." — *plays humanly, therefore artistically; none of the cold regularity of an automatic piano.*
- ad006 (en, 1920): "Welte reproduction is not "stencil cutting," but absolute tonal duplication"

**A5 Presence illusion** (≈31). *Rule:* the listener is said to feel that the artist is physically present or seated at the instrument ("as if", "close your eyes", "illusion", "deceptive"), or that the playing cannot be told apart from the live artist.
- ad049 (nl, 1912), quoting Dan. de Lange: "Inderdaad de illusie is volkomen, sluit men de oogen dan is het of men de Personen zelf hoort" — *the illusion is complete; close your eyes and it is as if you heard the persons themselves.*
- ad099 (da, 1926): "saa nøjagtigt og fuldendt, som sad han selv foran Instrumentet" — *so exact and perfect, as though he himself sat at the instrument.*
- ad122 (ru, 1908): "съ полной иллюзіей ихъ личной игры" — *with the full illusion of their personal playing.*

**A6 Artist verification: self-recognition & autograph** (≈22). *Rule:* the artists themselves vouch for the recording. They hear or recognise their own playing, are "deceived" by it, sign the rolls as autographs, or are shown recording; listeners can tell which pianist is playing; or a demonstration is set up to prove individuality.
- ad117 (es, 1924), Pugno: "Es ciertamente la primera vez que puedo decir que me he oído a mí mismo, pues sentí que todo emanaba de mí" — *the first time I can say I have heard myself; I felt everything came from me.*
- ad039 (en, 1913): the rolls "have all been heard by the musicians themselves and signed by them as true and actual autographs of their playing"
- ad159 (sv, 1908): "Chopins Ballad spelas af tvänne pianister för att framhålla "Mignons" återgifvande af det individuella hos hvarje pianist" — *Chopin's Ballade is played by two pianists to show how Mignon renders each pianist's individuality.*
- Variants: Reisenauer's "Erkenne dich selbst" (ad100); the Kaiser–Grieg anecdote, in which "the maestro instantly recognized his own touch" (ad041); and a photo of Hofmann at a recording piano (ad116).

### B. Time and memory

**B1 Immortality & posterity** (≈42). *Rule:* the art or playing is preserved for ever or for future generations; "immortal(s)", "Nachwelt", "verewigt". This includes the variants "dead artists still play" (ad004 "Reisenauer †", ad052 "wijlen Teresa Carreño", ad130, ad193) and "captured at the zenith of his career" (ad006, ad007, ad034, ad134).
- ad002 (en, 1922): "the Welte-Mignon caught the great masters in the act of playing, and fixed their style for ever"
- ad010 (de, 1907): "ist das Klavierspiel nun für die Nachwelt festgehalten" — *the playing is now captured for posterity.*
- ad193 (fr, 1927): "Certains de ces prodiges sont disparus; mais grâce au merveilleux "Piano des Artistes" … vous pouvez jouir de leur magistrale exécution" — *some of these prodigies have passed away, but thanks to … you can enjoy their masterly playing.*

**B2 The counterfactual past** (≈10). *Rule:* the ad regrets that the invention did not exist earlier, so that we could still hear Liszt, Chopin, Beethoven, Rubinstein and others. Nearly always voiced by a quoted musician.
- ad088 (da, 1919), Saint-Saëns: "Man maa kun beklage at denne Opfindelse ikke allerede blev gjort tidligere; thi da kunde vi endnu den Dag i Dag høre Beethoven, Mozart og Chopin selv spille" — *one can only regret it was not invented earlier; we could still hear Beethoven, Mozart and Chopin play.*
- ad130 (en, 1909): "The regret of Musicians must ever be that this great invention was not brought out in 1809 instead of 1909."
- ad009 (de, 1905): "Wenn das Reproduktionsklavier vor 50 Jahren existiert hätte, könnten wir auch heute noch dem Spiel der grossen Meister wie Liszt, Rubinstein, Bülow lauschen"

### C. Wonder and the uncanny

**C1 Wonder, miracle, magic, astonishment** (≈72; ≈40 if bare "wonderful/underbar/merveilleux" adjectives are excluded). *Rule:* the instrument is framed as a wonder, miracle, marvel, magic or sensation, or as causing astonishment or disbelief.
- ad005 (de, 1910), Carreño: "Das Welte Mignon ist das Wunder der Wunder." — *the wonder of wonders.*
- ad029 (en, 1927): "It is modern magic."
- ad148 (sv, 1907), Stenhammar: "Den som hört det, står stum inför detta under" — *whoever has heard it stands speechless before this wonder.*

**C2 Phantom hands & summoned spirits** (≈27; 15 of them visual). *Rule:* the absent performer is shown or described as a phantom or spirit. This covers ghost or semi-transparent hands and figures, keys moving with no one seated, the artist "summoned" ("zitieren", "summon", "beck and call"), and the uncanny.
- ad026 (en, 1924): "These are the Phantom Hands of a thousand immortal pianists"
- ad104 (en, 1924): "WATCH the keys of your piano moving, though no one sits before it!"
- ad100 (de, 1908), Zöllner's verse: "Denn du zitierst nicht bloss die Geister, In dir lebt fort des Künstlers Geist!" — *you do not merely summon spirits; the artist's spirit lives on in you.*
- ad139 (en, 1927), Leoncavallo: "Something like a sensation of fear comes over the listener …"
- Visual: a half-transparent Paderewski in front of newspaper headlines (ad011); "a grand piano … at which nobody sits" (ad080); a grand piano "that plays by itself" before guests (ad197); a rococo room where "no one is playing" (ad182); and the phantom-hands logo in the Auto Pneumatic series (ad015–ad040).

**C3 Hearing is believing** (≈18). *Rule:* the reader is challenged to verify the claim by listening, comparing or testing ("must be heard to be believed", "hear it in comparison", "does the experiment interest you?"). This is more than a bare invitation to a demonstration.
- ad005 (de, 1910), Pauer: "Man muss das Wunder gehört haben, um es zu glauben." — *one must have heard the wonder to believe it.*
- ad186 (de, 1928): "Sie werden das Spiel dieses Reproduktions-Klaviers wohl kaum von demjenigen eines Künstlers unterscheiden können. Interessiert Sie der Versuch?" — *you will hardly tell it from an artist's playing. Interested in the experiment?*
- ad202 (es, 1917): "vea todas las marcas buenas que se venden en la Habana, y luego vaya a OBISPO, 78, y examine y oiga el maravilloso WELTE MIGNON" — *look at all the good makes in Havana, then go to Obispo 78 and examine and hear the marvellous Welte-Mignon.*

### D. Home and social life

**D1 The great pianists in your home, at your command** (≈68). *Rule:* famous pianists can be heard in one's own home or on one's own piano, at any time, as often as wished, or at the user's command. This includes "concerts at home" and the slogan "The Master's Fingers on Your Piano".
- ad003 (de, 1909): "das Originalspiel der ersten Pianisten der Welt im eigenen Heim zu hören" — *to hear the original playing of the world's first pianists in one's own home.*
- ad011 (en, 1921): "He will play again, again and yet again for you tonight, tomorrow night and other nights in your own home."
- ad158 (sv, 1923), Backhaus: "samla alla världens pianistiska storheter i sin egen salong" — *to gather all the world's pianistic greats in one's own salon.*
- Variant "home concert": ad181 "Welte-Mignon Konzerte im eigenen Hause"; ad143 "A Concert By Living Pianists In Your Home"; ad183 "CONCERTS chez soi".

**D2 Effortless — no skill needed** (≈22). *Rule:* the instrument needs no skill, preparation or effort: a button, contact or key starts it, it plays "by itself", or it is for people who cannot play.
- ad097 (da, 1924): "Ingen kan spille Deres Piano staar ubenyttet hen. … paa hvilket De kan spille fuldstændig kunstnerisk uden nogensomhelst Forberedelse" — *Nobody can play — your piano stands unused … on this you can play fully artistically without any preparation.*
- ad107 (en, 1927): "a person with no musical skill can have the actual playing of Paderewski"
- ad019 (en, 1928): "At the touch of a button . . . without moving from your chair"

**D3 Domestic comfort & intimacy** (≈22, about half of them only in the illustrations). *Rule:* a cosy private scene: fireside, twilight, lamps, armchair, family gathered, privacy, a winter evening. Domestic interiors in the figures count.
- ad106 (en, 1926): "That delightful hour just after dinner—when the family is gathered around a cheery log fire"
- ad032 (en, 1924), Mary Roberts Rinehart: "having Grieg himself sit down at your piano, in the twilight with the lamps low and the fire burning"
- ad134 (en, 1923): "Spend a part of your Winter Evening with PADEREWSKI"

**D4 Entertaining guests** (≈12). *Rule:* the instrument serves sociability: the hostess, guests, dinner, dancing, social functions. Party scenes in the figures count.
- ad038 (en, 1923): "Entertaining at home in the summertime is a very easy and a very enjoyable matter for the hostess who has a Bush & Lane Welte-Mignon"
- ad145 (en, 1928): "the WELTE will interest your guests and relieve the strain of hospitality"
- ad197 (de, 1923): "Ihre Gäste sind ganz entzückt wenn das WELTE-MIGNON … das Meister-Spiel der ersten Klavierkünstler in Ihrem Heim erklingen läßt." — *your guests are delighted when …*

**D5 Status, refinement & culture** (≈13). *Rule:* ownership signals culture, refinement or distinction ("vornehmes Heim", "token of culture", "pardonable pride", "home of culture and refinement").
- ad145 (en, 1928): "A visible token of culture, its graceful lines and artistic appearance will add charm and dignity to the finest home."
- ad198 (de, 1924): "Ihre Kunst verewigt im vornehmen Heim" — *their art immortalised in the distinguished home.*
- ad205 (es, 1919): "Uno de estos instrumentos en su hogar, es una representación evidente de su cultura musical" — *proof of your musical culture.*

**D6 Furniture & ornament** (≈12). *Rule:* the case, design or period style; the instrument as an ornament of the salon.
- ad075 (no, 1907): "Elegant Ydre. En Pryd for enhver Salon." — *elegant exterior; an ornament for every salon.*
- ad067 (nl, 1926): "Indien gij Uw salon wilt versieren met een electrisch reproductie-instrument, neem dan een Welte-Mignon" — *if you want to decorate your salon …*
- ad018 (en, 1928): "period models FLORENTINE GRAND GEORGIAN … LOUIS XVI GRAND LOUIS XV … COLONIAL"

### E. Authority and proof

**E1 Quoted testimonials** (≈43). *Rule:* a named musician or other notable (novelist, court official) is quoted or paraphrased in praise.
- ad005 (de, 1910), Reger: "Welte Mignon ist für mich das unerreichte Ideal aller Musikinstrumente."
- ad014 (en, 1926), Pachmann: "Thru you I live forever"
- ad089 (da, 1919), Puccini: "Jeg var virkelig forbavset, da jeg hørte ›Welte Mignon‹." — *I was truly astonished when I heard the Welte-Mignon.*
- Oddity: ad205 (es, 1919) prints a testimonial attributed to **Liszt** ("Estoy admiradísimo"), who died in 1886. An anachronistic or misattributed endorsement, worth checking.

**E2 Collective acclaim & world fame** (≈38). *Rule:* the ad asserts endorsement by all, or by the greatest, artists, critics, authorities or the press, without (or beyond) individual quotes; or world fame or a triumph abroad.
- ad096 (da, 1923): "Anbefalet af de betydeligste Musikautoriteter Verden over." — *recommended by the most significant musical authorities world-wide.*
- ad069 (nl, 1927): "De loftuigingen der groote Meesters zijn onbegrensd" — *the praise of the great masters is unbounded.*
- ad058 (nl, 1924): "Van uit Amerika heeft de Estey-Welte reeds een triomftocht gemaakt door de geheele wereld." — *from America it has already made a triumphal tour of the whole world.*

**E3 Institutional recognition** (≈14). *Rule:* adoption or recognition by an institution (conservatory, ministry, opera, concert hall) or awards and medals at exhibitions, presented as proof.
- ad102 (de, 1909): "wurde soeben vom k. k. österreichischen Ministerium für Kultus und Unterricht zu pädagogischen Zwecken für das Wiener Konservatorium angekauft. Ein glänzender Beweis …" — *just bought by the Austrian Ministry of Culture for the Vienna Conservatory: brilliant proof …*
- ad117 (es, 1924): "ha sido premiada en todas las Exposiciones Internacionales con Medallas de Oro" (ad207 reproduces ten medals as images)
- ad022 (en, 1926): "the ballets of the Chicago Opera and the San Carlo Opera have both given public interpretations to its sole accompaniment"

**E4 Royal & aristocratic patronage** (≈11). *Rule:* royals, nobility or court are shown as users or patrons, including "Hoflieferant" and court-supplier titles and imperial emblems.
- ad041 (en, 1913): "How EDVARD GRIEG was Surprised by Kaiser Wilhelm II"
- ad165 (de, 1908): Grand Duke Friedrich I and Grand Duchess Luise "das … „Welte-Mignon"-Klavier sich täglich haben vorspielen lassen" — *had it play to them daily.*
- ad209 (es, 1926): "De cómo se reúnen en las mansiones aristocráticas de Europa, sólo para oír …" — *how people gather in Europe's aristocratic mansions just to hear …*

**E5 Satisfied owners / social proof** (≈10). *Rule:* ordinary owners (named or anonymous) or the number of owners vouch for the product.
- ad171 (de, 1910): "Das Welte-Mignon im Urteil seiner Besitzer" (incl. "W. Stünzi, Seidenfabriken, Horgen")
- ad029/030/040 (en, 1927): a fictive owner's voice, "… That's why I bought it."
- ad205 (es, 1919): "bajo el mismo juicio de más de DIEZ MIL familias, que en esta República poseen estos pianos" — *the same judgement as over ten thousand families in this republic who own them.*

### F. The invention and its rank

**F1 Sensational, epoch-making (new) invention** (≈50). *Rule:* the product is framed as an invention: epoch-making, pioneering, ingenious, a sensation or a novelty ("new", "first time here").
- ad037 (de, 1921), Nikisch: "eine epochemachende Erfindung"
- ad192 (fr, 1927), Gabrilowitsch: "incontestablement la plus grande invention du siècle"
- ad210 (pl, 1906): "Nowością sensacyjną jest fortepian reprodukcyjny „Mignon"" — *the Mignon is a sensational novelty.*
- Local-novelty variant: "only instrument of the kind in Canada" (ad187–189); "werd nog niet op Java geïmporteerd" (ad073).

**F2 Perfection & superlatives** (≈74). *Rule:* the instrument is called perfect, the best, finest, supreme, ultimate or unsurpassed, or the culmination or last word of a line of progress.
- ad000 / ad130 (en, 1913/1909): "After many inventions and many failures the perfect instrument"
- ad013 (en, 1909): "today the science has reached its apex, the goal has been attained and beyond the splendid achievement realized in the Welte-Mignon it is impossible to go"
- ad202 (es, 1917): "LA ULTIMA PALABRA … NO HAY NADA MEJOR, NI SE PUEDE PEDIR MAS" — *the last word … nothing better, one cannot ask for more.*
- ad088 (da, 1919): "Verdens fineste Kunstspilapparat" — *the world's finest player apparatus.*

**F3 Uniqueness & superiority over rivals** (≈38). *Rule:* the instrument is "the only one", sets the standard for all others, surpasses all others, or the reader is invited to compare it with rivals.
- ad016 (en, 1926): "only WELTE-MIGNON* possesses the secret of perfect reproduction"
- ad067 (nl, 1926): "als het eenige, dat inderdaad aanspraak kan maken op een natuurgetrouwe weergave van het handspel" — *the only one that can truly claim a natural rendering of the hand-playing.*
- ad106 (en, 1926): "Today the Welte-Mignon provides the standard for all other reproducing actions."

**F4 Originality & priority** (≈21). *Rule:* "the original", "the first", inventor or patent priority.
- ad017 (en, 1928): "The WELTE-MIGNON Is the Original REPRODUCING PIANO And Was the First Ever Sold in the World"
- ad061 (nl, 1924): "ORIGINEELE VINDING VAN DE FIRMA M. WELTE u. SöHNE FREIBURG" — *original invention of the firm …*
- ad117 (es, 1924): "fué la primera fábrica en el mundo que construyó y construye pianos REPRODUCTORES, por cuya razón conserva en su poder las patentes"
- In the US Licensee ads it is carried by the ever-present footnote "*Licensed under original Welte-Mignon patents".

**F5 Photography analogy** (≈9). *Rule:* recording or reproduction is likened to photography, or explicitly compared with the phonograph or gramophone.
- ad009 (de, 1905): "ein akustisches Seitenstück zur Platte des Photographen" — *an acoustic counterpart to the photographer's plate.*
- ad130 (en, 1909): "In the words of a well-known musician, "It is a photograph.""
- ad013 (en, 1909): "What the Victor is doing for the famous singers of the world the Welte-Mignon is accomplishing for the pianists."

**F6 Heritage & founder legend** (≈8). *Rule:* the maker's history, founding date or founder story as a guarantee. Dealers' own "established 1885" claims go in §4.
- ad033 (en, 1926): a full-page legend of "Michael Welte The Clockmaker of Freiburg" (orchestrion of 1849, "Dukes and statesmen … came from afar")
- ad004 (de, 1919): "Gegründet 1832."
- ad019 (en, 1928): "TURN BACK the calendar twenty-four years . . . From the House of Welte came the announcement in 1904"

**F7 Electricity & technical modernity** (≈36). *Rule:* electric drive or electro-pneumatic technology is foregrounded, or the mechanism is explained. *Caveat:* in most ads "electric" is a product descriptor ("electrische reproductie-piano"). Only about 10 ads make an argument of it.
- ad049 (nl, 1912): "aangesloten aan eene electrische lichtleiding of werkende op Accumulatoren is één druk op het contact voldoende" — *connected to the electric light circuit or to accumulators, one press on the contact suffices.*
- ad075 (no, 1907): "Drives ved Elektromotor; kan tilkobles hvilkensomhelst Lysledning." — *driven by an electric motor; can be connected to any light circuit.*
- ad201 (es, 1917): "Ya llegó el día de tener Música eléctrica perfecta" — *the day has come for perfect electric music.*

### G. Uses and versatility

**G1 Education & study** (≈18). *Rule:* value for learning, teaching, conservatories, students, or studying an interpretation by repetition.
- ad036 (en, 1919): "The Welte-Mignon Has a Faculty of One Hundred and Fifty-Six Instructors in Piano Playing"
- ad009 (de, 1905), Ansorge: "Es ist ein ausgezeichnetes Bildungsmittel für Konservatorien"
- ad116 (es, 1923): "para que discípulos y profesores se den cabal cuenta de la manera individual de interpretar de cada uno de los grandes "virtuosi""

**G2 Uses beyond the private home** (≈8). *Rule:* accompaniment of singers or instrumentalists, stage or ballet, hotels, cafés, restaurants, hospitals, sanatoria, clubs.
- ad150 (sv, 1908): "För hem, konsertsalonger, musikinstitut, sjukhus, sanatorier, klubblokaler, förstkl. restauranger m. m. blir "Mignon" en stor ackvisition." — *for homes, concert salons, music institutes, hospitals, sanatoria, club rooms, first-class restaurants …*
- ad067 (nl, 1926): "het ideale instrument voor fijne consumptiesalons en hôtels"
- ad009 (de, 1905): "wer singt oder geigt etc. wird sich sogar künstlerisch vollendet begleiten lassen können" — *singers and violinists can be accompanied to artistic perfection.*

**G3 Dual use & unobtrusive integration** (≈30). *Rule:* the instrument can also be played by hand, is invisible or unchanged in appearance, or can be attached or fitted to any piano (several playing modes).
- ad026 (en, 1924): "The Welte-Mignon* is invisible and does not interfere with manual playing."
- ad064 (nl, 1924): Quadrola "kan op vier verschillende manieren bespeeld worden" — *can be played in four different ways.*
- ad049 (nl, 1912): "hebben dezelfde uitmonstering en afmetingen als elke gewone Piano" — *same finish and dimensions as any ordinary piano.*

**G4 Breadth of repertoire & moods** (≈17). *Rule:* a range of genres or moods (classics and dance, jazz, opera; "every mood"; "the whole range of musical composition"). Bare catalogue sizes go in §4.
- ad019 (en, 1928): "classical music, modern music, orchestral music, ballets and dance ... a program to suit every mood and occasion" (with Gershwin's "Rhapsody in Blue")
- ad038 (en, 1923): "the newest and most popular dance hits, played by a hundred masters of jazz"
- ad092 (da, 1921): "saavel alle Klassikerne indspillet af Verdens betydeligste Virtuoser, som Øjeblikkets kendte og populære Danse" — *all the classics and the popular dances of the moment.*

**G5 The machine as concert performer** (≈28). *Rule:* a public concert, soirée or recital in which the reproducing piano performs and the programme credits each piece to an absent pianist ("Spillet af", "am Flügel", "played by"). This includes alternating with or assisting live performers, and composers playing their own works (ad077 Grieg, ad159 Leschetizky, ad167 Sapellnikoff, ad200 Granados "(Executat per son autor)", ad158).
- ad077 (no, 1907): "Brahms: Capriccio, Op. 76. Spillet af Ernst von Dohnanyi." — *played by …*
- ad120 (pt, 1913): "CONCERTO PELO GRANDE PIANISTA PADEREWSKI Todos os dias das 2 horas até ás 6 da tarde" — *a concert by the great pianist Paderewski every day from 2 to 6* (at the shop!)
- ad137 (en, 1927): "M. Lambert's feat of playing alternately with the great Master's own actual reproduced playing"

### H. Narrative imagery

**H1 Evocative scenes** (≈7). *Rule:* the copy describes the pictures, places or memories that the music conjures up (storm at sea, Valkyries, gaucho dance, a garden of long ago).
- ad026 (en, 1924): "Thunder of breaking waves; howl of the hurricane; crash of thunder; or, with your changing mood, mesmeric lure of the Lorelie's song"
- ad105 (en, 1924): "As the old strains come forth, time slips back to a garden of days gone by."
- ad191 (fr, 1926): "Le rythme précipité d'une mazurka, l'attrait d'un poème lyrique d'amour vénitien …" — *a French version of the English copy in ad108.*

### I. Value and occasion

**I1 Within everyone's reach** (≈9). *Rule:* the ad argues that the instrument or art music is accessible to all (democratisation, "not out of your reach", value above price). Actual prices and terms go in §4.
- ad012 (en, 1920): "We maintain that if music is to be enjoyed by everyone, it must be within everyone's reach."
- ad111 (en, 1928): "Marvellous—yes . . . out of your reach—emphatically, no!"
- ad100 (de, 1908), Grünfeld: "vollendet künstlerische Musik in den weitesten Kreisen populär zu machen" — *to make perfect art music popular in the widest circles.*

**I2 Quality & durability** (≈8). *Rule:* proven reliability, climate resistance, construction quality, or warnings against cheap or unknown makes.
- ad135 (en, 1926): "The Man who Buys a Jerry-Built House —— lives to regret it" (an analogy with cheap player pianos)
- ad205 (es, 1919): "construídos especialmente para el clima tropical, con caoba de Cuba"
- ad004 (de, 1919): "Erprobt in jedem Klima." — *tested in every climate.*

**I3 Gift & seasonal occasion** (≈7). *Rule:* tied to Christmas, New Year, holidays, summer or winter.
- ad028 (en, 1924): "What a Christmas gift!"
- ad170 (de, 1909): "das denkbar vornehmste Weihnachtsgeschenk!" — *the most distinguished Christmas present imaginable.*
- ad183 (fr, 1925): "Pendant les VACANCES pour avoir des CONCERTS chez soi"

### J. Paratextual motifs

**J1 The modest name** (≈9). *Rule:* the name "Mignon" ("little/darling") is said to be too modest for the instrument's significance. This is a recurring testimonial formula (Paderewski, Saint-Saëns, Leschetizky, Carreño).
- ad169 (de, 1909), Paderewski: "Das einzige, was ich „Mignon" vorzuwerfen habe, ist nur sein Name, weil er weder der gewaltigen Wirkung dieses Instrumentes, noch seiner kolossalen Bedeutung entspricht." — *my only reproach is its name, which matches neither its tremendous effect nor its colossal significance.*
- ad088 (da, 1919), Saint-Saëns: "et beskedent Navn for en beundringsværdig Ting" — *a modest name for an admirable thing.*
- ad208 (es, 1926), Paderewski: "debemos de encontrar un nombre que adecuadamente exprese su significado y alcance colosal"

**J2 National & local pride** (≈13). *Rule:* an appeal to national or local identity: domestic industry or inventive genius, national honour, local or national artists and composers, local customers.
- ad009 (de, 1905): "Deutschem Erfindungsgeist ist es geglückt" — *German inventive genius has succeeded.*
- ad192 (fr, 1927, Montréal): "ce piano qui fait honneur au nom canadien"
- ad158 (sv, 1923): "en komposition av Sjögren eller Stenhammar, inspelade av kompositörerna själva" — *recorded by the composers themselves.*

## 4. Recurring *functional* content (kept apart from the rhetorical topics)

These counts come from keywords with a quick manual check, so they are rougher than §2.

- **Dealer identity and contact**: name, address, telephone, branches. Nearly every ad.
- **Sole-agency and dealer self-claims** (≈55): "Alleinvertretung", "Eneforhandler", "único representante", "largest/oldest store", "Grundlagt 1885", "Ye Olde Firme", "Estd 65 years", "Hofleverancier" (dealer). This includes a legitimacy notice against false agents (ad204).
- **Invitations to demonstrations, auditions, recitals and showroom visits** (≈90–100): "Vorführung", "Auditions gratuites", "forespilles daglig", "free recitals daily", "no obligation". Concert *programmes* are counted rhetorically under G5 as well.
- **Artist rosters** (≈49 ads list four or more pianists by name) and **artist portraits** in the figures (≈18). These are informational, but they plainly also carry celebrity authority; see the note under E1/E2.
- **Prices** (≈25 ads with a price or price claim; concrete figures in about 15). Examples: ad006 "$450"; ad032 "$2,575" and "$1,695 Up"; ad038 "$1075 to $4100"; ad054 "f 2000"; ad072 "19.000 … 13.000"; ad107 "$1175 up"; ad142 "£575 (not £1150)"; ad152 "KR. 3,800"; ad154 "Kr. 1,750"; ad202/203 "$900" / "900 PESOS". Ticket prices for demonstration concerts: ad005, ad008, ad159.
- **Payment terms, trade-ins, guarantees** (≈20): "Convenient Terms", "Lempelige Betalingsvilkaar", "Ventas en condiciones Fáciles", "GRANDES FACILITÉS DE PAIEMENT", "Your Silent Piano taken as Deposit", "Brugte Flygler … tages i Bytte", "Fineste Garanti".
- **Second-hand and discount sales** (≈12): ad044, 050, 054, 070, 085, 090, 092, 099, 107, 152, 156, 158.
- **Model names and variants**: Vorsetzer / Cabinet Player / Forsats; Welte-Mignon piano with or without keyboard; Steinway-, Feurich-, Bechstein-, Mason & Hamlin-, Estey-, Baldwin-, Behning-, Laffargue-, Heintzman-, Linconola-, Duo-Pratte-Welte; Quadrola; Musicalle; Licensee action "in 112/115 makes of pianos"; period models.
- **Repertoire and library size**: "over 5,000 record-rolls", "156 masters", "several thousand recordings", "cirka 400 kompositioner", roll lists (ad112, ad208).
- **Catalogues, brochures, coupons** (≈40): "Send for the beautiful art brochure", "Kataloge mit Künstlerurteilen", "Forlang Prospekt", the coupon in ad006.
- **Fairs and exhibitions** (≈15): Leipzig Messe (ad004), National Music Show (ad007), Groninger Reclame-Tentoonstelling (ad053), Jaarbeurs Utrecht (ad057), Norsk-Amerikansk Utstilling (ad084), Geneva exhibition (ad184).
- **Licensing and legal notices** (≈25): "*Licensed under original Welte-Mignon patents"; "patented and controlled exclusively by …" (ad019).
- **Trade-directed copy**: ad017 ("An Important Message For Dealers … The WELTE-MIGNON franchise is a valuable one for the dealer"); ad150 ("Respektabla och driftiga ombud önskas" — *agents wanted*).
- **Co-advertised goods**: Victrolas, phonographs, other piano makes (ad006, ad032, ad072, ad153). These were mostly cut by the editor, but traces remain.

## 5. Candidates dropped or kept as residue (fewer than ~3 ads, or not an appeal)

- *Allegorical/classical ornament* in the figures: a Steinway lyre (ad000), fauns with pan-pipes (ad104, ad105), lyre and laurel (ad148), a winged putto seal (ad151, ad160), three muses (ad190), organ pipes as a frame (ad007, ad034). This is decorative rather than argumentative, so it is listed here, not as a topic.
- *Women as listeners, players and hostesses in the figures* (about 25 ads with women depicted). This is a visual pattern rather than an appeal. It feeds D3/D4/D5, and ad118 makes it verbal: "Una mujer y un piano no deben faltar en ninguna casa" (*a woman and a piano should be in every home*).
- *Gift to humanity* (ad170 Essipova: "… die der Menschheit diese schöne Erfindung geschenkt").
- *The artists are always in good form* (ad158 Backhaus: "de städse förträffligt disponerade konstnärerna" — *the artists, always in excellent form*).
- *Conquering space and time* (ad100 Zöllner: "Dem Raum, der Zeit die Macht zu rauben!").
- *Normalisation of the marvel* (ad032 Rinehart: "The marvel of yesterday is the commonplace of today.").
- *Rejuvenation* (ad014, Pachmann "rejuvenated at 75").
- *Better / edifying entertainment* (ad186: "Musikalische Unterhaltung edelster Art"; compare "Kunstmusik" in ad091, ad093).
- *Full keyboard compass* (ad122: "Единственный инструментъ, играющій полнымъ объемомъ клавіатуры" — *the only instrument playing the full keyboard*).
- *Industry adoption as testimony* (ad033: 112 makers "selected Welte-Mignon* as the only reproducing action … ample testimony"). This is folded into E2 and §4.
- *Celebrity news hook* (ad011, Paderewski retiring into politics; ad015, Gieseking's New York début; ad082, Lhévinne recording in Kristiania). Only 3 ads, so kept as a note; candidate for "topicality".

## 6. Limits of this Stage 1 (candid)

- **One annotator, one pass.** Labels, merges and the cut at 40 are my judgement. A second run, even by the same model with a different reading order, would produce different labels and boundaries. The core topics (A1, B1, C1, D1, E1, F2, G5) are very likely to recur; the small ones (H1, I3, J1) less so.
- **Order effects.** The file begins with English and German ads (Steinway London, the Auto Pneumatic series), and that shaped the early labels ("Master's fingers", "phantom"). Later ads were partly fitted into these existing slots.
- **Counts are approximate.** I coded while reading and checked recall with keywords, adjudicating the hits by hand. A real TopicGPT assignment step would ask the LLM about each ad separately. The thresholds for vague topics (C1 "wonderful"; F7 "electric" as descriptor) change the counts a lot.
- **Visual topics rest on the editor's prose descriptions** of the figures, not on the images. Wherever the description is thin, a visual motif may be missed.
- **Some topics are close to the product category** (A1 fidelity, F7 electricity, D1 home). They are real appeals, but they appear in so many ads that they say little on their own.

---

## Appendix A. Ad IDs per induced topic (my coding)

Ad numbers without the `ad` prefix. Counts are numbers of ads (an ad counts once per topic).

- **A1 Faithful reproduction** (93): 000 002 004 006 007 009 010 013 014 015 016 017 019 020 021 022 023 024 025 026 027 029 030 033 034 035 037 040 041 042 043 045 049 052 053 060 067 069 072 075 076 079 082 083 089 091 094 099 100 104 107 108 110 113 114 116 117 122 126 130 131 132 133 134 136 137 143 144 145 147 148 151 157 172 176 177 180 183 186 187 190 191 192 197 199 201 202 205 207 209 210 211 212
- **A2 Individual nuance & personality** (52): 000 004 005 006 008 009 010 013 016 017 020 022 023 030 033 035 037 040 041 052 069 075 076 079 082 083 089 094 100 108 113 116 122 130 131 143 144 145 148 151 159 160 176 177 179 180 187 191 199 209 210 212
- **A3 The artist's soul / living art** (17): 006 009 012 013 033 035 041 100 110 111 122 139 170 175 180 181 201
- **A4 Not mechanical** (25): 002 005 006 008 009 010 020 033 035 100 122 130 131 134 143 148 149 151 159 160 169 171 172 175 180
- **A5 Presence illusion** (31): 005 006 009 011 016 023 029 032 033 035 037 049 075 099 104 107 110 117 122 126 143 144 145 151 172 176 179 180 181 186 190
- **A6 Artist verification: self-recognition & autograph** (22): 009 010 033 037 039 041 082 100 116 117 143 144 151 159 170 177 186 202 203 205 208 212
- **B1 Immortality & posterity** (42): 001 002 004 005 006 007 008 009 010 011 012 013 014 017 019 024 026 027 028 030 033 034 037 041 052 075 100 101 104 105 130 131 134 143 169 177 182 192 193 198 208 212
- **B2 The counterfactual past** (10): 009 010 088 100 101 130 131 151 175 211
- **C1 Wonder, miracle, magic** (72): 005 009 010 011 019 024 025 026 027 028 029 030 032 033 035 037 039 040 041 075 076 088 089 100 101 104 105 107 108 111 112 116 118 119 126 130 131 132 136 137 138 139 140 141 142 145 147 148 149 151 154 155 156 158 165 172 175 177 178 179 183 190 191 192 193 200 202 203 209 210 211 212
- **C2 Phantom hands & summoned spirits** (27): 003 011 014 015 016 020 021 026 027 028 029 030 033 037 040 080 100 103 104 105 110 139 143 144 182 185 197
- **C3 Hearing is believing** (18): 005 017 026 027 028 030 033 035 040 117 130 131 143 148 151 175 186 202
- **D1 Great pianists in your home, at your command** (68): 003 005 006 007 008 009 011 012 013 014 015 016 019 020 021 022 023 024 025 026 028 029 030 031 032 033 037 038 040 049 052 055 067 086 093 100 103 104 105 106 107 108 109 110 111 112 113 117 118 143 144 145 148 158 169 170 179 181 182 183 185 190 191 192 193 197 198 205
- **D2 Effortless, no skill needed** (22): 003 009 010 018 019 049 086 097 100 103 106 107 108 109 130 131 143 148 151 179 191 200
- **D3 Domestic comfort & intimacy** (22): 006 012 019 032 039 080 099 106 107 109 110 111 112 113 121 134 143 144 171 181 193 198
- **D4 Entertaining guests** (12): 029 030 038 040 097 106 109 143 145 156 158 197
- **D5 Status, refinement & culture** (13): 030 031 037 040 145 170 182 185 186 195 198 205 209
- **D6 Furniture & ornament** (12): 006 013 017 018 031 067 075 076 135 145 172 208
- **E1 Quoted testimonials** (43): 005 008 009 010 014 015 032 035 037 041 049 065 075 082 088 089 100 101 116 117 130 131 139 140 143 148 151 158 165 169 170 171 172 175 177 178 179 185 192 205 208 211 212
- **E2 Collective acclaim & world fame** (38): 005 008 009 012 033 034 035 058 067 069 076 091 092 093 096 097 099 100 101 105 106 109 112 117 147 148 151 170 172 176 178 185 201 204 205 210 211 212
- **E3 Institutional recognition** (14): 004 005 008 022 025 045 046 067 102 116 117 169 184 207
- **E4 Royal & aristocratic patronage** (11): 003 010 033 041 070 071 103 165 195 196 209
- **E5 Satisfied owners / social proof** (10): 029 030 040 073 117 170 171 172 176 205
- **F1 Sensational, epoch-making invention** (50): 005 007 008 009 010 018 019 033 034 035 037 041 049 064 065 073 088 091 100 101 121 122 126 130 131 139 140 142 147 148 149 151 159 160 169 170 171 172 175 179 180 185 187 188 189 192 195 210 211 212
- **F2 Perfection & superlatives** (74): 000 001 002 005 007 008 013 014 016 017 019 020 021 024 026 028 033 034 037 040 058 059 065 070 072 073 088 089 090 091 092 094 096 098 099 100 101 102 104 105 106 109 110 112 113 116 118 130 131 132 145 150 151 153 155 156 169 174 175 177 178 182 185 194 195 196 199 200 201 202 203 205 209 213
- **F3 Uniqueness & superiority** (38): 001 005 008 016 017 020 021 023 024 026 027 028 033 035 046 067 069 106 109 122 143 148 149 151 159 160 169 170 171 172 175 178 183 190 193 199 200 205
- **F4 Originality & priority** (21): 001 014 016 017 018 019 020 026 027 028 032 033 061 066 068 105 106 109 112 117 169
- **F5 Photography analogy** (9): 009 013 017 023 033 100 130 131 143
- **F6 Heritage & founder legend** (8): 004 011 019 033 034 037 100 101
- **F7 Electricity & technical modernity** (36): 018 049 060 064 065 066 067 069 070 075 076 080 082 083 085 099 100 101 107 115 119 121 122 130 131 136 137 138 142 149 152 157 159 160 199 201
- **G1 Education & study** (18): 005 008 009 010 022 025 036 037 067 100 102 116 139 140 169 175 185 212
- **G2 Uses beyond the private home** (8): 009 022 025 067 090 148 150 151
- **G3 Dual use & unobtrusive integration** (30): 002 013 014 016 018 019 020 021 022 023 024 026 027 028 033 049 064 065 082 083 097 099 130 131 145 153 154 157 190 213
- **G4 Breadth of repertoire & moods** (17): 006 019 026 027 028 036 038 092 104 105 106 108 109 112 190 191 201
- **G5 The machine as concert performer** (28): 005 008 045 046 047 048 077 079 084 120 127 132 133 136 137 139 140 142 158 159 160 167 168 175 187 188 189 200
- **H1 Evocative scenes** (7): 026 027 028 104 105 108 191
- **I1 Within everyone's reach** (9): 006 012 100 108 111 134 142 190 191
- **I2 Quality & durability** (8): 004 006 135 165 169 171 172 205
- **I3 Gift & seasonal occasion** (7): 026 028 038 052 134 170 183
- **J1 The modest name** (9): 005 088 100 169 175 205 208 211 212
- **J2 National & local pride** (13): 007 009 034 077 082 112 119 158 165 176 192 200 210
