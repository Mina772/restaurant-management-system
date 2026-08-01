import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, enum: ['indoor', 'outdoor', 'balcony', 'private'], default: 'indoor' },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'maintenance'],
      default: 'available',
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Table = mongoose.model('Table', tableSchema);
export default Table;
