/* Mission150 membership/auth + Razorpay integration.
   Set these values before deployment. Supabase URL/anon key are safe to expose
   in frontend code; Razorpay secret NEVER belongs here. */
const MISSION150_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  RAZORPAY_KEY_ID: "YOUR_RAZORPAY_KEY_ID",
  CREATE_ORDER_ENDPOINT: "/api/create-order",
  VERIFY_PAYMENT_ENDPOINT: "/api/verify-payment",
  PRICE_PAISE: 9900
};

let sb = null;
let authMode = "login";

function $(id){ return document.getElementById(id); }
function msg(text, ok=false){ const e=$("authMsg"); if(e){e.textContent=text; e.className="auth-msg "+(ok?"ok":"");} }
function configured(){ return !MISSION150_CONFIG.SUPABASE_URL.startsWith("YOUR_") && !MISSION150_CONFIG.SUPABASE_ANON_KEY.startsWith("YOUR_"); }

function setMode(mode){
  authMode=mode;
  $("authTitle").textContent=mode==="login"?"Login to Mission150":"Create your Mission150 account";
  $("authSubmit").textContent=mode==="login"?"Login":"Sign up";
  $("toggleAuth").textContent=mode==="login"?"Create a new account":"Already have an account? Login";
  msg("");
}

function showGate(){ $("authGate").hidden=false; $("appContent").hidden=true; }
function showApp(){ $("authGate").hidden=true; $("appContent").hidden=false; }
function showPayment(){
  $("authForm").hidden=true; $("toggleAuth").hidden=true; $("paymentPanel").hidden=false;
  $("authTitle").textContent="Almost there!";
  $("authSubtitle").textContent="Your account is created. Unlock Mission150 for ₹99.";
}

async function getMembership(user){
  const {data,error}=await sb.from("profiles").select("is_paid").eq("id",user.id).maybeSingle();
  if(error) throw error;
  return !!data?.is_paid;
}

async function enterApp(user){
  try{
    const paid=await getMembership(user);
    if(paid) showApp(); else showPayment();
  }catch(e){ console.error(e); msg("Could not check membership. Please try again."); }
}

async function authSubmit(e){
  e.preventDefault();
  if(!configured()){ msg("Setup required: add Supabase URL and anon key in membership.js."); return; }
  const email=$("authEmail").value.trim(), password=$("authPassword").value;
  $("authSubmit").disabled=true;
  try{
    if(authMode==="login"){
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error) throw error;
      await enterApp(data.user);
    }else{
      const {data,error}=await sb.auth.signUp({email,password});
      if(error) throw error;
      if(data.user){
        msg("Account created. Check your email if email confirmation is enabled.",true);
        await enterApp(data.user);
      }
    }
  }catch(e){ msg(e.message||"Authentication failed."); }
  finally{ $("authSubmit").disabled=false; }
}

async function startPayment(){
  if(!sb){msg("Payment setup is not ready.");return;}
  const {data:{user}}=await sb.auth.getUser();
  if(!user){showGate();return;}
  try{
    $("payBtn").disabled=true; msg("Creating secure payment order…");
    const r=await fetch(MISSION150_CONFIG.CREATE_ORDER_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id})});
    const order=await r.json(); if(!r.ok) throw new Error(order.error||"Could not create payment order.");
    const options={
      key:MISSION150_CONFIG.RAZORPAY_KEY_ID,
      amount:order.amount,
      currency:"INR",
      name:"Mission150",
      description:"Mission150 one-time access",
      order_id:order.id,
      prefill:{email:user.email||""},
      theme:{color:"#111111"},
      handler:async function(response){
        msg("Verifying payment…");
        const vr=await fetch(MISSION150_CONFIG.VERIFY_PAYMENT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...response,userId:user.id})});
        const out=await vr.json(); if(!vr.ok) throw new Error(out.error||"Payment verification failed.");
        msg("Payment verified. Welcome to Mission150!",true); showApp();
      }
    };
    const rzp=new Razorpay(options);
    rzp.on("payment.failed",()=>msg("Payment failed or was cancelled. No access was granted."));
    rzp.open();
  }catch(e){msg(e.message||"Payment could not start.");}
  finally{$("payBtn").disabled=false;}
}

async function logout(){ await sb?.auth.signOut(); location.reload(); }

async function initMembership(){
  showGate();
  if(!configured()){ msg("Setup required before deployment: configure Supabase in membership.js."); return; }
  sb=window.supabase.createClient(MISSION150_CONFIG.SUPABASE_URL,MISSION150_CONFIG.SUPABASE_ANON_KEY);
  $("authForm").addEventListener("submit",authSubmit);
  $("toggleAuth").addEventListener("click",()=>setMode(authMode==="login"?"signup":"login"));
  $("payBtn").addEventListener("click",startPayment);
  $("logoutBtn").addEventListener("click",logout);
  const {data:{session}}=await sb.auth.getSession();
  if(session?.user) await enterApp(session.user);
}

document.addEventListener("DOMContentLoaded",initMembership);
