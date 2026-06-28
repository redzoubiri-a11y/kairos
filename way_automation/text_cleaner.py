"""Nettoyage des textes de script vidéo pour la chaîne WA'Y.

Deux transformations principales :
  1. Retrait des indications de mise en scène entre crochets, par ex.
     ``[Image : plan large sur la ville]`` ou ``[Musique douce]``.
  2. Conversion des pourcentages en toutes lettres (français), par ex.
     ``50%`` -> ``cinquante pour cent`` afin que la voix de synthèse les
     prononce correctement.

Le module est volontairement sans dépendance externe : il peut donc être
testé et réutilisé seul.
"""

from __future__ import annotations

import re

# --- Conversion nombre -> mots (français de France) ----------------------

_UNITS = [
    "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit",
    "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
]

_TENS = {2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante"}


def _below_100(n: int) -> str:
    if n < 20:
        return _UNITS[n]
    ten, unit = divmod(n, 10)
    if ten in _TENS:  # 20-69
        word = _TENS[ten]
        if unit == 0:
            return word
        if unit == 1:
            return f"{word} et un"
        return f"{word}-{_UNITS[unit]}"
    if ten == 7:  # 70-79 -> soixante + 10..19
        rest = _UNITS[10 + unit]
        return f"soixante et {rest}" if unit == 1 else f"soixante-{rest}"
    if ten == 8:  # 80-89
        return "quatre-vingts" if unit == 0 else f"quatre-vingt-{_UNITS[unit]}"
    # 90-99 -> quatre-vingt + 10..19
    return f"quatre-vingt-{_UNITS[10 + unit]}"


def _below_1000(n: int) -> str:
    if n < 100:
        return _below_100(n)
    hundreds, rest = divmod(n, 100)
    word = "cent" if hundreds == 1 else f"{_UNITS[hundreds]} cent"
    if rest == 0:
        # "cents" prend un s quand il termine le nombre (deux cents)
        return word + "s" if hundreds > 1 else word
    return f"{word} {_below_100(rest)}"


def number_to_french_words(n: int) -> str:
    """Convertit un entier positif en toutes lettres (français)."""
    if n < 0:
        return "moins " + number_to_french_words(-n)
    if n == 0:
        return "zéro"

    parts: list[str] = []
    millions, n = divmod(n, 1_000_000)
    thousands, rest = divmod(n, 1000)

    if millions:
        parts.append("un million" if millions == 1
                     else f"{_below_1000(millions)} millions")
    if thousands:
        parts.append("mille" if thousands == 1
                     else f"{_below_1000(thousands)} mille")
    if rest:
        parts.append(_below_1000(rest))
    return " ".join(parts)


def _decimal_digits_to_words(digits: str) -> str:
    """Lit la partie décimale chiffre par chiffre (ex. "05" -> "zéro cinq")."""
    return " ".join(_UNITS[int(d)] for d in digits)


def _percentage_to_words(match: re.Match) -> str:
    integer_part = match.group("int")
    decimal_part = match.group("dec")

    words = number_to_french_words(int(integer_part))
    if decimal_part:
        words += " virgule " + _decimal_digits_to_words(decimal_part)
    return f"{words} pour cent"


# Capture "50%", "50 %", "12,5%", "100 %", etc.
_PERCENT_RE = re.compile(r"(?P<int>\d+)(?:[.,](?P<dec>\d+))?\s*%")

# Capture toute indication entre crochets, y compris multi-lignes.
_BRACKET_RE = re.compile(r"\[[^\]]*\]", re.DOTALL)


def convert_percentages(text: str) -> str:
    """Remplace les pourcentages numériques par leur version en lettres."""
    return _PERCENT_RE.sub(_percentage_to_words, text)


def remove_stage_directions(text: str) -> str:
    """Retire les indications entre crochets ([Image : ...], [Musique]...)."""
    return _BRACKET_RE.sub("", text)


def _normalize_whitespace(text: str) -> str:
    cleaned_lines: list[str] = []
    for line in text.splitlines():
        # Espaces multiples -> simple, et pas d'espace avant la ponctuation.
        line = re.sub(r"[ \t]+", " ", line)
        line = re.sub(r"\s+([,.;:!?])", r"\1", line)
        cleaned_lines.append(line.strip())

    text = "\n".join(cleaned_lines)
    # Plus de deux sauts de ligne consécutifs -> on réduit à deux.
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_script_text(text: str) -> str:
    """Applique l'ensemble du nettoyage à un script vidéo brut."""
    text = remove_stage_directions(text)
    text = convert_percentages(text)
    text = _normalize_whitespace(text)
    return text


if __name__ == "__main__":  # petit test manuel
    sample = (
        "[Image : logo WA'Y] Bonjour et bienvenue !\n"
        "Cette année, la croissance atteint 50% [zoom],\n"
        "soit 12,5% de plus qu'en 2024.\n"
    )
    print(clean_script_text(sample))
