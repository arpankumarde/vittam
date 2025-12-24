"""
Database-backed Services for Personal Loan Sales System

This module provides services backed by MongoDB for:
- Customer data (CRM) - from users collection
- Credit bureau scores - from kycs collection
- KYC verification - from kycs collection
- PAN verification - from kycs collection
- Phone verification - from users collection
- Offer mart (pre-approved limits) - from users collection
- EMI calculations
- Risk rules and eligibility - using offer_template collection
"""

import logging
from typing import Dict, Optional, Any
from datetime import datetime

from database import (
    users_collection,
    kycs_collection,
    offer_template_collection,
)

# Configure logging
logger = logging.getLogger(__name__)


def _normalize_phone(phone: str) -> str:
    """Normalize phone number to 10-digit format (without +91 prefix)."""
    phone_clean = phone.strip().replace(" ", "").replace("-", "")
    # Remove +91 or 91 prefix
    if phone_clean.startswith("+91"):
        phone_clean = phone_clean[3:]
    elif phone_clean.startswith("91") and len(phone_clean) > 10:
        phone_clean = phone_clean[2:]
    return phone_clean


def _format_phone_for_display(phone: str) -> str:
    """Format phone number with +91 prefix for display."""
    normalized = _normalize_phone(phone)
    return f"+91{normalized}"


def _build_customer_data(user: Dict, kyc: Optional[Dict] = None) -> Dict:
    """
    Build a unified customer data dict from user and kyc documents.
    This maintains backward compatibility with the old hardcoded format.
    """
    if not user:
        return None

    # Calculate age from dob if available
    age = None
    dob_str = None
    if user.get("dob"):
        dob = user["dob"]
        if isinstance(dob, datetime):
            age = (datetime.now() - dob).days // 365
            dob_str = dob.strftime("%Y-%m-%d")
        elif isinstance(dob, str):
            dob_str = dob

    # Use phone as customer_id (normalized)
    phone = user.get("phone", "")
    customer_id = _normalize_phone(phone) if phone else str(user.get("_id", ""))

    customer_data = {
        "customer_id": customer_id,
        "name": user.get("name"),
        "age": age,
        "city": user.get("city"),
        "phone": _format_phone_for_display(phone) if phone else None,
        "email": user.get("email"),
        "dob": dob_str,
        "current_loans": user.get("current_loans", []),
        "pre_approved_limit": user.get("pre_approved_limit", 0),
        "salary": user.get("salary"),  # May be None if not in DB
        "existing_customer": True,  # If found in DB, they're an existing customer
    }

    # Merge KYC data if available
    if kyc:
        customer_data["pan"] = kyc.get("pan")
        customer_data["credit_score"] = kyc.get("credit_score")
        customer_data["address"] = kyc.get("address")
        # Use KYC dob if user dob not available
        if not dob_str and kyc.get("dob"):
            kyc_dob = kyc["dob"]
            if isinstance(kyc_dob, datetime):
                customer_data["dob"] = kyc_dob.strftime("%Y-%m-%d")
                customer_data["age"] = (datetime.now() - kyc_dob).days // 365
            elif isinstance(kyc_dob, str):
                customer_data["dob"] = kyc_dob

    return customer_data


def get_customer_by_phone(phone: str) -> Optional[Dict]:
    """Get customer data from database by phone number."""
    logger.info(f"[SERVICE] get_customer_by_phone called - phone: {phone}")

    normalized_phone = _normalize_phone(phone)

    # Query users collection
    user = users_collection.find_one({"phone": normalized_phone})

    if not user:
        logger.warning(
            f"[SERVICE] get_customer_by_phone - Customer not found for phone: {phone}"
        )
        return None

    # Get associated KYC data
    kyc = kycs_collection.find_one({"phone": normalized_phone})

    customer_data = _build_customer_data(user, kyc)
    logger.info(
        f"[SERVICE] get_customer_by_phone - Customer found: {customer_data['customer_id']}"
    )
    return customer_data


def get_customer_by_pan(pan: str) -> Optional[Dict]:
    """Get customer data from database by PAN number."""
    logger.info(f"[SERVICE] get_customer_by_pan called - PAN: {pan}")

    pan_upper = pan.upper().strip()

    # Query kycs collection to get phone number
    kyc = kycs_collection.find_one({"pan": pan_upper})

    if not kyc:
        logger.warning(
            f"[SERVICE] get_customer_by_pan - Customer not found for PAN: {pan}"
        )
        return None

    # Get user data using phone from KYC
    phone = kyc.get("phone")
    user = None
    if phone:
        normalized_phone = _normalize_phone(phone)
        user = users_collection.find_one({"phone": normalized_phone})

    # Build customer data (even if user not found, return KYC data)
    if user:
        customer_data = _build_customer_data(user, kyc)
    else:
        # Build from KYC only
        customer_data = {
            "customer_id": phone if phone else str(kyc.get("_id", "")),
            "name": kyc.get("name"),
            "pan": kyc.get("pan"),
            "credit_score": kyc.get("credit_score"),
            "address": kyc.get("address"),
            "phone": _format_phone_for_display(phone) if phone else None,
            "existing_customer": False,
        }
        if kyc.get("dob"):
            dob = kyc["dob"]
            if isinstance(dob, datetime):
                customer_data["dob"] = dob.strftime("%Y-%m-%d")
                customer_data["age"] = (datetime.now() - dob).days // 365

    logger.info(
        f"[SERVICE] get_customer_by_pan - Customer found: {customer_data.get('customer_id')}"
    )
    return customer_data


def get_customer_by_id(customer_id: str) -> Optional[Dict]:
    """
    Get customer data by customer ID.
    Customer ID is the normalized phone number (10 digits).
    """
    logger.info(f"[SERVICE] get_customer_by_id called - customer_id: {customer_id}")

    # customer_id is the normalized phone number
    normalized_phone = _normalize_phone(customer_id)

    # Query users collection
    user = users_collection.find_one({"phone": normalized_phone})

    if not user:
        logger.warning(
            f"[SERVICE] get_customer_by_id - Customer not found: {customer_id}"
        )
        return None

    # Get associated KYC data
    kyc = kycs_collection.find_one({"phone": normalized_phone})

    customer_data = _build_customer_data(user, kyc)
    logger.info(
        f"[SERVICE] get_customer_by_id - Customer found: {customer_data['customer_id']}"
    )
    return customer_data


def verify_kyc_details(name: str, dob: str, address: str, pan: str) -> Dict:
    """Verify KYC details against database."""
    logger.info(f"[SERVICE] verify_kyc_details called - name: {name}, pan: {pan}")

    pan_upper = pan.upper().strip()

    # Query KYC from database
    kyc = kycs_collection.find_one({"pan": pan_upper})

    if not kyc:
        return {
            "verified": False,
            "message": "PAN not found in our records",
            "customer_id": None,
        }

    # Get full customer data
    customer = get_customer_by_pan(pan_upper)

    # Check if details match
    matches = []

    # Name match (case-insensitive)
    kyc_name = kyc.get("name", "")
    if kyc_name and kyc_name.lower() == name.lower():
        matches.append("name")

    # DOB match
    kyc_dob = kyc.get("dob")
    if kyc_dob:
        kyc_dob_str = (
            kyc_dob.strftime("%Y-%m-%d")
            if isinstance(kyc_dob, datetime)
            else str(kyc_dob)
        )
        if kyc_dob_str == dob:
            matches.append("dob")

    # Address match (case-insensitive)
    kyc_address = kyc.get("address", "")
    if kyc_address and kyc_address.lower() == address.lower():
        matches.append("address")

    customer_id = customer.get("customer_id") if customer else None

    if len(matches) >= 2:  # At least 2 fields should match
        logger.info(
            f"[SERVICE] verify_kyc_details - KYC verified. Matched fields: {', '.join(matches)}"
        )
        return {
            "verified": True,
            "message": f"KYC verified. Matched fields: {', '.join(matches)}",
            "customer_id": customer_id,
            "customer_data": customer,
        }
    else:
        logger.warning(
            f"[SERVICE] verify_kyc_details - KYC verification failed. Only {len(matches)} field(s) matched"
        )
        return {
            "verified": False,
            "message": f"KYC verification failed. Only {len(matches)} field(s) matched: {', '.join(matches) if matches else 'none'}",
            "customer_id": customer_id,
        }


def verify_pan(pan: str) -> Dict:
    """Verify PAN number format and existence in database."""
    logger.info(f"[SERVICE] verify_pan called - PAN: {pan}")

    pan_upper = pan.upper().strip()

    # Basic PAN format validation (5 letters, 4 digits, 1 letter)
    if len(pan_upper) != 10:
        return {
            "verified": False,
            "message": "Invalid PAN format. PAN should be 10 characters long.",
            "customer_id": None,
        }

    if not (
        pan_upper[:5].isalpha() and pan_upper[5:9].isdigit() and pan_upper[9].isalpha()
    ):
        return {
            "verified": False,
            "message": "Invalid PAN format. Format should be: 5 letters, 4 digits, 1 letter.",
            "customer_id": None,
        }

    # Query database
    customer = get_customer_by_pan(pan_upper)

    if customer:
        logger.info(
            f"[SERVICE] verify_pan - PAN verified successfully for customer: {customer['customer_id']}"
        )
        return {
            "verified": True,
            "message": "PAN verified successfully",
            "customer_id": customer["customer_id"],
            "customer_name": customer.get("name"),
        }
    else:
        logger.warning(f"[SERVICE] verify_pan - PAN not found in database")
        return {
            "verified": False,
            "message": "PAN not found in our database",
            "customer_id": None,
        }


def verify_phone(phone: str) -> Dict:
    """Verify phone number and send OTP (simulated)."""
    logger.info(f"[SERVICE] verify_phone called - phone: {phone}")

    normalized_phone = _normalize_phone(phone)
    display_phone = _format_phone_for_display(normalized_phone)

    customer = get_customer_by_phone(normalized_phone)

    if customer:
        # Simulate OTP generation
        otp = "123456"  # In real system, this would be randomly generated
        logger.info(
            f"[SERVICE] verify_phone - OTP sent to {display_phone} for customer: {customer['customer_id']}"
        )
        return {
            "verified": True,
            "message": f"OTP sent to {display_phone}. OTP: {otp} (for testing)",
            "customer_id": customer["customer_id"],
            "customer_name": customer.get("name"),
            "otp": otp,
        }
    else:
        logger.warning(f"[SERVICE] verify_phone - Phone number not found in database")
        return {
            "verified": False,
            "message": f"Phone number {display_phone} not found in our database",
            "customer_id": None,
        }


def verify_otp(phone: str, otp: str) -> Dict:
    """Verify OTP (simulated - only accepts 123456 for testing)."""
    logger.info(f"[SERVICE] verify_otp called - phone: {phone}, OTP: {otp}")

    # Only accept the fixed test OTP: 123456
    if otp == "123456":
        customer = get_customer_by_phone(phone)
        if customer:
            logger.info(
                f"[SERVICE] verify_otp - OTP verified successfully for customer: {customer['customer_id']}"
            )
            return {
                "verified": True,
                "message": "Phone number verified successfully",
                "customer_id": customer["customer_id"],
            }
        else:
            logger.warning(
                f"[SERVICE] verify_otp - Customer not found for phone: {phone}"
            )
            return {
                "verified": False,
                "message": "Phone number not found in our database",
            }

    logger.warning(f"[SERVICE] verify_otp - Invalid OTP: {otp}")
    return {
        "verified": False,
        "message": "Invalid OTP. Please enter the correct OTP: 123456",
    }


def fetch_credit_score(customer_id: str) -> Dict:
    """Fetch credit score from database (kycs collection)."""
    logger.info(f"[SERVICE] fetch_credit_score called - customer_id: {customer_id}")

    # customer_id is the normalized phone number
    normalized_phone = _normalize_phone(customer_id)

    # Query KYC collection for credit score
    kyc = kycs_collection.find_one({"phone": normalized_phone})

    if kyc and kyc.get("credit_score") is not None:
        score = kyc["credit_score"]
        logger.info(
            f"[SERVICE] fetch_credit_score - Credit score retrieved: {score}/900 for customer: {customer_id}"
        )
        return {
            "success": True,
            "customer_id": customer_id,
            "credit_score": score,
            "max_score": 900,
            "message": f"Credit score retrieved: {score}/900",
        }

    # Try to get customer first to verify they exist
    customer = get_customer_by_id(customer_id)
    if not customer:
        logger.warning(
            f"[SERVICE] fetch_credit_score - Customer not found: {customer_id}"
        )
        return {"success": False, "message": "Customer not found", "credit_score": None}

    logger.warning(
        f"[SERVICE] fetch_credit_score - Credit score not available for customer: {customer_id}"
    )
    return {
        "success": False,
        "message": "Credit score not available",
        "credit_score": None,
    }


def get_pre_approved_limit(customer_id: str) -> Dict:
    """Get pre-approved loan limit from users collection."""
    logger.info(f"[SERVICE] get_pre_approved_limit called - customer_id: {customer_id}")

    customer = get_customer_by_id(customer_id)

    if customer:
        limit = customer.get("pre_approved_limit", 0)
        logger.info(
            f"[SERVICE] get_pre_approved_limit - Pre-approved limit: ₹{limit:,} for customer: {customer_id}"
        )
        return {
            "success": True,
            "customer_id": customer_id,
            "pre_approved_limit": limit,
            "message": f"Pre-approved limit: ₹{limit:,}",
        }

    logger.warning(
        f"[SERVICE] get_pre_approved_limit - Customer not found: {customer_id}"
    )
    return {
        "success": False,
        "message": "Customer not found",
        "pre_approved_limit": None,
    }


def calculate_emi(loan_amount: float, tenure_months: int, interest_rate: float) -> Dict:
    """Calculate EMI (Equated Monthly Installment)."""
    logger.info(
        f"[SERVICE] calculate_emi called - amount: ₹{loan_amount:,.0f}, tenure: {tenure_months} months, rate: {interest_rate}%"
    )

    if loan_amount <= 0 or tenure_months <= 0 or interest_rate <= 0:
        logger.warning(f"[SERVICE] calculate_emi - Invalid input parameters")
        return {"success": False, "message": "Invalid input parameters"}

    monthly_rate = interest_rate / (12 * 100)
    emi = (
        loan_amount
        * monthly_rate
        * ((1 + monthly_rate) ** tenure_months)
        / (((1 + monthly_rate) ** tenure_months) - 1)
    )
    total_amount = emi * tenure_months
    total_interest = total_amount - loan_amount

    logger.info(
        f"[SERVICE] calculate_emi - Calculated EMI: ₹{round(emi, 2):,.2f}, Total: ₹{round(total_amount, 2):,.2f}"
    )
    return {
        "success": True,
        "loan_amount": loan_amount,
        "tenure_months": tenure_months,
        "interest_rate": interest_rate,
        "emi": round(emi, 2),
        "total_amount": round(total_amount, 2),
        "total_interest": round(total_interest, 2),
    }


def get_interest_rate(credit_score: int, loan_amount: float) -> float:
    """
    Get interest rate based on credit score and loan amount.
    Uses offer_template collection if available, falls back to default rates.
    """
    logger.info(
        f"[SERVICE] get_interest_rate called - credit_score: {credit_score}, loan_amount: ₹{loan_amount:,.0f}"
    )

    # Try to find matching offer template from database
    offer = offer_template_collection.find_one(
        {
            "active": True,
            "min_credit_score": {"$lte": credit_score},
            "max_credit_score": {"$gte": credit_score},
            "min_amount": {"$lte": loan_amount},
            "max_amount": {"$gte": loan_amount},
        }
    )

    if offer and offer.get("base_rate") is not None:
        rate = offer["base_rate"]
        logger.info(f"[SERVICE] get_interest_rate - Rate from offer template: {rate}%")
        return round(rate, 2)

    # Fall back to default interest rate calculation
    # Interest rates based on credit score
    interest_rates = {
        "excellent": {"min": 10.5, "max": 12.0},  # 750+
        "good": {"min": 12.5, "max": 14.5},  # 700-749
        "fair": {"min": 15.0, "max": 18.0},  # 650-699
        "poor": {"min": 18.5, "max": 24.0},  # <650
    }

    if credit_score >= 750:
        category = "excellent"
    elif credit_score >= 700:
        category = "good"
    elif credit_score >= 650:
        category = "fair"
    else:
        category = "poor"

    rate_range = interest_rates[category]

    # Higher loan amounts get slightly better rates
    if loan_amount >= 1000000:
        rate = rate_range["min"]
    elif loan_amount >= 500000:
        rate = (rate_range["min"] + rate_range["max"]) / 2
    else:
        rate = rate_range["max"]

    rate = round(rate, 2)
    logger.info(
        f"[SERVICE] get_interest_rate - Calculated rate: {rate}% (category: {category})"
    )
    return rate


def check_eligibility(
    customer_id: str, requested_amount: float, tenure_months: int = 60
) -> Dict:
    """
    Check loan eligibility based on risk rules.

    Rules:
    1. Instant Approval: If requested_amount <= pre_approved_limit
    2. Conditional Approval: If requested_amount <= 2 * pre_approved_limit (requires salary slip)
    3. Rejection: If requested_amount > 2 * pre_approved_limit OR credit_score < 700
    """
    logger.info(
        f"[SERVICE] check_eligibility called - customer_id: {customer_id}, amount: ₹{requested_amount:,.0f}, tenure: {tenure_months} months"
    )

    customer = get_customer_by_id(customer_id)

    if not customer:
        logger.warning(
            f"[SERVICE] check_eligibility - Customer not found: {customer_id}"
        )
        return {
            "eligible": False,
            "status": "rejected",
            "message": "Customer not found",
            "reason": "Customer ID invalid",
        }

    credit_score = customer.get("credit_score", 0)
    pre_approved_limit = customer.get("pre_approved_limit", 0)
    salary = customer.get("salary")

    # If credit score not in customer data, fetch from KYC
    if not credit_score:
        credit_result = fetch_credit_score(customer_id)
        if credit_result.get("success"):
            credit_score = credit_result["credit_score"]

    # Rule 1: Rejection if credit score < 700
    if credit_score < 700:
        logger.warning(
            f"[SERVICE] check_eligibility - REJECTED: Credit score {credit_score} < 700"
        )
        return {
            "eligible": False,
            "status": "rejected",
            "message": "Loan application rejected",
            "reason": f"Credit score {credit_score} is below minimum requirement of 700",
            "credit_score": credit_score,
            "pre_approved_limit": pre_approved_limit,
        }

    # Rule 2: Rejection if requested amount > 2 * pre_approved_limit
    if pre_approved_limit > 0 and requested_amount > 2 * pre_approved_limit:
        logger.warning(
            f"[SERVICE] check_eligibility - REJECTED: Amount ₹{requested_amount:,} > 2x limit ₹{2 * pre_approved_limit:,}"
        )
        return {
            "eligible": False,
            "status": "rejected",
            "message": "Loan application rejected",
            "reason": f"Requested amount ₹{requested_amount:,} exceeds maximum eligible limit of ₹{2 * pre_approved_limit:,}",
            "requested_amount": requested_amount,
            "pre_approved_limit": pre_approved_limit,
            "max_eligible": 2 * pre_approved_limit,
        }

    # Rule 3: Instant Approval if requested_amount <= pre_approved_limit
    if requested_amount <= pre_approved_limit:
        interest_rate = get_interest_rate(credit_score, requested_amount)
        emi_result = calculate_emi(requested_amount, tenure_months, interest_rate)

        logger.info(
            f"[SERVICE] check_eligibility - INSTANT APPROVAL: Amount ₹{requested_amount:,} <= limit ₹{pre_approved_limit:,}"
        )
        return {
            "eligible": True,
            "status": "approved",
            "message": "Loan approved instantly",
            "requested_amount": requested_amount,
            "pre_approved_limit": pre_approved_limit,
            "credit_score": credit_score,
            "interest_rate": interest_rate,
            "tenure_months": tenure_months,
            "emi": emi_result["emi"],
            "approval_type": "instant",
        }

    # Rule 4: Conditional Approval (requires salary slip)
    # If salary not available, approve conditionally without EMI-to-salary check
    interest_rate = get_interest_rate(credit_score, requested_amount)
    emi_result = calculate_emi(requested_amount, tenure_months, interest_rate)
    emi = emi_result["emi"]

    if salary is None:
        # Salary not in database - approve conditionally, require salary slip for verification
        logger.info(
            f"[SERVICE] check_eligibility - CONDITIONAL APPROVAL: Salary verification required"
        )
        return {
            "eligible": True,
            "status": "conditionally_approved",
            "message": "Loan conditionally approved - salary slip verification required",
            "requested_amount": requested_amount,
            "pre_approved_limit": pre_approved_limit,
            "credit_score": credit_score,
            "interest_rate": interest_rate,
            "tenure_months": tenure_months,
            "emi": emi,
            "approval_type": "conditional",
            "requires_salary_slip": True,
        }

    # Check if EMI <= 50% of salary
    max_allowable_emi = salary * 0.5

    if emi <= max_allowable_emi:
        logger.info(
            f"[SERVICE] check_eligibility - CONDITIONAL APPROVAL: EMI ₹{emi:,.2f} <= 50% salary (₹{max_allowable_emi:,.2f})"
        )
        return {
            "eligible": True,
            "status": "conditionally_approved",
            "message": "Loan conditionally approved - salary slip verification required",
            "requested_amount": requested_amount,
            "pre_approved_limit": pre_approved_limit,
            "credit_score": credit_score,
            "interest_rate": interest_rate,
            "tenure_months": tenure_months,
            "emi": emi,
            "salary": salary,
            "max_allowable_emi": max_allowable_emi,
            "approval_type": "conditional",
            "requires_salary_slip": True,
        }
    else:
        logger.warning(
            f"[SERVICE] check_eligibility - REJECTED: EMI ₹{emi:,.2f} > 50% salary (₹{max_allowable_emi:,.2f})"
        )
        return {
            "eligible": False,
            "status": "rejected",
            "message": "Loan application rejected",
            "reason": f"EMI ₹{emi:,.2f} exceeds 50% of salary (₹{max_allowable_emi:,.2f})",
            "requested_amount": requested_amount,
            "emi": emi,
            "salary": salary,
            "max_allowable_emi": max_allowable_emi,
        }


def verify_salary_slip(customer_id: str, salary_slip_uploaded: bool = True) -> Dict:
    """Simulate salary slip verification (accepts any upload for testing)."""
    logger.info(
        f"[SERVICE] verify_salary_slip called - customer_id: {customer_id}, uploaded: {salary_slip_uploaded}"
    )

    customer = get_customer_by_id(customer_id)

    if not customer:
        logger.warning(
            f"[SERVICE] verify_salary_slip - Customer not found: {customer_id}"
        )
        return {"verified": False, "message": "Customer not found"}

    if salary_slip_uploaded:
        # Get salary from customer data or return a default verified response
        salary = customer.get("salary")
        logger.info(
            f"[SERVICE] verify_salary_slip - Salary slip verified successfully for customer: {customer_id}"
        )
        result = {
            "verified": True,
            "message": "Salary slip verified successfully",
            "customer_id": customer_id,
        }
        if salary:
            result["verified_salary"] = salary
        return result

    logger.warning(f"[SERVICE] verify_salary_slip - Salary slip not uploaded")
    return {"verified": False, "message": "Salary slip not uploaded"}


def get_offers_for_credit_score(credit_score: int, loan_amount: float = None) -> Dict:
    """
    Get available loan offers from offer_template collection based on credit score.

    Args:
        credit_score: Customer's credit score (out of 900)
        loan_amount: Optional loan amount to filter offers by

    Returns:
        Dict with matching offers and their details
    """
    logger.info(
        f"[SERVICE] get_offers_for_credit_score called - credit_score: {credit_score}, loan_amount: {loan_amount}"
    )

    # Build query for matching offers
    query = {
        "active": True,
        "min_credit_score": {"$lte": credit_score},
        "max_credit_score": {"$gte": credit_score},
    }

    # Add loan amount filter if provided
    if loan_amount:
        query["min_amount"] = {"$lte": loan_amount}
        query["max_amount"] = {"$gte": loan_amount}

    # Fetch matching offers sorted by base_rate (best rate first)
    offers = list(offer_template_collection.find(query).sort("base_rate", 1))

    if not offers:
        # Try without amount filter if no matches
        query_no_amount = {
            "active": True,
            "min_credit_score": {"$lte": credit_score},
            "max_credit_score": {"$gte": credit_score},
        }
        offers = list(
            offer_template_collection.find(query_no_amount).sort("base_rate", 1)
        )

    if offers:
        formatted_offers = []
        for offer in offers:
            formatted_offer = {
                "name": offer.get("name", "Personal Loan"),
                "min_credit_score": offer.get("min_credit_score"),
                "max_credit_score": offer.get("max_credit_score"),
                "min_amount": offer.get("min_amount"),
                "max_amount": offer.get("max_amount"),
                "min_tenure_months": offer.get("min_tenure_months", 12),
                "max_tenure_months": offer.get("max_tenure_months", 60),
                "base_rate": offer.get("base_rate"),
                "processing_fee_pct": offer.get("processing_fee_pct", 3.5),
            }
            formatted_offers.append(formatted_offer)

        # Get the best offer (lowest rate)
        best_offer = formatted_offers[0] if formatted_offers else None

        logger.info(
            f"[SERVICE] get_offers_for_credit_score - Found {len(formatted_offers)} matching offers"
        )
        return {
            "success": True,
            "credit_score": credit_score,
            "total_offers": len(formatted_offers),
            "best_offer": best_offer,
            "all_offers": formatted_offers,
            "message": f"Found {len(formatted_offers)} offers for credit score {credit_score}",
        }

    # Fallback: Return default offer based on credit score
    logger.info(
        f"[SERVICE] get_offers_for_credit_score - No offers in DB, using default rates"
    )

    # Determine rate category
    if credit_score >= 750:
        base_rate = 10.99
        category = "excellent"
    elif credit_score >= 700:
        base_rate = 12.5
        category = "good"
    elif credit_score >= 650:
        base_rate = 15.0
        category = "fair"
    else:
        base_rate = 18.0
        category = "poor"

    default_offer = {
        "name": f"Personal Loan - {category.title()} Credit",
        "min_credit_score": credit_score - 50,
        "max_credit_score": credit_score + 50,
        "min_amount": 50000,
        "max_amount": 5000000,
        "min_tenure_months": 12,
        "max_tenure_months": 60,
        "base_rate": base_rate,
        "processing_fee_pct": 3.5,
    }

    return {
        "success": True,
        "credit_score": credit_score,
        "total_offers": 1,
        "best_offer": default_offer,
        "all_offers": [default_offer],
        "message": f"Default offer for credit score {credit_score} (category: {category})",
    }


def get_loan_charges_info() -> Dict:
    """
    Get all loan charges and fees information.

    Returns:
        Dict with all applicable charges
    """
    logger.info(f"[SERVICE] get_loan_charges_info called")

    charges = {
        "interest_rate": "10.99% p.a. onwards",
        "processing_fee": "Up to 3.5% of loan amount + GST",
        "penal_charges": "3% per month on defaulted amount (Annualized 36%)",
        "cheque_dishonour": "₹600 per instrument per instance",
        "mandate_rejection": "₹450",
        "statement_charges": "₹250 + GST for physical copy (digital free)",
        "loan_cancellation": "2% of loan amount OR ₹5,750 (whichever is higher)",
        "annual_maintenance": "0.25% of dropline amount OR ₹1,000 (whichever is higher) - payable at end of 13th month",
        "prepayment": "Allowed after 12 months with minimal charges",
    }

    logger.info(f"[SERVICE] get_loan_charges_info completed")
    return {"success": True, "charges": charges}


def get_required_documents() -> Dict:
    """
    Get list of required documents for loan application.
    
    IMPORTANT: These are the ONLY 5 document types allowed (hardcoded):
    1. identity_proof (always mandatory)
    2. address_proof (always mandatory)
    3. bank_statement (always mandatory)
    4. salary_slip (sometimes required)
    5. employment_certificate (sometimes required)

    Returns:
        Dict with document requirements categorized by approval type
    """
    logger.info(f"[SERVICE] get_required_documents called")

    documents = {
        "always_required": {
            "identity_proof": {
                "doc_id": "identity_proof",
                "name": "Identity Proof",
                "description": "Any ONE of the following",
                "options": ["Voter ID", "Passport", "Driving License", "Aadhaar Card"],
            },
            "address_proof": {
                "doc_id": "address_proof",
                "name": "Address Proof",
                "description": "Any ONE of the following",
                "options": ["Voter ID", "Passport", "Driving License", "Aadhaar Card"],
            },
            "bank_statement": {
                "doc_id": "bank_statement",
                "name": "Bank Statement",
                "description": "Primary bank statement (salary account) for last 3 months"
            },
        },
        "conditional_only": {
            "description": "Required ONLY for conditional approvals (when loan amount > pre-approved limit)",
            "salary_slip": {
                "doc_id": "salary_slip",
                "name": "Salary Slips",
                "description": "Salary slips for last 2 months"
            },
            "employment_certificate": {
                "doc_id": "employment_certificate",
                "name": "Employment Certificate",
                "description": "Certificate confirming at least 1 year of continuous employment"
            },
        },
        "notes": [
            "Same document can serve as both identity and address proof",
            "Salary slips and employment certificate are only required for high-risk/conditional cases",
            "For instant approvals (loan ≤ pre-approved limit), only ID, address proof, and bank statement are needed",
            "⚠️ IMPORTANT: Only these 5 document types are allowed. Do NOT request any other document types.",
        ],
    }

    logger.info(f"[SERVICE] get_required_documents completed")
    return {"success": True, "documents": documents}


def generate_sanction_letter(
    customer_id: str, loan_amount: float, tenure_months: int, interest_rate: float
) -> Dict:
    """Generate sanction letter summary (text format for now)."""
    logger.info(
        f"[SERVICE] generate_sanction_letter called - customer_id: {customer_id}, amount: ₹{loan_amount:,.0f}, tenure: {tenure_months} months, rate: {interest_rate}%"
    )

    try:
        customer = get_customer_by_id(customer_id)
        logger.info(f"[SERVICE] generate_sanction_letter - Customer lookup result: {'Found' if customer else 'Not found'}")

        if not customer:
            logger.error(
                f"[SERVICE] generate_sanction_letter - Customer not found: {customer_id}"
            )
            return {"success": False, "message": "Customer not found"}

        logger.info(f"[SERVICE] generate_sanction_letter - Calculating EMI for amount: ₹{loan_amount:,.0f}, tenure: {tenure_months} months, rate: {interest_rate}%")
        emi_result = calculate_emi(loan_amount, tenure_months, interest_rate)
        logger.info(f"[SERVICE] generate_sanction_letter - EMI calculation result: {emi_result}")
        
        customer_name = customer.get("name", "Valued Customer")
        logger.info(f"[SERVICE] generate_sanction_letter - Customer name: {customer_name}")

        sanction_letter = {
        "success": True,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "sanction_date": datetime.now().strftime("%Y-%m-%d"),
        "loan_amount": loan_amount,
        "tenure_months": tenure_months,
        "interest_rate": interest_rate,
        "emi": emi_result["emi"],
        "total_amount": emi_result["total_amount"],
        "disbursement_account": "To be provided by customer",
        "terms_and_conditions": [
            "Loan amount will be disbursed within 24-48 hours of document verification",
            "Interest rate is fixed for the entire tenure",
            "Prepayment charges apply as per policy",
            "Default in payment will attract penalty charges",
            "All disputes subject to jurisdiction of Mumbai courts",
        ],
        "summary": f"""
SANCTION LETTER

Dear {customer_name},

We are pleased to inform you that your Personal Loan application has been approved.

Loan Details:
- Sanctioned Amount: ₹{loan_amount:,.2f}
- Tenure: {tenure_months} months ({tenure_months//12} years {tenure_months%12} months)
- Interest Rate: {interest_rate}% per annum
- EMI: ₹{emi_result["emi"]:,.2f}
- Total Amount Payable: ₹{emi_result["total_amount"]:,.2f}

This sanction is valid for 30 days from the date of issue.

Please contact us to complete the disbursement process.

Best Regards,
Tata Capital Personal Loans Team
        """.strip(),
    }

        logger.info(
            f"[SERVICE] generate_sanction_letter - Sanction letter generated successfully for customer: {customer_id}"
        )
        logger.info(f"[SERVICE] generate_sanction_letter - Returning sanction letter with keys: {list(sanction_letter.keys())}")
        return sanction_letter
    except Exception as e:
        logger.error(f"[SERVICE] generate_sanction_letter - Exception occurred: {str(e)}")
        import traceback
        logger.error(f"[SERVICE] generate_sanction_letter - Traceback: {traceback.format_exc()}")
        return {"success": False, "message": f"Error generating sanction letter: {str(e)}"}
