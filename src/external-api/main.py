from rezkaApi import *
import sys

type = sys.argv[1]
url = sys.argv[2]

rezka = HdRezkaApi(url)

if type == "get_config":
    dict = {
      "id": rezka.id,
      "name": rezka.name,
      "type": rezka.type,
      "translators": rezka.getTranslations(),
      "seasons": rezka.getSeasons()
    }

    print(dict)

sys.stdout.flush()
