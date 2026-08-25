const { supabase, requireUser, json } = require('./_lib/supabase');

function stripBase64(dataUrl=''){
  const m=dataUrl.match(/^data:(.+);base64,(.*)$/);
  return m ? { contentType:m[1], buffer:Buffer.from(m[2],'base64'), ext:m[1].includes('png')?'png':'jpg' } : null;
}
async function uploadPhoto(userId, dataUrl){
  const parsed=stripBase64(dataUrl); if(!parsed) return null;
  const path=`${userId}/${Date.now()}.${parsed.ext}`;
  const { error }=await supabase.storage.from('inspection-photos').upload(path,parsed.buffer,{contentType:parsed.contentType,upsert:false});
  if(error) throw error;
  const { data }=supabase.storage.from('inspection-photos').getPublicUrl(path);
  return data.publicUrl;
}
module.exports=async(req,res)=>{
 try{
  const user=await requireUser(req);
  if(req.method==='GET'){
    const {data,error}=await supabase.from('inspections').select('*').eq('responsavel_id',user.id).order('created_at',{ascending:false}).limit(100);
    if(error)throw error; return json(res,200,{inspections:data||[]});
  }
  if(req.method==='POST'){
    const b=req.body||{}; let foto_url=b.foto_url||null;
    if(b.foto_base64) foto_url=await uploadPhoto(user.id,b.foto_base64);
    const row={responsavel_id:user.id,nome:b.nome||'Peça sem identificação',codigo:b.codigo||null,modelo_caminhao:b.modelo_caminhao||null,placa:b.placa||null,quilometragem:Number(b.quilometragem||0),ano:Number(b.ano||new Date().getFullYear()),foto_url,...b};
    delete row.foto_base64;
    const {data,error}=await supabase.from('inspections').insert(row).select('*').single();
    if(error)throw error; return json(res,201,{inspection:data});
  }
  return json(res,405,{error:'Método não permitido.'});
 }catch(e){json(res,500,{error:e.message})}
};