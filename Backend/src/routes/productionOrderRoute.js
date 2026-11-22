import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { createOrder, updateOrder, listOrders, getOrder, startOrder, completeOrder, cancelOrder } from "../controller/productionOrderController.js";

const route = Router();
route.use(verifyToken);
route.post("/", createOrder);
route.get("/", listOrders);
route.get("/:id", getOrder);
route.put("/:id", updateOrder);
route.patch("/:id/start", startOrder);
route.patch("/:id/complete", completeOrder);
route.patch("/:id/cancel", cancelOrder);

export default route;
