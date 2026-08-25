const { supabase, requireUser, json } = require('./_lib/supabase');

function fallback(b){
  const integridade=92, desgaste=18, corrosao=2, vida=76, sustentabilidade=82;
  return {
    ...b, nome:b.nome||'Suporte do Eixo Traseiro', codigo:b.codigo||'504189756',
    modelo_compativel:b.modelo_caminhao||'IVECO S-WAY / T-WAY', peso:'8,4 kg',
    material:'Aço carbono', fornecedor:'Iveco / homologado',
    integridade, desgaste, corrosao, trincas:'Nenhuma', deformacoes:'Nenhuma', vida_util:vida,
    indice_sustentabilidade:sustentabilidade, recomendacao:'REAPROVEITAR',
    motivo:'A peça apresenta excelente integridade estrutural. Recomenda-se limpeza técnica e tratamento anticorrosivo antes da reinstalação.',
    economia_estimada:2450, co2_evitado:38, tempo_recuperacao:'1 h'
  };
}
async function realAI(b){
  if(!process.env.OPENAI_API_KEY || !b.foto_base64) return null;
  const prompt=`Você é um assistente técnico de manutenção automotiva. Analise a foto e os dados fornecidos como apoio de triagem, nunca substituindo inspeção certificada. Retorne SOMENTE JSON válido com: integridade (0-100), desgaste (0-100), corrosao (0-100), trincas (texto), deformacoes (texto), vida_util (0-100), indice_sustentabilidade (0-100), recomendacao (REAPROVEITAR|RECUPERAR|RECICLAR), motivo (texto curto), economia_estimada (número), co2_evitado (número kg), tempo_recuperacao (texto), material (texto), peso (texto), fornecedor (texto), modelo_compativel (texto). Dados: ${JSON.stringify({...b,foto_base64:undefined})}`;
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',input:[{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:b.foto_base64}]}]})});
  if(!r.ok) return null;
  const j=await r.json(); const text=j.output_text||'';
  const match=text.match(/\{[\s\S]*\}/); if(!match) return null;
  try{return JSON.parse(match[0])}catch{return null}
}
module.exports=async(req,res)=>{
 try{
  const user=await requireUser(req); if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  const b=req.body||{}; const ai=await realAI(b); const result={...fallback(b),...(ai||{})};
  let foto_url=null;
  if(b.foto_base64){
    const parsed=b.foto_base64.match(/^data:(.+);base64,(.*)$/);
    if(parsed){
      const ext=parsed[1].includes('png')?'png':'jpg',path=`${user.id}/${Date.now()}.${ext}`;
      const up=await supabase.storage.from('inspection-photos').upload(path,Buffer.from(parsed[2],'base64'),{contentType:parsed[1],upsert:false});
      if(!up.error) foto_url=supabase.storage.from('inspection-photos').getPublicUrl(path).data.publicUrl;
    }
  }
  const row={responsavel_id:user.id,nome:result.nome,codigo:result.codigo,modelo_caminhao:result.modelo_caminhao,modelo_compativel:result.modelo_compativel,placa:result.placa,quilometragem:Number(result.quilometragem||0),ano:Number(result.ano||2023),foto_url,integridade:result.integridade,desgaste:result.desgaste,corrosao:result.corrosao,trincas:result.trincas,deformacoes:result.deformacoes,vida_util:result.vida_util,indice_sustentabilidade:result.indice_sustentabilidade,recomendacao:result.recomendacao,motivo:result.motivo,economia_estimada:Number(result.economia_estimada||0),co2_evitado:Number(result.co2_evitado||0),tempo_recuperacao:result.tempo_recuperacao,material:result.material,peso:result.peso,fornecedor:result.fornecedor};
  const {data,error}=await supabase.from('inspections').insert(row).select('*').single(); if(error)throw error;
  if(row.recomendacao==='REAPROVEITAR'){
    await supabase.from('eco_transactions').insert({user_id:user.id,quantidade:Math.round(row.indice_sustentabilidade/2),tipo:'CREDITO',descricao:`Inspeção ${row.codigo}`});
  }
  json(res,200,{inspection:data,ai_enabled:Boolean(ai)});
 }catch(e){json(res,500,{error:e.message})}
};