/**
 * API Service for Vittam Chatbot
 * Handles all communication with the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface InputSpec {
  name: string;
  description: string;
  doc_id?: string;
}

export interface ChatResponse {
  message: string;
  inputs: InputSpec[];
  session_id: string;
}

export interface SessionResponse {
  session_id: string;
  message: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SessionHistory {
  session_id: string;
  history: ConversationMessage[];
}

/**
 * Create a new chat session
 */
export async function createSession(): Promise<SessionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Send a chat message to the server
 */
export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Get conversation history for a session
 */
export async function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * HARDCODED DOCUMENT TYPES - These are the ONLY document types allowed
 * Standardized keys: identity_proof, address_proof, bank_statement, salary_slip, employment_certificate
 * Backend should always send doc_id in inputs, this is a fallback
 */
const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  // Standardized keys (exact matches)
  'identity_proof': 'identity_proof',
  'address_proof': 'address_proof',
  'bank_statement': 'bank_statement',
  'salary_slip': 'salary_slip',
  'employment_certificate': 'employment_certificate',
  // Display name variations (fallback)
  'identity proof': 'identity_proof',
  'id proof': 'identity_proof',
  'photo identity proof': 'identity_proof',
  'address proof': 'address_proof',
  'bank statement': 'bank_statement',
  'salary slips': 'salary_slip',
  'salary slip': 'salary_slip',
  'pay slip': 'salary_slip',
  'payslip': 'salary_slip',
  'employment certificate': 'employment_certificate',
  'employment proof': 'employment_certificate',
  'job certificate': 'employment_certificate',
};

/**
 * Standardized document type keys (for reference)
 * These are the exact keys the AI should use when mentioning documents
 */
export const DOCUMENT_TYPE_KEYS = {
  IDENTITY_PROOF: 'identity_proof',
  ADDRESS_PROOF: 'address_proof',
  BANK_STATEMENT: 'bank_statement',
  SALARY_SLIP: 'salary_slip',
  EMPLOYMENT_CERTIFICATE: 'employment_certificate',
} as const;

/**
 * Map document display name to doc_id
 * This is a fallback - backend should always send doc_id in inputs
 * Only returns doc_id for ALLOWED_DOCUMENT_TYPES
 * Supports both standardized keys (identity_proof) and display names (Identity Proof)
 */
export function getDocIdFromName(docName: string): string | null {
  // Normalize the name for matching (case-insensitive, handle variations)
  const normalizedName = docName.toLowerCase().trim();
  
  // First check for exact standardized key match (e.g., "identity_proof")
  if (ALLOWED_DOCUMENT_TYPES[normalizedName]) {
    return ALLOWED_DOCUMENT_TYPES[normalizedName];
  }
  
  // Try partial match (only for allowed types)
  for (const [key, value] of Object.entries(ALLOWED_DOCUMENT_TYPES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  // If no match found, return null (don't generate doc_id for unknown types)
  // This ensures only allowed document types are processed
  console.warn(`Unknown document type: ${docName}. Allowed keys: identity_proof, address_proof, bank_statement, salary_slip, employment_certificate`);
  return null;
}

/**
 * Upload a document
 */
export interface DocumentUploadResponse {
  success: boolean;
  doc_id: string;
  document_id: string;  // MongoDB ObjectId as string
  message: string;
}

export async function uploadDocument(
  sessionId: string,
  docId: string,
  file: File
): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('doc_id', docId);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to upload document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get all documents for a session
 */
export interface DocumentInfo {
  document_id: string;
  doc_id: string;
  doc_name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  uploaded_at: string | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'unverified';
  verification_feedback?: string | null;
  verified_at?: string | null;
}

export interface DocumentsResponse {
  session_id: string;
  documents: DocumentInfo[];
}

export async function getSessionDocuments(sessionId: string): Promise<DocumentsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
}

/**
 * Verify all documents for a session
 */
export interface DocumentVerificationResult {
  document_id: string;
  doc_id: string;
  doc_name: string;
  verified: boolean;
  is_correct_type?: boolean;
  feedback?: string;
  status?: string;
}

export interface DocumentVerificationResponse {
  success: boolean;
  session_id: string;
  all_verified: boolean;
  results: DocumentVerificationResult[];
  total_documents: number;
  verified_count: number;
  rejected_count: number;
}

export async function verifySessionDocuments(sessionId: string): Promise<DocumentVerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${sessionId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to verify documents: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying documents:', error);
    throw error;
  }
}

/**
 * Verify a single document
 */
export interface SingleDocumentVerificationResponse {
  success: boolean;
  document_id: string;
  doc_id: string;
  doc_name: string;
  verified: boolean;
  is_correct_type: boolean;
  feedback: string;
  details?: any;
}

export async function verifyDocument(documentId: string): Promise<SingleDocumentVerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/verify/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to verify document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying document:', error);
    throw error;
  }
}

