import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Installation from "../models/Installation.js";
import User from "../models/User.js";
import { ServiceError, requiredText } from "./serviceError.js";

export async function installationStatus() {
    return { installed: Boolean(await Installation.exists({ _id: "factoryflow" }) || await User.exists({ role: "ADMIN" })) };
}

export async function install(data = {}) {
    const name = requiredText(data.name, "Le nom est obligatoire.");
    const email = requiredText(data.email, "L'email est obligatoire.").toLowerCase();
    const password = requiredText(data.password, "Le mot de passe est obligatoire.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceError(400, "Email invalide.");
    if (password.length < 8) throw new ServiceError(400, "Utilisez au moins 8 caracteres pour le mot de passe.");
    const passwordHash = await bcrypt.hash(data.password, 10);
    try {
        return await mongoose.connection.transaction(async session => {
            if (await Installation.exists({ _id: "factoryflow" }).session(session) || await User.exists({ role: "ADMIN" }).session(session)) {
                throw new ServiceError(409, "L'application est deja installee.");
            }
            const adminId = new mongoose.Types.ObjectId();
            // The fixed installation ID prevents two concurrent first admins.
            await Installation.create([{ _id: "factoryflow", firstAdmin: adminId }], { session });
            const [admin] = await User.create([{ _id: adminId, name, email, password: passwordHash, role: "ADMIN" }], { session });
            return { name: admin.name, email: admin.email, role: admin.role };
        });
    } catch (error) {
        if (error.code === 11000) throw new ServiceError(409, "L'application est deja installee ou cet email existe.");
        throw error;
    }
}
