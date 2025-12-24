"""Document Service - Database operations and file storage for Documents"""

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from bson import ObjectId

from database import documents_collection
from models import Document
from session_service import get_session, update_session


# Base directory for storing documents
STORE_DIR = Path(__file__).parent / "store"


def ensure_store_directory(session_id: str) -> Path:
    """Ensure the store directory exists for a session and return the path."""
    session_dir = STORE_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    return session_dir


def create_document(
    session_id: str,
    doc_id: str,
    doc_name: str,
    original_filename: str,
    file_content: bytes,
    file_size: int
) -> Document:
    """
    Create a new document entry in database and save file to disk.
    
    Args:
        session_id: Session ID
        doc_id: Document ID (e.g., "identity_proof", "bank_statement")
        doc_name: Document display name (e.g., "Identity Proof")
        original_filename: Original filename from upload
        file_content: File content as bytes
        file_size: File size in bytes
    
    Returns:
        Document object
    """
    # Ensure session exists
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    # Check if document already exists for this session and doc_id
    existing = documents_collection.find_one({
        "session_id": session_id,
        "doc_id": doc_id
    })
    
    if existing:
        # Update existing document
        doc_id_obj = existing["_id"]
    else:
        # Create new document
        doc_id_obj = ObjectId()
    
    # Get file extension from original filename
    file_ext = Path(original_filename).suffix or ""
    
    # Create file path: <SESSION_ID>/<doc_id><extension>
    file_path = f"{session_id}/{doc_id}{file_ext}"
    
    # Ensure store directory exists
    session_dir = ensure_store_directory(session_id)
    
    # Save file to disk
    file_path_full = session_dir / f"{doc_id}{file_ext}"
    with open(file_path_full, "wb") as f:
        f.write(file_content)
    
    # Create document entry
    now = datetime.now(timezone.utc)
    doc = {
        "_id": doc_id_obj,
        "session_id": session_id,
        "doc_id": doc_id,
        "doc_name": doc_name,
        "original_filename": original_filename,
        "file_path": file_path,
        "file_size": file_size,
        "uploaded_at": now,
        "verification_status": "pending",  # Initial status: pending verification
        "verification_feedback": None,
        "verified_at": None
    }
    
    # Upsert document (insert or update)
    documents_collection.update_one(
        {"session_id": session_id, "doc_id": doc_id},
        {"$set": doc},
        upsert=True
    )
    
    # Update session's documents array
    session = get_session(session_id)
    if session:
        documents = session.get("documents", [])
        # Convert existing ObjectIds to ObjectId type if they're strings
        documents = [ObjectId(did) if isinstance(did, str) else did for did in documents]
        # Check if this document_id is already in the list (by comparing ObjectIds)
        if not any(str(did) == str(doc_id_obj) for did in documents):
            documents.append(doc_id_obj)
            update_session(session_id, documents=documents)
    
    return doc  # type: ignore


def get_documents_by_session(session_id: str) -> List[Document]:
    """Get all documents for a session."""
    return list(documents_collection.find({"session_id": session_id}).sort("uploaded_at", 1))  # type: ignore


def get_document_by_doc_id(session_id: str, doc_id: str) -> Optional[Document]:
    """Get a specific document by session_id and doc_id."""
    return documents_collection.find_one({"session_id": session_id, "doc_id": doc_id})  # type: ignore


def get_document_by_object_id(document_id: ObjectId) -> Optional[Document]:
    """Get a document by its ObjectId."""
    return documents_collection.find_one({"_id": document_id})  # type: ignore

