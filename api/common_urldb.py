from pymongo import MongoClient

client = MongoClient(
    "mongodb+srv://rkdr:<kad$ai!Tn>@rkd.8gcpbt5.mongodb.net/office?retryWrites=true&w=majority&appName=rkd"
)
db = client["office"]
