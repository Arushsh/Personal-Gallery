import mongoose from "mongoose"

const MediaSchema = new mongoose.Schema({
 url: String,
 type: String,
 public_id: String,
 createdAt: {
  type: Date,
  default: Date.now
 }
})

export default mongoose.models.Media ||
 mongoose.model("Media", MediaSchema)