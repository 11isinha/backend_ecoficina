const { supabase, requireUser, json } = require('./_lib/supabase');

module.exports = async (req, res) => {
  try {
    const user = await requireUser(req);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    json(res, 200, { user: profile || { id:user.id, email:user.email, nome:user.email?.split('@')[0] } });
  } catch(e) { json(res, 401, { error:e.message }); }
};