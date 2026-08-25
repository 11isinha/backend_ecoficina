const { supabase, requireUser, json } = require('../_lib/supabase');
module.exports=async(req,res)=>{
 try{
  const user=await requireUser(req); const id=req.query.id;
  const {data,error}=await supabase.from('inspections').select('*').eq('id',id).eq('responsavel_id',user.id).single();
  if(error) return json(res,404,{error:'Inspeção não encontrada.'});
  json(res,200,{inspection:data});
 }catch(e){json(res,401,{error:e.message})}
};