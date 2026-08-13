export async function deliverFeedbackToLezhi(env, record, fetchImpl=fetch) {
  if(!env.LEZHI_FEEDBACK_URL||!env.LEZHI_FEEDBACK_TOKEN)return {accepted:false};
  try { const response=await fetchImpl(env.LEZHI_FEEDBACK_URL,{method:'POST',headers:{'Content-Type':'application/json','X-KOS-Token':env.LEZHI_FEEDBACK_TOKEN},body:JSON.stringify(record)});const result=await response.json();return {accepted:(response.status===200||response.status===201)&&result?.ok===true&&result?.reference===record.reference}; } catch { return {accepted:false}; }
}
