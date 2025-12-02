// src/routes/lecturasQr.js
import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

/**
 * POST /api/lecturas-qr
 * body esperado:
 * {
 *   "texto_qr": "string leído del QR",
 *   "usuario_id": 123,              // opcional si aún no tienes auth
 *   "ubicacion_reportada": "Bodega 1"
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { texto_qr, usuario_id, ubicacion_reportada } = req.body;

    if (!texto_qr) {
      return res.status(400).json({ error: 'texto_qr es requerido' });
    }

    // 1) Buscar barril por codigo_qr
    const { data: barril, error: barrilError } = await supabase
      .from('barriles')
      .select('*')
      .eq('codigo_qr', texto_qr)
      .maybeSingle();

    if (barrilError) throw barrilError;

    const resultado = barril ? 'ENCONTRADO' : 'NO_ENCONTRADO';
    const barril_id = barril ? barril.id : null;

    // 2) Insertar registro en lecturas_qr
    const { data: lectura, error: lecturaError } = await supabase
      .from('lecturas_qr')
      .insert([
        {
          barril_id,
          usuario_id: usuario_id ?? null,
          texto_qr,
          resultado,
          ubicacion_reportada: ubicacion_reportada ?? null
        }
      ])
      .select()
      .single();

    if (lecturaError) throw lecturaError;

    // 3) Responder
    res.status(201).json({
      mensaje: 'Lectura registrada',
      resultado,
      barril,
      lectura
    });
  } catch (err) {
    next(err);
  }
});

export default router;
