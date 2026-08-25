const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.');
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function requireUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new Error('Não autenticado.');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Sessão inválida ou expirada.');

  return data.user;
}

function json(res, status, body) {
  res.status(status).json(body);
}

module.exports = { supabase, requireUser, json };