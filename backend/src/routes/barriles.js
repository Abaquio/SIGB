// src/routes/barriles.js
import { Router } from "express";
import { supabase } from "../supabaseClient.js";

const router = Router();

/* ======================================================================
   HELPERS BÁSICOS: usuario, IP, auditoría general
   ====================================================================== */

function getUsuarioIdFromReq(req) {
  // Si más adelante pasas el usuario por headers:
  const headerId = req.headers["x-user-id"] || req.headers["x-userid"];
  const parsedHeader = headerId ? Number(headerId) : null;
  if (Number.isFinite(parsedHeader)) return parsedHeader;

  // O desde un middleware de auth en req.user
  if (req.user && req.user.id) return Number(req.user.id);

  // Por ahora, como no tienes login, dejamos null
  return null;
}

function getClientInfo(req) {
  const rawIp =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    null;

  const userAgent = req.headers["user-agent"] || null;

  return { ip: rawIp, userAgent };
}

// Auditoría GENERAL (tabla auditoria)
async function registrarAuditoriaGeneral({
  req,
  accion, // 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
  entidadId,
  datosAntes,
  datosDespues,
}) {
  try {
    const usuario_id = getUsuarioIdFromReq(req);
    const { ip, userAgent } = getClientInfo(req);

    const { error } = await supabase.from("auditoria").insert([
      {
        usuario_id: usuario_id ?? null,
        modulo: "barriles",
        accion,
        entidad: "barriles",
        entidad_id: entidadId ?? null,
        datos_antes: datosAntes ?? null,
        datos_despues: datosDespues ?? null,
        ip,
        user_agent: userAgent,
      },
    ]);

    if (error) {
      console.error("❌ Error creando registro en auditoria (barriles):", error);
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando auditoria general:", err);
  }
}

/* ======================================================================
   HELPERS DE CÓDIGOS
   ====================================================================== */

async function generateUniqueCodigoInterno() {
  for (let i = 0; i < 5; i++) {
    const code = `B-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from("barriles")
      .select("id")
      .eq("codigo_interno", code)
      .maybeSingle();

    if (error) {
      console.error("❌ Error verificando codigo_interno único:", error);
      throw error;
    }

    if (!data) return code;
  }

  throw new Error("No se pudo generar un codigo_interno único");
}

async function generateUniqueCodigoQR() {
  for (let i = 0; i < 5; i++) {
    const code = `QR-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from("barriles")
      .select("id")
      .eq("codigo_qr", code)
      .maybeSingle();

    if (error) {
      console.error("❌ Error verificando codigo_qr único:", error);
      throw error;
    }

    if (!data) return code;
  }

  throw new Error("No se pudo generar un codigo_qr único");
}

/* ======================================================================
   HELPERS DE CATÁLOGOS (categoría cerveza, bodega)
   ====================================================================== */

async function ensureCategoriaCerveza(nombre) {
  if (!nombre) return null;

  let { data, error } = await supabase
    .from("categorias_cerveza")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();

  if (error) {
    console.error("❌ Error buscando categoria_cerveza:", error);
    throw error;
  }

  if (data) return data.id;

  const { data: inserted, error: insertError } = await supabase
    .from("categorias_cerveza")
    .insert([{ nombre }])
    .select("id")
    .single();

  if (insertError) {
    console.error("❌ Error creando categoria_cerveza:", insertError);
    throw insertError;
  }

  return inserted.id;
}

async function ensureBodega(nombre) {
  if (!nombre) return null;

  let { data, error } = await supabase
    .from("bodegas")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();

  if (error) {
    console.error("❌ Error buscando bodega:", error);
    throw error;
  }

  if (data) return data.id;

  const { data: inserted, error: insertError } = await supabase
    .from("bodegas")
    .insert([
      {
        nombre,
        tipo: "OTRO",
      },
    ])
    .select("id")
    .single();

  if (insertError) {
    console.error("❌ Error creando bodega:", insertError);
    throw insertError;
  }

  return inserted.id;
}

/* ======================================================================
   MAPPER PARA EL FRONT
   ====================================================================== */

function mapBarril(row) {
  const categoria = row.categorias_cerveza;
  const bodega = row.bodegas;

  return {
    ...row,
    tipo_cerveza: categoria?.nombre || null,
    ubicacion_actual: row.ubicacion_actual || bodega?.nombre || null,
  };
}

/* ======================================================================
   HELPER: registrar movimiento + auditoria_movimientos
   ====================================================================== */

async function registrarMovimientoConAuditoria(
  req,
  barrilRow,
  movimientoPayload,
  auditoriaAccion = "CREAR" // 👈 ahora parametrizable
) {
  try {
    if (!barrilRow || !barrilRow.id) return;

    const usuario_id = getUsuarioIdFromReq(req);
    const { ip, userAgent } = getClientInfo(req);

    const movimiento = {
      barril_id: barrilRow.id,
      usuario_id: usuario_id ?? null,
      tipo_movimiento: movimientoPayload.tipo_movimiento,
      // fecha_hora: default now()
      ubicacion_origen: movimientoPayload.ubicacion_origen ?? null,
      ubicacion_destino: movimientoPayload.ubicacion_destino ?? null,
      origen_bodega_id: movimientoPayload.origen_bodega_id ?? null,
      destino_bodega_id: movimientoPayload.destino_bodega_id ?? null,
      observaciones: movimientoPayload.observaciones ?? null,
    };

    // 1) Insert en movimientos
    const { data: mov, error: movError } = await supabase
      .from("movimientos")
      .insert([movimiento])
      .select("*")
      .single();

    if (movError) {
      console.error("❌ Error creando movimiento de barril:", movError);
      return;
    }

    // 2) Insert en auditoria_movimientos
    const { error: audError } = await supabase
      .from("auditoria_movimientos")
      .insert([
        {
          usuario_id: usuario_id ?? null,
          movimiento_id: mov.id,
          barril_id: barrilRow.id,
          accion: auditoriaAccion, // 👈 CREAR / ACTUALIZAR / ELIMINAR
          datos_antes: null,
          datos_despues: mov,
          ip,
          user_agent: userAgent,
        },
      ]);

    if (audError) {
      console.error("❌ Error creando auditoria_movimientos:", audError);
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando movimiento/auditoría:", err);
  }
}

/* ======================================================================
   RUTAS
   ====================================================================== */

// ---------------------
// GET /api/barriles
// ---------------------
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("barriles")
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .eq("activo", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Error Supabase en GET /api/barriles:", error);
      return res.status(500).json({
        error: "Error al obtener barriles desde Supabase",
        details: error.message,
      });
    }

    const normalized = (data || []).map(mapBarril);
    res.json(normalized);
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/barriles:", err);
    next(err);
  }
});

// ---------------------
// POST /api/barriles
// ---------------------
router.post("/", async (req, res, next) => {
  try {
    const { tipo_cerveza, capacidad_litros, estado_actual, ubicacion_actual } =
      req.body;

    if (!tipo_cerveza) {
      return res.status(400).json({ error: "tipo_cerveza es requerido" });
    }

    const codigo_interno = await generateUniqueCodigoInterno();
    const codigo_qr = await generateUniqueCodigoQR();

    const categoria_cerveza_id = await ensureCategoriaCerveza(tipo_cerveza);
    const bodega_id = ubicacion_actual
      ? await ensureBodega(ubicacion_actual)
      : null;

    const { data, error } = await supabase
      .from("barriles")
      .insert([
        {
          codigo_interno,
          codigo_qr,
          categoria_cerveza_id,
          capacidad_litros: capacidad_litros ?? null,
          estado_actual: estado_actual || "DISPONIBLE",
          ubicacion_actual: ubicacion_actual || null,
          bodega_id,
          activo: true,
        },
      ])
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .single();

    if (error) {
      console.error("❌ Error Supabase al crear barril:", error);
      return res.status(500).json({
        error: "Error al crear barril en Supabase",
        details: error.message,
      });
    }

    const barrilNormalizado = mapBarril(data);

    // Auditoría general: CREAR
    await registrarAuditoriaGeneral({
      req,
      accion: "CREAR",
      entidadId: data.id,
      datosAntes: null,
      datosDespues: barrilNormalizado,
    });

    // Movimiento de creación (auditoriaAccion default = CREAR)
    await registrarMovimientoConAuditoria(req, data, {
      tipo_movimiento: "CREAR_BARRIL",
      ubicacion_origen: null,
      ubicacion_destino: barrilNormalizado.ubicacion_actual || null,
      origen_bodega_id: null,
      destino_bodega_id: data.bodega_id ?? null,
      observaciones: "Creación de barril desde módulo de gestión.",
    });

    res.status(201).json(barrilNormalizado);
  } catch (err) {
    console.error("❌ Error al crear barril:", err);
    next(err);
  }
});

// ---------------------
// PUT /api/barriles/:id
// ---------------------
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID de barril inválido" });
    }

    // Estado ANTES
    const { data: beforeRaw, error: beforeError } = await supabase
      .from("barriles")
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .eq("id", id)
      .maybeSingle();

    if (beforeError) {
      console.error("❌ Error obteniendo barril antes de actualizar:", beforeError);
      return res.status(500).json({
        error: "Error al obtener barril antes de actualizar",
        details: beforeError.message,
      });
    }

    if (!beforeRaw) {
      return res.status(404).json({ error: "Barril no encontrado" });
    }

    const before = mapBarril(beforeRaw);

    const { tipo_cerveza, ubicacion_actual, ...rest } = req.body;
    const updateData = { ...rest };

    if (tipo_cerveza !== undefined) {
      updateData.categoria_cerveza_id = await ensureCategoriaCerveza(
        tipo_cerveza
      );
    }

    if (ubicacion_actual !== undefined) {
      updateData.ubicacion_actual = ubicacion_actual;
      updateData.bodega_id = ubicacion_actual
        ? await ensureBodega(ubicacion_actual)
        : null;
    }

    // No permitimos editar estos campos
    delete updateData.codigo_interno;
    delete updateData.codigo_qr;
    delete updateData.id;

    const { data, error } = await supabase
      .from("barriles")
      .update(updateData)
      .eq("id", id)
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .single();

    if (error) {
      console.error("❌ Error Supabase al actualizar barril:", error);
      return res.status(500).json({
        error: "Error al actualizar barril en Supabase",
        details: error.message,
      });
    }

    const after = mapBarril(data);

    // Auditoría general: ACTUALIZAR
    await registrarAuditoriaGeneral({
      req,
      accion: "ACTUALIZAR",
      entidadId: id,
      datosAntes: before,
      datosDespues: after,
    });

    // Detectar cambios para movimientos
    const movimientos = [];

    // 1) Cambio de ubicación / bodega
    if (
      before.ubicacion_actual !== after.ubicacion_actual ||
      beforeRaw.bodega_id !== data.bodega_id
    ) {
      movimientos.push({
        tipo_movimiento: "CAMBIO_UBICACION",
        ubicacion_origen: before.ubicacion_actual || null,
        ubicacion_destino: after.ubicacion_actual || null,
        origen_bodega_id: beforeRaw.bodega_id ?? null,
        destino_bodega_id: data.bodega_id ?? null,
        observaciones: null,
      });
    }

    // 2) Cambio de estado_actual
    if (before.estado_actual !== after.estado_actual) {
      movimientos.push({
        tipo_movimiento: "CAMBIO_ESTADO",
        ubicacion_origen: after.ubicacion_actual || null,
        ubicacion_destino: after.ubicacion_actual || null,
        origen_bodega_id: data.bodega_id ?? null,
        destino_bodega_id: data.bodega_id ?? null,
        observaciones: `Estado: ${before.estado_actual} → ${after.estado_actual}`,
      });
    }

    // 3) Cambio de activo (si lo manejas por PUT)
    if (before.activo !== after.activo) {
      movimientos.push({
        tipo_movimiento: after.activo
          ? "REACTIVAR_BARRIL"
          : "DESACTIVAR_BARRIL",
        ubicacion_origen: before.ubicacion_actual || null,
        ubicacion_destino: after.ubicacion_actual || null,
        origen_bodega_id: beforeRaw.bodega_id ?? null,
        destino_bodega_id: data.bodega_id ?? null,
        observaciones: `Activo: ${before.activo} → ${after.activo}`,
      });
    }

    // Registrar movimientos con accion = ACTUALIZAR
    for (const mov of movimientos) {
      await registrarMovimientoConAuditoria(req, data, mov, "ACTUALIZAR");
    }

    res.json(after);
  } catch (err) {
    console.error("❌ Error al actualizar barril:", err);
    next(err);
  }
});

// ---------------------
// DELETE (soft) /api/barriles/:id
// ---------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID de barril inválido" });
    }

    // Estado ANTES
    const { data: beforeRaw, error: beforeError } = await supabase
      .from("barriles")
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .eq("id", id)
      .maybeSingle();

    if (beforeError) {
      console.error("❌ Error obteniendo barril antes de soft-delete:", beforeError);
      return res.status(500).json({
        error: "Error al obtener barril antes de eliminar",
        details: beforeError.message,
      });
    }

    if (!beforeRaw) {
      return res.status(404).json({ error: "Barril no encontrado" });
    }

    const before = mapBarril(beforeRaw);

    const { data, error } = await supabase
      .from("barriles")
      .update({
        activo: false,
        estado_actual: "ELIMINADO",
      })
      .eq("id", id)
      .select("*, categorias_cerveza(nombre), bodegas(nombre)")
      .single();

    if (error) {
      console.error("❌ Error Supabase al desactivar barril:", error);
      return res.status(500).json({
        error: "Error al desactivar barril en Supabase",
        details: error.message,
      });
    }

    const after = mapBarril(data);

    // Auditoría general: ELIMINAR (soft)
    await registrarAuditoriaGeneral({
      req,
      accion: "ELIMINAR",
      entidadId: id,
      datosAntes: before,
      datosDespues: after,
    });

    // Movimiento de desactivación → accion ELIMINAR
    await registrarMovimientoConAuditoria(
      req,
      data,
      {
        tipo_movimiento: "DESACTIVAR_BARRIL",
        ubicacion_origen: before.ubicacion_actual || null,
        ubicacion_destino: null,
        origen_bodega_id: beforeRaw.bodega_id ?? null,
        destino_bodega_id: null,
        observaciones:
          "Barril marcado como inactivo (soft-delete) desde módulo de gestión.",
      },
      "ELIMINAR"
    );

    res.status(204).send();
  } catch (err) {
    console.error("❌ Error al desactivar (soft-delete) barril:", err);
    next(err);
  }
});

export default router;
