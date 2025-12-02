// src/routes/barriles.js
import { Router } from "express";
import { supabase } from "../supabaseClient.js";

const router = Router();

// GET /api/barriles  → lista barriles (solo activos)
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("barriles")
      .select("*")
      .eq("activo", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Error Supabase en /api/barriles:", error);
      // mientras debuggeamos, devolvemos más detalle:
      return res.status(500).json({
        error: "Error al obtener barriles desde Supabase",
        details: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error inesperado en /api/barriles:", err);
    next(err);
  }
});

export default router;
