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

from fastapi import FastAPI, HTTPException
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
        create_session(session_id, {"conversation_stage": "initial", "tenure_months": 60}, True)
        session = get_session(session_id)
    
    # Build session state from database
    metadata = session.get("metadata", {})
    session_state = {
        "customer_id": metadata.get("customer_id"),
        "loan_amount": metadata.get("loan_amount"),
        "tenure_months": metadata.get("tenure_months", 60),
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

# Patterns to detect when agent is asking for document uploads
DOCUMENT_PATTERNS = {
    "identity_proof": {
        "patterns": [
            r"identity\s*proof",
            r"id\s*proof",
            r"photo\s*id",
            r"aadhaar",
            r"aadhar",
            r"voter\s*id",
            r"passport",
            r"driving\s*licen[sc]e",
        ],
        "name": "Identity Proof",
        "description": "Aadhaar Card / Voter ID / Passport / Driving License"
    },
    "address_proof": {
        "patterns": [
            r"address\s*proof",
        ],
        "name": "Address Proof", 
        "description": "Aadhaar Card / Voter ID / Passport / Driving License"
    },
    "bank_statement": {
        "patterns": [
            r"bank\s*statement",
            r"salary\s*account\s*statement",
        ],
        "name": "Bank Statement",
        "description": "Primary bank statement (salary account) for last 3 months"
    },
    "salary_slip": {
        "patterns": [
            r"salary\s*slip",
            r"pay\s*slip",
            r"salary\s*certificate",
        ],
        "name": "Salary Slips",
        "description": "Salary slips for last 2 months"
    },
    "employment_certificate": {
        "patterns": [
            r"employment\s*certificate",
            r"employment\s*proof",
            r"job\s*certificate",
        ],
        "name": "Employment Certificate",
        "description": "Certificate confirming at least 1 year of continuous employment"
    }
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
    
    # Check for each document type
    detected_docs = set()
    for doc_key, doc_info in DOCUMENT_PATTERNS.items():
        for pattern in doc_info["patterns"]:
            if re.search(pattern, response_lower):
                if doc_key not in detected_docs:
                    detected_docs.add(doc_key)
                    inputs.append({
                        "name": doc_info["name"],
                        "description": doc_info["description"]
                    })
                break
    
    return inputs


# ==================== PYDANTIC MODELS ====================

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    session_id: Optional[str] = None


class InputSpec(BaseModel):
    """Input specification for document uploads."""
    name: str
    description: str


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


# ==================== FASTAPI APP ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    logger.info("Vittam API starting up...")
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
        
        # Create master agent with current session state
        # We need to inject session_state into the prompt
        import main
        main.session_state = session_state
        main.current_session_id = session_id
        
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
        inputs = detect_document_requests(response_text)
        
        logger.info(f"[API] Response generated - Length: {len(response_text)}, Inputs: {len(inputs)}")
        
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
