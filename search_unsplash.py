import urllib.request
import json
url = "https://unsplash.com/napi/search/photos?query=feuerwehr&per_page=20"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for r in data['results']:
            print(r['urls']['raw'])
except Exception as e:
    print(e)
