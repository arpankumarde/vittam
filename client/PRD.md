# Vittam Product Requirements Document (PRD)

Vittam is an AI-driven multi-agent sales assistant designed for Non-Banking Financial Companies (NBFCs) like Tata Capital to automate and accelerate personal loan sales. It replaces manual processes with an intelligent, conversational system that handles the full customer journey from initial engagement to sanction letter generation, boosting conversions and reducing processing times from days to minutes.[1][2]

## Problem Statement

NBFCs face high application abandonment (up to 70%), manual processing delays (48+ hours), and low sales team productivity when selling personal loans to prospects and existing customers via digital channels. Current web-based interfaces lack persuasive, personalized guidance, leading to poor conversion rates (3-5%) and operational backlogs.[2]

## Target Users

- **Business Heads/CXOs**: Seek revenue growth from personal loans without proportional staff increases.
- **Digital/Marketing Leads**: Need higher funnel conversions from ads and emails.
- **Sales & Operations Teams**: Require automation to focus on high-value tasks, reducing manual KYC, underwriting, and documentation.

Primary users are mid-to-large NBFCs in India handling personal loans with digital acquisition channels.[1][2]

## Key Value Propositions

- End-to-end automation of loan sales: from customer engagement to instant sanction letters.
- Multi-agent AI orchestration for human-like persuasion and decision-making.
- 35-91% faster processing, 50-83% higher conversions, and 60% operational cost reduction.
- Scalable to handle 2-3x loan volume without added headcount.[1]

## Core Features

### Master Agent (Orchestrator)

- Manages customer conversations via web interface.
- Assesses needs, persuades on loan benefits, and routes tasks to worker agents.
- Handles edge cases like rejections or additional verification seamlessly.

### Worker Agents

- **Sales Agent**: Discovers needs, negotiates terms (amount, tenure, rates), and drives commitment.
- **Verification Agent**: Confirms KYC via CRM lookups, phone/OTP validation.
- **Underwriting Agent**: Fetches credit scores, applies risk rules; instant approval if under pre-approved limit; salary slip check for higher amounts (EMI ≤50% salary, score ≥700).
- **Sanction Letter Agent**: Generates professional PDF sanction letters with terms and disbursement details upon approval.[2]

### Full Customer Journey

1. Customer lands from ad/email into conversational interface.
2. Master Agent engages, qualifies, and hands off for verification/underwriting.
3. Conditional logic: auto-approve low-risk, request salary slip for medium-risk, reject high-risk.
4. Instant sanction letter delivery and chat closure.[2][1]

## Success Metrics

| Metric                     | Current Baseline | Vittam Target   |
| -------------------------- | ---------------- | --------------- |
| Loan Processing Time       | 2 days           | 5 minutes [1]   |
| Application Abandonment    | 70%              | 25% [1]         |
| Lead Conversion Rate       | 3-5%             | 4.5-8% [1]      |
| Monthly Loan Volume        | 10K apps         | 20-30K apps [1] |
| Operational Cost Reduction | N/A              | 60% [1]         |

## Non-Functional Requirements

- **Availability**: 24/7 with <1s response times for 99.8% of interactions.
- **Compliance**: Adhere to Indian BFSI regulations (KYC, data privacy, RBI guidelines).
- **Scalability**: Support 10K+ concurrent sessions.
- **Security**: Encrypt sensitive data; audit trails for all decisions.
- **Integrations**: Dummy/real APIs for CRM, credit bureaus, document storage.[2]

## Assumptions & Constraints

- Synthetic customer data for demos (10+ profiles with name, age, credit score, pre-approved limits).
- File uploads simulated for salary slips.
- No real disbursements; focus on pre-approval to sanction.[2]

## Launch Phases

- **MVP**: Core agents + journey for personal loans.
- **Phase 2**: Expand to home/auto loans, analytics dashboard.
- **Phase 3**: Full production integrations and A/B testing tools.[1]

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/63585131/cd6d2b12-4ba7-42eb-b712-058b728b8d5c/Ingenico_Banking-Financial-Services-and-Insurance-BFSI-Tata-Capital.pdf)
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/63585131/5753b05a-bb8d-4e59-9380-aa918de784ca/Challenge-II_-Banking-Financial-Services-and-Insurance-BFSI.pdf)
