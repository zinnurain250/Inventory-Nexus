import { Router, type IRouter } from "express";
import healthRouter from "./health";
import inventoryRouter from "./inventory";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import salesRouter from "./sales";
import purchasesRouter from "./purchases";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(inventoryRouter);
router.use(customersRouter);
router.use(suppliersRouter);
router.use(salesRouter);
router.use(purchasesRouter);
router.use(dashboardRouter);

export default router;
