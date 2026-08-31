#!/usr/bin/env python3
"""Génère la banque de mots Foundations (~350 items) avec calendrier SRS.

Sorties :
  data/foundations-banque-mots.csv
  data/foundations-banque-mots.json

Modèle SRS : intervalles J+1, J+3, J+7, J+16, J+35 après l'introduction.
Un item est "maîtrisé" après la 5e révision réussie (SM-2 simplifié :
une révision ratée fait reculer d'un cran l'intervalle, non modélisé ici).
Semaine scolaire : dimanche → jeudi (5 sessions). Les révisions tombant
vendredi/samedi glissent à la session suivante.
Vacances (2 sem. hiver après S13, 2 sem. printemps après S24) : mode
"révision seule" — les révisions SRS continuent, aucun nouvel item.
"""

import csv, json, os

# ---------------------------------------------------------------- lexique
# (en, fr, catégorie) — catégories : lexique / structure / fonction / décodable
W = {
1: [("hello","bonjour","lexique"),("hi","salut","lexique"),("goodbye","au revoir","lexique"),
    ("bye","salut (départ)","lexique"),("yes","oui","lexique"),("no","non","lexique"),
    ("I'm …","je suis …","structure"),("OK","d'accord","lexique")],
2: [("name","prénom","lexique"),("what","quoi / quel","fonction"),("my","mon / ma","fonction"),
    ("your","ton / ta","fonction"),("What's your name?","comment tu t'appelles ?","structure"),
    ("My name is …","je m'appelle …","structure"),("please","s'il te plaît","lexique"),
    ("thank you","merci","lexique"),("sorry","pardon","lexique")],
3: [("one","un","lexique"),("two","deux","lexique"),("three","trois","lexique"),
    ("four","quatre","lexique"),("five","cinq","lexique"),("how","comment","fonction"),
    ("fine","bien","lexique"),("How are you?","comment ça va ?","structure"),
    ("I'm fine","ça va bien","structure")],
5: [("red","rouge","lexique"),("blue","bleu","lexique"),("green","vert","lexique"),
    ("yellow","jaune","lexique"),("colour","couleur","lexique"),("it","il / ça (objet)","fonction"),
    ("It's red!","c'est rouge !","structure"),("look!","regarde !","lexique")],
6: [("black","noir","lexique"),("white","blanc","lexique"),("orange","orange (couleur)","lexique"),
    ("pink","rose","lexique"),("purple","violet","lexique"),("brown","marron","lexique"),
    ("grey","gris","lexique"),("What colour is it?","de quelle couleur est-ce ?","structure")],
7: [("six","six","lexique"),("seven","sept","lexique"),("eight","huit","lexique"),
    ("nine","neuf","lexique"),("ten","dix","lexique"),("many","beaucoup","fonction"),
    ("How many?","combien ?","structure"),("count","compter","lexique"),("number","nombre","lexique")],
9: [("mum","maman","lexique"),("dad","papa","lexique"),("brother","frère","lexique"),
    ("sister","sœur","lexique"),("this","ceci / voici","fonction"),
    ("This is my mum","voici ma maman","structure"),("and","et","fonction")],
10:[("grandma","grand-mère","lexique"),("grandpa","grand-père","lexique"),("baby","bébé","lexique"),
    ("family","famille","lexique"),("who","qui","fonction"),("Who's this?","qui est-ce ?","structure"),
    ("boy","garçon","lexique"),("girl","fille","lexique")],
11:[("big","grand","lexique"),("small","petit","lexique"),("old","vieux / âgé","lexique"),
    ("young","jeune","lexique"),("he","il (personne)","fonction"),("she","elle","fonction"),
    ("He's big","il est grand","structure"),("She's small","elle est petite","structure")],
13:[("head","tête","lexique"),("eyes","yeux","lexique"),("nose","nez","lexique"),
    ("mouth","bouche","lexique"),("ears","oreilles","lexique"),("face","visage","lexique"),
    ("hair","cheveux","lexique"),("I have two eyes","j'ai deux yeux","structure")],
14:[("hands","mains","lexique"),("feet","pieds","lexique"),("arms","bras","lexique"),
    ("legs","jambes","lexique"),("fingers","doigts","lexique"),("body","corps","lexique"),
    ("touch","toucher","lexique"),("Touch your nose!","touche ton nez !","structure"),
    ("clap","taper des mains","lexique")],
15:[("happy","content","lexique"),("sad","triste","lexique"),("angry","fâché","lexique"),
    ("tired","fatigué","lexique"),("hungry","affamé","lexique"),("thirsty","assoiffé","lexique"),
    ("scared","effrayé","lexique"),("smile","sourire","lexique"),("I'm happy","je suis content","structure")],
17:[("cat","chat","lexique"),("dog","chien","lexique"),("bird","oiseau","lexique"),
    ("fish","poisson","lexique"),("rabbit","lapin","lexique"),("a","un / une (article)","fonction"),
    ("It's a cat","c'est un chat","structure"),("pet","animal de compagnie","lexique")],
18:[("sheep","mouton","lexique"),("cow","vache","lexique"),("camel","chameau","lexique"),
    ("donkey","âne","lexique"),("goat","chèvre","lexique"),("hen","poule","lexique"),
    ("horse","cheval","lexique"),("farm","ferme","lexique")],
19:[("lion","lion","lexique"),("elephant","éléphant","lexique"),("monkey","singe","lexique"),
    ("snake","serpent","lexique"),("fennec","fennec","lexique"),("run","courir","lexique"),
    ("jump","sauter","lexique"),("fly","voler","lexique"),("swim","nager","lexique"),
    ("can","pouvoir / savoir faire","fonction"),("It can run","il sait courir","structure"),
    ("I can jump","je sais sauter","structure")],
21:[("bread","pain","lexique"),("milk","lait","lexique"),("water","eau","lexique"),
    ("eggs","œufs","lexique"),("cheese","fromage","lexique"),("eat","manger","lexique"),
    ("like","aimer","lexique"),("I like milk","j'aime le lait","structure")],
22:[("apple","pomme","lexique"),("banana","banane","lexique"),("an orange","une orange (fruit)","lexique"),
    ("dates","dattes","lexique"),("grapes","raisin","lexique"),("fruit","fruit","lexique"),
    ("don't","ne … pas","fonction"),("I don't like …","je n'aime pas …","structure")],
23:[("rice","riz","lexique"),("cake","gâteau","lexique"),("juice","jus","lexique"),
    ("tea","thé","lexique"),("chicken","poulet","lexique"),("drink","boire","lexique"),
    ("do","est-ce que (auxiliaire)","fonction"),("Do you like …?","est-ce que tu aimes … ?","structure"),
    ("Yes, I do","oui (j'aime)","structure"),("No, I don't","non (je n'aime pas)","structure")],
25:[("school","école","lexique"),("book","livre","lexique"),("pen","stylo","lexique"),
    ("pencil","crayon","lexique"),("bag","cartable","lexique"),("teacher","maître / maîtresse","lexique"),
    ("ruler","règle","lexique"),("What's this?","qu'est-ce que c'est ?","structure"),
    ("It's a pen","c'est un stylo","structure")],
26:[("Sunday","dimanche","lexique"),("Monday","lundi","lexique"),("Tuesday","mardi","lexique"),
    ("Wednesday","mercredi","lexique"),("Thursday","jeudi","lexique"),("Friday","vendredi","lexique"),
    ("Saturday","samedi","lexique"),("today","aujourd'hui","lexique"),("day","jour","lexique"),
    ("Sit down!","assieds-toi !","structure"),("Stand up!","lève-toi !","structure"),
    ("Open!","ouvre !","structure"),("Close!","ferme !","structure"),("Listen!","écoute !","structure")],
27:[("get up","se lever","lexique"),("go","aller","lexique"),("play","jouer","lexique"),
    ("sleep","dormir","lexique"),("home","maison (chez soi)","lexique"),
    ("morning","matin","lexique"),("afternoon","après-midi","lexique"),("night","nuit","lexique"),
    ("wash","se laver","lexique"),("I go to school","je vais à l'école","structure")],
29:[("house","maison","lexique"),("street","rue","lexique"),("shop","magasin","lexique"),
    ("park","parc","lexique"),("beach","plage","lexique"),("where","où","fonction"),
    ("in","dans","fonction"),("on","sur","fonction"),("under","sous","fonction"),
    ("Where is …?","où est … ?","structure")],
30:[("sunny","ensoleillé","lexique"),("rainy","pluvieux","lexique"),("hot","chaud","lexique"),
    ("cold","froid","lexique"),("windy","venteux","lexique"),("weather","météo","lexique"),
    ("What's the weather like?","quel temps fait-il ?","structure"),
    ("desert","désert","lexique"),("sea","mer","lexique"),("mountain","montagne","lexique"),
    ("sun","soleil","lexique")],
}

# Mots de célébration / mascotte (répartis tôt, très fréquents)
W[1] += [("well done!","bravo !","lexique"),("great!","super !","lexique")]
W[5] += [("again!","encore !","lexique")]
W[9] += [("help","aide / au secours","lexique"),("let's go!","allons-y !","lexique")]

# Extensions thématiques (chansons, culture locale, classe) — mêmes semaines
EXT = {
1: [("good morning","bonjour (le matin)","lexique")],
2: [("friend","ami","lexique"),("welcome","bienvenue","lexique")],
3: [("zero","zéro","lexique")],
5: [("rainbow","arc-en-ciel","lexique")],
6: [("beautiful","beau / belle","lexique")],
7: [("eleven","onze","lexique"),("twelve","douze","lexique")],
9: [("love","aimer (fort)","lexique"),("I love you","je t'aime","structure")],
10:[("uncle","oncle","lexique"),("aunt","tante","lexique")],
11:[("tall","grand (taille)","lexique"),("short","petit / court","lexique")],
13:[("teeth","dents","lexique"),("tongue","langue","lexique")],
14:[("shoulders","épaules","lexique"),("knees","genoux","lexique"),
    ("toes","orteils","lexique")],  # chanson Head, Shoulders, Knees and Toes
15:[("sick","malade","lexique"),("cry","pleurer","lexique"),("laugh","rire","lexique")],
17:[("mouse","souris","lexique"),("turtle","tortue","lexique")],
18:[("wolf","loup","lexique"),("frog","grenouille","lexique")],
19:[("walk","marcher","lexique"),("climb","grimper","lexique"),
    ("fast","rapide","lexique"),("slow","lent","lexique")],
21:[("butter","beurre","lexique"),("couscous","couscous","lexique"),
    ("yummy!","miam !","lexique")],
22:[("watermelon","pastèque","lexique"),("lemon","citron","lexique")],
23:[("soup","soupe / chorba","lexique"),("meat","viande","lexique"),
    ("sugar","sucre","lexique")],
25:[("eraser","gomme","lexique"),("desk","table / bureau","lexique"),
    ("classroom","salle de classe","lexique")],
26:[("week","semaine","lexique"),("What day is it?","quel jour sommes-nous ?","structure")],
27:[("breakfast","petit-déjeuner","lexique"),("dinner","dîner","lexique"),
    ("brush my teeth","me brosser les dents","structure")],
29:[("garden","jardin","lexique"),("door","porte","lexique"),
    ("window","fenêtre","lexique"),("city","ville","lexique")],
30:[("cloud","nuage","lexique"),("snow","neige","lexique"),("sky","ciel","lexique"),
    ("tree","arbre","lexique"),("flower","fleur","lexique")],
}
for wk, items in EXT.items():
    W[wk] += items

# ------------------------------------------------------- mots décodables
# Mots de lecture pure liés à la progression phonics (dédupliqués plus bas
# si déjà présents au lexique — ex. red, dog, sun sont lus ET dits).
DECODABLE = {
3: ["sat","pin","tin","tap","tip","at","nap"],
5: ["can (boîte)","cap","kit"],           # c/k
6: ["net","hat"],                          # e h  (hen/ten au lexique S18/S7)
7: ["rat","map","man"],                    # r m d (dad≈papa déjà 'dad' lexique -> skip)
9: ["got","on (phonics)","gap"],           # g o
10:["up","lip","log"],                     # u l
11:["fun","bat","fog","bus"],              # f b
13:["duck","sock","kick","back"],          # ck
14:["bell","doll","hill","miss","off"],    # ll ss ff
17:["rain","tail","wait","snail"],         # ai
18:["see","bee"],                          # ee (sheep/green/feet au lexique)
19:["boat","road","coat"],                 # oa (goat au lexique)
21:["ship","shut"],                        # sh (shop→S29, fish lexique)
22:["chick","chat","rich","lunch"],        # ch
23:["that","with","bath"],                 # th (this au lexique)
24:["king","song","ring","long"],          # ng
25:["moon","food"],                        # oo long (school au lexique)
26:["look","good","foot"],                 # oo court (book au lexique)
27:["queen","quick","yet"],                # qu y
29:["car","star","far"],                   # ar (park au lexique)
30:["fork","corn","her","river"],          # or er
}

MONDES = {1:"M1 · Hello !",2:"M2 · Colours & Numbers",3:"M3 · My Family",4:"M4 · My Body",
          5:"M5 · Animals",6:"M6 · Food",7:"M7 · My School & My Day",8:"M8 · My World"}
def monde_of(week): return MONDES[(week-1)//4 + 1]

# ------------------------------------------------- calendrier avec vacances
labels = [f"S{i}" for i in range(1,14)] + ["VH1","VH2"] + \
         [f"S{i}" for i in range(14,25)] + ["VP1","VP2"] + \
         [f"S{i}" for i in range(25,33)]
def label_at(abs_day):
    idx = abs_day // 7
    return labels[idx] if idx < len(labels) else "Été"
def next_school_day(abs_day):
    while abs_day % 7 > 4:  # jours 5,6 = vendredi, samedi
        abs_day += 1
    return abs_day
def abs_of(week_label, day):  # day: 1..4
    return labels.index(week_label) * 7 + (day - 1)

OFFSETS = [1, 3, 7, 16, 35]

rows, seen = [], set()
for week in sorted(W):
    items = [(en, fr, cat) for (en, fr, cat) in W[week]]
    for en in DECODABLE.get(week, []):
        items.append((en, "(mot de lecture)", "décodable"))
    for i, (en, fr, cat) in enumerate(items):
        key = en.lower().split(" (")[0]
        if key in seen and cat == "décodable":
            continue
        seen.add(key)
        day = (i % 4) + 1
        d0 = abs_of(f"S{week}", day)
        reviews = []
        for off in OFFSETS:
            reviews.append(label_at(next_school_day(d0 + off)))
        rows.append({
            "id": len(rows) + 1, "anglais": en, "francais": fr, "categorie": cat,
            "monde": monde_of(week), "semaine_intro": f"S{week}", "jour_intro": day,
            "r1": reviews[0], "r2": reviews[1], "r3": reviews[2],
            "r4": reviews[3], "r5": reviews[4], "maitrise": reviews[4],
        })

os.makedirs("data", exist_ok=True)
with open("data/foundations-banque-mots.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
with open("data/foundations-banque-mots.json", "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)

from collections import Counter
c = Counter(r["categorie"] for r in rows)
print(f"Total : {len(rows)} items — {dict(c)}")
