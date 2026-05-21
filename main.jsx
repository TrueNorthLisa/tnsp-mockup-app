import { useState, useRef, useEffect, useCallback } from "react";

const PLACEMENT_OPTIONS = [
  "Left Chest","Right Chest","Centre Front","Full Front",
  "Centre Back","Full Back","Sleeve — Left","Sleeve — Right",
  "Neck / Collar","Left Hip","Right Hip","Shoulder","Custom"
];
const DEC_TYPES = ["Screen Print","Embroidery","Heat Transfer","DTG","Patch"];
const VIEW_OPTIONS = ["Front","Back","Other"];

const PRESETS = {
  "Left Chest":    {x:.68,y:.30,scale:18},
  "Right Chest":   {x:.28,y:.30,scale:18},
  "Centre Front":  {x:.50,y:.36,scale:26},
  "Full Front":    {x:.50,y:.42,scale:54},
  "Centre Back":   {x:.50,y:.38,scale:26},
  "Full Back":     {x:.50,y:.40,scale:56},
  "Sleeve — Left": {x:.14,y:.46,scale:11},
  "Sleeve — Right":{x:.82,y:.46,scale:11},
  "Neck / Collar": {x:.50,y:.18,scale:12},
  "Left Hip":      {x:.68,y:.68,scale:14},
  "Right Hip":     {x:.28,y:.68,scale:14},
  "Shoulder":      {x:.50,y:.14,scale:10},
  "Custom":        {x:.50,y:.40,scale:24},
};

// ── Styles (inline to keep single-file) ──
const S = {
  body:     {fontFamily:"'IBM Plex Sans',sans-serif",background:"#f5f0e8",minHeight:"100vh",color:"#0f0f0f"},
  header:   {background:"#0f0f0f",borderBottom:"3px solid #c8372d",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  brand:    {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.7rem",letterSpacing:".08em",color:"#f5f0e8"},
  brandSpan:{color:"#c8372d"},
  brandSub: {fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".18em",textTransform:"uppercase",color:"#444",marginTop:2},
  tag:      {fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",border:"1px solid #333",color:"#666",padding:"5px 11px"},
  steps:    {display:"flex",background:"#0f0f0f",borderBottom:"2px solid #0f0f0f"},
  step:     (active,done)=>({flex:1,padding:"10px 16px",borderRight:"1px solid #2a2a2a",background:active?"#1a1a1a":done?"#111":"transparent",cursor:"pointer"}),
  stepNum:  (active)=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".14em",textTransform:"uppercase",color:active?"#c8372d":"#3a3a3a"}),
  stepLbl:  (active,done)=>({fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".8rem",fontWeight:500,color:active?"#f5f0e8":done?"#3a3a3a":"#555",marginTop:2}),
  wrap:     {maxWidth:820,margin:"0 auto",padding:"32px 20px 80px"},
  secTitle: {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",letterSpacing:".1em",borderBottom:"2px solid #0f0f0f",paddingBottom:5,marginBottom:14,display:"flex",alignItems:"baseline",gap:10},
  secN:     {fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",color:"#c8372d"},
  label:    {fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#555",display:"block",marginBottom:3},
  input:    {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"8px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".88rem",color:"#0f0f0f",outline:"none",width:"100%"},
  select:   {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",color:"#0f0f0f",outline:"none",width:"100%",appearance:"none"},
  textarea: {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".82rem",color:"#0f0f0f",outline:"none",width:"100%",resize:"vertical",minHeight:64},
  btn:      (variant="primary")=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".14em",textTransform:"uppercase",padding:"11px 22px",cursor:"pointer",border:"2px solid #0f0f0f",background:variant==="primary"?"#0f0f0f":variant==="red"?"#c8372d":"transparent",color:variant==="outline"?"#0f0f0f":"#f5f0e8"}),
  notice:   (type)=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".1em",textTransform:"uppercase",padding:"9px 13px",marginBottom:14,borderLeft:`3px solid ${type==="info"?"#2a5abd":type==="warn"?"#b8892e":"#2a7a4b"}`,background:type==="info"?"#e8f0fe":type==="warn"?"#fff8e6":"#e6f4ec",color:type==="info"?"#2a5abd":type==="warn"?"#7a5500":"#1b5e38"}),
  grid2:    {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  grid3:    {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},
  divider:  {border:"none",borderTop:"1px solid #d4cdc0",margin:"20px 0"},
  prow:     {background:"#fffdf8",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"12px 14px",marginBottom:10},
  sumCard:  {background:"#fff",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"14px 16px",marginBottom:10},
  artCard:  (sel)=>({background:"#fffdf8",border:`2px solid ${sel?"#c8372d":"#d4cdc0"}`,padding:8,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,width:78,position:"relative"}),
};

export default function App() {
  const [step, setStep] = useState(1);
  const [job, setJob] = useState({num:"",client:"",style:"",colour:""});
  const [garments, setGarments] = useState({front:null,back:null,other:null});
  const [artwork, setArtwork] = useState([]);
  const [placements, setPlacements] = useState([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",fromCentre:"",decType:"Screen Print",colours:"",notes:""}]);
  const [artCounter, setArtCounter] = useState(1);
  const [rowCounter, setRowCounter] = useState(2);
  const [aiStatus, setAiStatus] = useState("idle"); // idle | thinking | done | error
  const [aiPlan, setAiPlan] = useState([]);
  const [aiIntro, setAiIntro] = useState("");
  const [aiError, setAiError] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [mockupBuilt, setMockupBuilt] = useState(false);
  const canvasRef = useRef(null);
  const exportRef = useRef(null); // stores full combined canvas

  // ── Google Fonts ──
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  // ── Navigation ──
  function goStep(n) {
    if (n === 3) { runAI(); }
    else if (n === 4) { buildMockup(); }
    setStep(n);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  // ── Garment loading ──
  function loadGarmentView(e, view) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        setGarments(g => ({...g, [view]:{img, name:file.name, dataURL:ev.target.result}}));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Artwork loading ──
  function loadArtFiles(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          setArtwork(prev => [...prev, {id: artCounter + prev.length, img, name:file.name, dataURL:ev.target.result}]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    setArtCounter(c => c + e.target.files.length);
    e.target.value = "";
  }

  function removeArt(id) {
    setArtwork(a => a.filter(x => x.id !== id));
  }

  // ── Placement rows ──
  function addRow() {
    setPlacements(p => [...p, {_id:rowCounter,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",fromCentre:"",decType:"Screen Print",colours:"",notes:""}]);
    setRowCounter(c => c+1);
  }
  function removeRow(id) { setPlacements(p => p.filter(x => x._id !== id)); }
  function updateRow(id, key, val) { setPlacements(p => p.map(x => x._id===id ? {...x,[key]:val} : x)); }

  // ── AI call ──
  async function runAI() {
    setAiStatus("thinking");
    setAiPlan([]);
    setAiIntro("");
    setAiError("");

    if (!garments.front) { setAiStatus("error"); setAiError("Please upload a front garment photo first."); return; }
    if (placements.length === 0) { setAiStatus("error"); setAiError("Please add at least one placement."); return; }

    const artNames = artwork.map(a => `ID ${a.id}: "${a.name.replace(/\.[^.]+$/,"")}"`).join(", ") || "none";
    const placementDesc = placements.map((p,i) => {
      const artName = artwork.find(a => a.id == p.artId)?.name.replace(/\.[^.]+$/,"") || "unassigned";
      return `Placement ${i+1}:
  - View: ${p.view}
  - Position: ${p.placement}
  - Artwork: "${artName}" (ID: ${p.artId||"none"})
  - Art width: ${p.width||"not specified"} inches
  - From low collar point: ${p.fromCollar||"not specified"} inches
  - From centre: ${p.fromCentre||"not specified"}
  - Decoration: ${p.decType}
  - Colours: ${p.colours||"not specified"}
  - Notes: ${p.notes||"none"}`;
    }).join("\n\n");

    const loadedViews = Object.entries(garments).filter(([,v])=>v).map(([k])=>k).join(", ");

    const prompt = `You are a production assistant at True North Screen Printing & Embroidery in Vancouver, BC.
Interpret this mockup placement brief and return a confirmed placement plan as JSON only.

JOB:
- Job #: ${job.num||"not provided"}
- Client: ${job.client||"not provided"}
- Garment: ${job.style||"not provided"} in ${job.colour||"not provided"}
- Loaded views: ${loadedViews}

ARTWORK FILES: ${artNames}

PLACEMENTS:
${placementDesc}
${revisionNotes ? `\nREVISION NOTES: ${revisionNotes}` : ""}

Instructions:
1. For each placement, determine canvas x,y (0.0–1.0, top-left origin) and scale (artwork width as % of canvas width).
2. Scale guide: garment ~20" wide. 3.5" art ≈ 17%, 4" ≈ 20%, 10" ≈ 50%.
3. Use placement name as position guide (e.g. Left Chest = wearer's left = right side of image, x≈0.68).
4. Adjust y using fromCollar: garment height ~28". 3" from collar ≈ y=0.22, 5" ≈ y=0.30, 7" ≈ y=0.38.
5. Return ONLY valid JSON, no markdown, no backticks, no explanation.

JSON structure:
{
  "intro": "One sentence summary",
  "placements": [
    {
      "placement": "Left Chest",
      "view": "front",
      "artId": 1,
      "artName": "logo-name",
      "x": 0.68,
      "y": 0.30,
      "scale": 18,
      "decType": "Screen Print",
      "colours": "PMS 185 Red, White",
      "specWidth": "3.5",
      "specFromCollar": "3",
      "specFromCentre": "4 left",
      "notes": ""
    }
  ]
}`;

    try {
      const response = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          messages: [{role:"user", content: prompt}]
        })
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Server error ${response.status}: ${text.substring(0,300)}`);
      }
      let data;
      try { data = JSON.parse(text); }
      catch(e) { throw new Error("Could not parse server response. Raw: " + text.substring(0,200)); }
      if (data.error) throw new Error(data.error + (data.detail ? ": " + String(data.detail).substring(0,200) : ""));
      const raw = data.content?.find(b => b.type==="text")?.text || "";
      if (!raw) throw new Error("Empty response — check your ANTHROPIC_API_KEY is set in Netlify environment variables and redeploy.");
      const clean = raw.replace(/```json|```/g,"").trim();
      let plan;
      try { plan = JSON.parse(clean); }
      catch(e) { throw new Error("AI returned invalid JSON. Try again. Raw: " + clean.substring(0,200)); }
      setAiPlan(plan.placements || []);
      setAiIntro(plan.intro || "Placement plan ready.");
      setAiStatus("done");
    } catch(err) {
      setAiStatus("error");
      setAiError(err.message);
    }
  }

  // ── Build mockup ──
  function buildMockup() {
    // Defer to after render so canvas is mounted
    setTimeout(() => renderMockup(), 100);
  }

  function renderMockup() {
    const loadedViews = ["front","back","other"].filter(k => garments[k]);
    if (!loadedViews.length) return;

    const GAP = 14;
    const viewCanvases = loadedViews.map(k => buildViewCanvas(k));
    const totalW = viewCanvases.reduce((s,c)=>s+c.width,0) + (viewCanvases.length-1)*GAP;
    const maxH = Math.max(...viewCanvases.map(c=>c.height));
    const specC = buildSpecCanvas(maxH);

    const combined = document.createElement("canvas");
    combined.width = totalW + GAP + specC.width;
    combined.height = maxH;
    const cc = combined.getContext("2d");
    cc.fillStyle = "#ede8df";
    cc.fillRect(0,0,combined.width,combined.height);

    let xOff = 0;
    viewCanvases.forEach(vc => {
      cc.drawImage(vc, xOff, Math.round((maxH-vc.height)/2));
      xOff += vc.width + GAP;
    });
    cc.drawImage(specC, xOff, 0);

    exportRef.current = combined;

    // Draw onto visible canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = combined.width;
    canvas.height = combined.height;
    canvas.getContext("2d").drawImage(combined, 0, 0);
    setMockupBuilt(true);
  }

  function buildViewCanvas(viewKey) {
    const g = garments[viewKey]; if (!g) return null;
    const img = g.img;
    const r = Math.min(680/img.naturalWidth, 800/img.naturalHeight);
    const vw = Math.round(img.naturalWidth*r);
    const vh = Math.round(img.naturalHeight*r);
    const vc = document.createElement("canvas");
    vc.width = vw; vc.height = vh;
    const vx = vc.getContext("2d");
    vx.fillStyle = "#ffffff";
    vx.fillRect(0,0,vw,vh);
    vx.drawImage(img,0,0,vw,vh);

    // Draw placements for this view
    aiPlan
      .filter(p => (p.view||"front").toLowerCase() === viewKey)
      .forEach(p => {
        const art = artwork.find(a => a.id == p.artId);
        if (!art) return;
        const scale = Math.max(2, Math.min(200, p.scale||22));
        const aw = (scale/100)*vw;
        const ah = aw*(art.img.naturalHeight/art.img.naturalWidth);
        vx.save();
        vx.translate((p.x||.5)*vw, (p.y||.4)*vh);
        vx.drawImage(art.img,-aw/2,-ah/2,aw,ah);
        vx.restore();
      });

    // View badge
    const fs = Math.max(10, vw*.018);
    vx.fillStyle="rgba(0,0,0,.5)"; vx.fillRect(0,0,vw,fs*1.8);
    vx.font=`500 ${fs*.88}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(245,240,232,.9)";
    vx.fillText(viewKey.toUpperCase()+" VIEW",10,fs*1.3);

    // Watermark
    vx.fillStyle="rgba(0,0,0,.38)"; vx.fillRect(0,vh-fs*2.8,vw,fs*2.8);
    vx.font=`500 ${fs*.9}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(245,240,232,.82)";
    vx.fillText("TRUE NORTH SCREEN PRINTING",10,vh-fs*1.75);
    vx.font=`${fs*.74}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(200,55,45,.85)";
    const meta=[job.num&&"JOB #"+job.num, job.client&&job.client.toUpperCase()].filter(Boolean).join("  ·  ");
    if(meta) vx.fillText(meta,10,vh-fs*.78);

    return vc;
  }

  function buildSpecCanvas(height) {
    const PW = 380;
    const sc = document.createElement("canvas");
    sc.width=PW; sc.height=height;
    const sx=sc.getContext("2d");
    sx.fillStyle="#f5f0e8"; sx.fillRect(0,0,PW,height);
    sx.fillStyle="#c8372d"; sx.fillRect(0,0,3,height);
    sx.fillStyle="#0f0f0f"; sx.fillRect(0,0,PW,66);
    sx.font="bold 24px Bebas Neue,sans-serif"; sx.fillStyle="#f5f0e8"; sx.fillText("TRUE NORTH",14,27);
    sx.font="10px IBM Plex Mono,monospace"; sx.fillStyle="#c8372d"; sx.fillText("SCREEN PRINTING & EMBROIDERY",14,44);
    sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#555"; sx.fillText("PLACEMENT SPECIFICATION SHEET",14,59);

    let y=82;
    const mr=(k,v)=>{
      sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#aaa"; sx.fillText(k.toUpperCase(),14,y);
      sx.font="500 11px IBM Plex Sans,sans-serif"; sx.fillStyle="#0f0f0f"; sx.fillText(v||"—",115,y); y+=17;
    };
    if(job.num) mr("Job #",job.num);
    if(job.client) mr("Client",job.client);
    const gs=[job.style,job.colour].filter(Boolean).join(" — ");
    if(gs) mr("Garment",gs);
    const lv=Object.entries(garments).filter(([,v])=>v).map(([k])=>k.charAt(0).toUpperCase()+k.slice(1));
    if(lv.length) mr("Views",lv.join(" + "));

    y+=6; sx.fillStyle="#d4cdc0"; sx.fillRect(14,y,PW-28,1); y+=12;

    aiPlan.forEach((p,i)=>{
      const ch=estimateH(p);
      sx.fillStyle="#fff"; sx.fillRect(11,y-2,PW-22,ch+6);
      sx.strokeStyle="#e0dbd3"; sx.lineWidth=1; sx.strokeRect(11,y-2,PW-22,ch+6);
      sx.fillStyle="#c8372d"; sx.fillRect(11,y-2,3,ch+6);
      sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#c8372d";
      sx.fillText(`PLACEMENT ${i+1} · ${(p.view||"FRONT").toUpperCase()}`,20,y+11);
      sx.font="bold 13px IBM Plex Sans,sans-serif"; sx.fillStyle="#0f0f0f";
      sx.fillText(p.placement||"—",20,y+26);

      if(p.decType){
        sx.fillStyle="rgba(200,55,45,.12)";
        const tw=sx.measureText(p.decType.toUpperCase()).width+10;
        sx.fillRect(20,y+30,tw,13);
        sx.font="8px IBM Plex Mono,monospace"; sx.fillStyle="#c8372d";
        sx.fillText(p.decType.toUpperCase(),25,y+40);
      }
      let ry=y+(p.decType?50:38);
      const sr=(k,v)=>{
        if(!v) return;
        sx.font="8px IBM Plex Mono,monospace"; sx.fillStyle="#999"; sx.fillText(k.toUpperCase(),20,ry);
        sx.font="11px IBM Plex Sans,sans-serif"; sx.fillStyle="#222";
        const words=v.split(" "); let line=""; const mw=PW-150;
        words.forEach(w=>{ const t=line?line+" "+w:w; if(sx.measureText(t).width>mw&&line){sx.fillText(line,125,ry);line=w;ry+=13;}else{line=t;} });
        if(line) sx.fillText(line,125,ry); ry+=15;
      };
      if(p.artName) sr("Artwork",p.artName);
      if(p.specWidth) sr("Art Width",p.specWidth+'"');
      if(p.specFromCollar) sr("From Collar",p.specFromCollar+'"');
      if(p.specFromCentre) sr("From Centre",p.specFromCentre+'"');
      if(p.colours) sr("Colours",p.colours);
      if(p.notes) sr("Notes",p.notes);
      y+=ch+13;
    });

    const fY=height-24;
    sx.fillStyle="#0f0f0f"; sx.fillRect(0,fY,PW,24);
    sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#555";
    sx.fillText("truenorthscreenprinting.ca · Vancouver, BC",14,fY+15);
    sx.fillText(new Date().toLocaleDateString("en-CA"),PW-66,fY+15);
    return sc;
  }

  function estimateH(p){
    let h=p.decType?54:40;
    if(p.artName)h+=15;
    if(p.specWidth)h+=15;
    if(p.specFromCollar)h+=15;
    if(p.specFromCentre)h+=15;
    if(p.colours)h+=15+Math.ceil((p.colours.length||0)/36)*13;
    if(p.notes)h+=15+Math.ceil((p.notes.length||0)/36)*13;
    return Math.max(h,55);
  }

  function exportPNG(){
    if(!exportRef.current) return;
    const a=document.createElement("a");
    a.download=`TNSP-Mockup-${job.num||"draft"}.png`;
    a.href=exportRef.current.toDataURL("image/png"); a.click();
  }
  function exportJPG(){
    if(!exportRef.current) return;
    const a=document.createElement("a");
    a.download=`TNSP-Mockup-${job.num||"draft"}.jpg`;
    a.href=exportRef.current.toDataURL("image/jpeg",.93); a.click();
  }

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════
  return (
    <div style={S.body}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.brand}>TRUE<span style={S.brandSpan}>NORTH</span></div>
          <div style={S.brandSub}>Screen Printing &amp; Embroidery</div>
        </div>
        <div style={S.tag}>AI Mockup Builder</div>
      </div>

      {/* Steps */}
      <div style={S.steps}>
        {[["01","Job Details"],["02","Artwork & Placements"],["03","AI Review"],["04","Mockup"]].map(([n,lbl],i)=>(
          <div key={i} style={S.step(step===i+1,step>i+1)} onClick={()=>step>i+1&&setStep(i+1)}>
            <div style={S.stepNum(step===i+1)}>{`Step ${n}`}</div>
            <div style={S.stepLbl(step===i+1,step>i+1)}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={S.wrap}>

        {/* ══ STEP 1 ══ */}
        {step===1 && (
          <div>
            <div style={S.secTitle}><span style={S.secN}>01</span> Job &amp; Garment Details</div>
            <div style={S.grid2}>
              {[["Job #","num","TN-2026-0147"],["Client Name","client","e.g. Coastal Fitness Co."],["Garment Style","style","e.g. Gildan 18500 Hoodie"],["Garment Colour","colour","e.g. Sport Grey"]].map(([lbl,key,ph])=>(
                <div key={key}>
                  <label style={S.label}>{lbl}</label>
                  <input style={S.input} placeholder={ph} value={job[key]} onChange={e=>setJob(j=>({...j,[key]:e.target.value}))}/>
                </div>
              ))}
            </div>

            <hr style={S.divider}/>
            <div style={S.secTitle}><span style={S.secN}>+</span> Garment Photos</div>
            <div style={S.notice("info")}>Upload a photo for each view. Front is required; Back and Other are optional.</div>

            <div style={S.grid3}>
              {["front","back","other"].map(view=>(
                <label key={view} style={{border:`2px ${garments[view]?"solid #4caf7d":"dashed #d4cdc0"}`,background:"#fffdf8",padding:14,textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:90,position:"relative",gap:4}}>
                  <input type="file" accept="image/*" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}} onChange={e=>loadGarmentView(e,view)}/>
                  {garments[view]
                    ? <img src={garments[view].dataURL} style={{maxHeight:52,maxWidth:"100%",objectFit:"contain"}}/>
                    : <span style={{fontSize:"1.3rem"}}>👕</span>
                  }
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:garments[view]?"#4caf7d":"#aaa"}}>
                    {garments[view] ? "✓ "+garments[view].name.substring(0,16) : view.charAt(0).toUpperCase()+view.slice(1)+(view==="front"?" *":"")}
                  </span>
                </label>
              ))}
            </div>

            <div style={{display:"flex",gap:10,marginTop:28}}>
              <button style={S.btn()} onClick={()=>goStep(2)}>Next — Artwork &amp; Placements →</button>
            </div>
          </div>
        )}

        {/* ══ STEP 2 ══ */}
        {step===2 && (
          <div>
            <div style={S.secTitle}><span style={S.secN}>02</span> Artwork Library</div>
            <div style={S.notice("info")}>Upload all logos/artwork for this job. Assign each one to a placement below.</div>

            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
              {artwork.map(a=>(
                <div key={a.id} style={S.artCard(false)}>
                  <img src={a.dataURL} style={{width:54,height:54,objectFit:"contain",background:"#fff",padding:2}}/>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".44rem",letterSpacing:".06em",textTransform:"uppercase",color:"#888",textAlign:"center",wordBreak:"break-all",lineHeight:1.3}}>{a.name.replace(/\.[^.]+$/,"").substring(0,10)}</div>
                  <button onClick={()=>removeArt(a.id)} style={{position:"absolute",top:2,right:2,background:"none",border:"none",color:"#ccc",fontSize:".65rem",cursor:"pointer",padding:"1px 3px"}}>✕</button>
                </div>
              ))}
              <label style={{width:78,minHeight:80,border:"2px dashed #d4cdc0",background:"#fffdf8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",gap:3}}>
                <input type="file" accept="image/*" multiple style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}} onChange={loadArtFiles}/>
                <span style={{fontSize:"1.3rem",color:"#ccc"}}>+</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".44rem",letterSpacing:".1em",textTransform:"uppercase",color:"#bbb"}}>Add Art</span>
              </label>
            </div>

            <hr style={S.divider}/>
            <div style={S.secTitle}><span style={S.secN}>+</span> Placements</div>
            <div style={S.notice("info")}>One row per placement. The AI uses your entries to position and size each artwork.</div>

            {placements.map((p,idx)=>(
              <div key={p._id} style={S.prow}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d"}}>Placement {idx+1}</span>
                  <button onClick={()=>removeRow(p._id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".78rem"}}>✕ Remove</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:10}}>
                  {[["View","view","select",VIEW_OPTIONS],["Placement","placement","select",PLACEMENT_OPTIONS],["Artwork","artId","artSelect",[]],["Decoration","decType","select",DEC_TYPES]].map(([lbl,key,type,opts])=>(
                    <div key={key}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>{lbl}</div>
                      {type==="artSelect"
                        ? <select style={S.select} value={p.artId} onChange={e=>updateRow(p._id,"artId",e.target.value)}>
                            <option value="">— Select —</option>
                            {artwork.map(a=><option key={a.id} value={a.id}>{a.name.replace(/\.[^.]+$/,"").substring(0,16)}</option>)}
                          </select>
                        : <select style={S.select} value={p[key]} onChange={e=>updateRow(p._id,key,e.target.value)}>
                            {opts.map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                      }
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginTop:8}}>
                  {[["Art Width (in)","width",'e.g. 3.5"'],["From Low Collar (in)","fromCollar",'e.g. 3"'],["From Centre (in)","fromCentre",'e.g. 4" left'],["Ink / Thread Colours","colours","e.g. PMS 185, White"]].map(([lbl,key,ph])=>(
                    <div key={key}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>{lbl}</div>
                      <input style={S.input} placeholder={ph} value={p[key]} onChange={e=>updateRow(p._id,key,e.target.value)}/>
                    </div>
                  ))}
                </div>
                <textarea style={{...S.textarea,marginTop:8}} placeholder="Extra notes for this placement (e.g. weld all colours, centre on chest panel)" value={p.notes} onChange={e=>updateRow(p._id,"notes",e.target.value)}/>
              </div>
            ))}

            <button onClick={addRow} style={{background:"none",border:"1px dashed #d4cdc0",color:"#aaa",fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:9,cursor:"pointer",textAlign:"center",width:"100%",marginBottom:4}}>+ Add Placement</button>

            <div style={{display:"flex",gap:10,marginTop:24}}>
              <button style={S.btn("outline")} onClick={()=>setStep(1)}>← Back</button>
              <button style={S.btn("red")} onClick={()=>goStep(3)}>Send to AI for Review →</button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 ══ */}
        {step===3 && (
          <div>
            <div style={S.secTitle}><span style={S.secN}>03</span> AI Placement Review</div>

            {aiStatus==="thinking" && (
              <div style={{...S.notice("warn"),display:"flex",alignItems:"center",gap:8}}>
                <span style={{display:"inline-flex",gap:3}}>
                  {[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,background:"currentColor",borderRadius:"50%",display:"inline-block",animation:`pulse 1.2s ${d}s infinite`}}/>)}
                </span>
                Reading your job specs and calculating placements...
                <style>{`@keyframes pulse{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
              </div>
            )}

            {aiStatus==="error" && (
              <div style={{...S.notice("warn"),borderColor:"#c8372d",background:"#fdf0ee",color:"#c8372d"}}>
                ⚠ {aiError}
              </div>
            )}

            {aiStatus==="done" && (
              <div>
                <div style={S.notice("info")}>✓ {aiIntro}</div>
                {aiPlan.map((p,i)=>{
                  const art = artwork.find(a=>a.id==p.artId);
                  return (
                    <div key={i} style={S.sumCard}>
                      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".08em"}}>{p.placement}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d"}}>{(p.view||"front").toUpperCase()} · {p.decType||""}</div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 16px"}}>
                        {[
                          ["Artwork", p.artName||(art?.name.replace(/\.[^.]+$/,"")||"—")],
                          p.specWidth&&["Art Width", p.specWidth+'"'],
                          p.specFromCollar&&["From Collar", p.specFromCollar+'"'],
                          p.specFromCentre&&["From Centre", p.specFromCentre+'"'],
                          p.colours&&["Colours", p.colours],
                          ["Position", `x:${Math.round(p.x*100)}%  y:${Math.round(p.y*100)}%  scale:${Math.round(p.scale)}%`],
                        ].filter(Boolean).map(([k,v])=>(
                          <>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",color:"#aaa"}}>{k}</span>
                            <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",fontWeight:500}}>{v}</span>
                          </>
                        ))}
                      </div>
                      {p.notes&&<div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".76rem",color:"#666",fontStyle:"italic",marginTop:8,paddingTop:8,borderTop:"1px solid #e8e2d8"}}>{p.notes}</div>}
                    </div>
                  );
                })}

                <div>
                  <label style={S.label}>Revision notes (optional)</label>
                  <textarea style={S.textarea} placeholder='e.g. "Make the back logo larger, about 11 inches. Move left chest up slightly."' value={revisionNotes} onChange={e=>setRevisionNotes(e.target.value)}/>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}}>
              <button style={S.btn("outline")} onClick={()=>setStep(2)}>← Back</button>
              {aiStatus==="done"&&<button style={S.btn()} onClick={()=>goStep(4)}>✓ Looks Good — Build Mockup →</button>}
              {(aiStatus==="done"||aiStatus==="error")&&<button style={S.btn("outline")} onClick={()=>runAI()}>↺ Re-run{revisionNotes?" with Changes":""}</button>}
            </div>
          </div>
        )}

        {/* ══ STEP 4 ══ */}
        {step===4 && (
          <div>
            <div style={S.secTitle}><span style={S.secN}>04</span> Your Mockup</div>
            <div style={S.notice("info")}>All placements rendered from your specs. Export when ready.</div>

            <div style={{background:"#111",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400,backgroundImage:"linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)",backgroundSize:"28px 28px",padding:16}}>
              {!mockupBuilt && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".16em",textTransform:"uppercase",color:"#333"}}>Building...</span>}
              <canvas ref={canvasRef} style={{display:mockupBuilt?"block":"none",maxWidth:"100%",boxShadow:"0 0 0 1px #2a2a2a,0 16px 48px rgba(0,0,0,.7)"}}/>
            </div>

            <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
              <button style={S.btn()} onClick={exportPNG}>⬇ Export PNG</button>
              <button style={S.btn()} onClick={exportJPG}>⬇ Export JPG</button>
              <button style={S.btn("outline")} onClick={()=>setStep(3)}>← Back to Review</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
