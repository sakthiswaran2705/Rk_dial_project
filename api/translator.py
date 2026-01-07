from deep_translator import GoogleTranslator
from cachetools import TTLCache

TA_EN_TRANSLATOR = GoogleTranslator(source="ta", target="en")
EN_TA_TRANSLATOR = GoogleTranslator(source="en", target="ta")


cache = TTLCache(maxsize=10000, ttl=86400)

def should_translate(text: str):
    if not text:
        return False
    if text.isdigit():
        return False
    if text.isascii():      # sa, tea kadai, shop
        return False
    if len(text) <= 2:
        return False
    return True

# =============================
# Tamil → English (DB save)
# =============================
def ta_to_en(text: str) -> str:
    if not should_translate(text):
        return text

    key = f"ta_en:{text.strip().lower()}"
    cached = cache.get(key)
    if cached:
        return cached

    translated = TA_EN_TRANSLATOR.translate(text)
    cache[key] = translated
    return translated


# =============================
# English → Tamil (API response)
# =============================
def en_to_ta(text: str) -> str:
    if not text or text.isdigit():
        return text

    key = f"en_ta:{text.strip().lower()}"
    cached = cache.get(key)
    if cached:
        return cached

    translated = EN_TA_TRANSLATOR.translate(text)
    cache[key] = translated
    return translated
