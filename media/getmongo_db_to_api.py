import pymongo
from fastapi import FastAPI

emp = [
    {'id': 101},
    {'id':102},
    {'id':103},
    {'id':104}
]
app = FastAPI()
@app.get("/shop_details/")
def view(id: int):
    if id == emp[0]["id"]:
        mongoin = pymongo.MongoClient("mongodb://localhost:27017/")
        mydn = mongoin["office"]
        my = mydn["shop"]
        insertly = my.find()
        for x in insertly:
            x["_id"] = str(x["_id"])
        return x
    elif id == emp[1]["id"]:
        mongoin = pymongo.MongoClient("mongodb://localhost:27017/")
        mydn = mongoin["office"]
        my = mydn["city"]
        insertly = my.find()
        for x in insertly:
            x["_id"] = str(x["_id"])
        return x
    elif id == emp[2]["id"]:
        mongoin = pymongo.MongoClient("mongodb://localhost:27017/")
        mydn = mongoin["office"]
        my = mydn["shop_images"]
        insertly = my.find()
        for x in insertly:
            x["_id"] = str(x["_id"])
        return x
    elif id == emp[3]["id"]:
        mongoin = pymongo.MongoClient("mongodb://localhost:27017/")
        mydn = mongoin["office"]
        my = mydn["Product_images"]
        insertly = my.find()
        results = []
        for x in insertly:
            x["_id"] = str(x["_id"])
            results.append(x)
        return results
    else:
        return {"error": "ID not found"}