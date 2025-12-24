"""
Multi-Agent Personal Loan Sales System

Master Agent orchestrates four specialized Worker Agents:
1. Sales Agent - Needs analysis, persuasion, offers, objection handling
2. Verification Agent - KYC, PAN, phone verification
3. Underwriting Agent - Credit score, eligibility, risk assessment
4. Sanction Letter Agent - Generate sanction letter, terms, disbursement info

Requirements:
- Set OPENAI_API_KEY environment variable
- LangChain v1.1.0+
"""

import os
import json
import logging
import uuid
from typing import Optional, Dict
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from services import (
    verify_kyc_details, verify_pan, verify_phone, verify_otp,
    fetch_credit_score, get_pre_approved_limit, calculate_emi,
    check_eligibility, verify_salary_slip, generate_sanction_letter,
    get_customer_by_id, get_customer_by_phone, get_customer_by_pan,
    get_interest_rate, get_offers_for_credit_score, get_loan_charges_info,
    get_required_documents
)
from document_verification_service import verify_session_documents
from document_service import get_documents_by_session
from session_service import create_session, get_session, update_session
from conversation_service import create_conversation
from models import SessionMetadata

# Import ALLOWED_DOCUMENT_TYPES - use lazy import to avoid circular dependency
ALLOWED_DOCUMENT_TYPES = None

def _get_allowed_document_types():
    """Lazy import of ALLOWED_DOCUMENT_TYPES to avoid circular dependency."""
    global ALLOWED_DOCUMENT_TYPES
    if ALLOWED_DOCUMENT_TYPES is None:
        try:
            from app import ALLOWED_DOCUMENT_TYPES as doc_types
            ALLOWED_DOCUMENT_TYPES = doc_types
        except ImportError:
            # Fallback if import fails
            ALLOWED_DOCUMENT_TYPES = {
                "identity_proof": {"name": "Identity Proof"},
                "address_proof": {"name": "Address Proof"},
                "bank_statement": {"name": "Bank Statement"},
                "salary_slip": {"name": "Salary Slips"},
                "employment_certificate": {"name": "Employment Certificate"}
            }
    return ALLOWED_DOCUMENT_TYPES

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s',
    # format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
BASE_URL = os.getenv("OPENAI_API_BASE")
TEMPERATURE = 0.1

# Initialize model
model = ChatOpenAI(
    model=MODEL_NAME,
    base_url=BASE_URL if BASE_URL else None,
    temperature=TEMPERATURE,
    max_completion_tokens=1000,
    timeout=30,
)

# Session state to maintain conversation context
session_state = {
    "customer_id": None,
    "loan_amount": None,
    "tenure_months": None,
    "conversation_stage": "initial",  # initial, needs_analysis, verification, underwriting, sanction
    "customer_data": None,
    "conversation_history": []
}

# Current session ID
current_session_id: Optional[str] = None
verified_documents: Dict[str, bool] = {}  # Document verification status: {doc_id: is_verified}


# ==================== SALES AGENT TOOLS ====================

@tool
def analyze_customer_needs(query: str) -> str:
    """
    Analyze customer needs from their query to extract:
    - Desired loan amount
    - Purpose of loan
    - Urgency level
    - Budget constraints
    
    Input: Customer's query or statement about their loan needs
    Returns: JSON string with analyzed needs
    """
    logger.info(f"[TOOL] analyze_customer_needs called with query: {query[:100]}...")
    # This is a simple extraction - in production, this would use NLP/LLM
    analysis = {
        "intent": "loan_inquiry",
        "extracted_info": {
            "loan_amount_mentioned": None,
            "purpose": None,
            "urgency": "normal"
        },
        "message": "Analyzed customer needs from query"
    }
    result = json.dumps(analysis, indent=2)
    logger.info(f"[TOOL] analyze_customer_needs completed")
    return result


@tool
def handle_objection(objection_type: str, context: str = "") -> str:
    """
    Handle common customer objections with persuasive responses.
    
    Common objections:
    - interest_rate: Customer concerned about high interest rates
    - tenure: Customer wants different tenure
    - amount: Customer wants higher/lower amount
    - process: Customer concerned about process complexity
    - existing_loans: Customer has existing EMIs
    - documents: Customer concerned about documentation
    - time: Customer wants faster processing
    
    Input: objection_type (string), optional context
    Returns: Persuasive response addressing the objection
    """
    logger.info(f"[TOOL] handle_objection called - type: {objection_type}, context: {context[:50] if context else 'None'}...")
    responses = {
        "interest_rate": """
        I completely understand your concern about interest rates! Here's the good news - at Tata Capital, 
        we offer personal loans starting from just 10.99% p.a.! 
        
        Your actual rate depends on your credit score:
        - Excellent credit (750+): 10.99% - 12%
        - Good credit (700-749): 12.5% - 14.5%
        
        Plus, we have flexible tenure options that can significantly reduce your monthly EMI burden.
        Would you like me to check what rate you qualify for? I just need your PAN to give you an exact figure!
        """,
        "tenure": """
        Great question! We offer super flexible tenure options from 12 to 60 months (that's up to 5 years!).
        
        Here's how it works:
        - Longer tenure = Lower EMI (easier on monthly budget)
        - Shorter tenure = Save on total interest
        
        For example, on a ₹5 lakh loan at 10.99%:
        - 36 months: EMI ~₹16,300
        - 60 months: EMI ~₹10,900
        
        What monthly EMI would be comfortable for you? I can work backwards to find the perfect tenure!
        """,
        "amount": """
        Absolutely! We offer personal loans ranging from ₹50,000 to ₹50 lakhs - so there's definitely 
        something that fits your needs!
        
        The amount you're eligible for depends on:
        - Your credit score
        - Monthly income
        - Existing loan obligations
        
        Many of our customers have pre-approved limits ready! Would you like me to check yours? 
        It takes just a minute with your PAN number.
        """,
        "process": """
        I love this question because our process is incredibly simple! Here's all it takes:
        
        1️⃣ Quick verification (just PAN + phone OTP) - 2 mins
        2️⃣ Instant eligibility check - 1 min
        3️⃣ Document upload (salary slip, bank statement) - 5 mins
        4️⃣ Sanction letter generation - instant!
        
        Total time: Just 10-15 minutes, all from this chat! No branch visits, no lengthy forms.
        
        Ready to get started? Share your PAN and let's check your eligibility!
        """,
        "existing_loans": """
        Great question! Having existing loans doesn't disqualify you at all. Here's how we look at it:
        
        We use the 50% EMI-to-income rule:
        - Your total EMIs (existing + new loan) should be ≤ 50% of your salary
        
        For example, if you earn ₹80,000/month:
        - Maximum total EMI allowed: ₹40,000
        - Existing EMIs: ₹15,000
        - New loan EMI possible: up to ₹25,000!
        
        Want me to do a quick eligibility check? I can factor in your existing obligations.
        """,
        "documents": """
        Our documentation is minimal! Here's all you need:
        
        Identity/Address Proof (any one): Aadhaar, PAN, Voter ID, Passport, Driving License
        Income Proof: Last 2 months' salary slips + 3 months' bank statement
        Employment: Certificate showing 1 year of continuous employment
        
        Most customers already have these handy! And you can upload them right here in our chat.
        
        Shall we proceed? Which documents do you have ready?
        """,
        "time": """
        Speed is our specialty! Here's our timeline:
        
        Eligibility check: Instant (right now!)
        Sanction letter: Within minutes of approval
        Disbursement: 24-48 hours after document verification
        
        We've had customers go from first inquiry to money in account in under 2 days!
        
        Let's get you started right away - what's your PAN number?
        """
    }
    
    response = responses.get(objection_type.lower(), 
        "I completely understand your concern! Let me help you find the best solution. Could you tell me a bit more about what's on your mind? I'm here to make this as easy as possible for you.")
    
    result = json.dumps({
        "objection_type": objection_type,
        "response": response.strip(),
        "suggested_next_action": "Continue conversation to address concern and move toward application"
    }, indent=2)
    logger.info(f"[TOOL] handle_objection completed for type: {objection_type}")
    return result


@tool
def generate_offer(customer_id: Optional[str] = None, loan_amount: Optional[float] = None, 
                   tenure_months: int = 60) -> str:
    """
    Generate a personalized loan offer based on customer profile using offer templates from database.
    
    Input: customer_id (optional), loan_amount (optional), tenure_months (default 60)
    Returns: Personalized offer with EMI, interest rate, and benefits from offer_template collection
    """
    logger.info(f"[TOOL] generate_offer called - customer_id: {customer_id}, loan_amount: {loan_amount}, tenure: {tenure_months}")
    if customer_id:
        customer = get_customer_by_id(customer_id)
        if customer:
            credit_score = customer.get("credit_score", 700)
            pre_approved = customer.get("pre_approved_limit", 0)
            salary = customer.get("salary")
            
            if not loan_amount:
                loan_amount = min(pre_approved, 500000) if pre_approved else 500000
            
            # Get offers from database based on credit score
            offers_result = get_offers_for_credit_score(credit_score, loan_amount)
            best_offer = offers_result.get("best_offer", {})
            
            # Use the best offer's rate or calculate based on credit score
            interest_rate = best_offer.get("base_rate") or get_interest_rate(credit_score, loan_amount)
            processing_fee_pct = best_offer.get("processing_fee_pct", 3.5)
            
            emi_result = calculate_emi(loan_amount, tenure_months, interest_rate)
            processing_fee = loan_amount * (processing_fee_pct / 100)
            
            offer = {
                "customer_id": customer_id,
                "customer_name": customer.get("name"),
                "loan_amount": loan_amount,
                "tenure_months": tenure_months,
                "interest_rate": interest_rate,
                "emi": emi_result["emi"],
                "total_amount": emi_result.get("total_amount"),
                "total_interest": emi_result.get("total_interest"),
                "pre_approved_limit": pre_approved,
                "credit_score": credit_score,
                "processing_fee": processing_fee,
                "processing_fee_pct": processing_fee_pct,
                "offer_name": best_offer.get("name", "Tata Capital Personal Loan"),
                "approval_type": "instant" if loan_amount <= pre_approved else "conditional",
                "benefits": [
                    "Interest rate starting from 10.99% p.a.",
                    "Flexible tenure: 12 to 60 months",
                    "Quick disbursement within 24-48 hours",
                    "Minimal documentation",
                    "No collateral required",
                    "Prepayment allowed after 12 months"
                ],
                "charges": {
                    "processing_fee": f"₹{processing_fee:,.0f} ({processing_fee_pct}% + GST)",
                    "penal_charges": "3% per month on defaulted amount",
                    "prepayment": "Allowed after 12 months with minimal charges"
                },
                "message": f"Great news, {customer.get('name', 'valued customer')}! Based on your excellent profile (credit score: {credit_score}), you qualify for ₹{loan_amount:,.0f} at just {interest_rate}% p.a. with EMI of only ₹{emi_result['emi']:,.0f}/month!"
            }
            result = json.dumps(offer, indent=2)
            logger.info(f"[TOOL] generate_offer completed for customer: {customer_id}")
            return result
    
    # Generic offer if no customer ID - still enticing!
    charges_info = get_loan_charges_info()
    generic_offer = {
        "loan_amount": loan_amount or 500000,
        "tenure_months": tenure_months,
        "interest_rate_starting": "10.99%",
        "benefits": [
            "Personal loans from ₹50,000 to ₹50 lakhs",
            "Interest rates starting 10.99% p.a.",
            "Flexible tenure up to 60 months",
            "Quick approval in minutes",
            "Disbursement within 24-48 hours"
        ],
        "charges": charges_info.get("charges", {}),
        "message": "I'd love to create a personalized offer just for you! 🎯 To check your pre-approved limit and best interest rate, could you share your PAN number? It takes just a minute!"
    }
    logger.info(f"[TOOL] generate_offer completed (generic offer)")
    return json.dumps(generic_offer, indent=2)


@tool
def get_available_offers(credit_score: int, loan_amount: float = None) -> str:
    """
    Get all available loan offers from database based on credit score.
    
    Input: credit_score (required), loan_amount (optional)
    Returns: List of matching offers with rates and terms
    """
    logger.info(f"[TOOL] get_available_offers called - credit_score: {credit_score}, loan_amount: {loan_amount}")
    result = get_offers_for_credit_score(credit_score, loan_amount)
    logger.info(f"[TOOL] get_available_offers completed - found {result.get('total_offers', 0)} offers")
    return json.dumps(result, indent=2)


@tool
def get_document_requirements() -> str:
    """
    Get list of documents required for loan application.
    
    Returns: Document checklist with categories
    """
    logger.info(f"[TOOL] get_document_requirements called")
    result = get_required_documents()
    logger.info(f"[TOOL] get_document_requirements completed")
    return json.dumps(result, indent=2)


@tool
def get_charges_and_fees() -> str:
    """
    Get all loan charges, fees, and interest rate information.
    
    Returns: Complete fee structure
    """
    logger.info(f"[TOOL] get_charges_and_fees called")
    result = get_loan_charges_info()
    logger.info(f"[TOOL] get_charges_and_fees completed")
    return json.dumps(result, indent=2)


@tool
def detect_intent(user_query: str) -> str:
    """
    Detect user intent from their query.
    Categories: curious, serious, urgent, objection, information_seeking
    
    Input: User's query
    Returns: Intent classification with confidence
    """
    logger.info(f"[TOOL] detect_intent called with query: {user_query[:100]}...")
    query_lower = user_query.lower()
    
    urgent_keywords = ["urgent", "asap", "immediately", "quick", "fast", "today"]
    serious_keywords = ["apply", "interested", "want", "need", "proceed", "how do i"]
    objection_keywords = ["expensive", "high", "rate", "cost", "too much", "better", "cheaper"]
    info_keywords = ["what", "how", "tell me", "explain", "information"]
    
    if any(kw in query_lower for kw in urgent_keywords):
        intent = "urgent"
        confidence = 0.8
    elif any(kw in query_lower for kw in serious_keywords):
        intent = "serious"
        confidence = 0.75
    elif any(kw in query_lower for kw in objection_keywords):
        intent = "objection"
        confidence = 0.7
    elif any(kw in query_lower for kw in info_keywords):
        intent = "information_seeking"
        confidence = 0.7
    else:
        intent = "curious"
        confidence = 0.6
    
    result = json.dumps({
        "intent": intent,
        "confidence": confidence,
        "suggested_action": {
            "urgent": "Fast-track verification and approval",
            "serious": "Provide detailed offer and start application",
            "objection": "Address concern with persuasive response",
            "information_seeking": "Provide clear information",
            "curious": "Engage with benefits and features"
        }.get(intent, "Continue conversation")
    }, indent=2)
    logger.info(f"[TOOL] detect_intent completed - detected intent: {intent} (confidence: {confidence})")
    return result


# ==================== VERIFICATION AGENT TOOLS ====================

@tool
def verify_customer_kyc(name: str, dob: str, address: str, pan: str) -> str:
    """
    Verify customer KYC details (name, DOB, address, PAN).
    
    Input: name, dob (YYYY-MM-DD), address, pan
    Returns: Verification result with customer_id if verified
    """
    logger.info(f"[TOOL] verify_customer_kyc called - name: {name}, pan: {pan}")
    result = verify_kyc_details(name, dob, address, pan)
    if result["verified"]:
        session_state["customer_id"] = result["customer_id"]
        session_state["customer_data"] = result["customer_data"]
        session_state["conversation_stage"] = "verification"
        # Update session in database
        sync_session_to_db()
        logger.info(f"[TOOL] verify_customer_kyc - KYC verified for customer: {result['customer_id']}")
    else:
        logger.warning(f"[TOOL] verify_customer_kyc - KYC verification failed")
    return json.dumps(result, indent=2)


@tool
def verify_customer_pan(pan: str) -> str:
    """
    Verify PAN number format and existence in database.
    
    Input: PAN number (10 characters)
    Returns: Verification result with customer_id if found
    """
    logger.info(f"[TOOL] verify_customer_pan called - PAN: {pan}")
    result = verify_pan(pan)
    if result["verified"]:
        customer = get_customer_by_pan(pan)
        if customer:
            session_state["customer_id"] = result["customer_id"]
            session_state["customer_data"] = customer
            session_state["conversation_stage"] = "verification"
            # Update session in database
            sync_session_to_db()
            logger.info(f"[TOOL] verify_customer_pan - PAN verified for customer: {result['customer_id']}")
    else:
        logger.warning(f"[TOOL] verify_customer_pan - PAN verification failed")
    return json.dumps(result, indent=2)


@tool
def verify_customer_phone(phone: str) -> str:
    """
    Verify phone number and send OTP.
    
    Input: Phone number (with or without country code)
    Returns: OTP sent confirmation (OTP is 123456 for testing)
    """
    logger.info(f"[TOOL] verify_customer_phone called - phone: {phone}")
    result = verify_phone(phone)
    if result["verified"]:
        session_state["customer_id"] = result["customer_id"]
        if not session_state["customer_data"]:
            customer = get_customer_by_phone(phone)
            if customer:
                session_state["customer_data"] = customer
        # Update session in database
        sync_session_to_db()
        logger.info(f"[TOOL] verify_customer_phone - OTP sent to {phone} for customer: {result.get('customer_id')}")
    else:
        logger.warning(f"[TOOL] verify_customer_phone - Phone verification failed")
    return json.dumps(result, indent=2)


@tool
def verify_customer_otp(phone: str, otp: str) -> str:
    """
    Verify OTP sent to phone number.
    
    Input: phone number, otp (6 digits)
    Returns: Verification result
    """
    logger.info(f"[TOOL] verify_customer_otp called - phone: {phone}, OTP: {otp}")
    result = verify_otp(phone, otp)
    if result["verified"]:
        session_state["conversation_stage"] = "underwriting"
        # Update session in database
        sync_session_to_db()
        logger.info(f"[TOOL] verify_customer_otp - OTP verified successfully")
    else:
        logger.warning(f"[TOOL] verify_customer_otp - OTP verification failed")
    return json.dumps(result, indent=2)


# ==================== UNDERWRITING AGENT TOOLS ====================

@tool
def get_customer_credit_score(customer_id: str) -> str:
    """
    Fetch credit score from credit bureau for a customer.
    
    Input: customer_id
    Returns: Credit score (out of 900)
    """
    logger.info(f"[TOOL] get_customer_credit_score called - customer_id: {customer_id}")
    result = fetch_credit_score(customer_id)
    logger.info(f"[TOOL] get_customer_credit_score completed - score: {result.get('credit_score', 'N/A')}")
    return json.dumps(result, indent=2)


@tool
def get_customer_preapproved_limit(customer_id: str) -> str:
    """
    Get pre-approved loan limit from offer mart.
    
    Input: customer_id
    Returns: Pre-approved limit amount
    """
    logger.info(f"[TOOL] get_customer_preapproved_limit called - customer_id: {customer_id}")
    result = get_pre_approved_limit(customer_id)
    logger.info(f"[TOOL] get_customer_preapproved_limit completed - limit: ₹{result.get('pre_approved_limit', 'N/A'):,}" if result.get('pre_approved_limit') else "[TOOL] get_customer_preapproved_limit completed")
    return json.dumps(result, indent=2)


@tool
def check_loan_eligibility(customer_id: str, requested_amount: float, tenure_months: int = 60) -> str:
    """
    Check loan eligibility based on risk rules.
    Returns: approved, conditionally_approved, or rejected with reasons.
    
    Rules:
    - Instant approval if amount <= pre-approved limit
    - Conditional approval if amount <= 2x pre-approved limit (requires salary slip)
    - Rejection if amount > 2x pre-approved limit OR credit score < 700
    
    Input: customer_id, requested_amount, tenure_months (default 60)
    """
    logger.info(f"[TOOL] check_loan_eligibility called - customer_id: {customer_id}, amount: ₹{requested_amount:,.0f}, tenure: {tenure_months} months")
    result = check_eligibility(customer_id, requested_amount, tenure_months)
    if result["eligible"]:
        session_state["loan_amount"] = requested_amount
        session_state["tenure_months"] = tenure_months
        if result["status"] == "approved":
            session_state["conversation_stage"] = "sanction"
            logger.info(f"[TOOL] check_loan_eligibility - Loan APPROVED (instant) for customer: {customer_id}")
        else:
            session_state["conversation_stage"] = "underwriting"
            logger.info(f"[TOOL] check_loan_eligibility - Loan CONDITIONALLY APPROVED for customer: {customer_id}")
        # Update session in database
        sync_session_to_db()
    else:
        logger.warning(f"[TOOL] check_loan_eligibility - Loan REJECTED for customer: {customer_id}, reason: {result.get('reason', 'N/A')}")
    return json.dumps(result, indent=2)


@tool
def calculate_loan_emi(loan_amount: float, tenure_months: int, interest_rate: float) -> str:
    """
    Calculate EMI for given loan parameters.
    
    Input: loan_amount, tenure_months, interest_rate (annual %)
    Returns: EMI calculation details
    """
    logger.info(f"[TOOL] calculate_loan_emi called - amount: ₹{loan_amount:,.0f}, tenure: {tenure_months} months, rate: {interest_rate}%")
    result = calculate_emi(loan_amount, tenure_months, interest_rate)
    if result.get("success"):
        logger.info(f"[TOOL] calculate_loan_emi completed - EMI: ₹{result.get('emi', 'N/A'):,.2f}")
    return json.dumps(result, indent=2)


@tool
def verify_salary_slip_upload(customer_id: str, uploaded: bool = True) -> str:
    """
    Verify uploaded salary slip (simulated - accepts any upload for testing).
    
    Input: customer_id, uploaded (boolean)
    Returns: Verification result
    """
    logger.info(f"[TOOL] verify_salary_slip_upload called - customer_id: {customer_id}, uploaded: {uploaded}")
    result = verify_salary_slip(customer_id, uploaded)
    if result["verified"]:
        logger.info(f"[TOOL] verify_salary_slip_upload - Salary slip verified for customer: {customer_id}")
        # Re-check eligibility after salary slip verification
        if session_state["loan_amount"]:
            eligibility = check_eligibility(
                customer_id, 
                session_state["loan_amount"], 
                session_state["tenure_months"]
            )
            if eligibility["status"] == "approved":
                session_state["conversation_stage"] = "sanction"
                # Update session in database
                sync_session_to_db()
                logger.info(f"[TOOL] verify_salary_slip_upload - Loan approved after salary slip verification")
    else:
        logger.warning(f"[TOOL] verify_salary_slip_upload - Salary slip verification failed")
    return json.dumps(result, indent=2)


@tool
def verify_uploaded_documents(session_id: str) -> str:
    """
    Verify all uploaded documents for a session using AI verification.
    
    This tool verifies documents to check:
    1. If the document is the correct type (e.g., Identity Proof is actually Aadhaar/Voter ID/etc.)
    2. If the document is clear and readable
    3. If the document is complete
    
    Input: session_id
    Returns: Verification results for all documents with status (verified/rejected) and feedback
    
    IMPORTANT:
    - Only call this after documents have been uploaded
    - If documents are rejected, inform customer to reupload only the rejected documents
    - Do NOT ask for documents multiple times - only ask to resubmit if verification fails
    """
    logger.info(f"[TOOL] verify_uploaded_documents called - session_id: {session_id}")
    
    try:
        # Verify all documents
        result = verify_session_documents(session_id)
        
        # Format response for agent
        if result.get("all_verified", False):
            message = f"✅ All documents verified successfully! All {result.get('verified_count', 0)} documents are correct and ready."
        else:
            verified_count = result.get("verified_count", 0)
            rejected_count = result.get("rejected_count", 0)
            message = f"Document verification completed:\n"
            message += f"- Verified: {verified_count} documents\n"
            message += f"- Rejected: {rejected_count} documents\n\n"
            message += "Rejected documents need to be reuploaded:\n"
            
            for doc_result in result.get("results", []):
                if not doc_result.get("verified", False):
                    doc_name = doc_result.get("doc_name", "Unknown")
                    feedback = doc_result.get("feedback", "Document verification failed")
                    message += f"- {doc_name}: {feedback}\n"
        
        logger.info(f"[TOOL] verify_uploaded_documents - Session: {session_id}, All verified: {result.get('all_verified', False)}")
        return json.dumps({
            "success": True,
            "all_verified": result.get("all_verified", False),
            "message": message,
            "results": result.get("results", [])
        }, indent=2)
        
    except Exception as e:
        logger.error(f"[TOOL] verify_uploaded_documents - Error: {str(e)}")
        return json.dumps({
            "success": False,
            "message": f"Error verifying documents: {str(e)}"
        }, indent=2)


@tool
def check_document_verification_status(session_id: Optional[str] = None) -> str:
    """
    Check the verification status of all uploaded documents for the current session.
    
    Input: session_id (optional - will use current session if not provided)
    Returns: Status of all documents (pending, verified, rejected) with details
    
    Use this to check if all documents are verified before proceeding to sanction letter.
    
    IMPORTANT: If session_id is not provided, this will automatically use the current session.
    """
    # Use current_session_id if session_id not provided or if it looks invalid (not a UUID format)
    # UUIDs typically have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars with 4 dashes)
    if not session_id or len(session_id) < 30 or session_id.count('-') < 4:
        if current_session_id:
            logger.info(f"[TOOL] check_document_verification_status - Using current_session_id: {current_session_id} (provided: {session_id})")
            session_id = current_session_id
        else:
            logger.error(f"[TOOL] check_document_verification_status - No valid session_id provided and current_session_id is None")
            return json.dumps({
                "success": False,
                "message": "Session ID not available. Please ensure you're in an active session."
            }, indent=2)
    
    logger.info(f"[TOOL] check_document_verification_status called - session_id: {session_id}")
    
    try:
        # Get all documents for session
        documents = get_documents_by_session(session_id)
        
        if not documents:
            return json.dumps({
                "success": True,
                "message": "No documents uploaded yet",
                "documents": [],
                "all_verified": False
            }, indent=2)
        
        # Format document statuses
        doc_statuses = []
        all_verified = True
        pending_count = 0
        verified_count = 0
        rejected_count = 0
        
        for doc in documents:
            status = doc.get("verification_status", "pending")
            doc_statuses.append({
                "doc_id": doc["doc_id"],
                "doc_name": doc["doc_name"],
                "status": status,
                "feedback": doc.get("verification_feedback")
            })
            
            if status == "pending":
                pending_count += 1
                all_verified = False
            elif status == "verified":
                verified_count += 1
            elif status == "rejected":
                rejected_count += 1
                all_verified = False
        
        message = f"Document Status:\n"
        message += f"- Verified: {verified_count}\n"
        message += f"- Pending: {pending_count}\n"
        message += f"- Rejected: {rejected_count}\n"
        
        if all_verified and verified_count > 0:
            message += "\n✅ All documents are verified and ready!"
        elif rejected_count > 0:
            message += "\n⚠️ Some documents need to be reuploaded."
        elif pending_count > 0:
            message += "\n⏳ Some documents are pending verification."
        
        return json.dumps({
            "success": True,
            "message": message,
            "documents": doc_statuses,
            "all_verified": all_verified,
            "verified_count": verified_count,
            "pending_count": pending_count,
            "rejected_count": rejected_count
        }, indent=2)
        
    except Exception as e:
        logger.error(f"[TOOL] check_document_verification_status - Error: {str(e)}")
        return json.dumps({
            "success": False,
            "message": f"Error checking document status: {str(e)}"
        }, indent=2)


# ==================== SANCTION LETTER AGENT TOOLS ====================

@tool
def generate_loan_sanction_letter(customer_id: str, loan_amount: float, 
                                  tenure_months: int, interest_rate: float) -> str:
    """
    Generate sanction letter for approved loan.
    
    ⚠️ PREREQUISITES - This tool can ONLY be called after:
    1. KYC is fully verified (customer_id must exist and be verified)
    2. Loan is approved (instant or conditional)
    3. ALL required documents are uploaded and verified
    4. Bank account details are collected from customer
    
    Input: customer_id, loan_amount, tenure_months, interest_rate
    Returns: Sanction letter summary with all terms and conditions
    
    Note: This is the LAST step in the loan process. Never call this before all verifications are complete.
    """
    logger.info(f"[TOOL] generate_loan_sanction_letter called - customer_id: {customer_id}, amount: ₹{loan_amount:,.0f}, tenure: {tenure_months} months, rate: {interest_rate}%")
    logger.info(f"[TOOL] generate_loan_sanction_letter - Current session_id: {current_session_id}, conversation_stage: {session_state.get('conversation_stage')}")
    
    # Verify customer exists and is verified
    customer = get_customer_by_id(customer_id)
    if not customer:
        error_msg = "Cannot generate sanction letter: Customer not found or KYC not verified. Please complete KYC verification first."
        logger.error(f"[TOOL] generate_loan_sanction_letter - {error_msg}")
        return json.dumps({"success": False, "message": error_msg}, indent=2)
    logger.info(f"[TOOL] generate_loan_sanction_letter - Customer found: {customer.get('name', 'N/A')}")
    
    # Check if loan is approved (should be in underwriting stage or already approved)
    conversation_stage = session_state.get("conversation_stage")
    logger.info(f"[TOOL] generate_loan_sanction_letter - Conversation stage check: {conversation_stage}")
    if conversation_stage not in ["underwriting", "sanction"]:
        error_msg = f"Cannot generate sanction letter: Loan approval not confirmed. Current stage: {conversation_stage}. Please complete underwriting and get loan approval first."
        logger.error(f"[TOOL] generate_loan_sanction_letter - {error_msg}")
        return json.dumps({"success": False, "message": error_msg}, indent=2)
    
    # Check document verification status
    if current_session_id:
        try:
            logger.info(f"[TOOL] generate_loan_sanction_letter - Checking document verification status for session: {current_session_id}")
            status_result = check_document_verification_status(current_session_id)
            status_data = json.loads(status_result)
            logger.info(f"[TOOL] generate_loan_sanction_letter - Document status: all_verified={status_data.get('all_verified')}, pending={status_data.get('pending_count', 0)}, rejected={status_data.get('rejected_count', 0)}")
            if not status_data.get("all_verified", False):
                pending = status_data.get("pending_count", 0)
                rejected = status_data.get("rejected_count", 0)
                error_msg = f"Cannot generate sanction letter: Documents verification incomplete. Pending: {pending}, Rejected: {rejected}. Please verify all documents first."
                logger.error(f"[TOOL] generate_loan_sanction_letter - {error_msg}")
                return json.dumps({"success": False, "message": error_msg}, indent=2)
        except Exception as e:
            logger.warning(f"[TOOL] generate_loan_sanction_letter - Could not check document status: {str(e)}")
            import traceback
            logger.warning(f"[TOOL] generate_loan_sanction_letter - Document check traceback: {traceback.format_exc()}")
            # Continue anyway, but log the warning
    else:
        logger.warning(f"[TOOL] generate_loan_sanction_letter - current_session_id is None, skipping document verification check")
    
    try:
        logger.info(f"[TOOL] generate_loan_sanction_letter - Calling generate_sanction_letter service with: customer_id={customer_id}, loan_amount={loan_amount}, tenure_months={tenure_months}, interest_rate={interest_rate}")
        result = generate_sanction_letter(customer_id, loan_amount, tenure_months, interest_rate)
        logger.info(f"[TOOL] generate_loan_sanction_letter - Service returned: success={result.get('success')}, message={result.get('message', 'N/A')[:100]}")
        
        if result.get("success"):
            session_state["conversation_stage"] = "sanction"
            # Update session in database
            sync_session_to_db()
            logger.info(f"[TOOL] generate_loan_sanction_letter - Sanction letter generated successfully for customer: {customer_id}")
        else:
            error_msg = result.get("message", "Unknown error")
            logger.error(f"[TOOL] generate_loan_sanction_letter - Failed to generate sanction letter. Error: {error_msg}")
        return json.dumps(result, indent=2)
    except Exception as e:
        logger.error(f"[TOOL] generate_loan_sanction_letter - Exception occurred: {str(e)}")
        import traceback
        logger.error(f"[TOOL] generate_loan_sanction_letter - Traceback: {traceback.format_exc()}")
        return json.dumps({
            "success": False,
            "message": f"Technical error during sanction letter generation: {str(e)}"
        }, indent=2)


@tool
def get_loan_terms_and_conditions() -> str:
    """
    Get standard loan terms and conditions including all charges.
    
    Returns: Complete terms, conditions, and fee structure
    """
    logger.info(f"[TOOL] get_loan_terms_and_conditions called")
    terms = {
        "loan_features": {
            "interest_rate": "10.99% p.a. onwards",
            "loan_amount_range": "₹50,000 to ₹50,00,000",
            "tenure_range": "12 to 60 months",
            "disbursement_time": "24-48 hours after document verification",
            "collateral": "Not required",
            "purpose": "Any personal purpose"
        },
        "charges": {
            "processing_fee": "Up to 3.5% of loan amount + GST",
            "penal_charges": "3% per month on defaulted amount (Annualized 36%)",
            "cheque_dishonour": "₹600 per instrument per instance",
            "mandate_rejection": "₹450",
            "statement_of_account": "₹250 + GST for physical copy (digital free)",
            "loan_cancellation": "2% of loan amount OR ₹5,750 (whichever is higher)",
            "annual_maintenance_hybrid": "0.25% of dropline amount OR ₹1,000 (whichever is higher) - payable at end of 13th month"
        },
        "terms": [
            "Fixed interest rate for entire tenure",
            "Prepayment allowed after 12 months with applicable charges",
            "Default in payment attracts penal charges as mentioned",
            "All disputes subject to jurisdiction of Mumbai courts",
            "Loan amount disbursed directly to customer's bank account",
            "EMI debited automatically via NACH/Auto-debit mandate",
            "Sanction letter valid for 30 days from date of issue"
        ],
        "eligibility_criteria": {
            "age": "21-60 years",
            "minimum_credit_score": 700,
            "minimum_salary": "₹25,000 per month",
            "residency": "Indian resident",
            "employment": "Minimum 1 year continuous employment"
        },
        "required_documents": {
            "always_required": {
                "identity_proof": "Aadhaar, Voter ID, Passport, or Driving License",
                "address_proof": "Same as identity proof",
                "bank_statement": "Last 3 months (salary account)"
            },
            "conditional_only": {
                "note": "Only required when loan amount > pre-approved limit",
                "salary_slips": "Last 2 months",
                "employment_certificate": "Showing 1 year continuous employment"
            }
        }
    }
    logger.info(f"[TOOL] get_loan_terms_and_conditions completed")
    return json.dumps(terms, indent=2)


@tool
def get_disbursement_information(customer_id: str) -> str:
    """
    Get disbursement information and next steps.
    
    Input: customer_id
    Returns: Disbursement process details
    """
    logger.info(f"[TOOL] get_disbursement_information called - customer_id: {customer_id}")
    customer = get_customer_by_id(customer_id)
    if customer:
        info = {
            "customer_id": customer_id,
            "customer_name": customer["name"],
            "disbursement_process": [
                "1. Complete KYC verification (if not done)",
                "2. Sign loan agreement",
                "3. Provide bank account details for disbursement",
                "4. Loan amount will be credited within 24-48 hours"
            ],
            "required_documents": [
                "PAN card",
                "Aadhaar card",
                "Salary slip (last 3 months)",
                "Bank statements (last 6 months)"
            ],
            "contact_info": "For assistance, contact our support team at support@tatacapital.com"
        }
        logger.info(f"[TOOL] get_disbursement_information completed for customer: {customer_id}")
        return json.dumps(info, indent=2)
    logger.warning(f"[TOOL] get_disbursement_information - Customer not found: {customer_id}")
    return json.dumps({"error": "Customer not found"}, indent=2)


# ==================== CREATE WORKER AGENTS ====================

# Sales Agent
sales_agent_tools = [
    analyze_customer_needs,
    handle_objection,
    generate_offer,
    detect_intent,
    get_available_offers,
    get_document_requirements,
    get_charges_and_fees
]

sales_agent = create_agent(
    model=model,
    tools=sales_agent_tools,
    system_prompt="""You are Vittam, an AI Sales Assistant for Tata Capital Personal Loans. You're a friendly, persuasive, and knowledgeable sales expert who genuinely cares about helping customers get the right loan.

YOUR IDENTITY:
- Name: Vittam (विट्टम - meaning "wealth" in Sanskrit)
- Role: AI Personal Loan Sales Assistant for Tata Capital
- Goal: Help customers through the complete loan journey and maximize successful conversions

YOUR CORE MISSION:
Increase personal loan sales success rate by guiding customers through a smooth, human-like sales journey from initial interest to loan sanction.

TATA CAPITAL PERSONAL LOAN HIGHLIGHTS:
- Interest rates starting from just 10.99% p.a.
- Loan amounts: ₹50,000 to ₹50 lakhs
- Flexible tenure: 12 to 60 months
- Quick disbursement: 24-48 hours after approval
- Minimal documentation required
- No collateral needed

REQUIRED DOCUMENTS FOR PERSONAL LOAN:
⚠️ CRITICAL: You can ONLY request these 5 document types (hardcoded). Use the EXACT keys when mentioning documents:

ALWAYS MANDATORY (request these for every loan):
1. Identity Proof - Key: "identity_proof"
   - Description: Voter ID, Passport, Driving License, or Aadhaar Card
   - When asking, mention: "Please upload your identity_proof"

2. Address Proof - Key: "address_proof"
   - Description: Voter ID, Passport, Driving License, or Aadhaar Card
   - When asking, mention: "Please upload your address_proof"

3. Bank Statement - Key: "bank_statement"
   - Description: Primary bank statement (salary account) for last 3 months
   - When asking, mention: "Please upload your bank_statement"

SOMETIMES REQUIRED (only for conditional approvals when loan > pre-approved limit):
4. Salary Slips - Key: "salary_slip"
   - Description: Salary slips for last 2 months
   - When asking, mention: "Please upload your salary_slip"

5. Employment Certificate - Key: "employment_certificate"
   - Description: Certificate confirming at least 1 year of continuous employment
   - When asking, mention: "Please upload your employment_certificate"

⚠️ IMPORTANT RULES:
- Use the EXACT keys (identity_proof, address_proof, bank_statement, salary_slip, employment_certificate) when mentioning documents
- Do NOT ask for any other document types. Only request these 5 types.
- Do NOT ask for salary_slip or employment_certificate upfront. Only request these when the underwriting process identifies a conditional approval scenario.
- Always use lowercase with underscores when mentioning document types (e.g., "identity_proof", not "Identity Proof" or "identity proof")

⚠️ NEVER ASK FOR:
- Power of Attorney - NEVER request this under any circumstances
- Physical signatures - All approvals are 100% electronic/digital
- Signature documents - No physical signing required

CHARGES TO BE TRANSPARENT ABOUT:
- Processing Fee: Up to 3.5% of loan amount + GST
- Penal Charges: 3% per month on defaulted amount
- Cheque Dishonour: ₹600 per instance
- Prepayment: Allowed after 12 months

CRITICAL - CREDIT SCORE < 700 HANDLING:
If at any point you learn the customer has a credit score below 700, we CANNOT provide a loan. In this case:
- Be empathetic and apologetic
- Explain that our minimum credit score requirement is 700
- Direct them to speak with a human agent for alternative options
- Provide the helpline: "Please call our customer support at 1860 267 6060 for personalized assistance"

YOUR APPROACH:
1. ENGAGE warmly - greet customers by name, show genuine interest in their needs
2. UNDERSTAND deeply - ask about loan purpose, amount needed, timeline, concerns
3. EXCITE with personalized offers - use the generate_offer tool to create compelling proposals
4. HANDLE objections with empathy - use handle_objection tool, address concerns genuinely
5. GUIDE toward action - always have a clear next step (verify PAN, check eligibility, etc.)

CONVERSATION STYLE:
- Be conversational, warm, and enthusiastic - NOT robotic!
- Celebrate good news: "Great news!", "Fantastic!", "I'm excited to share..."
- Address concerns with empathy first: "I completely understand..." then offer solutions
- Use customer's name when known
- Reference previous conversation points to show you're listening
- Always move toward the next step in the loan journey
- Create urgency without being pushy: "Let me lock in this rate for you"

SALES TECHNIQUES:
- Highlight benefits, not just features
- Use social proof: "Many of our customers in similar situations..."
- Create value: "This rate is exclusive to your credit profile"
- Overcome objections by reframing: "Actually, that's a great thing because..."
- Trial close: "Shall we proceed with the verification?"

Remember: You're building a relationship and trust. Your goal is to help customers get the loan they need while ensuring Tata Capital's conversion success. Be the helpful relationship manager everyone wishes they had!"""

)

# Verification Agent
verification_agent_tools = [
    verify_customer_kyc,
    verify_customer_pan,
    verify_customer_phone,
    verify_customer_otp,
    get_document_requirements
]

verification_agent = create_agent(
    model=model,
    tools=verification_agent_tools,
    system_prompt="""You are Vittam's Verification Module for Tata Capital Personal Loans. Your role is to smoothly guide customers through the KYC verification process.

YOUR MISSION:
Complete verification quickly and smoothly while making customers feel secure and informed about the process.

⚠️ CRITICAL VERIFICATION FLOW - SINGLE STEP ONLY ⚠️
1. Ask customer for PAN card number ONLY
2. Use verify_customer_pan tool to verify PAN
3. PAN verification automatically retrieves customer details including phone number, credit score, and all other information
4. After PAN is verified, customer is immediately ready for underwriting
5. DO NOT ask for phone number or OTP - PAN verification handles everything automatically
6. DO NOT ask for credit score - it's retrieved automatically after PAN verification

VERIFICATION PROCESS (SINGLE STEP):
1. PAN Verification - Ask customer for PAN number (10 characters, format: ABCDE1234F)
   - Use verify_customer_pan tool to verify PAN
   - If verified, customer_id, customer_data, phone number, and credit score are automatically retrieved
   - No additional steps needed - verification is complete after PAN verification
2. After successful PAN verification, customer is ready for underwriting
   - All customer details (including credit score) are automatically available
   - Credit score and other details are fetched automatically - DO NOT ask customer for them

DOCUMENTS REQUIRED FOR VERIFICATION:
- PAN Card number (mandatory - this is the ONLY thing needed)

PROCESS FLOW (SINGLE STEP):
1. Ask for PAN card number → Verify using verify_customer_pan tool
2. Once PAN is verified → Customer details (including credit score) are automatically available for underwriting
3. Inform customer that verification is complete and they're ready for eligibility check

COMMUNICATION STYLE:
- Be reassuring: "Your information is secure and encrypted"
- Be helpful: Explain that PAN verification is all that's needed
- Be efficient: Don't ask for unnecessary information
- Celebrate progress: "Great! PAN verified successfully! ✅ Your verification is complete."
- Guide clearly: "Now let me check your eligibility and pre-approved loan limit"

ERROR HANDLING:
- If PAN not found: "I couldn't find this PAN in our system. Please check the format and try again. PAN should be 10 characters (e.g., ABCDE1234F)"
- If PAN format is wrong: "The PAN format seems incorrect. Please provide your PAN in the format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)"

SECURITY REMINDERS:
- All data is encrypted and secure
- PAN verification automatically retrieves all necessary information

After successful PAN verification, inform the customer that verification is complete and they're ready for eligibility check. Hand off smoothly to the underwriting process."""
)

# Underwriting Agent
underwriting_agent_tools = [
    get_customer_credit_score,
    get_customer_preapproved_limit,
    check_loan_eligibility,
    calculate_loan_emi,
    verify_salary_slip_upload,
    get_available_offers,
    get_charges_and_fees,
    verify_uploaded_documents,
    check_document_verification_status
]

underwriting_agent = create_agent(
    model=model,
    tools=underwriting_agent_tools,
    system_prompt="""You are Vittam's Underwriting Module for Tata Capital Personal Loans. Your role is to assess loan eligibility and make approval decisions based on risk rules.

YOUR MISSION:
Evaluate customer eligibility fairly while maximizing approval rates for qualified customers. Be transparent about decisions and guide customers through any additional requirements.

⚠️ CRITICAL - DO NOT ASK FOR CREDIT SCORE DIRECTLY ⚠️
- NEVER ask the customer for their credit score
- Credit score is fetched automatically from the backend after PAN verification
- You can ONLY access credit score through the get_customer_credit_score tool AFTER customer has provided PAN and it's been verified
- The credit score is retrieved automatically from our systems - customers don't need to provide it

CREDIT SCORE ASSESSMENT (out of 900 max):
- Credit score is fetched automatically from backend after PAN verification
- Use get_customer_credit_score tool to retrieve it (requires customer_id from verified PAN)
- Score ranges:
  • 750+ : Excellent - Best rates (10.99% onwards)
  • 700-749: Good - Competitive rates (12.5% onwards)
  • Below 700: CANNOT PROVIDE LOAN - Must refer to human agent

⚠️ CRITICAL - CREDIT SCORE BELOW 700 = HARD REJECTION ⚠️
If customer's credit score is below 700, we CANNOT provide a loan under ANY circumstances.
In this case, you MUST:
1. Be empathetic: "I'm sorry, but based on your current credit score of [X]..."
2. Explain clearly: "Our minimum credit score requirement is 700 for personal loans"
3. Refer to human agent: "For personalized assistance and alternative options, please contact our customer support team"
4. Provide helpline: "📞 Call: 1860 267 6060"
5. Do NOT proceed with any loan application or offer

ELIGIBILITY RULES (CRITICAL - FOLLOW STRICTLY):

1. INSTANT APPROVAL ✅
   Condition: Credit score ≥ 700 AND Requested loan amount ≤ Pre-approved limit
   Action: Approve immediately
   Documents needed: Photo ID, Address Proof, Bank Statement (3 months)
   Example: Pre-approved ₹5L, requests ₹4L → APPROVE INSTANTLY

2. CONDITIONAL APPROVAL (HIGHER RISK - NEED MORE DOCS)
   Condition: Credit score ≥ 700 AND Requested amount ≤ 2x Pre-approved limit
   Requirements:
   - Request salary slip upload (last 2 months)
   - Request employment certificate (1 year continuous employment)
   - Verify expected EMI ≤ 50% of monthly salary
   Example: Pre-approved ₹5L, requests ₹8L → Check if EMI fits 50% salary rule
   
   ONLY in this conditional case, ask for:
   - Salary Slips: Copies for last 2 months
   - Employment Certificate: Confirming at least 1 year of continuous employment

3. REJECTION ❌
   Conditions (ANY of these):
   - Credit score < 700 → HARD REJECTION, refer to human agent at 1860 267 6060
   - Requested amount > 2x Pre-approved limit
   Example: Credit score 680 → REJECT and refer to 1860 267 6060
   Example: Pre-approved ₹5L, requests ₹12L → REJECT (exceeds 2x limit)

EMI CALCULATION:
Use the formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
Where: P = Principal, r = monthly rate, n = tenure in months

OFFERS FROM DATABASE:
- Use get_available_offers tool to fetch offers matching customer's credit score
- Match offers based on:
  • Credit score range (min_credit_score to max_credit_score)
  • Loan amount range (min_amount to max_amount)
  • Tenure range (min_tenure_months to max_tenure_months)
- Use base_rate from matching offer template

INTEREST RATES & CHARGES:
- Base rate: 10.99% p.a. onwards
- Processing fee: Up to 3.5% + GST
- Penal charges: 3% per month on defaulted amount (36% annualized)
- Cheque dishonour: ₹600 per instance

COMMUNICATION STYLE:
- Be clear and transparent about decisions
- For APPROVALS: Celebrate! "Great news! You're approved for..."
- For CONDITIONAL: Be encouraging but clear about additional documents needed
- For REJECTIONS due to credit score < 700: Be empathetic and ALWAYS provide helpline 1860 267 6060
- Always explain the math behind EMI calculations
- Show how rate was determined based on credit score

AFTER APPROVAL:
Once approved (instant or after salary verification), inform customer about next steps:
1. Upload all required documents (Identity Proof, Address Proof, Bank Statement, and Salary Slips/Employment Certificate if conditional)
2. Provide bank account details (account number, IFSC code, account holder name)
3. Wait for document verification to complete
4. Only after ALL documents are verified and bank details are collected, then proceed to sanction letter generation

⚠️ IMPORTANT: Do NOT proceed to sanction letter immediately after approval. Ensure all documents are uploaded and bank details are provided first."""
)

# Sanction Letter Agent
sanction_agent_tools = [
    generate_loan_sanction_letter,
    get_loan_terms_and_conditions,
    get_disbursement_information,
    get_charges_and_fees,
    check_document_verification_status
]

sanction_agent = create_agent(
    model=model,
    tools=sanction_agent_tools,
    system_prompt="""You are Vittam's Sanction Letter Generator for Tata Capital Personal Loans. Your role is to create official sanction letters ONLY after all verifications are complete. This is the FINAL and LAST step in the loan process.

⚠️ CRITICAL PREREQUISITES - SANCTION LETTER CAN ONLY BE GENERATED AFTER:
1. ✅ KYC is fully verified (PAN verification completed and customer_id is available)
2. ✅ Loan approval is confirmed (instant or conditional approval after salary verification)
3. ✅ ALL required documents are uploaded and verified:
   - Identity Proof (uploaded)
   - Address Proof (uploaded)
   - Bank Statement (uploaded)
   - Salary Slips (if required for conditional approval - uploaded)
   - Employment Certificate (if required for conditional approval - uploaded)
4. ✅ Bank account details are collected from customer (account number, IFSC code, account holder name)
5. ✅ All document verifications are complete

⚠️ NEVER DO THE FOLLOWING:
- NEVER ask for power of attorney or any signature documents
- NEVER ask for physical signatures - approval is 100% electronic/digital
- NEVER generate sanction letter before all prerequisites above are met
- NEVER skip verification steps to rush to sanction letter
- NEVER generate sanction letter just after knowing loan requirements

APPROVAL METHOD:
- All approvals are ELECTRONIC/DIGITAL - no physical signatures required
- Customer acceptance is through digital confirmation
- No power of attorney or signature documents needed
- Loan agreement is digital

SANCTION LETTER MUST INCLUDE:
1. Customer details (name, customer ID)
2. Loan amount sanctioned
3. Interest rate (p.a.)
4. Tenure (months)
5. EMI amount
6. Total amount payable
7. Processing fee (Up to 3.5% + GST)
8. Disbursement account details (bank account number, IFSC, account holder name)
9. Disbursement timeline (24-48 hours)
10. Validity period (30 days from sanction date)

CHARGES TO DISCLOSE (TRANSPARENCY IS KEY):
- Processing Fee: Up to 3.5% of loan amount + GST
- Penal Charges: 3% per month on defaulted amount (36% annualized)
- Cheque Dishonour: ₹600 per instrument per instance
- Mandate Rejection: ₹450
- Statement Charges: ₹250 + GST for physical copy
- Loan Cancellation: 2% of loan amount OR ₹5,750 (whichever is higher)
- Annual Maintenance (Hybrid): 0.25% of dropline amount OR ₹1,000 (whichever is higher)

TERMS TO HIGHLIGHT:
- Fixed interest rate for entire tenure
- Prepayment allowed after 12 months
- EMI deducted via NACH/Auto-debit
- Loan for any personal purpose
- No collateral required
- Electronic approval - no physical signatures needed

WORKFLOW BEFORE SANCTION LETTER:
1. Use check_document_verification_status tool (call it without parameters or with current session_id) to verify ALL documents are verified
2. If any documents are not verified, inform customer and wait for verification
3. Collect bank account details if not already provided:
   - Account number
   - IFSC code
   - Account holder name (must match customer name)
4. Only after ALL documents are verified AND bank details are collected, generate sanction letter using generate_loan_sanction_letter tool

⚠️ CRITICAL: Never generate sanction letter if check_document_verification_status shows any documents are not verified!

⚠️ MANDATORY: You MUST call generate_loan_sanction_letter tool to generate the sanction letter. The tool requires:
- customer_id: Get from session_state or conversation context
- loan_amount: Get from session_state or conversation context  
- tenure_months: Get from session_state or conversation context (default to 60 if not specified)
- interest_rate: Get from conversation context or use default (12.5% if not specified)

DO NOT skip calling this tool - it is the ONLY way to generate the sanction letter. If you don't have these values, extract them from the conversation history or session state.

COMMUNICATION STYLE:
- Celebrate the milestone: "Congratulations! Your loan is sanctioned!"
- Be thorough but not overwhelming with information
- Highlight key figures: amount, EMI, rate
- Explain charges clearly and transparently
- Emphasize electronic approval: "Your approval is completely digital - no physical signatures needed!"
- Create excitement about the quick disbursement
- End with clear next steps

IMPORTANT:
- Sanction letter is valid for 30 days only - create urgency
- Ensure all calculations are accurate
- Double-check customer name and details
- Verify bank account details are correct before generating
- Provide contact info for any questions
- This is the LAST step - make it special!

Remember: Sanction letter is ONLY generated after ALL verifications, document uploads, and bank details collection are complete. Never rush this step!"""
)


# ==================== MASTER AGENT ====================

def get_conversation_summary() -> str:
    """Get a summary of conversation context for worker agents."""
    summary_parts = []
    if session_state.get("customer_id"):
        summary_parts.append(f"Customer ID: {session_state['customer_id']}")
    if session_state.get("loan_amount"):
        summary_parts.append(f"Loan amount discussed: ₹{session_state['loan_amount']:,.0f}")
    if session_state.get("tenure_months"):
        summary_parts.append(f"Tenure discussed: {session_state['tenure_months']} months")
    if session_state.get("conversation_stage"):
        summary_parts.append(f"Current stage: {session_state['conversation_stage']}")
    
    # Get last few messages for context
    if session_state.get("conversation_history"):
        recent_messages = session_state["conversation_history"][-4:]  # Last 4 messages
        context_text = "\n".join([
            f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content[:100]}"
            for msg in recent_messages if hasattr(msg, 'content')
        ])
        if context_text:
            summary_parts.append(f"Recent conversation:\n{context_text}")
    
    return "\n".join(summary_parts) if summary_parts else "No previous context"


def call_sales_agent(query: str, conversation_context: list = None) -> str:
    """Call Sales Agent to handle sales-related queries."""
    logger.info(f"[AGENT] Sales Agent called with query: {query[:100]}...")
    try:
        # Include conversation context if available
        messages = conversation_context.copy() if conversation_context else []
        
        # Add context summary to help agent remember
        context_summary = get_conversation_summary()
        if context_summary and context_summary != "No previous context":
            enhanced_query = f"[Conversation Context: {context_summary}]\n\nUser's current message: {query}"
        else:
            enhanced_query = query
        
        messages.append(HumanMessage(content=enhanced_query))
        
        result = sales_agent.invoke({"messages": messages})
        if isinstance(result, dict) and "messages" in result:
            response = result["messages"][-1].content
            logger.info(f"[AGENT] Sales Agent completed successfully")
            return response
        elif isinstance(result, list):
            response = result[-1].content if hasattr(result[-1], 'content') else str(result[-1])
            logger.info(f"[AGENT] Sales Agent completed successfully")
            return response
        logger.info(f"[AGENT] Sales Agent completed successfully")
        return str(result)
    except Exception as e:
        logger.error(f"[AGENT] Sales Agent error: {str(e)}")
        return f"Error in Sales Agent: {str(e)}"


def call_verification_agent(query: str, conversation_context: list = None) -> str:
    """Call Verification Agent to handle verification tasks."""
    logger.info(f"[AGENT] Verification Agent called with query: {query[:100]}...")
    try:
        # Include conversation context if available
        messages = conversation_context.copy() if conversation_context else []
        
        # Add context summary
        context_summary = get_conversation_summary()
        if context_summary and context_summary != "No previous context":
            enhanced_query = f"[Conversation Context: {context_summary}]\n\nUser's current message: {query}"
        else:
            enhanced_query = query
        
        messages.append(HumanMessage(content=enhanced_query))
        
        result = verification_agent.invoke({"messages": messages})
        if isinstance(result, dict) and "messages" in result:
            response = result["messages"][-1].content
            logger.info(f"[AGENT] Verification Agent completed successfully")
            return response
        elif isinstance(result, list):
            response = result[-1].content if hasattr(result[-1], 'content') else str(result[-1])
            logger.info(f"[AGENT] Verification Agent completed successfully")
            return response
        logger.info(f"[AGENT] Verification Agent completed successfully")
        return str(result)
    except Exception as e:
        logger.error(f"[AGENT] Verification Agent error: {str(e)}")
        return f"Error in Verification Agent: {str(e)}"


def call_underwriting_agent(query: str, conversation_context: list = None) -> str:
    """Call Underwriting Agent to handle underwriting tasks."""
    logger.info(f"[AGENT] Underwriting Agent called with query: {query[:100]}...")
    try:
        # Include conversation context if available
        messages = conversation_context.copy() if conversation_context else []
        
        # Add context summary
        context_summary = get_conversation_summary()
        if context_summary and context_summary != "No previous context":
            enhanced_query = f"[Conversation Context: {context_summary}]\n\nUser's current message: {query}"
        else:
            enhanced_query = query
        
        messages.append(HumanMessage(content=enhanced_query))
        
        result = underwriting_agent.invoke({"messages": messages})
        if isinstance(result, dict) and "messages" in result:
            response = result["messages"][-1].content
            logger.info(f"[AGENT] Underwriting Agent completed successfully")
            return response
        elif isinstance(result, list):
            response = result[-1].content if hasattr(result[-1], 'content') else str(result[-1])
            logger.info(f"[AGENT] Underwriting Agent completed successfully")
            return response
        logger.info(f"[AGENT] Underwriting Agent completed successfully")
        return str(result)
    except Exception as e:
        logger.error(f"[AGENT] Underwriting Agent error: {str(e)}")
        return f"Error in Underwriting Agent: {str(e)}"


def call_sanction_agent(query: str, conversation_context: list = None) -> str:
    """Call Sanction Letter Agent to handle sanction letter generation."""
    logger.info(f"[AGENT] Sanction Letter Agent called with query: {query[:100]}...")
    try:
        # Include conversation context if available
        messages = conversation_context.copy() if conversation_context else []
        
        # Add context summary
        context_summary = get_conversation_summary()
        if context_summary and context_summary != "No previous context":
            enhanced_query = f"[Conversation Context: {context_summary}]\n\nUser's current message: {query}"
        else:
            enhanced_query = query
        
        messages.append(HumanMessage(content=enhanced_query))
        
        result = sanction_agent.invoke({"messages": messages})
        if isinstance(result, dict) and "messages" in result:
            response = result["messages"][-1].content
            logger.info(f"[AGENT] Sanction Letter Agent completed successfully")
            return response
        elif isinstance(result, list):
            response = result[-1].content if hasattr(result[-1], 'content') else str(result[-1])
            logger.info(f"[AGENT] Sanction Letter Agent completed successfully")
            return response
        logger.info(f"[AGENT] Sanction Letter Agent completed successfully")
        return str(result)
    except Exception as e:
        logger.error(f"[AGENT] Sanction Letter Agent error: {str(e)}")
        return f"Error in Sanction Letter Agent: {str(e)}"


# Master Agent tools (worker agents as tools)
@tool
def route_to_sales_agent(query: str) -> str:
    """Route to Sales Agent for: needs analysis, objection handling, offer generation, intent detection, initial sales conversations."""
    # Pass conversation history to maintain context
    return call_sales_agent(query, session_state.get("conversation_history", []))


@tool
def route_to_verification_agent(query: str) -> str:
    """Route to Verification Agent for: KYC verification, PAN verification, phone verification, OTP verification."""
    # Pass conversation history to maintain context
    return call_verification_agent(query, session_state.get("conversation_history", []))


@tool
def route_to_underwriting_agent(query: str) -> str:
    """Route to Underwriting Agent for: credit score checks, eligibility checks, pre-approved limits, EMI calculations, risk assessment."""
    # Pass conversation history to maintain context
    return call_underwriting_agent(query, session_state.get("conversation_history", []))


@tool
def route_to_sanction_agent(query: str) -> str:
    """
    Route to Sanction Letter Agent for: generating sanction letters, terms and conditions, disbursement information.
    
    ⚠️ CRITICAL: Only route to sanction agent when ALL prerequisites are met:
    1. KYC verified (customer_id available)
    2. Loan approved
    3. All documents uploaded and verified
    4. Bank account details collected
    
    Never route to sanction agent just after knowing requirements or before verifications are complete.
    """
    # Verify prerequisites before routing
    if not session_state.get("customer_id"):
        return "Cannot proceed to sanction letter: KYC verification is required first. Please verify your PAN number."
    
    if session_state.get("conversation_stage") not in ["underwriting", "sanction"]:
        return "Cannot proceed to sanction letter: Loan approval is required first. Please complete the underwriting process."
    
    # Pass conversation history to maintain context
    return call_sanction_agent(query, session_state.get("conversation_history", []))


master_agent_tools = [
    route_to_sales_agent,
    route_to_verification_agent,
    route_to_underwriting_agent,
    route_to_sanction_agent
]

# Master Agent will be created with dynamic prompt in main()
# We'll create a function to get the system prompt with current state
def get_master_agent_prompt() -> str:
    """Get Master Agent system prompt with current session state."""
    # Get verified document status
    verified_docs = verified_documents if verified_documents else {}
    
    # Get ALLOWED_DOCUMENT_TYPES (lazy import)
    doc_types = _get_allowed_document_types()
    
    # Format verified documents info for prompt
    verified_docs_list = []
    unverified_docs_list = []
    for doc_id, doc_info in doc_types.items():
        is_verified = verified_docs.get(doc_id, False)
        doc_name = doc_info["name"]
        if is_verified:
            verified_docs_list.append(f"- {doc_name} ({doc_id}) ✓ VERIFIED")
        else:
            unverified_docs_list.append(f"- {doc_name} ({doc_id}) ✗ NOT VERIFIED")
    
    verified_docs_section = ""
    if verified_docs_list:
        verified_docs_section = f"""
✅ VERIFIED DOCUMENTS (DO NOT ASK FOR THESE - They are already verified):
{chr(10).join(verified_docs_list)}

⚠️ CRITICAL: The documents listed above are ALREADY VERIFIED. Do NOT ask the customer to upload them again.
"""
    
    unverified_docs_section = ""
    if unverified_docs_list:
        unverified_docs_section = f"""
❌ DOCUMENTS NOT YET VERIFIED (You may need to ask for these):
{chr(10).join(unverified_docs_list)}
"""
    
    document_status_section = verified_docs_section + unverified_docs_section if (verified_docs_section or unverified_docs_section) else ""
    
    return f"""You are VITTAM (विट्टम) - the AI-powered Personal Loan Sales Assistant for Tata Capital. Your name means "wealth" in Sanskrit, and your mission is to help customers achieve their financial goals through personal loans.

YOUR IDENTITY:
- Name: Vittam
- Company: Tata Capital
- Role: Master Orchestrator for Personal Loan Sales Journey
- Goal: MAXIMIZE loan conversion rates by guiding customers from initial interest to sanction letter

CORE BUSINESS OBJECTIVE:
Increase personal loan sales success rate through an AI-driven conversational approach. You're not just a support bot - you're a smart sales officer who understands needs, pitches the right product, handles objections, and coordinates all backend steps until sanction letter generation.

TATA CAPITAL LOAN HIGHLIGHTS (use these to excite customers):
Loan Range: ₹50,000 to ₹50 lakhs
Interest Rate: Starting 10.99% p.a.
Tenure: 12 to 60 months (flexible)
Disbursement: 24-48 hours after approval
Documentation: Minimal - ID proof, Address proof, Bank statement
No collateral required

{document_status_section}

REQUIRED DOCUMENTS FOR PERSONAL LOAN:
⚠️ CRITICAL: You can ONLY request these 5 document types (hardcoded). Use the EXACT keys when mentioning documents:

ALWAYS MANDATORY (request these for every loan):
1. Identity Proof - Key: "identity_proof"
   - Description: Voter ID, Passport, Driving License, or Aadhaar Card
   - When asking, mention: "Please upload your identity_proof"

2. Address Proof - Key: "address_proof"
   - Description: Voter ID, Passport, Driving License, or Aadhaar Card
   - When asking, mention: "Please upload your address_proof"

3. Bank Statement - Key: "bank_statement"
   - Description: Primary bank statement (salary account) for last 3 months
   - When asking, mention: "Please upload your bank_statement"

SOMETIMES REQUIRED (only for conditional approvals when loan > pre-approved limit):
4. Salary Slips - Key: "salary_slip"
   - Description: Salary slips for last 2 months
   - When asking, mention: "Please upload your salary_slip"

5. Employment Certificate - Key: "employment_certificate"
   - Description: Certificate confirming at least 1 year of continuous employment
   - When asking, mention: "Please upload your employment_certificate"

⚠️ IMPORTANT RULES:
- Use the EXACT keys (identity_proof, address_proof, bank_statement, salary_slip, employment_certificate) when mentioning documents
- Do NOT ask for any other document types. Only request these 5 types.
- Always use lowercase with underscores when mentioning document types (e.g., "identity_proof", not "Identity Proof" or "identity proof")
- ⚠️ CRITICAL: Check the VERIFIED DOCUMENTS section above. NEVER ask for documents that are already verified!
- ⚠️ CRITICAL: Check the VERIFIED DOCUMENTS section above. NEVER ask for documents that are already verified!

⚠️ NEVER ASK FOR:
- Power of Attorney - NEVER request this under any circumstances
- Physical signatures - All approvals are 100% electronic/digital
- Signature documents - No physical signing required

⚠️ CRITICAL - CREDIT SCORE < 700 = NO LOAN ⚠️
If customer's credit score is below 700, we CANNOT provide a loan under ANY circumstances.
You MUST:
1. Be empathetic and apologetic
2. Explain: "Our minimum credit score requirement is 700"
3. Refer to human agent: "📞 Please call 1860 267 6060 for personalized assistance"
4. Do NOT proceed with any loan process

UNDERWRITING RULES (memorize these):
1. INSTANT APPROVAL: Credit score ≥ 700 AND Loan amount ≤ Pre-approved limit
   → Documents: ID proof, Address proof, Bank statement only
2. CONDITIONAL: Credit score ≥ 700 AND Loan ≤ 2x Pre-approved limit + EMI ≤ 50% salary
   → Additional documents: Salary slips (2 months), Employment certificate
3. REJECTION: Credit score < 700 → Refer to human agent at 1860 267 6060
   OR Loan > 2x Pre-approved limit → Reject

CONVERSATION STAGES & ROUTING:

1️⃣ INITIAL/NEEDS ANALYSIS (Default) → Sales Agent
- Greeting, understanding needs, loan purpose
- Handling objections about rates, process, documents
- Generating personalized offers
- Detecting customer intent and urgency

2️⃣ VERIFICATION → Verification Agent
- When customer provides PAN number (ONLY STEP - single verification)
- Any KYC-related queries
- IMPORTANT: PAN verification automatically retrieves all customer details including phone number and credit score
- DO NOT ask for phone number or OTP - PAN verification handles everything
- DO NOT ask for credit score - it's retrieved automatically after PAN verification

3️⃣ UNDERWRITING → Underwriting Agent
- After PAN verification is complete (customer_id and all details automatically available)
- Credit score is already retrieved during PAN verification - no need to fetch again
- Fetching pre-approved limits
- Calculating EMIs
- Requesting/verifying salary slips for conditional approvals

4️⃣ SANCTION → Sanction Letter Agent (LAST STEP - ONLY AFTER ALL VERIFICATIONS)
- ⚠️ CRITICAL: Sanction letter is the FINAL and LAST step
- ⚠️ NEVER route to sanction agent until ALL prerequisites are met:
  1. KYC fully verified (PAN verified, customer_id available)
  2. Loan approved (instant or conditional after salary verification)
  3. ALL required documents uploaded and verified:
     - Identity Proof ✓
     - Address Proof ✓
     - Bank Statement ✓
     - Salary Slips (if conditional approval) ✓
     - Employment Certificate (if conditional approval) ✓
  4. Bank account details collected (account number, IFSC, account holder name)
  5. All document verifications complete
- Generating sanction letter ONLY after all above are complete
- Explaining terms, conditions, and charges
- Providing disbursement information

⚠️ NEVER DO:
- NEVER route to sanction agent just after knowing loan requirements
- NEVER generate sanction letter before KYC verification
- NEVER generate sanction letter before documents are uploaded
- NEVER generate sanction letter before bank details are collected
- NEVER ask for power of attorney or signatures - approval is 100% electronic

ROUTING INTELLIGENCE:
- Default to Sales Agent for any general conversation
- Switch to Verification when customer shares PAN number
- IMPORTANT: PAN verification is a single step that automatically retrieves all customer details including phone and credit score
- NEVER ask customer for phone number or OTP - PAN verification handles everything automatically
- NEVER ask customer for credit score directly - it's retrieved automatically after PAN verification
- Switch to Underwriting after successful PAN verification (when customer_id is available)
- Switch to Sanction ONLY after:
  ✓ Loan approval confirmed
  ✓ All documents uploaded and verified
  ✓ Bank account details collected
  ✓ All verifications complete

CONVERSATION CONTEXT - CRITICAL:
- ALWAYS read the FULL conversation history in messages
- Remember: loan amounts, purposes, tenure preferences, customer name
- Reference earlier conversation: "As you mentioned earlier about needing ₹5 lakhs for your wedding..."
- NEVER ask for information already provided
- Show you're listening: "Great question about the interest rate!"

SALES-FOCUSED COMMUNICATION:
- Be warm, enthusiastic, and persuasive
- Use customer's name frequently
- Celebrate good news: "Great news! You're pre-approved for..."
- Handle concerns with empathy first, then solutions
- Create appropriate urgency: "Let me lock in this rate for you before it changes"
- Always have a clear next step: "Let's verify your PAN to see your exact rate"
- Don't let conversations stall - guide toward action

KEY OBJECTION RESPONSES:
- Interest rate concerns → "Starting 10.99% p.a., best rates for good credit scores"
- Process concerns → "Just 10-15 minutes, all in this chat, no branch visits"
- Document concerns → "Just 3 simple documents - ID, address proof, and bank statement"
- Time concerns → "Sanction in minutes, money in account within 24-48 hours"

BENEFITS TO HIGHLIGHT:
✅ Quick approval - often instant for pre-approved customers
✅ Competitive rates based on credit profile
✅ Flexible tenure to fit monthly budget
✅ No collateral, no guarantor needed
✅ Use for any purpose - wedding, travel, home improvement, medical
✅ Prepayment allowed after 12 months

CHARGES TO BE TRANSPARENT ABOUT:
- Processing: Up to 3.5% + GST
- Penal charges: 3% per month on default
- Prepayment: Allowed after 12 months

Current conversation stage: {session_state["conversation_stage"]}
Current customer ID: {session_state["customer_id"] or "Not identified yet"}

Remember: You're simulating a human-like, full sales journey. Higher conversion and faster loan journeys mean happy customers and successful business. Be the relationship manager everyone wishes they had!"""

# Create master agent (will be recreated with updated prompt when needed)
master_agent = create_agent(
    model=model,
    tools=master_agent_tools,
    system_prompt=get_master_agent_prompt()
)


# ==================== DATABASE INTEGRATION ====================

def sync_session_to_db():
    """Sync session_state to database"""
    if not current_session_id:
        return
    metadata: SessionMetadata = {
        "customer_id": session_state.get("customer_id"),
        "loan_amount": session_state.get("loan_amount"),
        "tenure_months": session_state.get("tenure_months"),
        "conversation_stage": session_state.get("conversation_stage"),
        "customer_data": session_state.get("customer_data")
    }
    update_session(current_session_id, metadata=metadata, conversation_stage=session_state.get("conversation_stage"))


def initialize_session(session_id: Optional[str] = None) -> str:
    """Initialize or resume session"""
    global current_session_id, session_state
    if session_id and (s := get_session(session_id)):
        current_session_id = session_id
        m = s.get("metadata", {})
        session_state.update({k: m.get(k) for k in ["customer_id", "loan_amount", "tenure_months", "conversation_stage", "customer_data"]})
        session_state.setdefault("conversation_stage", "initial")
        return session_id
    new_id = session_id or str(uuid.uuid4())
    create_session(new_id, {"conversation_stage": "initial"}, True)
    current_session_id = new_id
    return new_id


# ==================== CLI INTERFACE ====================

def reset_session():
    """Reset session state for new conversation."""
    global session_state, current_session_id
    session_state = {
        "customer_id": None,
        "loan_amount": None,
        "tenure_months": None,
        "conversation_stage": "initial",
        "customer_data": None,
        "conversation_history": []
    }
    # Create a new session in database
    current_session_id = initialize_session()


def update_master_agent_prompt():
    """Update Master Agent system prompt with current session state."""
    # Note: In LangChain, we'd need to recreate the agent to update the prompt
    # For now, the agent will use tools that have access to session_state
    pass


def main():
    """Interactive CLI for loan sales system."""
    global master_agent
    
    print("=" * 80)
    print("   TATA CAPITAL PERSONAL LOANS")
    print("   Powered by VITTAM - Your AI Loan Assistant")
    print("=" * 80)
    print("\nNamaste! I'm Vittam (विट्टम), your personal loan assistant from Tata Capital!")
    print("\nI can help you with:")
    print("  Personal loans from ₹50,000 to ₹50 lakhs")
    print("  Interest rates starting 10.99% p.a.")
    print("  Quick approval - disbursement in 24-48 hours")
    print("  Check your pre-approved limit instantly")
    print("  Generate sanction letter in minutes")
    print("\nType 'exit' or 'quit' to end the conversation.")
    print("Type 'reset' to start a new conversation.")
    print("=" * 80 + "\n")
    
    # Initialize session (creates new session in database)
    reset_session()
    print(f"[New session started: {current_session_id}]\n")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("\nThank you for using Tata Capital Personal Loans. Have a great day!")
                break
            
            if user_input.lower() == 'reset':
                reset_session()
                # Recreate master agent with fresh prompt
                master_agent = create_agent(
                    model=model,
                    tools=master_agent_tools,
                    system_prompt=get_master_agent_prompt()
                )
                print("\n[Session reset. Starting fresh conversation.]\n")
                continue
            
            if not current_session_id:
                initialize_session()
            create_conversation(current_session_id, "user", user_input)
            
            # Add user message to conversation history
            user_message = HumanMessage(content=user_input)
            session_state["conversation_history"].append(user_message)
            
            # Recreate master agent with updated prompt to reflect current state
            master_agent = create_agent(
                model=model,
                tools=master_agent_tools,
                system_prompt=get_master_agent_prompt()
            )
            
            print("\n[Processing...]")
            logger.info(f"[AGENT] Master Agent called - User input: {user_input[:100]}...")
            logger.info(f"[AGENT] Master Agent - Conversation history length: {len(session_state['conversation_history'])} messages")
            logger.info(f"[AGENT] Master Agent - Session ID: {current_session_id}")
            
            # Invoke master agent with FULL conversation history
            result = master_agent.invoke({"messages": session_state["conversation_history"]})
            
            # Extract response - find the last AI message (skip tool calls)
            response = None
            if isinstance(result, dict) and "messages" in result:
                # Find the last AIMessage (not tool calls or other message types)
                for msg in reversed(result["messages"]):
                    if isinstance(msg, AIMessage) or (hasattr(msg, 'content') and hasattr(msg, 'type') and msg.type == 'ai'):
                        if hasattr(msg, 'content') and msg.content:
                            response = msg.content
                            break
                
                # Fallback: get last message with content
                if not response:
                    for msg in reversed(result["messages"]):
                        if hasattr(msg, 'content') and msg.content:
                            response = msg.content
                            break
                            
            elif isinstance(result, list):
                # If result is a list, find the last AI message
                for msg in reversed(result):
                    if isinstance(msg, AIMessage) or (hasattr(msg, 'content') and hasattr(msg, 'type') and getattr(msg, 'type', None) == 'ai'):
                        if hasattr(msg, 'content') and msg.content:
                            response = msg.content
                            break
                
                # Fallback
                if not response and result:
                    last_msg = result[-1]
                    if hasattr(last_msg, 'content'):
                        response = last_msg.content
                    else:
                        response = str(last_msg)
            
            # Final fallback
            if not response:
                response = str(result)
            
            create_conversation(current_session_id, "assistant", response, "master")
            
            # Add assistant response to history
            if response:
                session_state["conversation_history"].append(AIMessage(content=response))
                logger.info(f"[AGENT] Master Agent completed - Response length: {len(response)} characters")
            
            # Sync session state to database
            sync_session_to_db()
            
            print(f"\nAssistant: {response}\n")
            print(f"[Session ID: {current_session_id}]\n")
            print("-" * 80 + "\n")
            
        except KeyboardInterrupt:
            print("\n\nThank you for using Tata Capital Personal Loans. Have a great day!")
            break
        except Exception as e:
            print(f"\n[Error: {str(e)}]\n")
            print("Please try again or type 'exit' to quit.\n")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
