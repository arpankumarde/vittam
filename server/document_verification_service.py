"""Document Verification Service"""

import os
import json
import base64
import logging
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.messages import HumanMessage, AIMessage
import fitz  # PyMuPDF for PDF to image conversion

from document_service import get_documents_by_session, get_document_by_doc_id, STORE_DIR
from database import documents_collection

logger = logging.getLogger(__name__)

load_dotenv()

# Initialize vision-capable model for document verification
VISION_MODEL_NAME = os.getenv("VISION_MODEL", "gpt-4o")
BASE_URL = os.getenv("OPENAI_API_BASE")
TEMPERATURE = 0.1

vision_model = ChatOpenAI(
    model=VISION_MODEL_NAME,
    base_url=BASE_URL if BASE_URL else None,
    temperature=TEMPERATURE,
    # max_tokens=1000,
    timeout=30,
)


# Document type expectations for verification
DOCUMENT_TYPE_EXPECTATIONS = {
    "identity_proof": {
        "expected_types": ["Aadhaar Card", "Voter ID", "Passport", "Driving License"],
        "description": "Identity proof document (Aadhaar, Voter ID, Passport, or Driving License)",
        "key_fields": ["name", "date of birth", "photo", "document number"]
    },
    "address_proof": {
        "expected_types": ["Aadhaar Card", "Voter ID", "Passport", "Driving License", "Utility Bill"],
        "description": "Address proof document showing residential address",
        "key_fields": ["address", "name", "document number"]
    },
    "bank_statement": {
        "expected_types": ["Bank Statement"],
        "description": "Bank statement showing transaction history for last 3 months",
        "key_fields": ["account number", "bank name", "transactions", "balance", "date range"]
    },
    "salary_slip": {
        "expected_types": ["Salary Slip", "Payslip"],
        "description": "Salary slip showing monthly salary details",
        "key_fields": ["employee name", "salary amount", "month", "employer name", "deductions"]
    },
    "employment_certificate": {
        "expected_types": ["Employment Certificate", "Employment Letter", "Experience Certificate"],
        "description": "Certificate confirming employment and tenure",
        "key_fields": ["employee name", "employer name", "employment date", "designation"]
    }
}


def encode_image_to_base64(image_path: Path) -> str:
    """Encode image file to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def encode_image_bytes_to_base64(image_bytes: bytes) -> str:
    """Encode image bytes to base64 string."""
    return base64.b64encode(image_bytes).decode('utf-8')


def convert_pdf_to_images(pdf_path: Path, max_pages: int = 3) -> List[bytes]:
    """
    Convert PDF pages to image bytes.
    
    Args:
        pdf_path: Path to PDF file
        max_pages: Maximum number of pages to convert (default: 3, for multi-page documents)
    
    Returns:
        List of image bytes (PNG format)
    """
    try:
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(pdf_path)
        
        images = []
        # Convert first few pages to images (usually first page is enough for verification)
        pages_to_convert = min(len(pdf_document), max_pages)
        
        for page_num in range(pages_to_convert):
            page = pdf_document[page_num]
            
            # Convert page to image (pixmap)
            # zoom factor of 2.0 for better quality
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert pixmap to PNG bytes
            img_bytes = pix.tobytes("png")
            images.append(img_bytes)
        
        pdf_document.close()
        return images
        
    except Exception as e:
        raise Exception(f"Error converting PDF to images: {str(e)}")


def verify_document_with_langchain(
    file_path: Path,
    doc_id: str,
    doc_name: str
) -> Dict:
    """
    Verify a document using LangChain with OpenAI Vision model.
    
    Args:
        file_path: Path to the document file
        doc_id: Document ID (e.g., "identity_proof")
        doc_name: Document display name (e.g., "Identity Proof")
    
    Returns:
        Dict with verification result:
        {
            "verified": bool,
            "is_correct_type": bool,
            "feedback": str,
            "details": dict
        }
    """
    try:
        # Get document type expectations
        doc_expectations = DOCUMENT_TYPE_EXPECTATIONS.get(doc_id, {})
        expected_types = doc_expectations.get("expected_types", [])
        description = doc_expectations.get("description", "")
        key_fields = doc_expectations.get("key_fields", [])
        
        # Check file extension to determine if it's an image
        file_ext = file_path.suffix.lower()
        is_image = file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        is_pdf = file_ext == '.pdf'
        
        if not (is_image or is_pdf):
            return {
                "verified": False,
                "is_correct_type": False,
                "feedback": f"Invalid file format. Please upload an image (JPG, PNG) or PDF file.",
                "details": {}
            }
        
        # Prepare verification prompt - lenient for testing purposes
        verification_prompt = f"""You are a document verification expert. Analyze this document and verify:

IMPORTANT - TESTING MODE (LENIENT VERIFICATION):
- This is for testing purposes - accept documents even if they contain words like "DUMMY", "SPECIMEN", "SAMPLE", "TEST"
- Focus ONLY on whether the required information is present, not whether it's a real/authentic document
- If the document shows the required information clearly, accept it regardless of test/specimen labels

1. Document Type Check:
   - Expected document type: {doc_name}
   - Expected document types: {', '.join(expected_types)}
   - Document description: {description}
   - Is this document the correct type? (e.g., if asked for Identity Proof, is it Aadhaar/Voter ID/Passport/Driving License?)
   - IGNORE words like "DUMMY", "SPECIMEN", "SAMPLE" - only check if it's the right document type

2. Document Quality Check:
   - Is the document clear and readable?
   - Is it complete (not cropped or cut off)?
   - Can you see the information needed?

3. Key Information Check:
   - Does the document contain the expected key fields: {', '.join(key_fields)}?
   - Is the information clearly visible and readable?
   - If the required fields are present and readable, ACCEPT the document even if it says "DUMMY" or "SPECIMEN"

VERIFICATION RULES (LENIENT):
- ACCEPT if: Document is correct type AND required information is present AND readable (even if marked as DUMMY/SPECIMEN)
- REJECT only if: Document is wrong type OR required information is missing OR document is unreadable/blurry
- Do NOT reject just because document says "DUMMY", "SPECIMEN", "SAMPLE", or "TEST"
- Focus on information completeness, not document authenticity

REQUIRED JSON FORMAT (respond with ONLY this JSON, nothing else):
{{
    "is_correct_type": true,
    "is_clear_and_readable": true,
    "is_complete": true,
    "contains_expected_fields": true,
    "overall_verification": "verified",
    "feedback": "Brief feedback about the document",
    "document_type_detected": "The actual type of document detected"
}}

Remember: Respond with ONLY the JSON object, no other text."""

        # Prepare message content for LangChain
        # Start with text prompt
        message_content = [{"type": "text", "text": verification_prompt}]
        
        # Add image or PDF to the message
        if is_image:
            # For images, encode to base64
            base64_image = encode_image_to_base64(file_path)
            message_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/{file_ext[1:]};base64,{base64_image}"
                }
            })
        elif is_pdf:
            # For PDFs, convert to images first
            try:
                # Convert PDF pages to images (convert first page, or up to 3 pages for multi-page docs)
                pdf_images = convert_pdf_to_images(file_path, max_pages=3)
                
                if not pdf_images:
                    return {
                        "verified": False,
                        "is_correct_type": False,
                        "feedback": "Could not extract images from PDF. Please ensure the PDF is not corrupted and try again, or upload as an image (JPG/PNG).",
                        "details": {}
                    }
                
                # Determine how many pages to verify
                # For single-page documents (ID proof, address proof, salary slip), first page is enough
                # For multi-page documents (bank statements), verify up to 3 pages
                pages_to_verify = 1 if doc_id in ["identity_proof", "address_proof", "salary_slip", "employment_certificate"] else min(3, len(pdf_images))
                
                # Update prompt for multi-page documents before adding to message_content
                if len(pdf_images) > 1 and doc_id == "bank_statement":
                    verification_prompt = verification_prompt + f"\n\nNote: This is a multi-page bank statement ({len(pdf_images)} pages). Please verify the pages shown and ensure they contain transaction history for the last 3 months."
                    # Update the text prompt in message_content
                    message_content[0]["text"] = verification_prompt
                
                # Add PDF pages as images
                for i in range(pages_to_verify):
                    base64_image = encode_image_bytes_to_base64(pdf_images[i])
                    message_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    })
                
            except Exception as e:
                return {
                    "verified": False,
                    "is_correct_type": False,
                    "feedback": f"Error processing PDF: {str(e)}. Please ensure the PDF is not password-protected and is a valid PDF file. Alternatively, upload as an image (JPG/PNG).",
                    "details": {"error": str(e)}
                }
        
        # Create HumanMessage with image content
        message = HumanMessage(content=message_content)
        
        # Call LangChain vision model
        # Note: We need to request JSON format, but LangChain doesn't directly support response_format
        # So we'll add it to the prompt and parse the response
        try:
            response = vision_model.invoke([message])
            
            # Parse response - handle different response types
            if isinstance(response, AIMessage):
                result_text = response.content
            elif hasattr(response, 'content'):
                result_text = response.content
            elif isinstance(response, str):
                result_text = response
            else:
                result_text = str(response)
            
            # Try to extract JSON from response (might be wrapped in markdown code blocks)
            verification_result = None
            
            try:
                # First, try direct JSON parsing
                verification_result = json.loads(result_text.strip())
            except json.JSONDecodeError:
                # Remove markdown code blocks if present
                cleaned_text = result_text
                if "```json" in cleaned_text:
                    cleaned_text = cleaned_text.split("```json")[1].split("```")[0].strip()
                elif "```" in cleaned_text:
                    cleaned_text = cleaned_text.split("```")[1].split("```")[0].strip()
                
                # Try parsing cleaned text
                try:
                    verification_result = json.loads(cleaned_text)
                except json.JSONDecodeError:
                    # Try to extract JSON object using regex
                    import re
                    # More robust regex for nested JSON
                    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_text, re.DOTALL)
                    if json_match:
                        try:
                            verification_result = json.loads(json_match.group())
                        except json.JSONDecodeError:
                            pass
            
            # If still no result, create fallback
            if verification_result is None:
                logger.warning(f"[VERIFY] Failed to parse JSON for {doc_id}")
                verification_result = {
                    "is_correct_type": False,
                    "is_clear_and_readable": False,
                    "is_complete": False,
                    "contains_expected_fields": False,
                    "overall_verification": "rejected",
                    "feedback": "Unable to parse verification response. Please try uploading the document again.",
                    "document_type_detected": "Unknown"
                }
            
        except Exception as e:
            logger.error(f"[VERIFY] Error calling vision model for {doc_id}: {str(e)}")
            verification_result = {
                "is_correct_type": False,
                "is_clear_and_readable": False,
                "is_complete": False,
                "contains_expected_fields": False,
                "overall_verification": "rejected",
                "feedback": "Error during verification. Please try uploading the document again.",
                "document_type_detected": "Unknown"
            }
        
        # Extract verification status
        is_verified = verification_result.get("overall_verification", "").lower() == "verified"
        is_correct_type = verification_result.get("is_correct_type", False)
        feedback = verification_result.get("feedback", "")
        
        return {
            "verified": is_verified,
            "is_correct_type": is_correct_type,
            "feedback": feedback,
            "details": verification_result
        }
        
    except Exception as e:
        return {
            "verified": False,
            "is_correct_type": False,
            "feedback": f"Error during verification: {str(e)}. Please try uploading the document again.",
            "details": {"error": str(e)}
        }


def verify_document(document_id: str) -> Dict:
    """
    Verify a single document by its ObjectId.
    
    Args:
        document_id: MongoDB ObjectId as string
    
    Returns:
        Dict with verification result
    """
    from bson import ObjectId
    
    # Get document from database
    doc = documents_collection.find_one({"_id": ObjectId(document_id)})
    if not doc:
        return {
            "success": False,
            "message": "Document not found",
            "document_id": document_id
        }
    
    # Get file path
    file_path = STORE_DIR / doc["file_path"]
    if not file_path.exists():
        return {
            "success": False,
            "message": "Document file not found on disk",
            "document_id": document_id
        }
    
    # Verify document
    verification_result = verify_document_with_langchain(
        file_path,
        doc["doc_id"],
        doc["doc_name"]
    )
    
    # Update document status in database
    update_data = {
        "verification_status": "verified" if verification_result["verified"] else "rejected",
        "verification_feedback": verification_result["feedback"],
        "verified_at": datetime.now(timezone.utc) if verification_result["verified"] else None
    }
    
    documents_collection.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "document_id": document_id,
        "doc_id": doc["doc_id"],
        "doc_name": doc["doc_name"],
        "verified": verification_result["verified"],
        "is_correct_type": verification_result["is_correct_type"],
        "feedback": verification_result["feedback"],
        "details": verification_result.get("details", {})
    }


def verify_session_documents(session_id: str) -> Dict:
    """
    Verify all uploaded documents for a session.
    
    Args:
        session_id: Session ID
    
    Returns:
        Dict with verification results for all documents
    """
    # Get all documents for session
    documents = get_documents_by_session(session_id)
    
    if not documents:
        return {
            "success": False,
            "message": "No documents found for this session",
            "session_id": session_id,
            "results": []
        }
    
    results = []
    all_verified = True
    
    for doc in documents:
        # Skip if already verified
        if doc.get("verification_status") == "verified":
            results.append({
                "document_id": str(doc["_id"]),
                "doc_id": doc["doc_id"],
                "doc_name": doc["doc_name"],
                "verified": True,
                "status": "already_verified",
                "feedback": "Document was already verified"
            })
            continue
        
        # Verify document
        verification_result = verify_document(str(doc["_id"]))
        results.append(verification_result)
        
        if not verification_result.get("verified", False):
            all_verified = False
    
    return {
        "success": True,
        "session_id": session_id,
        "all_verified": all_verified,
        "results": results,
        "total_documents": len(documents),
        "verified_count": sum(1 for r in results if r.get("verified", False)),
        "rejected_count": sum(1 for r in results if not r.get("verified", False))
    }

