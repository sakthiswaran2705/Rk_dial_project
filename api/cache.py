cache = {}

def get_cached(text: str):
    return cache.get(text)

def set_cache(text: str, value: str):
    cache[text] = value
