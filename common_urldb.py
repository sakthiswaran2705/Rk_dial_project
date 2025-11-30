from pymongo import MongoClient

client = MongoClient("mongodb+srv://rkdr:kad$ai!Tn@cluster0.XXXX.mongodb.net/?retryWrites=true&w=majority")
db = client["office"]
