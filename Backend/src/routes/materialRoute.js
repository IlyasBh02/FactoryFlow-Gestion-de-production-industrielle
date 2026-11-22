import { Router } from "express";
import { createMaterial, allMaterial , updateMaterial} from "../controller/matiersController.js";
import verifyToken from "../middlewares/verifyToken.js";
import requireAdmin from "../middlewares/requireAdmin.js";

const route = Router();
route.use(verifyToken, requireAdmin);

route.post("/newMaterial", createMaterial)
route.get("/all", allMaterial);
route.post("/update/:reference", updateMaterial)

export default route;
