import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import SanctionLetterContent from "./SanctionLetterContent";

export interface SanctionData {
  customer_id: string;
  customer_name: string;
  loan_amount: number;
  tenure_months: number;
  interest_rate: number;
  emi: number;
  total_amount: number;
  processing_fee: number;
  created_at: Date;
  validity_days: number;
  bank_details?: {
    account_number?: string;
    ifsc_code?: string;
    account_holder_name?: string;
  };
}

async function getSanctionData(id: string): Promise<SanctionData | null> {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) return null;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { sanction_id: id };
    }

    const data = await db.collection("sanctions").findOne(query);
    if (!data) return null;

    return {
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      loan_amount: data.loan_amount,
      tenure_months: data.tenure_months,
      interest_rate: data.interest_rate,
      emi: data.emi,
      total_amount: data.total_amount,
      processing_fee: data.processing_fee,
      created_at: data.created_at,
      validity_days: data.validity_days,
      bank_details: data.bank_details
        ? {
            account_number: data.bank_details.account_number,
            ifsc_code: data.bank_details.ifsc_code,
            account_holder_name: data.bank_details.account_holder_name,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching sanction data:", error);
    return null;
  }
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const sanction = await getSanctionData(id);

  if (!sanction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-100">
        <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col items-center gap-3">
          <p className="text-xl font-bold text-neutral-800">
            Sanction Letter Not Found
          </p>
          <p className="text-neutral-500 text-sm">
            Reference ID: <span className="font-mono">{id}</span>
          </p>
          <div className="h-px w-full bg-neutral-100 my-2" />
          <p className="text-xs text-neutral-400">
            Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const serializedSanction = {
    ...sanction,
    created_at: sanction.created_at.toISOString(),
  };

  return <SanctionLetterContent data={serializedSanction as any} id={id} />;
};

export default Page;
