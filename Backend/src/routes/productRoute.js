import { Router } from "express";
import { createProduct, allProduct, getProduct, updateProduct, deleteProduct } from "../controller/productController.js";
import verifyToken from "../middlewares/verifyToken.js";
import requireAdmin from "../middlewares/requireAdmin.js";

const route = Router();
route.use(verifyToken, requireAdmin);

route.post("/newProduct", createProduct);
route.get("/all", allProduct);
route.get("/:reference", getProduct);
route.put("/update/:reference", updateProduct);
route.delete("/delete/:reference", deleteProduct);

export default route;
