import users from "../repositories/userRepository.js";
import { ServiceError } from "../services/serviceError.js";
import { controllerError } from "./errorHandler.js";

export default async function requireAdmin(req, res, next) {
    try {
        const user = await users.findById(req.user.sub);
        if (!user) throw new ServiceError(401, "Utilisateur introuvable.");
        if (user.role !== "ADMIN") throw new ServiceError(403, "Acces reserve aux administrateurs.");
        return next();
    } catch (error) {
        return controllerError(error, res, next);
    }
}
