const { supabase, requireUser, json } = require('./_lib/supabase');

module.exports = async (req, res) => {
  try {
    const user = await requireUser(req);
    const { data, error } = await supabase.from('inspections').select('recomendacao,economia_estimada,co2_evitado').eq('responsavel_id', user.id);
    if(error) throw error;
    const rows=data||[];
    const scanned=rows.length, approved=rows.filter(x=>x.recomendacao==='REAPROVEITAR').length;
    const savings=rows.reduce((a,x)=>a+Number(x.economia_estimada||0),0);
    const co2=rows.reduce((a,x)=>a+Number(x.co2_evitado||0),0);
    const { count: recycled }=await supabase.from('inspections').select('*',{count:'exact',head:true}).eq('responsavel_id',user.id).eq('recomendacao','RECICLAR');
    const { data: credits }=await supabase.from('eco_transactions').select('quantidade,tipo').eq('user_id',user.id);
    const creditBalance=(credits||[]).reduce((a,x)=>a+(x.tipo==='CREDITO'?Number(x.quantidade):-Number(x.quantidade)),0);
    json(res,200,{scanned,approved,credits:creditBalance,co2,savings,recycled:recycled||0, trucks:24,sustainability:scanned?Math.round((approved/scanned)*100):82,circularity:Math.min(98,60+approved),waste_reduction:74,financial_efficiency:81,compliance:94,fuel:Math.round(co2*.74)});
  }catch(e){json(res,500,{error:e.message})}
};