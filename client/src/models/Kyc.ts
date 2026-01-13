import { Schema, model, models } from "mongoose";

const KycSchema = new Schema(
  {
    name: String,
    pan: {
      type: String,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      unique: true,
    },
    credit_score: Number,
    phone: {
      type: String,
      match: /^[0-9]{10}$/,
    },
    address: String,
    dob: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "kyc" }
);

export const Kyc = models.Kyc || model("Kyc", KycSchema);
