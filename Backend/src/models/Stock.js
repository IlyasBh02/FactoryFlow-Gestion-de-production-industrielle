import mongoose from 'mongoose';
import { nonNegativeNumber } from './validators.js';

const movementSchema = new mongoose.Schema({
  type: { type: String, enum: ['INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT'], required: true },
  quantity: { type: Number, required: true, validate: nonNegativeNumber },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionOrder', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const stockSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'La matière première est obligatoire'],
    unique: true, // Document unique par matière première
    immutable: true
  },
  quantityInitial: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    immutable: true
  },
  quantityCurrent: {
    type: Number,
    required: true,
    min: 0,
    default: function () {
      return this.quantityInitial; 
    }
  },
  alertThreshold: { type: Number, default: 0, validate: nonNegativeNumber },
  movements: { type: [movementSchema], default: [] },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  }
}, { timestamps: true });

export default mongoose.model('Stock', stockSchema);
