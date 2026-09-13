const $=s=>document.querySelector(s);
const pages={builder:$("#builder"),test:$("#test"),result:$("#result")};
let qs=[],ans=[],marks=[],seen=[],cur=0,left=0,timer=null,mode="exam";

const demo=[
{text:"A particle moves with constant acceleration. Which quantity changes uniformly with time?",options:["Velocity","Displacement","Acceleration","Mass"],answer:0,solution:"With constant acceleration, velocity changes linearly with time.",subject:"Physics"},
{text:"The value of sin²θ + cos²θ is:",options:["0","1","2","Depends on θ"],answer:1,solution:"The fundamental identity is sin²θ + cos²θ = 1.",subject:"Mathematics"},
{text:"Which molecule has linear geometry?",options:["NH₃","H₂O","CO₂","CH₄"],answer:2,solution:"CO₂ has two electron domains around carbon, giving a linear geometry.",subject:"Chemistry"},
{text:"The powerhouse of a eukaryotic cell is:",options:["Nucleus","Mitochondria","Ribosome","Golgi body"],answer:1,solution:"Mitochondria produce most cellular ATP through cellular respiration.",subject:"Biology"},
{text:"If f(x)=x², then f'(3) equals:",options:["3","6","9","12"],answer:1,solution:"f'(x)=2x, so f'(3)=6.",subject:"Mathematics"},
{text:"The SI unit of electric charge is:",options:["Volt","Ampere","Coulomb","Ohm"],answer:2,solution:"Electric charge is measured in coulombs (C).",subject:"Physics"}
];

$("#theme").onclick=()=>{document.body.classList.toggle("dark");$("#theme").textContent=document.body.classList.contains("dark")?"☀":"☾"};
$("#qpdf").onchange=e=>$("#qname").textContent=e.target.files[0]?.name||"PDF • click to select";
$("#spdf").onchange=e=>$("#sname").textContent=e.target.files[0]?.name||"Optional • answer key / solutions";
$("#demo").onclick=()=>start(demo,true);
$("#build").onclick=build;
$("#prev").onclick=()=>go(cur-1);
$("#next").onclick=()=>go(cur+1);
$("#mark").onclick=()=>{marks[cur]=!marks[cur];render()};
$("#submit").onclick=()=>$("#confirm").classList.remove("hidden");
$("#close").onclick=$("#cancel").onclick=()=>$("#confirm").classList.add("hidden");
$("#yes").onclick=()=>{ $("#confirm").classList.add("hidden");finish() };
$("#again").onclick=()=>{clearInterval(timer);show("builder")};

function show(k){Object.values(pages).forEach(p=>p.classList.remove("active"));pages[k].classList.add("active");scrollTo(0,0)}

async function build(){
 const f=$("#qpdf").files[0];
 if(!f){$("#status").textContent="Upload a question PDF first.";return}
 $("#build").disabled=true;$("#status").textContent="Extracting questions from PDF…";
 try{
   const text=await pdfText(f);
   const sol=$("#spdf").files[0]?await pdfText($("#spdf").files[0]):"";
   const parsed=parse(text,sol);
   if(!parsed.length)throw Error("No numbered multiple-choice questions were detected.");
   const n=Math.min(+$("#count").value||parsed.length,parsed.length);
   start(parsed.slice(0,n),false);
 }catch(e){$("#status").textContent=e.message+" Try the demo to preview the CBT."}
 finally{$("#build").disabled=false}
}

async function pdfText(file){
 const lib=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs");
 lib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs";
 const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;
 let out="";
 for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();out+=c.items.map(x=>x.str).join(" ")+"\\n"}
 return out;
}

function parse(text,sol){
 const chunks=text.replace(/\\u00a0/g," ").split(/(?=(?:^|\\n)\\s*(?:Q(?:uestion)?\\s*)?\\d+\\s*[.)-]\\s*)/i);
 const out=[];
 for(const ch of chunks){
   const head=ch.match(/(?:^|\\n)\\s*(?:Q(?:uestion)?\\s*)?(\\d+)\\s*[.)-]\\s*/i); if(!head)continue;
   const body=ch.slice(head.index+head[0].length).trim();
   const re=/(?:^|\\s)\\(?([A-D])\\)?[.)]\\s*/gi, ms=[...body.matchAll(re)];
   if(ms.length<2)continue;
   const q=body.slice(0,ms[0].index).trim(), opts=[];
   for(let i=0;i<ms.length;i++){const st=ms[i].index+ms[i][0].length,en=i+1<ms.length?ms[i+1].index:body.length;opts.push(body.slice(st,en).trim())}
   const sm=sol.match(new RegExp("(?:question\\\\s*)?"+head[1]+"[\\\\s\\\\S]{0,250}?([A-D])","i"));
   const answer=sm?sm[1].toUpperCase().charCodeAt(0)-65:null;
   out.push({text:q,options:opts.slice(0,4),answer,solution:sm?"Solution extracted from the uploaded solution PDF.":"Answer key was not confidently detected.",subject:"General"});
 }
 return out;
}

function start(data,isDemo){
 qs=data;ans=Array(qs.length).fill(null);marks=Array(qs.length).fill(false);seen=Array(qs.length).fill(false);cur=0;
 mode=$("#mode").value;$("#testName").textContent=isDemo?"Demo CBT":($("#name").value||"CBT Test").toUpperCase();
 left=(+$("#minutes").value||180)*60;if(isDemo)left=10*60;
 show("test");render();clearInterval(timer);
 timer=setInterval(()=>{if(mode==="practice"){return}left--;if(left<=0){left=0;finish()}updateClock()},1000);updateClock();
}

function updateClock(){const h=Math.floor(left/3600),m=Math.floor(left%3600/60),s=left%60;$("#clock").textContent=[h,m,s].map((x,i)=>i===0?String(x).padStart(2,"0"):String(x).padStart(2,"0")).join(":")}

function render(){
 seen[cur]=true;const q=qs[cur];$("#qnum").textContent=`Question ${cur+1} of ${qs.length}`;$("#subject").textContent=q.subject||"General";$("#qtext").textContent=q.text;
 $("#options").innerHTML=q.options.map((o,i)=>`<label class="option ${ans[cur]===i?"selected":""}"><input type="radio" name="opt" value="${i}" ${ans[cur]===i?"checked":""}><span>${String.fromCharCode(65+i)}. ${escapeHtml(o)}</span></label>`).join("");
 $("#options").querySelectorAll("input").forEach(x=>x.onchange=()=>{ans[cur]=+x.value;render()});
 const box=$("#solution");if(mode==="practice"&&q.solution){box.classList.remove("hidden");box.innerHTML="<b>Solution</b><br>"+escapeHtml(q.solution)}else box.classList.add("hidden");
 $("#prev").disabled=cur===0;$("#next").textContent=cur===qs.length-1?"Finish →":"Save & Next →";$("#progress").textContent=`${ans.filter(x=>x!==null).length}/${qs.length}`;
 $("#grid").innerHTML=qs.map((_,i)=>`<button class="${ans[i]!==null?"answered ":""}${seen[i]&&!ans[i]===null?"visited ":""}${marks[i]?"marked ":""}">${i+1}</button>`).join("");
 $("#grid").querySelectorAll("button").forEach((b,i)=>b.onclick=()=>{cur=i;render()});
}

function go(n){if(n<0)return;if(n>=qs.length){$("#confirm").classList.remove("hidden");return}cur=n;render()}

function finish(){
 clearInterval(timer);show("result");
 const total=qs.length, attempted=ans.filter(x=>x!==null).length, correct=qs.reduce((n,q,i)=>n+(ans[i]!==null&&q.answer!==null&&ans[i]===q.answer?1:0),0), wrong=attempted-correct;
 const pct=total?Math.round(correct/total*100):0;$("#rtitle").textContent=$("#testName").textContent;$("#percent").textContent=pct+"%";$("#summary").textContent=`${correct} correct out of ${total} questions · ${attempted} attempted`;
 $("#stats").innerHTML=[["Correct",correct],["Wrong",wrong],["Unattempted",total-attempted],["Accuracy",attempted?Math.round(correct/attempted*100)+"%":"0%"]].map(x=>`<div class="stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
 const subjects={};qs.forEach((q,i)=>{const s=q.subject||"General";subjects[s]??={c:0,t:0};subjects[s].t++;if(ans[i]===q.answer)subjects[s].c++});
 $("#bars").innerHTML=Object.entries(subjects).map(([s,v])=>`<div class="bar-row"><div class="bar-head"><span>${s}</span><span>${Math.round(v.c/v.t*100)}%</span></div><div class="bar"><i style="width:${Math.round(v.c/v.t*100)}%"></i></div></div>`).join("");
 $("#review").innerHTML=qs.map((q,i)=>{const ok=ans[i]!==null&&q.answer!==null&&ans[i]===q.answer;return `<div class="review-row"><b>${i+1}.</b><span class="${ok?"correct":"wrong"}">${ans[i]===null?"Unattempted":ok?"Correct":"Incorrect"}</span> · <span>Answer: ${q.answer===null?"Not detected":String.fromCharCode(65+q.answer)}</span><div>${escapeHtml(q.solution||"No solution available.")}</div></div>`}).join("");
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
