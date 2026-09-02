#!/usr/bin/env python3
"""Génère fennec/app/word-emoji.json : un emoji par mot de catégorie
"lexique" quand une image fidèle et univoque existe, sinon rien (le mot
reste affiché en texte anglais — un placeholder honnête plutôt qu'un emoji
trompeur ou dupliqué).

Fichier volontairement séparé de data/foundations-banque-mots.json et du
schéma Supabase (words.image_url reste réservé aux vraies illustrations
futures) : c'est une béquille visuelle temporaire, à supprimer dès que de
vraies illustrations existent (cf. fennec/README.md, section "Design
système").

Règle de curation : jamais deux mots différents avec le même emoji — sinon
un enfant verrait deux fois la même image dans un écran "écoute → touche"
sans pouvoir les distinguer. Vérifié programmatiquement ci-dessous.
"""

import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "catalog.json")
OUT = os.path.join(HERE, "word-emoji.json")

# english -> emoji, uniquement pour les mots réellement représentables par
# une image unique. Absent volontairement : mots grammaticaux/relationnels
# sans référent visuel univoque (big/small/old/young/tall/short/OK/again!...).
EMOJI = {
    "hello": "👋", "hi": "🙋", "goodbye": "🛫", "bye": "🤚",
    "yes": "👍", "no": "👎", "OK": "👌",
    "well done!": "🎉", "great!": "⭐",
    "name": "📛",
    "please": "🤲", "thank you": "🙏", "sorry": "😔",
    "friend": "👫", "welcome": "🤗",
    "one": "1️⃣", "two": "2️⃣", "three": "3️⃣", "four": "4️⃣", "five": "5️⃣",
    "fine": "🙂", "zero": "0️⃣",
    "red": "🔴", "blue": "🔵", "green": "🟢", "yellow": "🟡", "colour": "🎨",
    "look!": "🔍", "again!": "🔁", "rainbow": "🌈",
    "black": "⚫", "white": "⚪", "orange": "🟠", "pink": "🩷", "purple": "🟣",
    "brown": "🟤", "grey": "🩶",
    "beautiful": "🌸",
    "six": "6️⃣", "seven": "7️⃣", "eight": "8️⃣", "nine": "9️⃣", "ten": "🔟",
    "count": "🧮", "number": "🔢", "eleven": "🕚", "twelve": "🕛",
    "mum": "👩", "dad": "👨", "brother": "👦", "sister": "👭",
    "help": "🆘", "let's go!": "🚀", "love": "❤️",
    "grandma": "👵", "grandpa": "👴", "baby": "👶", "family": "👨‍👩‍👧‍👦",
    "boy": "🧒", "girl": "👧", "uncle": "🧔", "aunt": "👩‍🦱",
    "head": "🗣️", "eyes": "👀", "nose": "👃", "mouth": "👄", "ears": "👂",
    "face": "👤", "hair": "💇",
    "teeth": "🦷", "tongue": "👅",
    "hands": "✋", "feet": "🦶", "arms": "💪", "legs": "🦵", "fingers": "👆",
    "touch": "☝️", "clap": "👏", "body": "🧍",
    "shoulders": "🤷",
    "happy": "😄", "sad": "😢", "angry": "😠", "tired": "🥱", "hungry": "🤤",
    "thirsty": "😩", "scared": "😨", "smile": "😊",
    "sick": "🤒", "cry": "😭", "laugh": "😂",
    "cat": "🐱", "dog": "🐶", "bird": "🐦", "fish": "🐟", "rabbit": "🐰",
    "pet": "🐕", "mouse": "🐭", "turtle": "🐢",
    "sheep": "🐑", "cow": "🐄", "camel": "🐫", "donkey": "🫏", "goat": "🐐",
    "hen": "🐔", "horse": "🐴", "farm": "🚜",
    "wolf": "🐺", "frog": "🐸",
    "lion": "🦁", "elephant": "🐘", "monkey": "🐵", "snake": "🐍", "fennec": "🦊",
    "run": "🏃", "jump": "🤸", "fly": "🕊️", "swim": "🏊",
    "walk": "🚶", "climb": "🧗", "fast": "💨", "slow": "🐌",
    "bread": "🍞", "milk": "🥛", "water": "💧", "eggs": "🥚", "cheese": "🧀",
    "eat": "🍴", "like": "😍",
    "butter": "🧈", "couscous": "🍲", "yummy!": "😋",
    "apple": "🍎", "banana": "🍌", "an orange": "🍊", "dates": "🌴", "grapes": "🍇",
    "fruit": "🍏",
    "watermelon": "🍉", "lemon": "🍋",
    "rice": "🍚", "cake": "🎂", "juice": "🧃", "tea": "🍵", "chicken": "🍗",
    "drink": "🥤",
    "soup": "🍜", "meat": "🥩", "sugar": "🧂",
    "school": "🏫", "book": "📖", "pen": "🖊️", "pencil": "✏️", "bag": "🎒",
    "teacher": "🧑‍🏫", "ruler": "📏",
    "eraser": "🧽", "desk": "🪑",
    # Les jours de la semaine n'ont pas d'emoji distinctif par jour dans
    # Unicode — les 7 mots restent volontairement en texte (le nom anglais
    # écrit sert aussi la lecture, ce qui est pédagogiquement pertinent ici).
    "today": "📆", "day": "🌤️", "week": "🗓️",
    "get up": "🛏️", "go": "🚶‍♂️", "play": "🧸", "sleep": "😴", "home": "🏠",
    "morning": "🌅", "afternoon": "🌇", "night": "🌙",
    "wash": "🧼",
    "breakfast": "🥞", "dinner": "🍽️",
    "house": "🏡", "street": "🛣️", "shop": "🏪", "park": "🏞️", "beach": "🏖️",
    "garden": "🌷", "door": "🚪", "window": "🪟", "city": "🏙️",
    "sunny": "☀️", "rainy": "🌧️", "hot": "🥵", "cold": "🥶", "windy": "🌬️",
    "weather": "🌡️",
    "desert": "🏜️", "sea": "🌊", "mountain": "⛰️", "sun": "🌞",
    "cloud": "☁️", "snow": "❄️", "sky": "🌌", "tree": "🌳", "flower": "🌼",
}


def main():
    catalog = json.load(open(CATALOG, encoding="utf-8"))
    lexique = [w for w in catalog if w["category"] == "lexique"]

    result = {}
    for w in lexique:
        emoji = EMOJI.get(w["english"])
        if emoji:
            result[str(w["wordId"])] = emoji

    # Garde-fou : jamais le même emoji sur deux mots différents.
    by_emoji = {}
    for wid, emoji in result.items():
        by_emoji.setdefault(emoji, []).append(wid)
    dups = {e: ids for e, ids in by_emoji.items() if len(ids) > 1}
    if dups:
        by_id = {str(w["wordId"]): w["english"] for w in lexique}
        lines = [f"  {e} -> {[by_id[i] for i in ids]}" for e, ids in dups.items()]
        raise SystemExit("Emoji dupliqués détectés :\n" + "\n".join(lines))

    covered = len(result)
    total = len(lexique)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(f"Écrit {OUT} — {covered}/{total} mots lexique illustrés ({total - covered} restent en texte)")


if __name__ == "__main__":
    main()
