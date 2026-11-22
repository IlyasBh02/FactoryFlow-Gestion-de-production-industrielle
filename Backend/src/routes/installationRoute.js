import { Router } from "express";
import { installationStatus, install } from "../services/installationService.js";
import { controllerError } from "../middlewares/errorHandler.js";

const router = Router();
router.get("/status", async (req, res, next) => {
    try { res.json(await installationStatus()); }
    catch (error) { controllerError(error, res, next); }
});
router.post("/", async (req, res, next) => {
    try { res.status(201).json({ user: await install(req.body) }); }
    catch (error) { controllerError(error, res, next); }
});
export default router;
