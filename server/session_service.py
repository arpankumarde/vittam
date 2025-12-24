"""Session Service - Database operations for Sessions"""

from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from database import sessions_collection
from models import Session, SessionMetadata


def create_session(session_id: str, metadata: Optional[SessionMetadata] = None, is_active: bool = True) -> Session:
    """Create a new session in the database"""
    now = datetime.now(timezone.utc)
    doc = {
        "session_id": session_id,
        "created_at": now,
        "updated_at": now,
        "metadata": metadata or {},
        "is_active": is_active,
        "documents": []
    }
    result = sessions_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc  # type: ignore


def get_session(session_id: str) -> Optional[Session]:
    """Get session by session_id"""
    return sessions_collection.find_one({"session_id": session_id})  # type: ignore


def update_session(session_id: str, metadata: Optional[SessionMetadata] = None, is_active: Optional[bool] = None, conversation_stage: Optional[str] = None, documents: Optional[List[ObjectId]] = None) -> Optional[Session]:
    """Update session metadata and fields"""
    set_data = {"updated_at": datetime.now(timezone.utc)}  # type: ignore
    if metadata:
        set_data["metadata"] = metadata  # type: ignore
    if is_active is not None:
        set_data["is_active"] = is_active  # type: ignore
    if conversation_stage:
        if "metadata" not in set_data:
            set_data["metadata"] = {}  # type: ignore
        set_data["metadata"]["conversation_stage"] = conversation_stage  # type: ignore
    if documents is not None:
        set_data["documents"] = documents  # type: ignore
    sessions_collection.update_one({"session_id": session_id}, {"$set": set_data})
    return get_session(session_id)
