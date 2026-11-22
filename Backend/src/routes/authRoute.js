import { Router } from "express";
import { register, login, logout } from "../controller/authController.js";
import verifyToken from "../middlewares/verifyToken.js";
import User from "../models/User.js";
import requireAdmin from "../middlewares/requireAdmin.js";

const route = Router();

route.post("/register", verifyToken, requireAdmin, register);
route.post("/createUser", verifyToken, requireAdmin, register);
route.get("/operators", verifyToken, requireAdmin, async (req, res, next) => {
    try { res.json({ operators: await User.find({ role: "OPERATOR" }).select("name email role") }); }
    catch (error) { next(error); }
});
route.put("/operators/:id", verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message_error: "Nom et email valides obligatoires." });
        if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message_error: "Identifiant invalide." });
        const operator = await User.findOneAndUpdate({ _id: req.params.id, role: "OPERATOR" }, { $set: { name, email } }, { new: true, runValidators: true }).select("name email role");
        if (!operator) return res.status(404).json({ message_error: "Operateur introuvable." });
        res.json({ operator });
    } catch (error) { next(error); }
});
route.post("/login", login)
route.post("/logout", verifyToken, logout);


route.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.sub)
            .select("name email role");

        if (!user) {
            return res.status(404).json({
                message_error: "Utilisateur introuvable"
            });
        }

        return res.status(200).json({
            user: user
        });

    } catch (error) {
        return res.status(500).json({
            message_error: "Erreur serveur"
        });
    }
});


export default route;
