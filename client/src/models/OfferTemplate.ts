import { Schema, model, models } from "mongoose";

const OfferTemplateSchema = new Schema(
  {
    name: String,
    min_credit_score: Number,
    max_credit_score: Number,
    min_amount: Number,
    max_amount: Number,
    min_tenure_months: Number,
    max_tenure_months: Number,
    base_rate: Number,
    processing_fee_pct: Number,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "offer_template" }
);

export const OfferTemplate =
  models.OfferTemplate || model("OfferTemplate", OfferTemplateSchema);
