import urllib.request
import re
import urllib.parse

query = urllib.parse.quote("site:unsplash.com fire truck night")
url = f"https://html.duckduckgo.com/html/?q={query}"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        links = re.findall(r'href="([^"]+)"', html)
        for link in set(links):
            if 'unsplash.com/photo' in link:
                print(link)
except Exception as e:
    print("Error:", e)
