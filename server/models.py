"""Database Models and Type Definitions"""

from typing import TypedDict, Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId


class SessionMetadata(TypedDict, total=False):
    """Session metadata"""

    customer_id: Optional[str]
    loan_amount: Optional[float]
    tenure_months: Optional[int]
    conversation_stage: Optional[str]
    customer_data: Optional[Dict[str, Any]]
    current_state: Optional[Dict[str, Any]]


class Session(TypedDict, total=False):
    """Session document"""

    _id: Optional[ObjectId]
    session_id: str
    created_at: datetime
    updated_at: datetime
    metadata: SessionMetadata
    is_active: bool
    documents: List[ObjectId]


class Conversation(TypedDict, total=False):
    """Conversation document"""

    _id: Optional[ObjectId]
    session_id: str
    message: Dict[str, Any]  # {"role": str, "content": str, "timestamp": datetime}
    created_at: datetime
    agent_type: Optional[str]


class CurrentLoan(TypedDict):
    """Single loan entry for a user"""

    type: str
    emi: float
    outstanding: float


class User(TypedDict):
    """User document for the users collection"""

    _id: Optional[ObjectId]
    name: Optional[str]
    dob: Optional[datetime]
    city: Optional[str]
    phone: Optional[str]  # 10-digit Indian phone number (no +91 prefix)
    email: Optional[str]
    current_loans: Optional[List[CurrentLoan]]
    pre_approved_limit: Optional[float]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class Kyc(TypedDict):
    """KYC document for the kycs collection"""

    _id: Optional[ObjectId]
    name: Optional[str]
    pan: Optional[str]
    credit_score: Optional[int]
    phone: Optional[str]
    address: Optional[str]
    dob: Optional[datetime]


class OfferTemplate(TypedDict):
    """Offer template document for the offer_template collection"""

    _id: Optional[ObjectId]
    name: Optional[str]
    min_credit_score: Optional[int]
    max_credit_score: Optional[int]
    min_amount: Optional[float]
    max_amount: Optional[float]
    min_tenure_months: Optional[int]
    max_tenure_months: Optional[int]
    base_rate: Optional[float]
    processing_fee_pct: Optional[float]
    active: Optional[bool]


class Document(TypedDict, total=False):
    """Document document for the documents collection"""

    _id: Optional[ObjectId]
    session_id: str
    doc_id: str  # e.g., "identity_proof", "bank_statement"
    doc_name: str  # e.g., "Identity Proof", "Bank Statement"
    original_filename: str
    file_path: str  # e.g., "<SESSION_ID>/identity_proof"
    file_size: int  # Size in bytes
    uploaded_at: datetime
    verification_status: Optional[str]  # "verified", "unverified", "rejected", "pending"
    verification_feedback: Optional[str]  # Feedback from verification (if rejected)
    verified_at: Optional[datetime]  # When document was verified
