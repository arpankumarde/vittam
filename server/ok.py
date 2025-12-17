import os
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()

def migrate_kyc_to_kycs():
    # Get MongoDB URI from environment variable
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable not set")

    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client.get_default_database()  # Uses DB from URI

    # Source and destination collections
    source = db["kyc"]
    destination = db["kycs"]

    # Fetch all documents from source
    documents = list(source.find())

    if not documents:
        print("No documents found in 'kyc' collection.")
        return

    # Insert into destination
    destination.insert_many(documents)

    print(f"Migrated {len(documents)} documents from 'kyc' to 'kycs'.")

if __name__ == "__main__":
    migrate_kyc_to_kycs()
