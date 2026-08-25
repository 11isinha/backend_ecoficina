import { supabase } from "../../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    // GET /api/inspections
    if (req.method === "GET") {
      const {
        data,
        error
      } = await supabase
        .from("inspecoes")
        .select(`
          *,
          veiculos (
            id,
            modelo,
            placa
          ),
          usuarios (
            id,
            nome,
            cargo
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar inspeções:", error);

        return res.status(500).json({
          success: false,
          error: "Erro ao buscar inspeções.",
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    // POST /api/inspections
    if (req.method === "POST") {
      const {
        veiculo_id,
        usuario_id,
        peca_nome,
        codigo_peca,
        foto_url,
        resultado,
        recomendacao,
        integridade,
        desgaste,
        corrosao,
        trincas,
        deformacoes,
        vida_util,
        economia_estimada,
        co2_evitado,
        indice_sustentabilidade,
        observacoes
      } = req.body || {};

      if (!peca_nome) {
        return res.status(400).json({
          success: false,
          error: "O nome da peça é obrigatório."
        });
      }

      const { data, error } = await supabase
        .from("inspecoes")
        .insert([
          {
            veiculo_id: veiculo_id || null,
            usuario_id: usuario_id || null,
            peca_nome,
            codigo_peca: codigo_peca || null,
            foto_url: foto_url || null,
            resultado: resultado || "EM_ANALISE",
            recomendacao: recomendacao || null,
            integridade: integridade ?? null,
            desgaste: desgaste ?? null,
            corrosao: corrosao ?? null,
            trincas: trincas || "Nenhuma",
            deformacoes: deformacoes || "Nenhuma",
            vida_util: vida_util ?? null,
            economia_estimada: economia_estimada ?? 0,
            co2_evitado: co2_evitado ?? 0,
            indice_sustentabilidade: indice_sustentabilidade ?? 0,
            observacoes: observacoes || null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar inspeção:", error);

        return res.status(500).json({
          success: false,
          error: "Erro ao criar inspeção.",
          details: error.message
        });
      }

      return res.status(201).json({
        success: true,
        message: "Inspeção criada com sucesso.",
        data
      });
    }

    return res.status(405).json({
      success: false,
      error: "Método não permitido."
    });

  } catch (error) {
    console.error("Erro inesperado:", error);

    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor.",
      details: error.message
    });
  }
}