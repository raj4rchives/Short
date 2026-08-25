/* Mission150 membership/auth + manual UPI approval.
   Set UPI_ID to your own UPI ID before deployment.
   Users submit their UTR after paying ₹99. You approve the request in Supabase.
*/
const MISSION150_CONFIG = {
  SUPABASE_URL: "https://kjlyutzogjmhnzioxpuz.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_plHTaKfRzlnVfBYJtBN0mw_9pNnXwQf",
  UPI_ID: "YOUR_UPI_ID@upi",
  UPI_NAME: "Mission150",
  PRICE_RUPEES: 99
};

let sb = null;
let authMode = "login";
let currentUser = null;

function $(id){return document.getElementById(id);}
function msg(text, ok=false){const e=$("authMsg"); if(e){e.textContent=text; e.className="auth-msg "+(ok?"ok":"");}}
function configured(){return !MISSION150_CONFIG.SUPABASE_URL.startsWith("YOUR_") && !MISSION150_CONFIG.SUPABASE_ANON_KEY.startsWith("YOUR_");}
function upiConfigured(){return MISSION150_CONFIG.UPI_ID && !MISSION150_CONFIG.UPI_ID.startsWith("YOUR_");}

function setMode(mode){
  authMode=mode;
  $("authTitle").textContent=mode==="login"?"Login to Mission150":"Create your Mission150 account";
  $("authSubmit").textContent=mode==="login"?"Login":"Sign up";
  $("toggleAuth").textContent=mode==="login"?"Create a new account":"Already have an account? Login";
  msg("");
}
function showGate(){$("authGate").hidden=false; $("appContent").hidden=true;}
function showApp(){$("authGate").hidden=true; $("appContent").hidden=false;}

async function getMembership(user){
  const {data,error}=await sb.from("profiles").select("is_paid").eq("id",user.id).maybeSingle();
  if(error) throw error;
  return !!data?.is_paid;
}

async function getPendingRequest(user){
  const {data,error}=await sb.from("payment_requests").select("id,utr,status,created_at,amount").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  return data;
}

function showPayment(){
  $("authForm").hidden=true; $("toggleAuth").hidden=true; $("paymentPanel").hidden=false;
  $("authTitle").textContent="Unlock Mission150";
  $("authSubtitle").textContent="Pay ₹99 by UPI and submit the UTR. Access will be unlocked after manual approval.";
  if($("upiIdText")) $("upiIdText").textContent=MISSION150_CONFIG.UPI_ID;
  if($("upiAmount")) $("upiAmount").textContent="₹"+MISSION150_CONFIG.PRICE_RUPEES;
  if($("upiPayLink")){
    const link="upi://pay?pa="+encodeURIComponent(MISSION150_CONFIG.UPI_ID)+"&pn="+encodeURIComponent(MISSION150_CONFIG.UPI_NAME)+"&am="+MISSION150_CONFIG.PRICE_RUPEES+"&cu=INR";
    $("upiPayLink").href=link;
  }
}

async function enterApp(user){
  currentUser=user;
  try{
    const paid=await getMembership(user);
    if(paid){showApp(); return;}
    showPayment();
    const req=await getPendingRequest(user);
    if(req){
      $("utrInput").value=req.utr||"";
      $("requestStatus").textContent=req.status==="pending"?"Payment submitted. Waiting for approval."
        :req.status==="rejected"?"Your request was rejected. Please check your UTR and submit again."
        :"Payment request status: "+req.status;
      if(req.status==="pending") $("submitPaymentBtn").disabled=true;
    }
  }catch(e){console.error(e); msg("Could not check membership/payment status. Please try again.");}
}

async function authSubmit(e){
  e.preventDefault();
  if(!configured()){msg("Setup required: add Supabase URL and anon key in membership.js.");return;}
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
        if(data.session){msg("Account created successfully. Pay ₹99 to unlock Mission150.",true); await enterApp(data.user);}
        else {msg("Account created. Please verify your email, then login to continue.",true); setMode("login");}
      }
    }
  }catch(e){msg(e.message||"Authentication failed.");}
  finally{$("authSubmit").disabled=false;}
}

async function submitPaymentRequest(){
  if(!currentUser){showGate();return;}
  const utr=$("utrInput").value.trim();
  if(!utr){msg("Please enter your UTR / transaction ID.");return;}
  if(!upiConfigured()){msg("Admin setup required: add your UPI ID in membership.js.");return;}
  if(!/^[-A-Za-z0-9]{6,40}$/.test(utr)){msg("Please enter a valid UTR / transaction ID.");return;}
  $("submitPaymentBtn").disabled=true;
  try{
    const {data,error}=await sb.from("payment_requests").insert({user_id:currentUser.id,amount:MISSION150_CONFIG.PRICE_RUPEES,utr,status:"pending"}).select().single();
    if(error) throw error;
    $("requestStatus").textContent="Payment submitted successfully. We'll unlock your account after verification.";
    msg("UTR submitted. Please wait for manual approval.",true);
  }catch(e){
    console.error(e);
    if(String(e.message||"").toLowerCase().includes("duplicate")) msg("This UTR has already been submitted.");
    else msg(e.message||"Could not submit payment request.");
    $("submitPaymentBtn").disabled=false;
  }
}

async function refreshStatus(){
  if(!currentUser)return;
  try{await enterApp(currentUser);}catch(e){console.error(e);}
}
async function logout(){await sb?.auth.signOut();location.reload();}

async function initMembership(){
  showGate();
  if(!configured()){msg("Setup required before deployment: configure Supabase in membership.js.");return;}
  sb=window.supabase.createClient(MISSION150_CONFIG.SUPABASE_URL,MISSION150_CONFIG.SUPABASE_ANON_KEY);
  $("authForm").addEventListener("submit",authSubmit);
  $("toggleAuth").addEventListener("click",()=>setMode(authMode==="login"?"signup":"login"));
  $("submitPaymentBtn").addEventListener("click",submitPaymentRequest);
  $("refreshStatusBtn").addEventListener("click",refreshStatus);
  $("logoutBtn").addEventListener("click",logout);
  if($("copyUpiBtn")) $("copyUpiBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(MISSION150_CONFIG.UPI_ID);msg("UPI ID copied.",true);}catch(e){msg("UPI ID: "+MISSION150_CONFIG.UPI_ID,true);}});
  const {data:{session}}=await sb.auth.getSession();
  if(session?.user) await enterApp(session.user);
}

document.addEventListener("DOMContentLoaded",initMembership);
