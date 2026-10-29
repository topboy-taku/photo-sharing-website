const mongoose = require("mongoose");

// Predefined reasons admins maintain for the post-report dropdown.
const ReportReasonSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportReason", ReportReasonSchema);
