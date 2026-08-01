import mongoose from 'mongoose';

export const RESERVATION_STATUS = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];

const reservationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 30 },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true }, // "19:30"
    durationMinutes: { type: Number, default: 90 },
    status: { type: String, enum: RESERVATION_STATUS, default: 'pending', index: true },
    specialRequests: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, time: 1, table: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
