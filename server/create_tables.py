"""
Database Setup Script

This script connects to MongoDB and creates all necessary collections
and indexes for the Personal Loan Sales System.

Collections:
- sessions: Session documents
- conversations: Conversation messages
- users: User documents
- kycs: KYC documents
- offer_template: Offer template documents

The script only creates collections/indexes if they don't exist,
and verifies that existing indexes match the required configuration.
"""

import os
from typing import Dict, List, Tuple, Any
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")


def normalize_index_key(key_spec: Any) -> Dict[str, int]:
    """Normalize index key specification to a dict format."""
    if isinstance(key_spec, str):
        return {key_spec: 1}
    elif isinstance(key_spec, list):
        result: Dict[str, int] = {}
        for item in key_spec:
            if isinstance(item, tuple) and len(item) == 2:
                field, direction = item
                result[str(field)] = int(direction)
        return result
    elif isinstance(key_spec, dict):
        return {str(k): int(v) for k, v in key_spec.items()}
    else:
        raise ValueError(f"Invalid index key specification: {key_spec}")


def index_matches(required: Dict[str, Any], existing: Dict[str, Any]) -> bool:
    """Check if an existing index matches the required index."""
    # Normalize keys for comparison
    required_key = normalize_index_key(required.get("key", required.get("keys", [])))
    existing_key = normalize_index_key(existing.get("key", existing.get("keys", [])))
    
    # Compare keys
    if required_key != existing_key:
        return False
    
    # Compare options (unique, sparse, etc.)
    required_unique = required.get("unique", False)
    existing_unique = existing.get("unique", False)
    
    required_sparse = required.get("sparse", False)
    existing_sparse = existing.get("sparse", False)
    
    if required_unique != existing_unique or required_sparse != existing_sparse:
        return False
    
    return True


def get_existing_indexes(collection: Collection) -> List[Dict[str, Any]]:
    """Get all existing indexes for a collection."""
    try:
        indexes = list(collection.list_indexes())
        return [idx for idx in indexes if idx.get("name") != "_id_"]  # Exclude default _id index
    except Exception:
        return []


def ensure_index(collection: Collection, index_spec: Dict[str, Any], index_name: str = None) -> Tuple[bool, str]:
    """
    Ensure an index exists with the correct specification.
    Returns (created_or_updated: bool, message: str)
    """
    existing_indexes = get_existing_indexes(collection)
    
    # Check if index with matching spec already exists
    for existing_idx in existing_indexes:
        if index_matches(index_spec, existing_idx):
            return False, f"Index already exists: {existing_idx.get('name', 'unnamed')}"
    
    # Check if index with same key but different options exists
    required_key = normalize_index_key(index_spec.get("key", index_spec.get("keys", [])))
    for existing_idx in existing_indexes:
        existing_key = normalize_index_key(existing_idx.get("key", existing_idx.get("keys", [])))
        if required_key == existing_key:
            # Index exists but with different options - drop and recreate
            try:
                idx_name = existing_idx.get("name")
                if idx_name:
                    collection.drop_index(idx_name)
            except Exception:
                pass
    
    # Create the index
    try:
        key = index_spec.get("key") or index_spec.get("keys")
        if key is None:
            return False, "No key specified for index"
        
        options = {k: v for k, v in index_spec.items() if k not in ["key", "keys"]}
        if index_name:
            options["name"] = index_name
        
        collection.create_index(key, **options)
        return True, "Index created"
    except Exception as e:
        return False, f"Error creating index: {str(e)}"


def setup_collection(
    db: Database,
    collection_name: str,
    required_indexes: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Setup a collection and its indexes. Returns summary of actions."""
    print(f"\nSetting up '{collection_name}' collection...")
    
    # Check if collection exists
    collection_names = db.list_collection_names()
    collection_exists = collection_name in collection_names
    
    if collection_exists:
        print(f"  Collection '{collection_name}' already exists.")
    else:
        print(f"  Creating collection '{collection_name}'...")
        # Collections are created automatically when first document is inserted
        # or when first index is created, so we'll create it by creating an index
    
    collection: Collection = db[collection_name]
    
    created_count = 0
    existing_count = 0
    error_count = 0
    
    index_descriptions = []
    
    for idx_spec in required_indexes:
        idx_name = idx_spec.get("name", "unnamed")
        created, message = ensure_index(collection, idx_spec, idx_name)
        
        if created:
            created_count += 1
            index_descriptions.append(f"  ✓ {message}: {idx_name}")
        elif "already exists" in message:
            existing_count += 1
            index_descriptions.append(f"  → {message}")
        else:
            error_count += 1
            index_descriptions.append(f"  ✗ {message}")
    
    for desc in index_descriptions:
        print(desc)
    
    return {
        "name": collection_name,
        "existed": collection_exists,
        "indexes_created": created_count,
        "indexes_existing": existing_count,
        "indexes_errors": error_count
    }


def create_collections_and_indexes():
    """Create all collections and indexes for the application."""
    
    # Connect to MongoDB
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db: Database = client.get_default_database()
    print(f"Connected to database: {db.name}")
    
    # Define required indexes for each collection
    sessions_indexes = [
        {"key": "session_id", "unique": True, "name": "session_id_1"},
        {"key": "created_at", "name": "created_at_1"},
        {"key": "updated_at", "name": "updated_at_1"},
        {"key": "is_active", "name": "is_active_1"},
        {"key": [("metadata.customer_id", 1)], "name": "metadata.customer_id_1"},
        {"key": [("metadata.conversation_stage", 1)], "name": "metadata.conversation_stage_1"},
    ]
    
    conversations_indexes = [
        {"key": "session_id", "name": "session_id_1"},
        {"key": "created_at", "name": "created_at_1"},
        {"key": "agent_type", "name": "agent_type_1"},
        {"key": [("session_id", 1), ("created_at", 1)], "name": "session_id_1_created_at_1"},
    ]
    
    users_indexes = [
        {"key": "phone", "unique": True, "sparse": True, "name": "phone_1"},
        {"key": "email", "unique": True, "sparse": True, "name": "email_1"},
        {"key": "created_at", "name": "created_at_1"},
        {"key": "updated_at", "name": "updated_at_1"},
    ]
    
    kycs_indexes = [
        {"key": "pan", "unique": True, "sparse": True, "name": "pan_1"},
        {"key": "phone", "sparse": True, "name": "phone_1"},
        {"key": "credit_score", "name": "credit_score_1"},
    ]
    
    offer_template_indexes = [
        {"key": "name", "name": "name_1"},
        {"key": "active", "name": "active_1"},
        {"key": [("min_credit_score", 1), ("max_credit_score", 1)], "name": "min_credit_score_1_max_credit_score_1"},
        {"key": [("min_amount", 1), ("max_amount", 1)], "name": "min_amount_1_max_amount_1"},
    ]
    
    # Setup all collections
    results = []
    results.append(setup_collection(db, "sessions", sessions_indexes))
    results.append(setup_collection(db, "conversations", conversations_indexes))
    results.append(setup_collection(db, "users", users_indexes))
    results.append(setup_collection(db, "kycs", kycs_indexes))
    results.append(setup_collection(db, "offer_template", offer_template_indexes))
    
    # Print summary
    print("\n" + "="*60)
    print("Database setup completed!")
    print("="*60)
    
    total_created = sum(r["indexes_created"] for r in results)
    total_existing = sum(r["indexes_existing"] for r in results)
    total_errors = sum(r["indexes_errors"] for r in results)
    
    print(f"\nSummary:")
    print(f"  Collections checked: {len(results)}")
    print(f"  Indexes created: {total_created}")
    print(f"  Indexes already exist: {total_existing}")
    if total_errors > 0:
        print(f"  Indexes with errors: {total_errors}")
    
    print("\nCollections:")
    for r in results:
        status = "✓" if r["existed"] else "✓ (created)"
        print(f"  {status} {r['name']}")
    
    # Close connection
    client.close()
    print("\nConnection closed.")


if __name__ == "__main__":
    try:
        create_collections_and_indexes()
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)

