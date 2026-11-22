import ProductionOrder from "../models/ProductionOrder.js";
import mongoose from "mongoose";

export default {
    isValidId(id) {
        return mongoose.isObjectIdOrHexString(id);
    },

    async create(data) {
        return ProductionOrder.create(data);
    },

    async findById(id, session) {
        const query = ProductionOrder.findById(id).populate("assignedOperator", "name email role");
        return session ? query.session(session) : query;
    },

    async findAll(filter = {}) {
        return ProductionOrder.find(filter).populate("assignedOperator", "name email role").sort({ createdAt: -1 });
    },

    async transition(id, previousStatus, changes, session) {
        return ProductionOrder.findOneAndUpdate(
            { _id: id, status: previousStatus },
            { $set: changes },
            { new: true, runValidators: true, session }
        ).populate("assignedOperator", "name email role");
    },

    async existsByProductId(productId) {
        return ProductionOrder.exists({ $or: [{ product: productId }, { "products.product": productId }] });
    }
};
