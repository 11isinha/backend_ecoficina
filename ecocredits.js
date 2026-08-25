const { supabase, requireUser, json } = require('./_lib/supabase');
module.exports=async(req,res)=>{
 try{
  const user=await requireUser(req);
  const {data,error}=await supabase.from('eco_transactions').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error)throw error; const rows=data||[];
  const saldo=rows.reduce((a,x)=>a+(x.tipo==='CREDITO'?Number(x.quantidade):-Number(x.quantidade)),0);
  const acumulados=rows.filter(x=>x.tipo==='CREDITO').reduce((a,x)=>a+Number(x.quantidade),0);
  const resgatados=rows.filter(x=>x.tipo==='DEBITO').reduce((a,x)=>a+Number(x.quantidade),0);
  const {data:ins}=await supabase.from('inspections').select('co2_evitado').eq('responsavel_id',user.id);
  json(res,200,{saldo,acumulados,resgatados,co2:(ins||[]).reduce((a,x)=>a+Number(x.co2_evitado||0),0),transactions:rows});
 }catch(e){json(res,500,{error:e.message})}
};