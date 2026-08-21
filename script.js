const KEY = "jee370rTrackerV3";
const LEGACY_V2 = "jee370rTrackerV2";
const LEGACY_V1 = "jee370rTrackerV1";

// Tere naye HTML <thead> order ke exact same mapping:
const fields = [
  "date",      // 1. DATE
  "lec",       // 2. LEC TOTAL
  "phyWork",   // 3. PHY HW / CLASS ILLU
  "chemWork",  // 4. CHEM HW / CLASS ILLU
  "mathWork",  // 5. MATH HW / CLASS ILLU
  "phyDpp",    // 6. PHY DPP (Naya order)
  "chemDpp",   // 7. CHEM DPP
  "mathDpp",   // 8. MATH DPP
  "phyPyq",    // 9. PHY PYQ
  "chemPyq",   // 10. CHEM PYQ
  "mathPyq"    // 11. MATH PYQ
];


const tbody = document.querySelector("#tracker tbody");

// 1. Helper Functions
function num(v) {
  const m = String(v || "").match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function sumField(data, field) {
  return data.reduce((s, r) => s + num(r[field]), 0);
}

function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function combine(a, b) {
  const x = String(a || "").trim(), y = String(b || "").trim();
  if (x && y) return `${x} + ${y}`;
  return x || y;
}

// 2. Table Rows Manager
function makeRows() {
  if (!tbody) return;
  tbody.innerHTML = "";
  addRows(15);
}

function addRows(count = 15) {
  if (!tbody) return;
  const start = tbody.children.length;
  for (let i = 0; i < count; i++) {
    const tr = document.createElement("tr");
    tr.dataset.i = start + i;
    tr.innerHTML = fields.map((f, j) => 
      `<td><input data-f="${f}" ${j === 0 ? 'type="date"' : ''} inputmode="numeric"></td>`
    ).join("");
    tbody.appendChild(tr);
    
    tr.querySelectorAll("input").forEach(x => {
      x.addEventListener("input", () => {
        updateStats();
        autoExtendRows();
      });
    });
  }
}

function rowsData() {
  if (!tbody) return [];
  return [...tbody.querySelectorAll("tr")].map(tr => {
    const o = {};
    tr.querySelectorAll("input").forEach(i => o[i.dataset.f] = i.value);
    return o;
  });
}

function setData(data) {
  makeRows();
  (data || []).forEach((o, i) => {
    while (i >= tbody.children.length) addRows(15);
    const tr = tbody.children[i];
    fields.forEach(f => {
      if (o[f] != null) {
        const input = tr.querySelector(`[data-f="${f}"]`);
        if (input) input.value = o[f];
      }
    });
  });
  updateStats();
}

function autoExtendRows() {
  if (!tbody) return;
  const rows = [...tbody.children];
  const last = rows.slice(-3);
  if (last.some(tr => [...tr.querySelectorAll("input")].some(i => i.value.trim() !== ""))) {
    addRows(15);
  }
}

// 3. Migration & LocalStorage Logic
function migrateData() {
  const v3 = JSON.parse(localStorage.getItem(KEY) || "null");
  if (v3 && Array.isArray(v3.rows)) return v3;

  const v2 = JSON.parse(localStorage.getItem(LEGACY_V2) || "null");
  if (v2 && Array.isArray(v2.rows)) {
    return {
      startDate: v2.startDate || "",
      examDate: v2.examDate || "",
      rows: v2.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: combine(r.phyHw, r.phyIllu),
        chemWork: combine(r.chemHw, r.chemIllu),
        mathWork: combine(r.mathHw, r.mathIllu),
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.phyPyq || "", chemPyq: r.chemPyq || "", mathPyq: r.mathPyq || ""
      }))
    };
  }

  const v1 = JSON.parse(localStorage.getItem(LEGACY_V1) || "null");
  if (v1 && Array.isArray(v1.rows)) {
    return {
      startDate: v1.startDate || "",
      examDate: v1.examDate || "",
      rows: v1.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: r.phy || "", chemWork: r.chem || "", mathWork: r.math || "",
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.pyq || "", chemPyq: "", mathPyq: ""
      }))
    };
  }
  return null;
}

function save() {
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  localStorage.setItem(KEY, JSON.stringify({
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData()
  }));
  alert("Progress saved on this device.");
}

function load() {
  const x = migrateData();
  if (!x) { alert("No saved tracker found."); return; }
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  if (startEl) startEl.value = x.startDate || "";
  if (examEl) examEl.value = x.examDate || examEl.value;
  setData(x.rows);
  save();
}

function clearAll() {
  if (!confirm("Clear all study data?")) return;
  localStorage.removeItem(KEY);
  const startEl = document.querySelector("#startDate");
  if (startEl) startEl.value = "";
  setData([]);
}

function fillDates() {
  const startEl = document.querySelector("#startDate");
  const s = startEl ? startEl.value : "";
  if (!s) { alert("Select a start date first."); return; }
  const d = new Date(s + "T00:00:00");
  [...tbody.children].forEach((tr, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const dateInput = tr.querySelector('[data-f="date"]');
    if (dateInput) dateInput.value = x.toISOString().slice(0, 10);
  });
  updateStats();
}

// 4. Statistics Calculation
function updateStats() {
  const data = rowsData();
  const done = data.filter(r => Object.values(r).some(v => String(v || "").trim() !== "")).length;
  const lec = sumField(data, "lec");

  const phyWork = sumField(data, "phyWork");
  const chemWork = sumField(data, "chemWork");
  const mathWork = sumField(data, "mathWork");
  const chemDpp = sumField(data, "chemDpp");
  const mathDpp = sumField(data, "mathDpp");
  const phyPyq = sumField(data, "phyPyq");
  const chemPyq = sumField(data, "chemPyq");
  const mathPyq = sumField(data, "mathPyq");

  const phy = phyWork + phyPyq;
  const chem = chemWork + chemDpp + chemPyq;
  const math = mathWork + mathDpp + mathPyq;
  const overall = phy + chem + math;
  const pyq = phyPyq + chemPyq + mathPyq;
  const dpp = chemDpp + mathDpp;
  const avg = done ? Math.round(overall / done) : 0;
  const target = done ? Math.min(100, Math.round(overall / (done * 70) * 100)) : 0;

  put("daysDone", done);
  put("lecSum", lec);
  put("questionSum", overall);
  put("pyqSum", pyq);
  put("avgQ", avg);
  put("qTarget", target + "%");

  put("phyWorkSum", phyWork); put("chemWorkSum", chemWork); put("mathWorkSum", mathWork); put("workSum", phyWork + chemWork + mathWork);
  put("phyDppSum", 0); put("chemDppSum", chemDpp); put("mathDppSum", mathDpp); put("dppSum", dpp);
  put("phyPyqSum", phyPyq); put("chemPyqSum", chemPyq); put("mathPyqSum", mathPyq); put("pyqDetailSum", pyq);
  put("phyTotal", phy); put("chemTotal", chem); put("mathTotal", math); put("overallTotal", overall);
}

// 5. Monthly Reporting Helpers
function monthKey(date) { return String(date || '').slice(0, 7); }
function getMonths() { return [...new Set(rowsData().map(r => monthKey(r.date)).filter(Boolean))].sort(); }
function phaseNumber(key) { const keys = getMonths(); const i = keys.indexOf(key); return i < 0 ? '—' : i + 1; }
function monthRows(key) { return rowsData().filter(r => monthKey(r.date) === key); }

function monthSummary(key) {
  const d = monthRows(key);
  const done = d.filter(r => Object.values(r).some(v => String(v || '').trim() !== '')).length;
  const sum = f => d.reduce((a, r) => a + num(r[f]), 0);
  const phyWork = sum('phyWork'), chemWork = sum('chemWork'), mathWork = sum('mathWork');
  const chemDpp = sum('chemDpp'), mathDpp = sum('mathDpp');
  const phyPyq = sum('phyPyq'), chemPyq = sum('chemPyq'), mathPyq = sum('mathPyq');
  const phy = phyWork + phyPyq, chem = chemWork + chemDpp + chemPyq, math = mathWork + mathDpp + mathPyq;
  return { days: done, lec: sum('lec'), phyWork, chemWork, mathWork, chemDpp, mathDpp, phyPyq, chemPyq, mathPyq, phy, chem, math, total: phy + chem + math, pyq: phyPyq + chemPyq + mathPyq };
}

function updateCountdown() {
  const input = document.querySelector('#examDate');
  const out = document.querySelector('#countdown');
  const label = document.querySelector('#examDateLabel');
  if (!input || !out) return;
  const v = input.value;
  if (!v) { out.textContent = '—'; if (label) label.textContent = 'Set your target exam date above'; return; }
  const target = new Date(v + 'T00:00:00');
  const now = new Date();
  target.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - now) / 86400000);
  out.textContent = days > 0 ? `${days} DAYS LEFT` : days === 0 ? 'EXAM DAY' : 'DATE PASSED';
  if (label) label.textContent = target.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// 6. Exports & Import
function exportJSON() {
  const startEl = document.querySelector('#startDate');
  const examEl = document.querySelector('#examDate');
  const payload = {
    focusSessions: getFocusSessions(),
    version: 5,
    exportedAt: new Date().toISOString(),
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData(),
    focusSessions: getFocusSessions()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jee-tracker-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const x = JSON.parse(r.result);
      if (!Array.isArray(x.rows)) throw new Error('Invalid backup');
      const startEl = document.querySelector('#startDate');
      const examEl = document.querySelector('#examDate');
      if (startEl) startEl.value = x.startDate || '';
      if (examEl && x.examDate) examEl.value = x.examDate;
      setData(x.rows);
      if (Array.isArray(x.focusSessions)) saveFocusSessions(x.focusSessions);
      renderFocusHistory();
      save();
      alert('JSON imported successfully.');
    } catch (e) {
      alert('Invalid JSON backup.');
    }
  };
  r.readAsText(file);
}

async function makeMonthlyPDF() {
  const reportEl = document.querySelector('#reportMonth');
  const key = reportEl ? reportEl.value : "";
  if (!key) { alert('Select a report month first.'); return; }
  const rows = monthRows(key);
  if (!rows.length) { alert('No study data found for this month.'); return; }
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const m = monthSummary(key);
  const [y, mo] = key.split('-');
  const name = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
  pdf.text(`370R JEE Tracker — Phase ${phaseNumber(key)} — ${name}`, 14, 16);
  pdf.setFontSize(10);
  pdf.text(`Study days: ${m.days}   Lectures: ${m.lec}   Total Questions: ${m.total}   PYQs: ${m.pyq}   Avg Q/day: ${m.days ? Math.round(m.total / m.days) : 0}`, 14, 24);
  pdf.setFontSize(11);
  pdf.text('Subject summary', 14, 34);
  
  const rowsSummary = [
    ['HW / CLASS ILLU', m.phyWork, m.chemWork, m.mathWork, m.phyWork + m.chemWork + m.mathWork],
    ['DPP', 0, m.chemDpp, m.mathDpp, m.chemDpp + m.mathDpp],
    ['PYQ', m.phyPyq, m.chemPyq, m.mathPyq, m.pyq],
    ['TOTAL', m.phy, m.chem, m.math, m.total]
  ];
  
  if (pdf.autoTable) pdf.autoTable({ startY: 38, head: [['TYPE', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'TOTAL']], body: rowsSummary, theme: 'grid' });
  let yy = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 45;
  pdf.setFontSize(10); pdf.text('Daily log', 14, yy); yy += 5;
  
  const body = rows.map(r => [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq]);
  if (pdf.autoTable) pdf.autoTable({ startY: yy, head: [['DATE', 'LEC', 'PHY HW/ILLU', 'CHEM HW/ILLU', 'MATH HW/ILLU', 'CHEM DPP', 'MATH DPP', 'PHY PYQ', 'CHEM PYQ', 'MATH PYQ']], body, theme: 'grid', styles: { fontSize: 7 } });
  
  pdf.save(`JEE-Tracker-Phase-${phaseNumber(key)}-${key}.pdf`);
}

async function makePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const img = new Image();
  img.src = "tracker-template.png";
  
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    pdf.addImage(img, "PNG", 0, 0, 210, 297);
  } catch (e) {
    console.warn("Template image not found or blocked. Generating standard PDF layout instead.");
  }

  const sx = 210 / 1086, sy = 297 / 1536;
  const cols = [20, 126, 232, 338, 444, 550, 656, 762, 868, 974, 1080];
  const centers = cols.slice(0, -1).map((x, i) => ((x + cols[i + 1]) / 2) * sx);
  const tableTop = 264, rowH = (1398 - 264) / 15;
  const data = rowsData();

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(12);

  data.forEach((r, i) => {
    if (i >= 15) return;
    const y = (tableTop + (i + .5) * rowH) * sy + 1.7;
    const vals = [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq];
    
    vals.forEach((v, j) => {
      if (v === "" || v == null) return;
      let text = String(v);
      if (j === 0 && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [yy, mm, dd] = text.split("-"); text = `${dd}/${mm}`;
      }
      const maxChars = j === 0 ? 10 : 6;
      if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
      pdf.text(text, centers[j], y, { align: "center", maxWidth: (cols[j + 1] - cols[j]) * sx - 1 });
    });
  });

  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

// 8. Focus Mode
const FOCUS_KEY = "jee370rFocusSessionsV1";
const FOCUS_ACTIVE_KEY = "jee370rFocusActiveV1";
let focusInterval = null;
let focusStartMs = null;

function getFocusSessions() {
  try { return JSON.parse(localStorage.getItem(FOCUS_KEY) || "[]"); }
  catch(e) { return []; }
}
function saveFocusSessions(list) { localStorage.setItem(FOCUS_KEY, JSON.stringify(list)); }

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h,m,s].map((v,i)=>i===0 ? String(v).padStart(2,"0") : String(v).padStart(2,"0")).join(":");
}
function shortDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min/60)}h ${min%60}m`;
}
function updateFocusTimer() {
  const el=document.querySelector("#focusTimer");
  if (el && focusStartMs) el.textContent=formatDuration(Date.now()-focusStartMs);
}
function renderFocusHistory() {
  const list=getFocusSessions();
  const box=document.querySelector("#focusHistory");
  if(!box) return;
  const totalMs=list.reduce((a,s)=>a+Number(s.durationMs||0),0);
  const totalQ=list.reduce((a,s)=>a+Number(s.questions||0),0);
  put("focusTotalTime",shortDuration(totalMs));
  put("focusTotalQ",totalQ);
  put("focusSessions",list.length);
  if(!list.length){ box.innerHTML='<div class="focus-empty">No focus sessions yet. Start your first session 🚀</div>'; return; }
  box.innerHTML=list.slice().reverse().map(s=>{
    const d=new Date(s.endedAt||s.startedAt);
    const date=d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
    return `<div class="focus-row">
      <div><b>${escapeHtml(s.subject)}</b><br><span>${escapeHtml(s.activity)}</span></div>
      <div><b>${shortDuration(s.durationMs)}</b><br><span>${date}</span></div>
      <div><b>${Number(s.questions||0)}</b><br><span>questions</span></div>
      <div class="focus-time"><span>${d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>
    </div>`;
  }).join("");
}
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function startFocus() {
  if(focusStartMs) return;
  focusStartMs=Date.now();
  localStorage.setItem(FOCUS_ACTIVE_KEY,JSON.stringify({
    start:focusStartMs,
    subject:document.querySelector("#focusSubject").value,
    activity:document.querySelector("#focusActivity").value,
    questions:document.querySelector("#focusQuestions").value
  }));
  document.querySelector("#startFocus").disabled=true;
  document.querySelector("#stopFocus").disabled=false;
  put("focusStatus","Focusing… timer is running");
  focusInterval=setInterval(updateFocusTimer,1000);
  updateFocusTimer();
}
function stopFocus(saveIt=true) {
  if(!focusStartMs) return;
  const end=Date.now(), duration=end-focusStartMs;
  const active=JSON.parse(localStorage.getItem(FOCUS_ACTIVE_KEY)||"{}");
  if(saveIt && duration>=1000){
    const list=getFocusSessions();
    list.push({id:Date.now(),startedAt:new Date(focusStartMs).toISOString(),endedAt:new Date(end).toISOString(),
      durationMs:duration,subject:active.subject||document.querySelector("#focusSubject").value,
      activity:active.activity||document.querySelector("#focusActivity").value,
      questions:Math.max(0,Number(active.questions||document.querySelector("#focusQuestions").value||0))});
    saveFocusSessions(list);
  }
  localStorage.removeItem(FOCUS_ACTIVE_KEY);
  focusStartMs=null; clearInterval(focusInterval); focusInterval=null;
  document.querySelector("#startFocus").disabled=false;
  document.querySelector("#stopFocus").disabled=true;
  put("focusStatus","Session saved ✓");
  document.querySelector("#focusQuestions").value="";
  document.querySelector("#focusTimer").textContent="00:00:00";
  refreshFocusViews();
}
function restoreActiveFocus(){
  try{
    const a=JSON.parse(localStorage.getItem(FOCUS_ACTIVE_KEY)||"null");
    if(!a || !a.start) return;
    focusStartMs=Number(a.start);
    document.querySelector("#focusSubject").value=a.subject||"Physics";
    document.querySelector("#focusActivity").value=a.activity||"Questions Practice";
    document.querySelector("#focusQuestions").value=a.questions||"";
    document.querySelector("#startFocus").disabled=true;
    document.querySelector("#stopFocus").disabled=false;
    put("focusStatus","Focusing… restored after reload");
    focusInterval=setInterval(updateFocusTimer,1000); updateFocusTimer();
  }catch(e){}
}

function localDateKey(d=new Date()) {
  const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return x.toISOString().slice(0,10);
}
function sessionsForDate(dateKey){
  return getFocusSessions().filter(s=>localDateKey(new Date(s.startedAt||s.endedAt))===dateKey);
}
function activityTime(list, activity){ return list.filter(s=>s.activity===activity).reduce((a,s)=>a+Number(s.durationMs||0),0); }
function totalQuestions(list){ return list.reduce((a,s)=>a+Number(s.questions||0),0); }
function renderTodayDashboard(){
  const today=localDateKey(); const list=sessionsForDate(today);
  put('todayFocusTime',shortDuration(list.reduce((a,s)=>a+Number(s.durationMs||0),0)));
  put('todayLectureTime',shortDuration(activityTime(list,'Lecture')));
  put('todayQuestionTime',shortDuration(activityTime(list,'Questions Practice')));
  put('todayQuestions',totalQuestions(list)); put('todaySessions',list.length);
}
function renderDatewiseFocus(){
  const filter=document.querySelector('#focusDateFilter')?.value||'';
  let list=getFocusSessions().slice().sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt));
  if(filter) list=list.filter(s=>localDateKey(new Date(s.startedAt||s.endedAt))===filter);
  const box=document.querySelector('#datewiseFocus'); if(!box)return;
  if(!list.length){box.innerHTML='<div class="focus-empty">No study data for this date.</div>';return;}
  const groups={}; list.forEach(s=>{const k=localDateKey(new Date(s.startedAt||s.endedAt));(groups[k]??=[]).push(s);});
  box.innerHTML=Object.entries(groups).map(([date,sessions])=>{
    const total=sessions.reduce((a,s)=>a+Number(s.durationMs||0),0);
    const lec=activityTime(sessions,'Lecture'), qtime=activityTime(sessions,'Questions Practice');
    return `<div class="date-group"><div class="date-group-head"><b>${new Date(date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</b><span>Focus ${shortDuration(total)} · Lecture ${shortDuration(lec)} · Questions ${shortDuration(qtime)} · ${totalQuestions(sessions)} Q</span></div><table><thead><tr><th>Subject</th><th>Activity</th><th>Time</th><th>Questions</th><th>Note</th></tr></thead><tbody>${sessions.map(s=>`<tr><td>${escapeHtml(s.subject)}</td><td>${escapeHtml(s.activity)}</td><td>${shortDuration(s.durationMs)}</td><td>${Number(s.questions||0)}</td><td>${escapeHtml(s.note||'')}</td></tr>`).join('')}</tbody></table></div>`;
  }).join('');
}
function refreshFocusViews(){renderFocusHistory();renderTodayDashboard();renderDatewiseFocus();}
function saveManualLog(){
  const date=document.querySelector('#manualDate').value||localDateKey();
  const minutes=Math.max(0,Number(document.querySelector('#manualMinutes').value||0));
  if(!minutes){alert('Please enter study duration in minutes.');return;}
  const subject=document.querySelector('#manualSubject').value, activity=document.querySelector('#manualActivity').value;
  const q=Math.max(0,Number(document.querySelector('#manualQuestions').value||0));
  const note=document.querySelector('#manualNote').value.trim();
  const start=new Date(date+'T12:00:00'); const end=new Date(start.getTime()+minutes*60000);
  const list=getFocusSessions(); list.push({id:Date.now(),startedAt:start.toISOString(),endedAt:end.toISOString(),durationMs:minutes*60000,subject,activity,questions:q,note,manual:true});
  saveFocusSessions(list); document.querySelector('#manualMinutes').value='';document.querySelector('#manualQuestions').value='';document.querySelector('#manualNote').value='';
  refreshFocusViews(); alert('Manual study log saved ✓');
}
function downloadStudyReport(){
  const jsPDFLib=window.jspdf?window.jspdf.jsPDF:window.jsPDF;
  if(!jsPDFLib){alert('PDF library missing.');return;}
  const list=getFocusSessions().slice().sort((a,b)=>new Date(a.startedAt)-new Date(b.startedAt));
  if(!list.length){alert('No focus data to export yet.');return;}
  const pdf=new jsPDFLib({orientation:'portrait',unit:'mm',format:'a4'});
  pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.text('JEE STUDY — DATEWISE FOCUS REPORT',14,14);
  pdf.setFontSize(9);pdf.setFont('helvetica','normal');pdf.text('Generated: '+new Date().toLocaleString('en-IN'),14,20);
  const groups={};list.forEach(s=>{const k=localDateKey(new Date(s.startedAt));(groups[k]??=[]).push(s);});
  let y=27;
  for(const [date,sessions] of Object.entries(groups)){
    const total=sessions.reduce((a,s)=>a+Number(s.durationMs||0),0), qs=totalQuestions(sessions);
    const lec=activityTime(sessions,'Lecture'), qtime=activityTime(sessions,'Questions Practice');
    pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.text(`${new Date(date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})}`,14,y);y+=5;
    pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.text(`Total: ${shortDuration(total)} | Lecture: ${shortDuration(lec)} | Questions Practice: ${shortDuration(qtime)} | Questions: ${qs}`,14,y);y+=3;
    pdf.autoTable({startY:y,head:[['Subject','Activity','Duration','Questions','Note']],body:sessions.map(s=>[s.subject,s.activity,shortDuration(s.durationMs),String(s.questions||0),s.note||'']),theme:'grid',styles:{fontSize:7,cellPadding:2},headStyles:{fontStyle:'bold'}});
    y=pdf.lastAutoTable.finalY+8; if(y>270){pdf.addPage();y=15;}
  }
  pdf.save('JEE-Datewise-Study-Report.pdf');
}

function initFocusMode(){
  const menu=document.querySelector("#studyMenu"), overlay=document.querySelector("#focusOverlay");
  document.querySelector("#menuBtn")?.addEventListener("click",()=>menu.classList.toggle("open"));
  document.querySelector("#closeMenu")?.addEventListener("click",()=>menu.classList.remove("open"));
  document.querySelector("#openFocus")?.addEventListener("click",()=>{menu.classList.remove("open");overlay.classList.add("open");document.body.classList.add("focus-open");renderFocusHistory();updateFocusTimer();});
  document.querySelector("#closeFocus")?.addEventListener("click",()=>{overlay.classList.remove("open");document.body.classList.remove("focus-open");});
  document.querySelector("#startFocus")?.addEventListener("click",startFocus);
  document.querySelector("#stopFocus")?.addEventListener("click",()=>stopFocus(true));
  document.querySelector("#dashboardFocusBtn")?.addEventListener("click",()=>{overlay.classList.add("open");document.body.classList.add("focus-open");renderFocusHistory();});
  document.querySelector("#manualLogBtn")?.addEventListener("click",()=>{overlay.classList.add("open");document.body.classList.add("focus-open");document.querySelector("#manualDate").value=localDateKey();document.querySelector("#manualMinutes")?.focus();});
  document.querySelector("#saveManualLog")?.addEventListener("click",saveManualLog);
  document.querySelector("#reportBtn")?.addEventListener("click",downloadStudyReport);
  document.querySelector("#focusDateFilter")?.addEventListener("change",renderDatewiseFocus);
  document.querySelector("#clearFocusDateBtn")?.addEventListener("click",()=>{document.querySelector("#focusDateFilter").value='';renderDatewiseFocus();});
  overlay?.addEventListener("click",e=>{if(e.target===overlay && !focusStartMs){overlay.classList.remove("open");document.body.classList.remove("focus-open");}});
  document.querySelector('#manualDate')?.setAttribute('value',localDateKey());
  refreshFocusViews(); restoreActiveFocus();
}


// 7. Event Listeners Setup
document.addEventListener("DOMContentLoaded", () => {
  const bindClick = (id, fn) => { const el = document.querySelector(id); if (el) el.onclick = fn; };
  
  bindClick("#saveBtn", save);
  bindClick("#loadBtn", load);
  bindClick("#clearBtn", clearAll);
  bindClick("#datesBtn", fillDates);
  bindClick("#addBtn", () => addRows(15));
  bindClick("#pdfBtn", makePDF);
  bindClick("#monthPdfBtn", makeMonthlyPDF);
  bindClick("#jsonExportBtn", exportJSON);
  
  const jsonImport = document.querySelector("#jsonImport");
  if (jsonImport) jsonImport.addEventListener("change", e => { if (e.target.files[0]) importJSON(e.target.files[0]); });
  
  const examDateEl = document.querySelector("#examDate");
  if (examDateEl) examDateEl.addEventListener("change", () => { updateCountdown(); save(); });

  setInterval(updateCountdown, 60000);

  // Initialize
  makeRows();
  const saved = migrateData();
  if (saved) {
    const startEl = document.querySelector("#startDate");
    const examEl = document.querySelector("#examDate");
    if (startEl) startEl.value = saved.startDate || "";
    if (examEl) examEl.value = saved.examDate || examEl.value;
    setData(saved.rows);
  }
  updateCountdown();
  updateStats();
  initFocusMode();
});
    

  async function makePDF() {
  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDFLib) {
    alert("PDF library missing h! Index.html me script tags check kr.");
    return;
  }

  const pdf = new jsPDFLib({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Title Block
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("370R JEE ADVANCED TRACKER", 14, 12);
  pdf.setFontSize(8);
  pdf.text("15-DAY QUESTION & LECTURE LOG", 14, 16);

  // 2. Yellow Headers (14 Columns)
  const headers = [[
    "DATE", "LEC",
    "PHY HW", "PHY ILLU",
    "CHEM HW", "CHEM ILLU",
    "MATH HW", "MATH ILLU",
    "PHY DPP", "CHEM DPP", "MATH DPP",
    "PHY PYQ", "CHEM PYQ", "MATH PYQ"
  ]];

  // 3. Extract 15 Rows
  const rows = [...tbody.children].slice(0, 15).map(tr => {
    const getVal = f => {
      const inp = tr.querySelector(`[data-f="${f}"]`);
      return inp ? inp.value : "";
    };

    return [
      getVal("date"),
      getVal("lec"),
      getVal("phyWork"), "",
      getVal("chemWork"), "",
      getVal("mathWork"), "",
      getVal("phyDpp"),
      getVal("chemDpp"),
      getVal("mathDpp"),
      getVal("phyPyq"),
      getVal("chemPyq"),
      getVal("mathPyq")
    ];
  });

  // 4. Totals Calculation
  const data = rowsData().slice(0, 15);
  const totalLec = sumField(data, "lec");
  const pWork = sumField(data, "phyWork"), cWork = sumField(data, "chemWork"), mWork = sumField(data, "mathWork");
  const pDpp = sumField(data, "phyDpp"), cDpp = sumField(data, "chemDpp"), mDpp = sumField(data, "mathDpp");
  const pPyq = sumField(data, "phyPyq"), cPyq = sumField(data, "chemPyq"), mPyq = sumField(data, "mathPyq");

  const totalPyqs = pPyq + cPyq + mPyq;
  const totalQs = pWork + cWork + mWork + pDpp + cDpp + mDpp + totalPyqs;

  // 5. Single AutoTable (Foot option se exact column width lock ho jayegi)
  pdf.autoTable({
    startY: 19,
    head: headers,
    body: rows,
    foot: [[
      "TOTAL",
      totalLec || "",
      pWork || 0, 0,
      cWork || 0, 0,
      mWork || 0, 0,
      pDpp || 0, cDpp || 0, mDpp || 0,
      pPyq || 0, cPyq || 0, mPyq || 0
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
      textColor: 0,
      lineColor: 150,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [250, 204, 21], // Yellow Header
      textColor: 0,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [255, 255, 255], // White background for TOTAL row
      textColor: 0,
      fontStyle: 'bold',
      lineColor: 150,
      lineWidth: 0.1
    }
  });

  // 6. Footer Text Summary
  const footerY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 6 : 190;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total questions: ${totalQs}`, 14, footerY);
  pdf.text(`Total lectures: ${totalLec}   |   Total PYQs: ${totalPyqs}`, 14, footerY + 4);

  // Download Output
  pdf.save("15DAY-REPORT-JEE-Advanced.pdf");
  }
