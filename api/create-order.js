import Razorpay from "razorpay";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const rzp=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});
    const order=await rzp.orders.create({amount:9900,currency:"INR",receipt:`mission150_${Date.now()}`,notes:{userId:req.body?.userId||""}});
    return res.status(200).json({id:order.id,amount:order.amount,currency:order.currency});
  }catch(e){return res.status(500).json({error:e.message||"Order creation failed"});}
}
