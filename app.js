const notes=[
 {s:"Physics",t:"Kinematics",d:"Core equations, graphs, relative motion and quick traps.",i:"⚙"},
 {s:"Physics",t:"Electrostatics",d:"Field, potential, Gauss law, capacitance and energy.",i:"⚡"},
 {s:"Chemistry",t:"Chemical Equilibrium",d:"Kc/Kp, Q, Le Chatelier and dissociation shortcuts.",i:"⚗"},
 {s:"Chemistry",t:"Electrochemistry",d:"Nernst equation, conductance and cell potential essentials.",i:"🔋"},
 {s:"Maths",t:"Quadratic Equations",d:"Roots, relations, range and common JEE patterns.",i:"∑"},
 {s:"Maths",t:"Definite Integration",d:"Properties, symmetry and standard results for fast solving.",i:"∫"}
];
const pyqs=[
 ["JEE Main","2026","Physics","Current Electricity","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2026","Chemistry","Chemical Bonding","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2025","Maths","Coordinate Geometry","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2024","Physics","Modern Physics","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2023","Chemistry","Coordination Compounds","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2022","Maths","Matrices & Determinants","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2021","Physics","Semiconductors","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Main","2020","Chemistry","Thermodynamics","Official NTA paper archive","https://jeemain.nta.nic.in/"],
 ["JEE Advanced","2026","Physics","Mechanics","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2025","Maths","Algebra","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2024","Chemistry","Organic Chemistry","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2023","Physics","Electromagnetism","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2022","Maths","Calculus","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2021","Chemistry","Physical Chemistry","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["JEE Advanced","2020","Physics","Mechanics","Official JEE Advanced archive","https://jeeadv.ac.in/"],
 ["BITSAT","2026","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2025","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2024","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2023","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2022","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2021","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"],
 ["BITSAT","2020","Mixed","PCM + English + Logical Reasoning","Practice set / licensed source slot","#"]
];

const notesGrid=document.getElementById("notesGrid");
function renderNotes(subject="All"){
 notesGrid.innerHTML=notes.filter(n=>subject==="All"||n.s===subject).map(n=>`
 <article class="note-card"><div class="icon">${n.i}</div><h3>${n.t}</h3><p>${n.d}</p><button class="secondary" onclick="showNote('${n.t}')">Open →</button></article>`).join("");
}
renderNotes();
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderNotes(b.dataset.subject)});

const pyqList=document.getElementById("pyqList"), exam=document.getElementById("examFilter"), year=document.getElementById("yearFilter"), search=document.getElementById("search");
function renderPyq(){
 const q=search.value.toLowerCase(), e=exam.value, y=year.value;
 const rows=pyqs.filter(r=>(e==="All Exams"||r[0]===e)&&(y==="All Years"||r[1]===y)&&r.join(" ").toLowerCase().includes(q));
 pyqList.innerHTML=rows.map(r=>`<div class="pyq-row"><div><small>${r[0]} • ${r[1]} • ${r[2]}</small><strong>${r[3]}</strong><small>${r[4]}</small></div><a class="open-link" href="${r[5]}" target="_blank" rel="noopener">${r[5]==="#"?"Soon":"Open →"}</a></div>`).join("")||"<div class='notice'>No matching item. Try another year, exam or topic.</div>";
}
[exam,year,search].forEach(x=>x.addEventListener("input",renderPyq));renderPyq();

let solved=Number(localStorage.getItem("jeesatSolved")||0);document.getElementById("doneCount").textContent=solved;
document.querySelectorAll(".solve").forEach(b=>b.onclick=()=>{if(!b.disabled){solved+=Number(b.dataset.add);localStorage.setItem("jeesatSolved",solved);document.getElementById("doneCount").textContent=solved;b.textContent="Solved ✓";b.disabled=true;toast("Question added to your progress");}});
document.querySelectorAll(".practice-card").forEach(b=>b.onclick=()=>{toast(b.dataset.mode+" mode selected");});
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function showNote(t){openModal(`<div class="eyebrow">QUICK REVISION</div><h2 style="font-family:Kalam;font-size:32px">${t}</h2><p>This is a starter digital-book screen. Add your verified formula/short-note content here chapter by chapter. Keep the notes concise and exam-focused.</p><button class="primary" onclick="toast('Bookmark saved')">☆ Bookmark</button>`)}
function openTool(type){
 const content={predictor:`<div class="eyebrow">EXAM TOOL</div><h2>Score Predictor</h2><p>Enter marks for a rough practice estimate.</p><input id="marks" type="number" min="0" max="300" placeholder="Marks / 300" style="width:100%;padding:13px;border:1px solid #ddd;border-radius:12px"><button class="primary" style="margin-top:12px" onclick="predict()">Calculate →</button><div id="result" style="margin-top:15px;font-weight:800"></div>`,timer:`<div class="eyebrow">FOCUS MODE</div><h2>25-minute Focus Timer</h2><div id="timer" style="font-size:52px;font-weight:900;margin:20px 0">25:00</div><button class="primary" onclick="startTimer()">▶ Start</button>`,book:`<div class="eyebrow">DIGITAL BOOK</div><h2>Your revision library</h2><p>Organise Physics, Chemistry and Maths into chapters. Add formulas, 1-page notes, solved examples and your own bookmarks.</p><button class="primary" onclick="toast('Book workspace opened')">Open workspace →</button>`};openModal(content[type])}
function predict(){let m=Number(document.getElementById("marks").value);document.getElementById("result").textContent=m?`Practice score: ${m}/300 • Use official results for real percentile.`:"Enter marks first."}
let timerInterval;function startTimer(){let s=1500;clearInterval(timerInterval);timerInterval=setInterval(()=>{s--;document.getElementById("timer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;if(s<=0){clearInterval(timerInterval);toast("Focus session complete 🎉")}},1000)}
function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.add("show")}
document.getElementById("modalX").onclick=()=>document.getElementById("modal").classList.remove("show");document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")document.getElementById("modal").classList.remove("show")};
const sidebar=document.getElementById("sidebar"),scrim=document.getElementById("scrim");document.getElementById("menuBtn").onclick=()=>{sidebar.classList.add("open");scrim.classList.add("show")};document.getElementById("closeMenu").onclick=closeMenu;scrim.onclick=closeMenu;function closeMenu(){sidebar.classList.remove("open");scrim.classList.remove("show")}
document.querySelectorAll(".sidebar a").forEach(a=>a.addEventListener("click",closeMenu));
document.getElementById("premiumBtn").onclick=()=>openModal(`<div class="eyebrow">JEESAT PRO</div><h2>Premium UI ready</h2><p>Add your payment/authentication provider later. This starter build keeps the premium screen as a front-end placeholder.</p><button class="primary" onclick="toast('Premium interest saved')">Continue →</button>`);
