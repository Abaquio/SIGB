// src/routes/barriles.js
import { Router } from "express";
import { supabase } from "../supabaseClient.js";

const router = Router();

// =====================
// Helpers para códigos
// =====================
async function generateUniqueCodigoInterno() {
  // intenta algunas veces hasta encontrar uno libre
  for (let i = 0; i < 5; i++) {
    const code = `B-${Math.floor(100000 + Math.random() * 900000)}`; // B-123456

    const { data, error } = await supabase
      .from("barriles")
      .select("id")
      .eq("codigo_interno", code)
      .maybeSingle();

    if (error) {
      console.error("❌ Error verificando codigo_interno único:", error);
      throw error;
    }

    if (!data) {
      // no existe → podemos usarlo
      return code;
    }
  }

  throw new Error("No se pudo generar un codigo_interno único después de varios intentos");
}

async function generateUniqueCodigoQR() {
  for (let i = 0; i < 5; i++) {
    const code = `QR-${Math.floor(100000 + Math.random() * 900000)}`; // QR-123456

    const { data, error } = await supabase
      .from("barriles")
      .select("id")
      .eq("codigo_qr", code)
      .maybeSingle();

    if (error) {
      console.error("❌ Error verificando codigo_qr único:", error);
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error("No se pudo generar un codigo_qr único después de varios intentos");
}

// =====================
// GET /api/barriles
// =====================
// lista barriles (solo activos)
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

// =====================
// POST /api/barriles
// =====================
// crea un barril nuevo con codigo_interno y codigo_qr automáticos
router.post("/", async (req, res, next) => {
  try {
    // solo tomamos los campos de negocio que vienen del front
    const {
      tipo_cerveza,
      capacidad_litros,
      estado_actual,
      ubicacion_actual,
    } = req.body;

    if (!tipo_cerveza) {
      return res.status(400).json({ error: "tipo_cerveza es requerido" });
    }

    // generar códigos únicos
    const codigo_interno = await generateUniqueCodigoInterno();
    const codigo_qr = await generateUniqueCodigoQR();

    const { data, error } = await supabase
      .from("barriles")
      .insert([
        {
          codigo_interno,
          codigo_qr,
          tipo_cerveza,
          capacidad_litros,
          estado_actual: estado_actual || "DISPONIBLE",
          ubicacion_actual: ubicacion_actual || null,
          activo: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error Supabase al crear barril:", error);
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error al crear barril:", err);
    next(err);
  }
});

// =====================
// DELETE /api/barriles/:id
// =====================
// elimina barril por id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID de barril inválido" });
    }

    const { error } = await supabase.from("barriles").delete().eq("id", id);

    if (error) {
      console.error("❌ Error Supabase al eliminar barril:", error);
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    console.error("❌ Error al eliminar barril:", err);
    next(err);
  }
});

// =====================
// PUT /api/barriles/:id
// =====================
// actualizar barril
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID de barril inválido" });
    }

    const updateData = { ...req.body };
    delete updateData.id;              // no actualizamos el id
    delete updateData.codigo_interno;  // evitamos cambiar códigos
    delete updateData.codigo_qr;

    const { data, error } = await supabase
      .from("barriles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error Supabase al actualizar barril:", error);
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error al actualizar barril:", err);
    next(err);
  }
});

export default router;
