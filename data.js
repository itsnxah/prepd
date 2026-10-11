/* ==========================================================================
   PREPD – Datendatei
   Wird von Claude gepflegt. Rezepte und Lebensmittel stehen nur hier,
   nicht in der Datenbank. Änderung eintragen → git push → fertig.

   LEBENSMITTEL
     id         eindeutiger Kurzname (wird in Rezepten verwendet)
     name       Anzeigename
     gang       Supermarkt-Bereich (siehe GAENGE unten, sortiert die Einkaufsliste)
     einheit    'g' | 'ml' | 'Stk' | 'Dose' | 'TL' | 'EL' | 'Zehe'
     g          Gramm pro Einheit (bei g/ml = 1)
     n          Nährwerte pro 100 g: kcal, e (Eiweiß), kh (Kohlenhydrate), f (Fett)
     kw         Kurzform, an der der Kochmodus das Lebensmittel im Schritt-Text erkennt
     basic      true = hast du wahrscheinlich schon zuhause (Öl, Salz, Gewürze …)

   REZEPTE
     portionen  Grundmenge (Standard: 2 – wir kochen für zwei)
     zeit       Minuten
     bild       optionaler Pfad zu einem Foto, z. B. 'bilder/hackfleisch-bowl.jpg'
                (fehlt es, zeichnet die App einen passenden Platzhalter)
     mealPrep   true = gut zum Vorkochen und Mitnehmen
     haltbar    Tage im Kühlschrank
     zutaten    [lebensmittel-id, menge in dessen Einheit]
     schritte   { t: Kurztitel, timer: Sekunden (optional), text: Anweisung }
                Der Timer läuft im Kochmodus mit.
   ========================================================================== */

window.PREPD = {
  GAENGE: [
    'Obst & Gemüse',
    'Fleisch & Fisch',
    'Kühlregal',
    'Konserven & Vorrat',
    'Gewürze & Öl',
    'Sonstiges',
  ],

  lebensmittel: [
    // Fleisch & Fisch
    { id: 'haehnchen',  name: 'Hähnchenbrust',        gang: 'Fleisch & Fisch', einheit: 'g', g: 1, n: { kcal: 110, e: 23.5, kh: 0,   f: 1.5 }, kw: 'Hähnchen' },
    { id: 'pute',       name: 'Putenbrust',           gang: 'Fleisch & Fisch', einheit: 'g', g: 1, n: { kcal: 105, e: 24,   kh: 0,   f: 1 }, kw: 'Pute' },
    { id: 'rinderhack', name: 'Rinderhack (5 % Fett)', gang: 'Fleisch & Fisch', einheit: 'g', g: 1, n: { kcal: 121, e: 21,   kh: 0,   f: 4.5 }, kw: 'Hack' },
    { id: 'lachs',      name: 'Lachsfilet',           gang: 'Fleisch & Fisch', einheit: 'g', g: 1, n: { kcal: 200, e: 20,   kh: 0,   f: 13 }, kw: 'Lachs' },

    // Kühlregal
    { id: 'eier',       name: 'Eier (M)',             gang: 'Kühlregal', einheit: 'Stk', g: 60, n: { kcal: 137, e: 12.5, kh: 0.7, f: 9.3 }, kw: 'Eier' },
    { id: 'magerquark', name: 'Magerquark',           gang: 'Kühlregal', einheit: 'g',   g: 1,  n: { kcal: 67,  e: 12,   kh: 4,   f: 0.3 }, kw: 'Quark' },
    { id: 'huettenkaese', name: 'Hüttenkäse',         gang: 'Kühlregal', einheit: 'g',   g: 1,  n: { kcal: 98,  e: 12.3, kh: 2.6, f: 4.3 }, kw: 'Hüttenkäse' },
    { id: 'frischkaese', name: 'Frischkäse light',    gang: 'Kühlregal', einheit: 'g',   g: 1,  n: { kcal: 115, e: 8.5,  kh: 5,   f: 6.5 }, kw: 'Frischkäse' },
    { id: 'cheddar-light', name: 'Cheddar-Scheiben light', gang: 'Kühlregal', einheit: 'Scheibe', g: 20, n: { kcal: 280, e: 29, kh: 0.5, f: 18 }, kw: 'Cheddar' },
    { id: 'skyr',       name: 'Skyr natur',           gang: 'Kühlregal', einheit: 'g',   g: 1,  n: { kcal: 63,  e: 11,   kh: 4,   f: 0.2 }, kw: 'Skyr' },

    // Obst & Gemüse
    { id: 'paprika',    name: 'Paprika',              gang: 'Obst & Gemüse', einheit: 'Stk', g: 160, n: { kcal: 31, e: 1,   kh: 6,   f: 0.3 }, kw: 'Paprika' },
    { id: 'zwiebel',    name: 'Zwiebel',              gang: 'Obst & Gemüse', einheit: 'Stk', g: 80,  n: { kcal: 40, e: 1.1, kh: 9,   f: 0.1 }, kw: 'Zwiebel' },
    { id: 'knoblauch',  name: 'Knoblauch',            gang: 'Obst & Gemüse', einheit: 'Zehe', g: 4,  n: { kcal: 140, e: 6,  kh: 28,  f: 0.5 }, kw: 'Knoblauch' },
    { id: 'kartoffeln', name: 'Kartoffeln',           gang: 'Obst & Gemüse', einheit: 'g',   g: 1,   n: { kcal: 72, e: 2,   kh: 15,  f: 0.1 }, kw: 'Kartoffeln' },
    { id: 'champignons', name: 'Champignons',         gang: 'Obst & Gemüse', einheit: 'g',   g: 1,   n: { kcal: 22, e: 3.1, kh: 0.6, f: 0.3 }, kw: 'Champignons' },
    { id: 'spinat',     name: 'Babyspinat',           gang: 'Obst & Gemüse', einheit: 'g',   g: 1,   n: { kcal: 23, e: 2.9, kh: 0.6, f: 0.4 }, kw: 'Spinat' },
    { id: 'gurke',      name: 'Salatgurke',           gang: 'Obst & Gemüse', einheit: 'Stk', g: 400, n: { kcal: 12, e: 0.6, kh: 1.8, f: 0.2 }, kw: 'Gurke' },
    { id: 'eisberg',    name: 'Eisbergsalat',         gang: 'Obst & Gemüse', einheit: 'g',   g: 1,   n: { kcal: 14, e: 1,   kh: 2,   f: 0.2 }, kw: 'Eisbergsalat' },
    { id: 'tomate',     name: 'Tomaten',              gang: 'Obst & Gemüse', einheit: 'Stk', g: 100, n: { kcal: 18, e: 0.9, kh: 2.6, f: 0.2 }, kw: 'Tomaten' },
    { id: 'tomaten',    name: 'Cherrytomaten',        gang: 'Obst & Gemüse', einheit: 'g',   g: 1,   n: { kcal: 20, e: 0.9, kh: 3,   f: 0.2 }, kw: 'Tomaten' },

    // Konserven & Vorrat
    { id: 'reis',       name: 'Basmatireis',          gang: 'Konserven & Vorrat', einheit: 'g',    g: 1,   n: { kcal: 350, e: 8,  kh: 77, f: 0.6 }, kw: 'Reis' },
    { id: 'linsen',     name: 'Rote Linsen',          gang: 'Konserven & Vorrat', einheit: 'g',    g: 1,   n: { kcal: 340, e: 24, kh: 49, f: 1.5 }, kw: 'Linsen' },
    { id: 'kidney',     name: 'Kidneybohnen',         gang: 'Konserven & Vorrat', einheit: 'Dose', g: 250, n: { kcal: 100, e: 7,  kh: 13, f: 0.5 }, kw: 'Bohnen' },
    { id: 'mais',       name: 'Mais',                 gang: 'Konserven & Vorrat', einheit: 'Dose', g: 140, n: { kcal: 80,  e: 3,  kh: 14, f: 1.2 }, kw: 'Mais' },
    { id: 'tomaten-mediterran', name: 'Gehackte Tomaten mediterran', gang: 'Konserven & Vorrat', einheit: 'Dose', g: 400, n: { kcal: 28, e: 1.2, kh: 4.2, f: 0.4 }, kw: 'Gehackte Tomaten' },
    { id: 'tomatenmark', name: 'Tomatenmark',          gang: 'Konserven & Vorrat', einheit: 'EL',   g: 15,  n: { kcal: 82,  e: 4.3, kh: 13, f: 0.5 }, kw: 'Tomatenmark' },
    { id: 'gewuerzgurken', name: 'Gewürzgurken (Glas)', gang: 'Konserven & Vorrat', einheit: 'Stk', g: 30, n: { kcal: 20, e: 0.5, kh: 3, f: 0.1 }, kw: 'Gewürzgurken' },
    { id: 'sesam',      name: 'Sesam',                gang: 'Konserven & Vorrat', einheit: 'EL',   g: 8,   n: { kcal: 580, e: 18, kh: 10, f: 50 }, kw: 'Sesam' },
    { id: 'salatcreme', name: 'Salatcreme oder Mayo light', gang: 'Kühlregal',   einheit: 'EL',   g: 15,  n: { kcal: 300, e: 1,  kh: 10, f: 28 }, kw: 'Salatcreme' },
    { id: 'passata',    name: 'Passierte Tomaten',    gang: 'Konserven & Vorrat', einheit: 'g',    g: 1,   n: { kcal: 25,  e: 1.4, kh: 3.8, f: 0.2 }, kw: 'passierte Tomaten' },
    { id: 'kokosmilch', name: 'Kokosmilch light',     gang: 'Konserven & Vorrat', einheit: 'ml',   g: 1,   n: { kcal: 70,  e: 0.6, kh: 2,  f: 7 }, kw: 'Kokosmilch' },
    { id: 'thunfisch',  name: 'Thunfisch im eigenen Saft', gang: 'Konserven & Vorrat', einheit: 'Dose', g: 120, n: { kcal: 110, e: 25, kh: 0, f: 1 }, kw: 'Thunfisch' },

    // Gewürze & Öl – wahrscheinlich schon zuhause
    { id: 'olivenoel',  name: 'Olivenöl',             gang: 'Gewürze & Öl', einheit: 'EL', g: 10,  n: { kcal: 884, e: 0,  kh: 0,  f: 100 }, kw: 'Öl', basic: true },
    { id: 'rapsoel',    name: 'Rapsöl',               gang: 'Gewürze & Öl', einheit: 'TL', g: 4.5, n: { kcal: 884, e: 0,  kh: 0,  f: 100 }, kw: 'Rapsöl', basic: true },
    { id: 'senf',       name: 'Senf',                 gang: 'Gewürze & Öl', einheit: 'TL', g: 5,   n: { kcal: 90,  e: 6,  kh: 5,  f: 4 }, kw: 'Senf',   basic: true },
    { id: 'zwiebelpulver', name: 'Zwiebelpulver',     gang: 'Gewürze & Öl', einheit: 'TL', g: 2.5, n: { kcal: 340, e: 10, kh: 70, f: 1 },   basic: true },
    { id: 'knoblauchpulver', name: 'Knoblauchpulver', gang: 'Gewürze & Öl', einheit: 'TL', g: 3,   n: { kcal: 330, e: 17, kh: 63, f: 1 },   basic: true },
    { id: 'honig',      name: 'Honig oder Süßstoff',  gang: 'Gewürze & Öl', einheit: 'TL', g: 7,   n: { kcal: 305, e: 0.4, kh: 76, f: 0 }, kw: 'Honig',  basic: true },
    { id: 'salz',       name: 'Salz',                 gang: 'Gewürze & Öl', einheit: 'TL', g: 5,   n: { kcal: 0,   e: 0,  kh: 0,  f: 0 },   basic: true },
    { id: 'pfeffer',    name: 'Pfeffer',              gang: 'Gewürze & Öl', einheit: 'TL', g: 2,   n: { kcal: 255, e: 10, kh: 39, f: 3 },   basic: true },
    { id: 'paprikapulver', name: 'Paprikapulver',     gang: 'Gewürze & Öl', einheit: 'TL', g: 2.5, n: { kcal: 290, e: 14, kh: 19, f: 13 },  basic: true },
    { id: 'curry',      name: 'Currypulver',          gang: 'Gewürze & Öl', einheit: 'TL', g: 2.5, n: { kcal: 325, e: 14, kh: 25, f: 14 },  basic: true },
    { id: 'kreuzkuemmel', name: 'Kreuzkümmel',        gang: 'Gewürze & Öl', einheit: 'TL', g: 2,   n: { kcal: 375, e: 18, kh: 34, f: 22 },  basic: true },
    { id: 'hackgewuerz', name: 'Hackfleischgewürz',    gang: 'Gewürze & Öl', einheit: 'TL', g: 3,   n: { kcal: 230, e: 8,  kh: 35, f: 5 },   basic: true },
    { id: 'kraeuter',   name: 'TK-Kräuter',           gang: 'Gewürze & Öl', einheit: 'EL', g: 5,   n: { kcal: 40,  e: 3,  kh: 4,  f: 1 },   basic: true },
  ],

  rezepte: [
    {
      id: 'big-mac-bowl',
      name: 'Big-Mac-Bowl mit Tomaten und Mais',
      portionen: 2, zeit: 25, mealPrep: true, haltbar: 2,
      zutaten: [
        ['rinderhack', 500], ['rapsoel', 1], ['salz', 1], ['pfeffer', 0.5],
        ['cheddar-light', 2], ['sesam', 1], ['eisberg', 400], ['tomate', 2],
        ['mais', 1], ['zwiebel', 1], ['gewuerzgurken', 5], ['skyr', 150],
        ['salatcreme', 1], ['senf', 1], ['paprikapulver', 0.5], ['zwiebelpulver', 0.5],
        ['knoblauchpulver', 0.3], ['honig', 1],
      ],
      schritte: [
        { t: 'Sauce rühren', text: 'Big-Mac-Sauce: 2 der 5 Gewürzgurken sehr fein hacken. Mit Skyr, Salatcreme oder Mayo, Senf, 1 EL Gurkenwasser aus dem Glas, Paprika-, Zwiebel- und Knoblauchpulver und Honig glatt rühren, mit einer Prise Salz abschmecken und kaltstellen.' },
        { t: 'Sesam rösten', timer: 180, text: 'Sesam in einer trockenen Pfanne goldbraun rösten und beiseitestellen.' },
        { t: 'Toppings schneiden', text: 'Eisbergsalat in feine Streifen schneiden, Tomaten stückeln, Mais abtropfen lassen, die (kleine, weiße) Zwiebel ganz fein würfeln, restliche Gewürzgurken in Scheiben schneiden.' },
        { t: 'Hack braten', timer: 480, text: 'Rapsöl stark erhitzen, Hack hineingeben und erst ohne Rühren scharf anbraten, dann krümelig zerteilen. Nur mit Salz und Pfeffer würzen.' },
        { t: 'Käse schmelzen', timer: 120, text: 'Cheddar in Stücke zupfen, auf das Hack legen, Deckel drauf und schmelzen lassen.' },
        { t: 'Anrichten', text: 'Salat in zwei Schüsseln geben, Käse-Hack darauf, dann Tomaten, Mais, Zwiebel und Gurkenscheiben verteilen. Mit reichlich Sauce toppen und mit Sesam bestreuen.' },
      ],
      notiz: 'Kosten für beide etwa 11 €. Zum Mitnehmen Salat, Hack und Sauce getrennt abfüllen und erst am Platz mischen.',
    },
    {
      id: 'hackfleisch-bowl',
      name: 'Klassische Hackfleisch-Bowl',
      portionen: 2, zeit: 15, mealPrep: true, haltbar: 3,
      zutaten: [
        ['rinderhack', 500], ['tomaten-mediterran', 1], ['tomatenmark', 1], ['hackgewuerz', 2],
        ['paprikapulver', 1], ['salz', 0.5], ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Hack anbraten', timer: 480, text: 'Hackfleisch ohne Öl in der Pfanne krümelig und kräftig anbraten.' },
        { t: 'Tomatenmark anrösten', timer: 60, text: 'Tomatenmark dazu und kurz mitrösten.' },
        { t: 'Würzen', text: 'Mit Hackfleischgewürz, Paprikapulver, Salz und Pfeffer würzen.' },
        { t: 'Einköcheln lassen', timer: 300, text: 'Gehackte Tomaten dazu und 5 Minuten einköcheln lassen, bis es sämig ist. Bolognese ohne Nudeln, fertig.' },
      ],
    },
    {
      id: 'haehnchen-paprika-reis',
      name: 'Hähnchen-Paprika-Pfanne mit Reis',
      portionen: 2, zeit: 25, mealPrep: true, haltbar: 3,
      zutaten: [
        ['haehnchen', 400], ['paprika', 2], ['zwiebel', 1], ['knoblauch', 2],
        ['reis', 120], ['olivenoel', 1], ['paprikapulver', 2], ['salz', 1],
        ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Reis kochen', timer: 720, text: 'Reis nach Packung kochen.' },
        { t: 'Hähnchen anbraten', timer: 480, text: 'Hähnchen in Würfel schneiden, in Öl scharf anbraten, mit Paprikapulver, Salz und Pfeffer würzen.' },
        { t: 'Gemüse mitbraten', timer: 420, text: 'Zwiebel, Knoblauch und Paprika dazu, 5–7 Minuten mitbraten.' },
        { t: 'Anrichten', text: 'Mit dem Reis anrichten oder direkt in Dosen aufteilen.' },
      ],
    },
    {
      id: 'chili-con-carne',
      name: 'Chili con Carne',
      portionen: 2, zeit: 35, mealPrep: true, haltbar: 4,
      zutaten: [
        ['rinderhack', 400], ['kidney', 1], ['mais', 1], ['passata', 500],
        ['paprika', 1], ['zwiebel', 1], ['knoblauch', 2], ['kreuzkuemmel', 1],
        ['paprikapulver', 2], ['salz', 1], ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Hack anbraten', timer: 480, text: 'Zwiebel und Knoblauch würfeln, Hack ohne Öl krümelig anbraten.' },
        { t: 'Gemüse anrösten', timer: 180, text: 'Paprika würfeln und mit Zwiebel, Knoblauch und Gewürzen kurz mitrösten.' },
        { t: 'Köcheln lassen', timer: 1200, text: 'Passierte Tomaten, abgetropfte Bohnen und Mais dazu, 20 Minuten köcheln lassen.' },
        { t: 'Abschmecken', text: 'Abschmecken. Schmeckt am zweiten Tag noch besser.' },
      ],
    },
    {
      id: 'linsen-haehnchen-curry',
      name: 'Rotes Linsen-Hähnchen-Curry',
      portionen: 2, zeit: 30, mealPrep: true, haltbar: 3,
      zutaten: [
        ['haehnchen', 300], ['linsen', 100], ['kokosmilch', 200], ['passata', 250],
        ['zwiebel', 1], ['knoblauch', 2], ['spinat', 100], ['curry', 2],
        ['salz', 1],
      ],
      schritte: [
        { t: 'Zwiebel anschwitzen', timer: 180, text: 'Zwiebel und Knoblauch anschwitzen, Currypulver kurz mitrösten.' },
        { t: 'Hähnchen anbraten', timer: 300, text: 'Hähnchenwürfel dazu und rundum anbraten.' },
        { t: 'Köcheln lassen', timer: 900, text: 'Linsen, Kokosmilch, passierte Tomaten und 200 ml Wasser dazu, 15 Minuten köcheln.' },
        { t: 'Spinat unterheben', timer: 120, text: 'Spinat unterheben, bis er zusammenfällt. Salzen, fertig.' },
      ],
    },
    {
      id: 'putengeschnetzeltes',
      name: 'Puten­geschnetzeltes mit Champignons und Kartoffeln',
      portionen: 2, zeit: 30, mealPrep: true, haltbar: 3,
      zutaten: [
        ['pute', 400], ['champignons', 250], ['zwiebel', 1], ['frischkaese', 100],
        ['kartoffeln', 400], ['olivenoel', 1], ['salz', 1], ['pfeffer', 0.5],
        ['kraeuter', 1],
      ],
      schritte: [
        { t: 'Kartoffeln kochen', timer: 1200, text: 'Kartoffeln schälen und in Salzwasser 20 Minuten kochen.' },
        { t: 'Pute anbraten', timer: 360, text: 'Pute in Streifen schneiden, in Öl anbraten, herausnehmen.' },
        { t: 'Champignons braten', timer: 300, text: 'Zwiebel und Champignons in der gleichen Pfanne braten.' },
        { t: 'Sauce binden', timer: 180, text: 'Frischkäse mit 100 ml Wasser einrühren, Pute zurück in die Pfanne, mit Kräutern abschmecken.' },
      ],
    },
    {
      id: 'hack-kartoffel-pfanne',
      name: 'Hack-Kartoffel-Pfanne mit Quark-Dip',
      portionen: 2, zeit: 30, mealPrep: true, haltbar: 3,
      zutaten: [
        ['rinderhack', 300], ['kartoffeln', 500], ['paprika', 1], ['zwiebel', 1],
        ['magerquark', 250], ['kraeuter', 2], ['olivenoel', 1], ['paprikapulver', 1],
        ['salz', 1],
      ],
      schritte: [
        { t: 'Kartoffeln braten', timer: 900, text: 'Kartoffeln in kleine Würfel schneiden und in Öl 15 Minuten goldbraun braten.' },
        { t: 'Hack und Gemüse dazu', timer: 420, text: 'Hack, Zwiebel und Paprika dazu und mitbraten, mit Paprikapulver und Salz würzen.' },
        { t: 'Quark-Dip rühren', text: 'Quark mit Kräutern, Salz und einem Schluck Wasser glatt rühren.' },
        { t: 'Anrichten', text: 'Für Meal Prep den Dip in einer extra Dose mitnehmen.' },
      ],
    },
    {
      id: 'lachs-ofenkartoffeln',
      name: 'Lachs mit Ofenkartoffeln und Kräuterquark',
      portionen: 2, zeit: 35, mealPrep: false, haltbar: 1,
      zutaten: [
        ['lachs', 250], ['kartoffeln', 400], ['tomaten', 200], ['magerquark', 200],
        ['kraeuter', 2], ['olivenoel', 1], ['salz', 1], ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Kartoffeln in den Ofen', timer: 900, text: 'Ofen auf 200 °C vorheizen. Kartoffeln vierteln, mit Öl und Salz aufs Blech.' },
        { t: 'Lachs dazulegen', timer: 900, text: 'Nach 15 Minuten Lachs und Tomaten dazulegen, weitere 15 Minuten backen.' },
        { t: 'Kräuterquark rühren', text: 'Quark mit Kräutern, Salz und Pfeffer verrühren.' },
        { t: 'Servieren', text: 'Frisch essen – Fisch wird aufgewärmt nicht besser.' },
      ],
    },
    {
      id: 'ruehrei-spinat',
      name: 'Rührei mit Hüttenkäse und Spinat',
      portionen: 2, zeit: 10, mealPrep: false, haltbar: 1,
      zutaten: [
        ['eier', 6], ['huettenkaese', 200], ['spinat', 100], ['tomaten', 150],
        ['salz', 0.5], ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Eier verquirlen', text: 'Eier verquirlen, salzen und pfeffern.' },
        { t: 'Spinat anbraten', timer: 120, text: 'Spinat in einer beschichteten Pfanne zusammenfallen lassen.' },
        { t: 'Eier stocken lassen', timer: 180, text: 'Eier dazu und bei mittlerer Hitze stocken lassen, Hüttenkäse unterheben.' },
        { t: 'Servieren', text: 'Mit halbierten Tomaten servieren.' },
      ],
    },
    {
      id: 'thunfisch-ei-salat',
      name: 'Thunfisch-Ei-Salat',
      portionen: 2, zeit: 15, mealPrep: true, haltbar: 2,
      zutaten: [
        ['thunfisch', 2], ['eier', 4], ['gurke', 1], ['tomaten', 200],
        ['skyr', 150], ['zwiebel', 0.5], ['salz', 0.5], ['pfeffer', 0.5],
      ],
      schritte: [
        { t: 'Eier hart kochen', timer: 540, text: 'Eier 9 Minuten hart kochen, abschrecken und würfeln.' },
        { t: 'Gemüse schneiden', text: 'Gurke, Tomaten und Zwiebel klein schneiden.' },
        { t: 'Dressing rühren', text: 'Thunfisch abtropfen lassen und mit Skyr, Salz und Pfeffer verrühren.' },
        { t: 'Alles mischen', text: 'Alles mischen. Gurke erst kurz vor dem Essen dazugeben, dann bleibt sie knackig.' },
      ],
    },
  ],
};
