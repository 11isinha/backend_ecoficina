const { supabase, requireUser, json } = require('./_lib/supabase');
module.exports=async(req,res)=>{
 try{
  await requireUser(req);
  const {data,error}=await supabase.from('fleet').select('*').order('created_at',{ascending:false});
  if(error)throw error; json(res,200,{fleet:data||[]});
 }catch(e){json(res,500,{error:e.message})}
};