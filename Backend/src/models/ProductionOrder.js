import mongoose from 'mongoose';
import { positiveNumber, uniqueMaterials } from './validators.js';

const snapshotLineSchema = new mongoose.Schema({
  rawMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  reference: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  quantityPerUnit: {
    type: Number,
    required: true,
    validate: positiveNumber
  },
}, { _id: false });

const orderProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productReference: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, validate: positiveNumber },
  compositionSnapshot: { type: [snapshotLineSchema], required: true, validate: uniqueMaterials }
}, { _id: false });

const productionOrderSchema = new mongoose.Schema({
  products: {
    type: [orderProductSchema],
    default: undefined,
    validate: {
      validator: lines => !lines || (lines.length > 0 && new Set(lines.map(line => String(line.product))).size === lines.length),
      message: 'Un ordre doit contenir des produits sans doublon.'
    }
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function () { return !this.products?.length; }
  },
  productReference: {
    type: String,
    required: function () { return !this.products?.length; },
    immutable: true
  },
  productName: {
    type: String,
    required: function () { return !this.products?.length; },
    immutable: true
  },
  quantity: {
    type: Number,
    required: function () { return !this.products?.length; },
    validate: positiveNumber
  },
  compositionSnapshot: {
    type: [snapshotLineSchema],
    default: undefined,
    required: function () { return !this.products?.length; },
    immutable: true,
    validate: uniqueMaterials
  },
  status: {
    type: String,
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    required: true,
    default: 'PLANNED'
  },
  assignedOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
}, { timestamps: true });

productionOrderSchema.index({ assignedOperator: 1, status: 1, createdAt: -1 });
productionOrderSchema.index({ status: 1, createdAt: -1 });
productionOrderSchema.index({ product: 1, createdAt: -1 });
productionOrderSchema.index({ 'products.product': 1, createdAt: -1 });

export default mongoose.model('ProductionOrder', productionOrderSchema);
