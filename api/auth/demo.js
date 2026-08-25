const { supabase, json } = require('../_lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const email = process.env.DEMO_EMAIL || 'demo@ecooficina.local';
    const password = process.env.DEMO_PASSWORD || 'EcoDemo@12345';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return json(res, 401, { error: 'Configure um usuário demo no Supabase Auth e as variáveis DEMO_EMAIL/DEMO_PASSWORD.' });
    json(res, 200, { user: data.user, session: data.session });
  } catch (e) { json(res, 500, { error: e.message }); }
};