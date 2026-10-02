const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    pronouns: { type: String, default: "" },
    bio: { type: String, default: "" },
    links: { type: [String], default: [] },
    profileImage: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },

    // Friend graph: accepted friends both ways, plus pending incoming requests.
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Never send the password hash back in API responses.
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
