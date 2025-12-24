"""
FastAPI Application for Vittam - Tata Capital Personal Loan AI Assistant

This module provides REST API endpoints for the multi-agent loan sales system.
"""

import os
import re
import uuid
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

# Import from main.py - agent tools and configurations
from main import (
    master_agent_tools,
    get_master_agent_prompt,
    sync_session_to_db,
    model,
)
from session_service import create_session, get_session, update_session
from conversation_service import create_conversation, get_conversations
from document_service import create_document, get_documents_by_session
from document_verification_service import verify_document, verify_session_documents
from models import SessionMetadata

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# ==================== SESSION MANAGEMENT ====================

def get_or_create_session(session_id: str) -> Dict[str, Any]:
    """Get existing session from database or create a new one."""
    session = get_session(session_id)
    
    if not session:
        # Create new session in database
        create_session(session_id, {"conversation_stage": "initial"}, True)
        session = get_session(session_id)
    
    # Build session state from database
    metadata = session.get("metadata", {})
    session_state = {
        "customer_id": metadata.get("customer_id"),
        "loan_amount": metadata.get("loan_amount"),
        "tenure_months": metadata.get("tenure_months"),
        "conversation_stage": metadata.get("conversation_stage", "initial"),
        "customer_data": metadata.get("customer_data"),
    }
    
    return session_state


def get_conversation_history_from_db(session_id: str) -> List:
    """
    Get conversation history from database and convert to LangChain messages.
    Returns list of HumanMessage and AIMessage objects.
    """
    conversations = get_conversations(session_id)
    messages = []
    
    for conv in conversations:
        msg_data = conv.get("message", {})
        role = msg_data.get("role", "")
        content = msg_data.get("content", "")
        
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    
    return messages


def sync_session_state_to_db(session_id: str, session_state: Dict[str, Any]):
    """Sync session state to database."""
    metadata: SessionMetadata = {
        "customer_id": session_state.get("customer_id"),
        "loan_amount": session_state.get("loan_amount"),
        "tenure_months": session_state.get("tenure_months"),
        "conversation_stage": session_state.get("conversation_stage"),
        "customer_data": session_state.get("customer_data")
    }
    update_session(session_id, metadata=metadata, conversation_stage=session_state.get("conversation_stage"))


# ==================== DOCUMENT INPUT DETECTION ====================

# HARDCODED DOCUMENT TYPES - These are the ONLY document types allowed
ALLOWED_DOCUMENT_TYPES = {
    "identity_proof": {
        "name": "Identity Proof",
        "description": "Aadhaar Card / Voter ID / Passport / Driving License",
        "mandatory": True,  # Always required
        "key": "identity_proof",
        "patterns": [
            r"identity\s*proof",
            r"id\s*proof",
            r"photo\s*id",
            r"aadhaar",
            r"aadhar",
            r"voter\s*id",
            r"passport",
            r"driving\s*licen[sc]e",
        ]
    },
    "address_proof": {
        "name": "Address Proof",
        "description": "Aadhaar Card / Voter ID / Passport / Driving License",
        "mandatory": True,  # Always required
        "key": "address_proof",
        "patterns": [
            r"address\s*proof",
        ]
    },
    "bank_statement": {
        "name": "Bank Statement",
        "description": "Primary bank statement (salary account) for last 3 months",
        "mandatory": True,  # Always required
        "key": "bank_statement",  # Standardized key for AI to use
        "patterns": [
            r"bank\s*statement",
            r"salary\s*account\s*statement",
        ]
    },
    "salary_slip": {
        "name": "Salary Slips",
        "description": "Salary slips for last 2 months",
        "mandatory": False,  # Sometimes required (only for conditional approvals)
        "key": "salary_slip",  # Standardized key for AI to use
        "patterns": [
            r"salary\s*slip",
            r"pay\s*slip",
            r"salary\s*certificate",
        ]
    },
    "employment_certificate": {
        "name": "Employment Certificate",
        "description": "Certificate confirming at least 1 year of continuous employment",
        "mandatory": False,  # Sometimes required (only for conditional approvals)
        "key": "employment_certificate",  # Standardized key for AI to use
        "patterns": [
            r"employment\s*certificate",
            r"employment\s*proof",
            r"job\s*certificate",
        ]
    }
}

# Document keys list for AI prompts (standardized format)
DOCUMENT_TYPE_KEYS = {
    "identity_proof": "identity_proof",
    "address_proof": "address_proof", 
    "bank_statement": "bank_statement",
    "salary_slip": "salary_slip",
    "employment_certificate": "employment_certificate"
}

# Legacy DOCUMENT_PATTERNS for backward compatibility (uses ALLOWED_DOCUMENT_TYPES)
DOCUMENT_PATTERNS = {
    doc_id: {
        "name": doc_info["name"],
        "description": doc_info["description"],
        "patterns": doc_info["patterns"]
    }
    for doc_id, doc_info in ALLOWED_DOCUMENT_TYPES.items()
}

# Patterns that indicate document upload request context
UPLOAD_CONTEXT_PATTERNS = [
    r"upload",
    r"share",
    r"provide",
    r"submit",
    r"send\s*(me|us)?",
    r"attach",
    r"need.*document",
    r"require.*document",
    r"please.*document",
]


def detect_document_requests(response: str) -> List[Dict[str, str]]:
    """
    Detect if the agent is asking for document uploads.
    Returns list of input specifications for documents needed.
    
    IMPORTANT: Only detects documents from ALLOWED_DOCUMENT_TYPES.
    The AI must ONLY request these specific document types:
    - identity_proof (always mandatory)
    - address_proof (always mandatory)
    - bank_statement (always mandatory)
    - salary_slip (sometimes required)
    - employment_certificate (sometimes required)
    
    Note: PAN is NOT included as agent asks for PAN number directly (not upload)
    """
    inputs = []
    response_lower = response.lower()
    
    # Check if response contains upload context
    has_upload_context = any(
        re.search(pattern, response_lower) 
        for pattern in UPLOAD_CONTEXT_PATTERNS
    )
    
    if not has_upload_context:
        return inputs
    
    # First, check for exact key matches (AI using standardized keys like "identity_proof")
    detected_docs = set()
    for doc_id, doc_info in ALLOWED_DOCUMENT_TYPES.items():
        # Check for exact key match (e.g., "identity_proof", "bank_statement")
        # Use word boundaries to match exact keys
        key_pattern = r'\b' + re.escape(doc_id) + r'\b'
        if re.search(key_pattern, response_lower):
            if doc_id not in detected_docs:
                detected_docs.add(doc_id)
                inputs.append({
                    "name": doc_info["name"],
                    "description": doc_info["description"],
                    "doc_id": doc_id  # Always include doc_id
                })
                continue  # Skip pattern matching if key found
    
    # Then check for pattern matches (fallback for natural language)
    for doc_id, doc_info in ALLOWED_DOCUMENT_TYPES.items():
        if doc_id in detected_docs:
            continue  # Already detected via key match
        
        for pattern in doc_info["patterns"]:
            if re.search(pattern, response_lower):
                if doc_id not in detected_docs:
                    detected_docs.add(doc_id)
                    inputs.append({
                        "name": doc_info["name"],
                        "description": doc_info["description"],
                        "doc_id": doc_id  # Always include doc_id
                    })
                break
    
    return inputs


def get_doc_id_from_name(doc_name: str) -> Optional[str]:
    """
    Map document display name to doc_id.
    Returns None if not found.
    """
    for doc_key, doc_info in DOCUMENT_PATTERNS.items():
        if doc_info["name"] == doc_name:
            return doc_key
    return None


def get_verified_document_status(session_id: str) -> Dict[str, bool]:
    """
    Get verification status for all document types for a session.
    
    Returns:
        Dict mapping doc_id to verification status (True if verified, False otherwise)
        Example: {"identity_proof": True, "address_proof": True, "bank_statement": False}
    """
    try:
        # Get all documents for session
        documents = get_documents_by_session(session_id)
        
        # Create status map
        status_map = {}
        for doc in documents:
            doc_id = doc.get("doc_id")
            if doc_id:
                verification_status = doc.get("verification_status", "pending")
                status_map[doc_id] = verification_status == "verified"
        
        # Initialize all document types (set to False if not found)
        for doc_id in ALLOWED_DOCUMENT_TYPES.keys():
            if doc_id not in status_map:
                status_map[doc_id] = False
        
        return status_map
    except Exception as e:
        logger.error(f"[API] Error getting verified document status: {str(e)}")
        # Return all False on error
        return {doc_id: False for doc_id in ALLOWED_DOCUMENT_TYPES.keys()}


# ==================== PYDANTIC MODELS ====================

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    session_id: Optional[str] = None


class InputSpec(BaseModel):
    """Input specification for document uploads."""
    name: str
    description: str
    doc_id: Optional[str] = None  # Document ID (e.g., "identity_proof")


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    message: str
    inputs: List[InputSpec] = []
    session_id: str


class SessionResponse(BaseModel):
    """Response model for session creation."""
    session_id: str
    message: str


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    service: str


class DocumentUploadResponse(BaseModel):
    """Response model for document upload."""
    success: bool
    doc_id: str
    document_id: str  # ObjectId as string
    message: str


class DocumentsResponse(BaseModel):
    """Response model for getting documents."""
    session_id: str
    documents: List[Dict[str, Any]]


class DocumentVerificationResponse(BaseModel):
    """Response model for document verification."""
    success: bool
    session_id: Optional[str] = None
    document_id: Optional[str] = None
    all_verified: Optional[bool] = None
    verified: Optional[bool] = None
    is_correct_type: Optional[bool] = None
    feedback: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None
    total_documents: Optional[int] = None
    verified_count: Optional[int] = None
    rejected_count: Optional[int] = None


# ==================== FASTAPI APP ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    logger.info("Tata Capital Personal Loan AI Assistant ready!")
    yield
    logger.info("Vittam API shutting down...")


app = FastAPI(
    title="Vittam - Tata Capital Loan Assistant API",
    description="AI-powered Personal Loan Sales Assistant for Tata Capital",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== API ENDPOINTS ====================

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return HealthResponse(
        status="healthy",
        service="Vittam - Tata Capital Loan Assistant"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="Vittam - Tata Capital Loan Assistant"
    )


@app.post("/session", response_model=SessionResponse)
async def create_new_session():
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    get_or_create_session(session_id)
    
    logger.info(f"[API] New session created: {session_id}")
    
    return SessionResponse(
        session_id=session_id,
        message="Namaste! I'm Vittam (विट्टम), your personal loan assistant from Tata Capital. How can I help you today?"
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint for conversation with Vittam.
    
    Request:
    - message: User's message
    - session_id: Optional session ID (creates new if not provided)
    
    Response:
    - message: Agent's response in natural language
    - inputs: Array of document upload requirements (empty if none needed)
    - session_id: Session ID for continuing conversation
    """
    try:
        # Get or create session
        session_id = request.session_id or str(uuid.uuid4())
        session_state = get_or_create_session(session_id)
        
        logger.info(f"[API] Chat request - Session: {session_id}, Message: {request.message[:100]}...")
        
        # Store user message in database
        create_conversation(session_id, "user", request.message)
        
        # Get conversation history from database
        conversation_history = get_conversation_history_from_db(session_id)
        
        # Get verified document status BEFORE creating agent
        verified_documents = get_verified_document_status(session_id)
        
        # Create master agent with current session state
        # We need to inject session_state into the prompt
        import main
        main.session_state = session_state
        main.current_session_id = session_id
        main.verified_documents = verified_documents  # Pass verified documents to main
        
        master_agent = create_agent(
            model=model,
            tools=master_agent_tools,
            system_prompt=get_master_agent_prompt()
        )
        
        logger.info(f"[API] Invoking master agent - History length: {len(conversation_history)}")
        
        # Invoke master agent with conversation history from database
        result = master_agent.invoke({"messages": conversation_history})
        
        # Extract response from agent result
        response_text = None
        if isinstance(result, dict) and "messages" in result:
            for msg in reversed(result["messages"]):
                if isinstance(msg, AIMessage) or (hasattr(msg, 'content') and hasattr(msg, 'type') and msg.type == 'ai'):
                    if hasattr(msg, 'content') and msg.content:
                        response_text = msg.content
                        break
            
            if not response_text:
                for msg in reversed(result["messages"]):
                    if hasattr(msg, 'content') and msg.content:
                        response_text = msg.content
                        break
                        
        elif isinstance(result, list):
            for msg in reversed(result):
                if isinstance(msg, AIMessage) or (hasattr(msg, 'content') and hasattr(msg, 'type') and getattr(msg, 'type', None) == 'ai'):
                    if hasattr(msg, 'content') and msg.content:
                        response_text = msg.content
                        break
            
            if not response_text and result:
                last_msg = result[-1]
                if hasattr(last_msg, 'content'):
                    response_text = last_msg.content
                else:
                    response_text = str(last_msg)
        
        if not response_text:
            response_text = str(result)
        
        # Store assistant response in database
        create_conversation(session_id, "assistant", response_text, "master")
        
        # Update session state if needed (from tools that modify state)
        # Re-fetch session state to get any updates from tools
        updated_session_state = get_or_create_session(session_id)
        updated_session_state.update(session_state)  # Preserve any tool updates
        
        # Sync session state to database
        sync_session_state_to_db(session_id, updated_session_state)
        
        # Detect if agent is asking for document uploads
        detected_inputs = detect_document_requests(response_text)
        
        # Filter out documents that are already uploaded and verified
        if detected_inputs:
            # Get all existing documents for this session
            existing_documents = get_documents_by_session(session_id)
            
            # Create a map of doc_id -> verification_status
            existing_docs_map = {}
            for doc in existing_documents:
                doc_id = doc.get("doc_id")
                if doc_id:
                    status = doc.get("verification_status", "pending")
                    existing_docs_map[doc_id] = status
            
            # Filter inputs: only include documents that are missing or not verified
            filtered_inputs = []
            for inp in detected_inputs:
                doc_id = inp.get("doc_id")
                if doc_id:
                    # Check if document exists and is verified
                    if doc_id in existing_docs_map:
                        if existing_docs_map[doc_id] == "verified":
                            # Document is already verified, skip it
                            logger.info(f"[API] Skipping {doc_id} - already verified")
                            continue
                        else:
                            # Document exists but not verified, ask for reupload
                            logger.info(f"[API] Including {doc_id} - exists but not verified (status: {existing_docs_map[doc_id]})")
                    # Document doesn't exist or needs reupload
                    filtered_inputs.append(inp)
                else:
                    # No doc_id, include it (shouldn't happen but be safe)
                    filtered_inputs.append(inp)
            
            inputs = filtered_inputs
        else:
            inputs = []
        
        logger.info(f"[API] Response generated - Length: {len(response_text)}, Detected inputs: {len(detected_inputs)}, Filtered inputs: {len(inputs)}")
        
        return ChatResponse(
            message=response_text,
            inputs=[InputSpec(**inp) for inp in inputs],
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"[API] Error in chat: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """Get conversation history for a session."""
    try:
        history = get_conversations(session_id)
        
        if not history:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Format history
        formatted_history = []
        for msg in history:
            formatted_history.append({
                "role": msg.get("message", {}).get("role", "unknown"),
                "content": msg.get("message", {}).get("content", ""),
                "timestamp": msg.get("created_at").isoformat() if msg.get("created_at") else None
            })
        
        return {
            "session_id": session_id,
            "history": formatted_history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    try:
        # Session deletion can be handled by database cleanup if needed
        # For now, just return success
        return {
            "session_id": session_id,
            "message": "Session deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"[API] Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")


@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    session_id: str = Form(...),
    doc_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a document for a session.
    
    Request:
    - session_id: Session ID
    - doc_id: Document ID (e.g., "identity_proof", "bank_statement")
    - file: The file to upload
    
    Response:
    - success: Whether upload was successful
    - doc_id: Document ID
    - document_id: MongoDB ObjectId as string
    - message: Status message
    """
    try:
        # Validate session exists
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Validate doc_id - must be from ALLOWED_DOCUMENT_TYPES
        if doc_id not in ALLOWED_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid doc_id: {doc_id}. Allowed types: {', '.join(ALLOWED_DOCUMENT_TYPES.keys())}"
            )
        
        # Get document info
        doc_info = ALLOWED_DOCUMENT_TYPES[doc_id]
        doc_name = doc_info["name"]
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (1MB = 1048576 bytes)
        MAX_FILE_SIZE = 1048576
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds 1MB limit. Current size: {file_size} bytes"
            )
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Create document
        document = create_document(
            session_id=session_id,
            doc_id=doc_id,
            doc_name=doc_name,
            original_filename=file.filename or f"{doc_id}.pdf",
            file_content=file_content,
            file_size=file_size
        )
        
        logger.info(f"[API] Document uploaded - Session: {session_id}, Doc ID: {doc_id}, Size: {file_size} bytes")
        
        return DocumentUploadResponse(
            success=True,
            doc_id=doc_id,
            document_id=str(document["_id"]),
            message=f"Document '{doc_name}' uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error uploading document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@app.get("/documents/{session_id}", response_model=DocumentsResponse)
async def get_session_documents(session_id: str):
    """
    Get all documents for a session.
    
    Response:
    - session_id: Session ID
    - documents: List of document objects with metadata
    """
    try:
        # Validate session exists
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Get documents
        documents = get_documents_by_session(session_id)
        
        # Format documents for response
        formatted_docs = []
        for doc in documents:
            formatted_docs.append({
                "document_id": str(doc["_id"]),
                "doc_id": doc["doc_id"],
                "doc_name": doc["doc_name"],
                "original_filename": doc["original_filename"],
                "file_path": doc["file_path"],
                "file_size": doc["file_size"],
                "uploaded_at": doc["uploaded_at"].isoformat() if doc.get("uploaded_at") else None,
                "verification_status": doc.get("verification_status", "pending"),
                "verification_feedback": doc.get("verification_feedback"),
                "verified_at": doc["verified_at"].isoformat() if doc.get("verified_at") else None
            })
        
        return DocumentsResponse(
            session_id=session_id,
            documents=formatted_docs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")


@app.post("/documents/{session_id}/verify")
async def verify_session_documents_endpoint(session_id: str):
    """
    Verify all documents for a session using OpenAI.
    
    This endpoint verifies all uploaded documents for a session and updates their verification status.
    
    Response:
    - session_id: Session ID
    - all_verified: Whether all documents are verified
    - results: List of verification results for each document
    """
    try:
        # Validate session exists
        session = get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Verify all documents
        result = verify_session_documents(session_id)
        
        logger.info(f"[API] Document verification completed - Session: {session_id}, All verified: {result.get('all_verified', False)}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error verifying documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error verifying documents: {str(e)}")


@app.post("/documents/verify/{document_id}")
async def verify_single_document_endpoint(document_id: str):
    """
    Verify a single document by its document ID.
    
    Response:
    - success: Whether verification was successful
    - document_id: Document ID
    - verified: Whether document is verified
    - feedback: Verification feedback
    """
    try:
        # Verify document
        result = verify_document(document_id)
        
        if not result.get("success", False):
            raise HTTPException(status_code=404, detail=result.get("message", "Document not found"))
        
        logger.info(f"[API] Document verification completed - Document: {document_id}, Verified: {result.get('verified', False)}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error verifying document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error verifying document: {str(e)}")
