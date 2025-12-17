"""
MongoDB Database Connection and Collection Access

This module provides:
- MongoDB client connection
- Database instance
- Collection references for sessions and conversations
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

# Load environment variables from .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")


if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")

# Create MongoDB client/db object
client = MongoClient(MONGO_URI)
db: Database = client.get_default_database()

# Collection references
sessions_collection: Collection = db["sessions"]
conversations_collection: Collection = db["conversations"]
users_collection: Collection = db["users"]
kycs_collection: Collection = db["kycs"]
offer_template_collection: Collection = db["offer_template"]

# Create indexes for better query performance
def create_indexes():
    """Create database indexes for optimal query performance"""
    # Index on session_id for conversations (most common query)
    conversations_collection.create_index("session_id")
    
    # Index on session_id for sessions (for lookups)
    sessions_collection.create_index("session_id", unique=True)
    
    # Index on created_at for both collections (for sorting)
    sessions_collection.create_index("created_at")
    conversations_collection.create_index("created_at")
    
    # Index on is_active for sessions (for filtering active sessions)
    sessions_collection.create_index("is_active")

# Initialize indexes on import
create_indexes()
