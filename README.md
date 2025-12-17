# Vittam

Vittam is a multi-agent personal loan sales system designed to streamline the loan application process. It leverages AI agents to handle various stages of the loan journey, including sales, verification, underwriting, and sanctioning.

## Features

- **Master Agent**: Orchestrates the entire loan journey, handles customer needs, and routes tasks to the appropriate agents.
- **Sales Agent**: Understands customer needs, handles objections, and generates personalized loan offers.
- **Verification Agent**: Performs KYC, PAN, and phone verification.
- **Underwriting Agent**: Assesses credit scores, eligibility, and calculates EMIs.
- **Sanction Agent**: Generates sanction letters and provides disbursement details.

## Prerequisites

- Python 3.13+
- Node.js (for client-side components)
- MongoDB (for database operations)

## Setup Instructions

### Backend

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_API_BASE` (optional)
3. Run the server:
   ```bash
   python main.py
   ```

### Frontend

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- **server/**: Backend services and AI agent logic.
- **client/**: Frontend React components for user interaction.
- **chatbot/**: The interactive chatbot code and logic
