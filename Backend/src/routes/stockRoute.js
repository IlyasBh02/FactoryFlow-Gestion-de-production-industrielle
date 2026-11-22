import { Router } from "express";
import {
    createStock,
    getAllStocks,
    getStockById,
    updateStock,
    addStockEntry,
    deleteStock
} from "../controller/stockController.js";
import verifyToken from "../middlewares/verifyToken.js";
import requireAdmin from "../middlewares/requireAdmin.js";

const route = Router();
route.use(verifyToken, requireAdmin);

route.post("/newStock", createStock);
route.get("/all", getAllStocks);
route.get("/:id", getStockById);
route.put("/update/:id", updateStock);
route.post("/entry/:id", addStockEntry);
route.delete("/delete/:id", deleteStock);

export default route;
