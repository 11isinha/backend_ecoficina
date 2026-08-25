const { supabase, json } = require('../_lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return json(res, 400, { error: 'E-mail e senha são obrigatórios.' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return json(res, 401, { error: error.message });

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    json(res, 200, { user: profile || { id: data.user.id, email: data.user.email }, session: data.session });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
};