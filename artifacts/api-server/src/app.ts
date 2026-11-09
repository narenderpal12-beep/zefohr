import express from "express";
import {configureApp,errorHandler} from "@workspace/peoplehub-core";
const app=express();
configureApp(app);
app.use(errorHandler);
export default app;
