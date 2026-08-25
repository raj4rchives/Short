import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature,userId}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!userId) return res.status(400).json({error:"Missing payment fields"});
  const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  if(expected!==razorpay_signature) return res.status(400).json({error:"Invalid payment signature"});
  try{
    const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const {error}=await admin.from("profiles").upsert({id:userId,is_paid:true,paid_at:new Date().toISOString()},{onConflict:"id"});
    if(error) throw error;
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({error:e.message||"Could not unlock account"});}
}
