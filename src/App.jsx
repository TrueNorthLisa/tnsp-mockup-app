import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sb = async (method, path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const PLACEMENT_OPTIONS = [
  "Left Chest","Right Chest","Centre Front","Full Front",
  "Centre Back","Full Back","Sleeve â€” Left","Sleeve â€” Right",
  "Neck / Collar","Left Hip","Right Hip","Shoulder","Custom"
];
const DEC_TYPES = ["Screen Print","Embroidery","Heat Transfer","DTG","Patch"];
const VIEW_OPTIONS = ["Front","Back","Other"];

const S = {
  body:     {fontFamily:"'IBM Plex Sans',sans-serif",background:"#f5f0e8",minHeight:"100vh",color:"#0f0f0f"},
  header:   {background:"#0f0f0f",borderBottom:"3px solid #c8372d",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  brand:    {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.7rem",letterSpacing:".08em",color:"#f5f0e8"},
  brandSpan:{color:"#c8372d"},
  brandSub: {fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".18em",textTransform:"uppercase",color:"#444",marginTop:2},
  tag:      {fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",border:"1px solid #333",color:"#666",padding:"5px 11px"},
  steps:    {display:"flex",background:"#0f0f0f",borderBottom:"2px solid #0f0f0f"},
  step:     (a,d)=>({flex:1,padding:"10px 16px",borderRight:"1px solid #2a2a2a",background:a?"#1a1a1a":d?"#111":"transparent",cursor:"pointer"}),
  stepNum:  (a)=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".14em",textTransform:"uppercase",color:a?"#c8372d":"#3a3a3a"}),
  stepLbl:  (a,d)=>({fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".8rem",fontWeight:500,color:a?"#f5f0e8":d?"#3a3a3a":"#555",marginTop:2}),
  wrap:     {maxWidth:860,margin:"0 auto",padding:"28px 20px 80px"},
  secTitle: {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.25rem",letterSpacing:".1em",borderBottom:"2px solid #0f0f0f",paddingBottom:5,marginBottom:14,display:"flex",alignItems:"baseline",gap:10},
  secN:     {fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",color:"#c8372d"},
  label:    {fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#555",display:"block",marginBottom:3},
  input:    {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"8px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".88rem",color:"#0f0f0f",outline:"none",width:"100%"},
  select:   {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",color:"#0f0f0f",outline:"none",width:"100%",appearance:"none"},
  textarea: {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".82rem",color:"#0f0f0f",outline:"none",width:"100%",resize:"vertical",minHeight:64},
  btn:      (v="primary")=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".14em",textTransform:"uppercase",padding:"11px 22px",cursor:"pointer",border:"2px solid #0f0f0f",background:v==="primary"?"#0f0f0f":v==="red"?"#c8372d":v==="green"?"#2a7a4b":"transparent",color:v==="outline"?"#0f0f0f":"#f5f0e8"}),
  notice:   (t)=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".1em",textTransform:"uppercase",padding:"9px 13px",marginBottom:14,borderLeft:`3px solid ${t==="info"?"#2a5abd":t==="warn"?"#b8892e":t==="success"?"#2a7a4b":"#c8372d"}`,background:t==="info"?"#e8f0fe":t==="warn"?"#fff8e6":t==="success"?"#e6f4ec":"#fdf0ee",color:t==="info"?"#2a5abd":t==="warn"?"#7a5500":t==="success"?"#1b5e38":"#c8372d"}),
  grid2:    {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  grid3:    {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},
  divider:  {border:"none",borderTop:"1px solid #d4cdc0",margin:"20px 0"},
  prow:     {background:"#fffdf8",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"12px 14px",marginBottom:10},
  sumCard:  {background:"#fff",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"14px 16px",marginBottom:10},
  jobCard:  {background:"#fff",border:"1px solid #d4cdc0",padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"border-color .15s"},
};

const ALL_SIZES = ["YS","YM","YL","XS","S","M","L","XL","2XL","3XL"];

function emptyJob() { return {num:"",client:"",style:"",colour:""}; }
function emptySizes() { return Object.fromEntries(ALL_SIZES.map(s=>[s,{active:false,qty:""}])); }

// â”€â”€ INTERACTIVE FINE-TUNE CANVAS (Step 4) â”€â”€
function FineTuneCanvas({ garments, artwork, aiPlan, onConfirm, onBack }) {
  const [viewKey, setViewKey] = useState(() => {
    const loaded = ["front","back","other"].filter(k => garments[k]);
    return loaded[0] || "front";
  });
  // layers: one per aiPlan entry, keyed by index
  const [layers, setLayers] = useState(() =>
    aiPlan.map((p, i) => ({
      id: i,
      placement: p.placement,
      view: (p.view||"front").toLowerCase(),
      artId: p.artId,
      x: p.x || 0.5,
      y: p.y || 0.4,
      scale: p.scale || 20,
      flipped: false,
      visible: true,
    }))
  );
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOX, setDragOX] = useState(0);
  const [dragOY, setDragOY] = useState(0);
  const [resizeStartScale, setResizeStartScale] = useState(0);
  const [resizeStartDist, setResizeStartDist] = useState(0);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const loadedViews = ["front","back","other"].filter(k => garments[k]);
  const viewLayers = layers.filter(l => l.view === viewKey);

  // Render canvas whenever state changes
  useEffect(() => { renderCanvas(); }, [layers, selected, viewKey, garments, artwork]);

  function renderCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const g = garments[viewKey]; if (!g) return;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0,0,cw,ch);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(g.img, 0, 0, cw, ch);

    // Draw layers for this view
    layers.filter(l => l.view===viewKey && l.visible).forEach(l => {
      const art = artwork.find(a => a.id == l.artId); if (!art) return;
      const aw = (l.scale/100)*cw;
      const ah = aw*(art.img.naturalHeight/art.img.naturalWidth);
      const ax = l.x*cw, ay = l.y*ch;
      ctx.save();
      ctx.translate(ax, ay);
      if (l.flipped) ctx.scale(-1,1);
      ctx.drawImage(art.img, -aw/2, -ah/2, aw, ah);
      ctx.restore();

      // Selection handles
      if (l.id === selected) {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.strokeStyle = "rgba(200,55,45,.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5,4]);
        ctx.strokeRect(-aw/2-4, -ah/2-4, aw+8, ah+8);
        ctx.setLineDash([]);
        // Corner handles
        [[-aw/2-4,-ah/2-4],[aw/2+4,-ah/2-4],[-aw/2-4,ah/2+4],[aw/2+4,ah/2+4]].forEach(([hx,hy]) => {
          ctx.fillStyle = "#c8372d";
          ctx.fillRect(hx-7, hy-7, 14, 14);
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
          ctx.strokeRect(hx-7, hy-7, 14, 14);
        });
        // Label
        ctx.font = `bold ${Math.max(9,cw*.014)}px IBM Plex Mono,monospace`;
        ctx.fillStyle = "rgba(200,55,45,.9)";
        ctx.fillText(l.placement, -aw/2-4, -ah/2-9);
        ctx.restore();
      }
    });
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * canvas.width / rect.width,
      y: (e.clientY - rect.top) * canvas.height / rect.height,
    };
  }

  function hitCorner(p, l) {
    const art = artwork.find(a => a.id == l.artId); if (!art) return null;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    const aw = (l.scale/100)*cw, ah = aw*(art.img.naturalHeight/art.img.naturalWidth);
    const ax = l.x*cw, ay = l.y*ch;
    const corners = [[-aw/2-4,-ah/2-4],[aw/2+4,-ah/2-4],[-aw/2-4,ah/2+4],[aw/2+4,ah/2+4]];
    for (const [hx,hy] of corners) {
      if (Math.abs(p.x-(ax+hx)) < 12 && Math.abs(p.y-(ay+hy)) < 12) return true;
    }
    return false;
  }

  function hitLayer(p, l) {
    const art = artwork.find(a => a.id == l.artId); if (!art) return false;
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    const aw = (l.scale/100)*cw, ah = aw*(art.img.naturalHeight/art.img.naturalWidth);
    const ax = l.x*cw, ay = l.y*ch;
    return p.x>=ax-aw/2-10 && p.x<=ax+aw/2+10 && p.y>=ay-ah/2-10 && p.y<=ay+ah/2+10;
  }

  function onMouseDown(e) {
    const p = getCanvasPoint(e);
    // Check resize on selected first
    if (selected !== null) {
      const sel = layers.find(l => l.id===selected);
      if (sel && sel.view===viewKey && hitCorner(p, sel)) {
        const cw = canvasRef.current.width, ch = canvasRef.current.height;
        const dist = Math.sqrt((p.x-sel.x*cw)**2 + (p.y-sel.y*ch)**2);
        setResizing(true);
        setResizeStartScale(sel.scale);
        setResizeStartDist(dist);
        return;
      }
    }
    // Hit test layers top to bottom
    const viewL = layers.filter(l=>l.view===viewKey&&l.visible).reverse();
    for (const l of viewL) {
      if (hitLayer(p, l)) {
        setSelected(l.id);
        const cw = canvasRef.current.width, ch = canvasRef.current.height;
        setDragging(true);
        setDragOX(p.x - l.x*cw);
        setDragOY(p.y - l.y*ch);
        return;
      }
    }
    setSelected(null);
  }

  function onMouseMove(e) {
    const p = getCanvasPoint(e);
    const cw = canvasRef.current.width, ch = canvasRef.current.height;
    if (resizing && selected !== null) {
      const sel = layers.find(l=>l.id===selected);
      if (!sel) return;
      const dist = Math.sqrt((p.x-sel.x*cw)**2 + (p.y-sel.y*ch)**2);
      if (resizeStartDist > 0) {
        const newScale = Math.max(2, Math.min(200, resizeStartScale*(dist/resizeStartDist)));
        setLayers(ls => ls.map(l => l.id===selected ? {...l, scale:Math.round(newScale)} : l));
      }
      return;
    }
    if (dragging && selected !== null) {
      setLayers(ls => ls.map(l => l.id===selected ? {
        ...l,
        x: Math.max(0.05, Math.min(0.95, (p.x-dragOX)/cw)),
        y: Math.max(0.05, Math.min(0.95, (p.y-dragOY)/ch)),
      } : l));
    }
  }

  function onMouseUp() { setDragging(false); setResizing(false); }

  function onWheel(e) {
    e.preventDefault();
    if (selected === null) return;
    setLayers(ls => ls.map(l => l.id===selected ? {...l, scale:Math.max(2,Math.min(200,l.scale+(e.deltaY>0?-1:1)))} : l));
  }

  function nudge(dx, dy) {
    if (selected === null) return;
    const cw = canvasRef.current?.width || 600;
    const ch = canvasRef.current?.height || 700;
    setLayers(ls => ls.map(l => l.id===selected ? {
      ...l,
      x: Math.max(0.05,Math.min(0.95, l.x+dx/cw)),
      y: Math.max(0.05,Math.min(0.95, l.y+dy/ch)),
    } : l));
  }

  function scaleStep(d) {
    if (selected === null) return;
    setLayers(ls => ls.map(l => l.id===selected ? {...l, scale:Math.max(2,Math.min(200,l.scale+d))} : l));
  }

  function flipSelected() {
    if (selected === null) return;
    setLayers(ls => ls.map(l => l.id===selected ? {...l,flipped:!l.flipped} : l));
  }

  function toggleVis(id) {
    setLayers(ls => ls.map(l => l.id===id ? {...l,visible:!l.visible} : l));
  }

  // Build the final merged plan from adjusted layers
  function handleConfirm() {
    const adjustedPlan = aiPlan.map((p, i) => {
      const l = layers.find(l => l.id===i);
      return l ? {...p, x:l.x, y:l.y, scale:l.scale} : p;
    });
    onConfirm(adjustedPlan);
  }

  const selLayer = selected !== null ? layers.find(l=>l.id===selected) : null;

  return (
    <div>
      <div style={S.secTitle}><span style={S.secN}>04</span> Fine-Tune Placements</div>
      <div style={S.notice("info")}>
        Drag artwork to reposition Â· Drag corner handles to resize Â· Scroll to scale Â· Click a placement in the list to select it
      </div>

      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>

        {/* Canvas area */}
        <div style={{flex:1,minWidth:0}}>
          {/* View switcher */}
          {loadedViews.length > 1 && (
            <div style={{display:"flex",gap:0,marginBottom:10,border:"1px solid #d4cdc0",width:"fit-content"}}>
              {loadedViews.map(v => (
                <button key={v} onClick={()=>setViewKey(v)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:"7px 16px",background:viewKey===v?"#0f0f0f":"transparent",color:viewKey===v?"#f5f0e8":"#888",border:"none",borderRight:v!==loadedViews[loadedViews.length-1]?"1px solid #d4cdc0":"none",cursor:"pointer"}}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div ref={containerRef} style={{background:"#111",position:"relative",lineHeight:0}}>
            <canvas
              ref={canvasRef}
              width={640} height={750}
              style={{maxWidth:"100%",cursor:dragging?"grabbing":resizing?"nwse-resize":"default",display:"block"}}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onWheel={onWheel}
            />
          </div>

          {/* Nudge / scale toolbar */}
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {[["â†",-4,0],["â†’",4,0],["â†‘",0,-4],["â†“",0,4]].map(([lbl,dx,dy])=>(
              <button key={lbl} onClick={()=>nudge(dx,dy)} style={{...S.btn("outline"),padding:"7px 14px",fontSize:".7rem"}}>{lbl}</button>
            ))}
            <button onClick={()=>scaleStep(-1)} style={{...S.btn("outline"),padding:"7px 14px",fontSize:".7rem"}}>âˆ’ Size</button>
            <button onClick={()=>scaleStep(1)} style={{...S.btn("outline"),padding:"7px 14px",fontSize:".7rem"}}>+ Size</button>
            <button onClick={flipSelected} style={{...S.btn("outline"),padding:"7px 14px",fontSize:".7rem"}}>â‡† Flip</button>
          </div>
        </div>

        {/* Right panel â€” layer list + selected info */}
        <div style={{width:210,flexShrink:0}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Placements</div>
          {layers.map(l => {
            const art = artwork.find(a=>a.id==l.artId);
            const isSel = l.id===selected;
            return (
              <div key={l.id} onClick={()=>{ setSelected(l.id); setViewKey(l.view); }}
                style={{background:isSel?"#0f0f0f":"#fff",border:`1px solid ${isSel?"#c8372d":"#d4cdc0"}`,borderLeft:`3px solid ${isSel?"#c8372d":"#d4cdc0"}`,padding:"8px 10px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                {art && <img src={art.dataURL} style={{width:28,height:28,objectFit:"contain",background:"#f5f0e8",padding:2,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".08em",textTransform:"uppercase",color:isSel?"#f5f0e8":"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.placement}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:isSel?"#aaa":"#bbb",marginTop:2}}>{l.view.toUpperCase()} Â· {Math.round(l.scale)}%</div>
                </div>
                <button onClick={e=>{e.stopPropagation();toggleVis(l.id);}} style={{background:"none",border:"none",color:isSel?"#aaa":"#ccc",fontSize:".72rem",cursor:"pointer",padding:2}}>{l.visible?"ðŸ‘":"ðŸš«"}</button>
              </div>
            );
          })}

          {/* Selected layer readout */}
          {selLayer && (
            <div style={{marginTop:12,background:"#fff",border:"1px solid #d4cdc0",padding:"10px 12px"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Selected</div>
              {[["X pos",Math.round(selLayer.x*100)+"%"],["Y pos",Math.round(selLayer.y*100)+"%"],["Scale",Math.round(selLayer.scale)+"%"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".08em",textTransform:"uppercase",color:"#aaa"}}>{k}</span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",color:"#0f0f0f",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}>
        <button style={S.btn("outline")} onClick={onBack}>â† Back to AI Review</button>
        <button style={S.btn()} onClick={handleConfirm}>âœ“ Looks Good â€” Generate Final â†’</button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("jobs");
  const [step, setStep] = useState(1);
  const [job, setJob] = useState(emptyJob());
  const [sizes, setSizes] = useState(emptySizes());
  const [garments, setGarments] = useState({front:null,back:null,other:null});
  const [artwork, setArtwork] = useState([]);
  const [placements, setPlacements] = useState([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",fromCentre:"",decType:"Screen Print",colours:"",notes:""}]);
  const [artCounter, setArtCounter] = useState(1);
  const [rowCounter, setRowCounter] = useState(2);
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiPlan, setAiPlan] = useState([]);
  const [aiIntro, setAiIntro] = useState("");
  const [aiError, setAiError] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [mockupBuilt, setMockupBuilt] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedJobId, setSavedJobId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const canvasRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { if (page==="jobs") loadJobs(); }, [page]);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2800); }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const data = await sb("GET","/jobs?select=id,job_num,client,garment_style,garment_colour,status,created_at,updated_at&order=updated_at.desc");
      setJobs(Array.isArray(data)?data:[]);
    } catch(e) { showToast("Could not load jobs"); }
    setJobsLoading(false);
  }

  async function deleteJob(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this job?")) return;
    await sb("DELETE",`/jobs?id=eq.${id}`);
    setJobs(j=>j.filter(x=>x.id!==id));
    showToast("Job deleted");
  }

  function newJob() {
    setJob(emptyJob()); setSizes(emptySizes()); setGarments({front:null,back:null,other:null}); setArtwork([]);
    setPlacements([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",fromCentre:"",decType:"Screen Print",colours:"",notes:""}]);
    setAiPlan([]); setAiStatus("idle"); setAiIntro(""); setAiError("");
    setRevisionNotes(""); setMockupBuilt(false); setSavedJobId(null); setSaveStatus("");
    setArtCounter(1); setRowCounter(2); setStep(1); setPage("builder");
  }

  async function loadJob(jobId) {
    try {
      const data = await sb("GET",`/jobs?id=eq.${jobId}&select=*`);
      const j = data[0]; if (!j) return;
      setJob({num:j.job_num||"",client:j.client||"",style:j.garment_style||"",colour:j.garment_colour||""});
      setSizes(j.sizes || emptySizes());
      setPlacements(j.placements||[]);
      setAiPlan(j.ai_plan||[]);
      setAiStatus(j.ai_plan?.length?"done":"idle");
      setSavedJobId(j.id); setSaveStatus("saved");
      const gUrls = j.garment_urls||{};
      const newGarments = {front:null,back:null,other:null};
      await Promise.all(Object.entries(gUrls).map(([view,dataURL])=>new Promise(res=>{
        if(!dataURL){res();return;}
        const img=new Image();
        img.onload=()=>{newGarments[view]={img,name:view+" view",dataURL};res();};
        img.src=dataURL;
      })));
      setGarments(newGarments);
      const artData = j.artwork_data||[];
      const newArt = [];
      await Promise.all(artData.map((a,idx)=>new Promise(res=>{
        const img=new Image();
        img.onload=()=>{newArt[idx]={id:a.id,img,name:a.name,dataURL:a.dataURL};res();};
        img.src=a.dataURL;
      })));
      setArtwork(newArt.filter(Boolean));
      if(newArt.length) setArtCounter(Math.max(...newArt.map(a=>a.id))+1);
      setStep(j.ai_plan?.length?3:1); setPage("builder");
      showToast("Job loaded â€” ready to edit");
    } catch(e) { showToast("Could not load job: "+e.message); }
  }

  async function saveJob(status="draft", planOverride) {
    setSaveStatus("saving");
    try {
      const garmentUrls = {};
      for (const [view,g] of Object.entries(garments)) {
        if(!g) continue;
        const c=document.createElement("canvas");
        const r=Math.min(400/g.img.naturalWidth,1);
        c.width=Math.round(g.img.naturalWidth*r); c.height=Math.round(g.img.naturalHeight*r);
        c.getContext("2d").drawImage(g.img,0,0,c.width,c.height);
        garmentUrls[view]=c.toDataURL("image/jpeg",0.6);
      }
      const artworkData = artwork.map(a=>{
        const c=document.createElement("canvas");
        const r=Math.min(300/a.img.naturalWidth,1);
        c.width=Math.round(a.img.naturalWidth*r); c.height=Math.round(a.img.naturalHeight*r);
        c.getContext("2d").drawImage(a.img,0,0,c.width,c.height);
        return {id:a.id,name:a.name,dataURL:c.toDataURL("image/png")};
      });
      const payload = {
        job_num:job.num, client:job.client, garment_style:job.style, garment_colour:job.colour,
        status, placements, ai_plan:planOverride||aiPlan, sizes,
        garment_urls:garmentUrls, artwork_data:artworkData,
        updated_at:new Date().toISOString(),
      };
      if(savedJobId) { await sb("PATCH",`/jobs?id=eq.${savedJobId}`,payload); }
      else { const r=await sb("POST","/jobs",payload); if(r?.[0]?.id) setSavedJobId(r[0].id); }
      setSaveStatus("saved");
      showToast(status==="final"?"Job saved as final âœ“":"Draft saved âœ“");
    } catch(e) { setSaveStatus("error"); showToast("Save failed: "+e.message); }
  }

  function goStep(n) {
    if(n===3) runAI();
    else if(n===5) buildMockup();
    setStep(n);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function loadGarmentView(e, view) {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>setGarments(g=>({...g,[view]:{img,name:file.name,dataURL:ev.target.result}}));
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value="";
  }

  function loadArtFiles(e) {
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        const img=new Image();
        img.onload=()=>setArtwork(prev=>[...prev,{id:artCounter+prev.length,img,name:file.name,dataURL:ev.target.result}]);
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    setArtCounter(c=>c+e.target.files.length); e.target.value="";
  }
  function removeArt(id) { setArtwork(a=>a.filter(x=>x.id!==id)); }

  function addRow() {
    setPlacements(p=>[...p,{_id:rowCounter,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",fromCentre:"",decType:"Screen Print",colours:"",notes:""}]);
    setRowCounter(c=>c+1);
  }
  function removeRow(id) { setPlacements(p=>p.filter(x=>x._id!==id)); }
  function updateRow(id,key,val) { setPlacements(p=>p.map(x=>x._id===id?{...x,[key]:val}:x)); }

  async function runAI() {
    setAiStatus("thinking"); setAiPlan([]); setAiIntro(""); setAiError("");
    if(!garments.front){setAiStatus("error");setAiError("Please upload a front garment photo first.");return;}
    if(!placements.length){setAiStatus("error");setAiError("Please add at least one placement.");return;}
    const artNames=artwork.map(a=>`ID ${a.id}: "${a.name.replace(/\.[^.]+$/,"")}"`).join(", ")||"none";
    const placementDesc=placements.map((p,i)=>{
      const artName=artwork.find(a=>a.id==p.artId)?.name.replace(/\.[^.]+$/,"")||"unassigned";
      return `Placement ${i+1}:\n  - View: ${p.view}\n  - Position: ${p.placement}\n  - Artwork: "${artName}" (ID: ${p.artId||"none"})\n  - Art width: ${p.width||"not specified"} inches\n  - From low collar point: ${p.fromCollar||"not specified"} inches\n  - Decoration: ${p.decType}\n  - Colours: ${p.colours||"not specified"}\n  - Notes: ${p.notes||"none"}`;
    }).join("\n\n");
    const loadedViews=Object.entries(garments).filter(([,v])=>v).map(([k])=>k).join(", ");
    const prompt=`You are a production assistant at True North Screen Printing & Embroidery in Vancouver, BC.
Interpret this mockup placement brief and return a confirmed placement plan as JSON only.

JOB:
- Job #: ${job.num||"not provided"}
- Client: ${job.client||"not provided"}
- Garment: ${job.style||"not provided"} in ${job.colour||"not provided"}
- Loaded views: ${loadedViews}

GARMENT DIMENSIONS (standard Large, laid flat):
- Chest width: 22 inches (44 inches around)
- Body length: 30 inches
- Use these exact dimensions for all scaling and positioning calculations.

GARMENT PHOTO CALIBRATION:
- The garment photos have ~12% blank space above the shoulder seam at the top of the image.
- The shoulder seam sits at yâ‰ˆ0.12 in the image.
- The front collar low point sits at yâ‰ˆ0.22 in the image.
- The back collar low point sits at yâ‰ˆ0.19 in the image.
- The bottom hem sits at yâ‰ˆ0.88 in the image.

STANDARD PLACEMENT POSITIONS (use these as base, adjust only if measurements differ):
- Left Chest: x=0.65, y=0.33
- Right Chest: x=0.32, y=0.33
- Centre Front: x=0.50, y=0.38
- Full Front: x=0.50, y=0.45
- Centre Back: x=0.50, y=0.30
- Full Back: x=0.50, y=0.38

ARTWORK FILES: ${artNames}

PLACEMENTS:
${placementDesc}
${revisionNotes?`\nREVISION NOTES: ${revisionNotes}`:""}

Instructions:
1. scale% = (art width in inches / 22) * 100. Examples: 3.5"=15.9%, 4"=18.2%, 10"=45.5%, 12"=54.5%.
2. X: Left Chest (wearer's left)=xâ‰ˆ0.65. Right Chest=xâ‰ˆ0.32. Centre=xâ‰ˆ0.50.
3. Y Front: y=0.22+(fromCollar/30)*0.66. e.g. 3"=0.29, 5"=0.33, 7"=0.37.
   Y Back: y=0.19+(fromCollar/30)*0.69. e.g. 3"=0.26, 5"=0.31, 7"=0.35.
   If no fromCollar given, use standard positions above.
4. Return ONLY valid JSON, no markdown, no backticks.

JSON:
{"intro":"One sentence summary","placements":[{"placement":"Left Chest","view":"front","artId":1,"artName":"logo","x":0.65,"y":0.33,"scale":15.9,"decType":"Screen Print","colours":"PMS 185","specWidth":"3.5","specFromCollar":"3","notes":""}]}`;

    try {
      const response=await fetch("/.netlify/functions/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const text=await response.text();
      if(!response.ok) throw new Error(`Server error ${response.status}: ${text.substring(0,300)}`);
      let data; try{data=JSON.parse(text);}catch(e){throw new Error("Could not parse server response.");}
      if(data.error) throw new Error(data.error);
      const raw=data.content?.find(b=>b.type==="text")?.text||"";
      if(!raw) throw new Error("Empty response â€” check ANTHROPIC_API_KEY in Netlify.");
      const clean=raw.replace(/```json|```/g,"").trim();
      let plan; try{plan=JSON.parse(clean);}catch(e){throw new Error("AI returned invalid JSON. Try again.");}
      setAiPlan(plan.placements||[]);
      setAiIntro(plan.intro||"Placement plan ready.");
      setAiStatus("done");
    } catch(err){setAiStatus("error");setAiError(err.message);}
  }

  function handleFineTuneConfirm(adjustedPlan) {
    setAiPlan(adjustedPlan);
    goStep(5);
  }

  function buildMockup() { setTimeout(()=>renderMockup(),100); }

  function renderMockup() {
    const loadedViews=["front","back","other"].filter(k=>garments[k]);
    if(!loadedViews.length) return;
    const GAP=14;
    const viewCanvases=loadedViews.map(k=>buildViewCanvas(k)).filter(Boolean);
    const totalW=viewCanvases.reduce((s,c)=>s+c.width,0)+(viewCanvases.length-1)*GAP;
    const maxH=Math.max(...viewCanvases.map(c=>c.height));
    const specC=buildSpecCanvas(maxH);
    const combined=document.createElement("canvas");
    combined.width=totalW+GAP+specC.width; combined.height=maxH;
    const cc=combined.getContext("2d");
    cc.fillStyle="#ede8df"; cc.fillRect(0,0,combined.width,combined.height);
    let xOff=0;
    viewCanvases.forEach(vc=>{cc.drawImage(vc,xOff,Math.round((maxH-vc.height)/2));xOff+=vc.width+GAP;});
    cc.drawImage(specC,xOff,0);
    exportRef.current=combined;
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=combined.width; canvas.height=combined.height;
    canvas.getContext("2d").drawImage(combined,0,0);
    setMockupBuilt(true);
  }

  function buildViewCanvas(viewKey) {
    const g=garments[viewKey]; if(!g) return null;
    const img=g.img;
    const r=Math.min(680/img.naturalWidth,800/img.naturalHeight);
    const vw=Math.round(img.naturalWidth*r),vh=Math.round(img.naturalHeight*r);
    const vc=document.createElement("canvas"); vc.width=vw; vc.height=vh;
    const vx=vc.getContext("2d");
    vx.fillStyle="#fff"; vx.fillRect(0,0,vw,vh); vx.drawImage(img,0,0,vw,vh);
    aiPlan.filter(p=>(p.view||"front").toLowerCase()===viewKey).forEach(p=>{
      const art=artwork.find(a=>a.id==p.artId); if(!art) return;
      const aw=(Math.max(2,Math.min(200,p.scale||22))/100)*vw;
      const ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
      vx.save(); vx.translate((p.x||.5)*vw,(p.y||.4)*vh); vx.drawImage(art.img,-aw/2,-ah/2,aw,ah); vx.restore();
    });
    const fs=Math.max(10,vw*.018);
    vx.fillStyle="rgba(0,0,0,.5)"; vx.fillRect(0,0,vw,fs*1.8);
    vx.font=`500 ${fs*.88}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(245,240,232,.9)";
    vx.fillText(viewKey.toUpperCase()+" VIEW",10,fs*1.3);
    vx.fillStyle="rgba(0,0,0,.38)"; vx.fillRect(0,vh-fs*2.8,vw,fs*2.8);
    vx.font=`500 ${fs*.9}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(245,240,232,.82)";
    vx.fillText("TRUE NORTH SCREEN PRINTING",10,vh-fs*1.75);
    vx.font=`${fs*.74}px IBM Plex Mono,monospace`; vx.fillStyle="rgba(200,55,45,.85)";
    const meta=[job.num&&"JOB #"+job.num,job.client&&job.client.toUpperCase()].filter(Boolean).join("  Â·  ");
    if(meta) vx.fillText(meta,10,vh-fs*.78);
    return vc;
  }

  function buildSpecCanvas(height) {
    const PW=380; const sc=document.createElement("canvas"); sc.width=PW; sc.height=height;
    const sx=sc.getContext("2d");
    sx.fillStyle="#f5f0e8"; sx.fillRect(0,0,PW,height);
    sx.fillStyle="#c8372d"; sx.fillRect(0,0,3,height);
    sx.fillStyle="#0f0f0f"; sx.fillRect(0,0,PW,66);
    sx.font="bold 24px Bebas Neue,sans-serif"; sx.fillStyle="#f5f0e8"; sx.fillText("TRUE NORTH",14,27);
    sx.font="10px IBM Plex Mono,monospace"; sx.fillStyle="#c8372d"; sx.fillText("SCREEN PRINTING & EMBROIDERY",14,44);
    sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#555"; sx.fillText("PLACEMENT SPECIFICATION SHEET",14,59);
    let y=82;
    const mr=(k,v)=>{sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#aaa";sx.fillText(k.toUpperCase(),14,y);sx.font="500 11px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(v||"â€”",115,y);y+=17;};
    if(job.num) mr("Job #",job.num); if(job.client) mr("Client",job.client);
    const gs=[job.style,job.colour].filter(Boolean).join(" - "); if(gs) mr("Garment",gs);
    const lv=Object.entries(garments).filter(([,v])=>v).map(([k])=>k.charAt(0).toUpperCase()+k.slice(1));
    if(lv.length) mr("Views",lv.join(" + "));

    // Sizes breakdown
    const activeSizes = ALL_SIZES.filter(s=>sizes[s]?.active && sizes[s]?.qty);
    if(activeSizes.length) {
      const total = activeSizes.reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0);
      mr("Total Units", String(total));
      const sizeStr = activeSizes.map(s=>`${s}:${sizes[s].qty}`).join("  ");
      // Word-wrap size string
      sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#aaa"; sx.fillText("SIZE BREAKDOWN",14,y);
      sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#0f0f0f";
      const words=sizeStr.split("  "); let line=""; let ly=y;
      words.forEach(w=>{ const t=line?line+"  "+w:w; if(sx.measureText(t).width>PW-30&&line){sx.fillText(line,14,ly+12);line=w;ly+=13;}else{line=t;} });
      if(line) sx.fillText(line,14,ly+12);
      y=ly+26;
    }
    y+=6; sx.fillStyle="#d4cdc0"; sx.fillRect(14,y,PW-28,1); y+=12;
    aiPlan.forEach((p,i)=>{
      const ch=estimateH(p);
      sx.fillStyle="#fff"; sx.fillRect(11,y-2,PW-22,ch+6);
      sx.strokeStyle="#e0dbd3"; sx.lineWidth=1; sx.strokeRect(11,y-2,PW-22,ch+6);
      sx.fillStyle="#c8372d"; sx.fillRect(11,y-2,3,ch+6);
      sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#c8372d";
      sx.fillText(`PLACEMENT ${i+1} Â· ${(p.view||"FRONT").toUpperCase()}`,20,y+11);
      sx.font="bold 13px IBM Plex Sans,sans-serif"; sx.fillStyle="#0f0f0f"; sx.fillText(p.placement||"â€”",20,y+26);
      if(p.decType){sx.fillStyle="rgba(200,55,45,.12)";const tw=sx.measureText(p.decType.toUpperCase()).width+10;sx.fillRect(20,y+30,tw,13);sx.font="8px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText(p.decType.toUpperCase(),25,y+40);}
      let ry=y+(p.decType?50:38);
      const sr=(k,v)=>{if(!v)return;sx.font="8px IBM Plex Mono,monospace";sx.fillStyle="#999";sx.fillText(k.toUpperCase(),20,ry);sx.font="11px IBM Plex Sans,sans-serif";sx.fillStyle="#222";const words=v.split(" ");let line="";const mw=PW-150;words.forEach(w=>{const t=line?line+" "+w:w;if(sx.measureText(t).width>mw&&line){sx.fillText(line,125,ry);line=w;ry+=13;}else{line=t;}});if(line)sx.fillText(line,125,ry);ry+=15;};
      if(p.artName)sr("Artwork",p.artName);if(p.specWidth)sr("Art Width",p.specWidth+'"');if(p.specFromCollar)sr("From Collar",p.specFromCollar+'"');if(p.colours)sr("Colours",p.colours);if(p.notes)sr("Notes",p.notes);
      y+=ch+13;
    });
    const fY=height-24; sx.fillStyle="#0f0f0f"; sx.fillRect(0,fY,PW,24);
    sx.font="9px IBM Plex Mono,monospace"; sx.fillStyle="#555";
    sx.fillText("truenorthscreenprinting.ca Â· Vancouver, BC",14,fY+15);
    sx.fillText(new Date().toLocaleDateString("en-CA"),PW-66,fY+15);
    return sc;
  }

  function estimateH(p){let h=p.decType?54:40;if(p.artName)h+=15;if(p.specWidth)h+=15;if(p.specFromCollar)h+=15;if(p.specFromCentre)h+=15;if(p.colours)h+=15+Math.ceil((p.colours.length||0)/36)*13;if(p.notes)h+=15+Math.ceil((p.notes.length||0)/36)*13;return Math.max(h,55);}

  function exportPNG(){if(!exportRef.current)return;const a=document.createElement("a");a.download=`TNSP-Mockup-${job.num||"draft"}.png`;a.href=exportRef.current.toDataURL("image/png");a.click();}
  function exportJPG(){if(!exportRef.current)return;const a=document.createElement("a");a.download=`TNSP-Mockup-${job.num||"draft"}.jpg`;a.href=exportRef.current.toDataURL("image/jpeg",.93);a.click();}

  return (
    <div style={S.body}>
      <div style={S.header}>
        <div>
          <div style={S.brand}>TRUE<span style={S.brandSpan}>NORTH</span></div>
          <div style={S.brandSub}>Screen Printing &amp; Embroidery</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {page==="builder"&&<button style={{...S.tag,cursor:"pointer",color:"#aaa"}} onClick={()=>setPage("jobs")}>â† All Jobs</button>}
          <div style={S.tag}>AI Mockup Builder</div>
        </div>
      </div>

      {/* JOBS PAGE */}
      {page==="jobs"&&(
        <div style={S.wrap}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:20}}>
            <div style={S.secTitle}><span style={S.secN}>âœ¦</span> Saved Jobs</div>
            <button style={S.btn("red")} onClick={newJob}>+ New Mockup</button>
          </div>
          {jobsLoading&&<div style={S.notice("info")}>Loading jobs...</div>}
          {!jobsLoading&&jobs.length===0&&<div style={S.notice("info")}>No saved jobs yet â€” click New Mockup to get started.</div>}
          {jobs.map(j=>(
            <div key={j.id} style={S.jobCard} onClick={()=>loadJob(j.id)}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#c8372d"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#d4cdc0"}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".06em"}}>
                  {j.client||"Unnamed Client"}
                  {j.job_num&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".12em",color:"#c8372d",marginLeft:10}}>#{j.job_num}</span>}
                </div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".08em",textTransform:"uppercase",color:"#aaa",marginTop:3}}>
                  {j.garment_style}{j.garment_colour?" â€” "+j.garment_colour:""}
                </div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".08em",textTransform:"uppercase",color:"#ccc",marginTop:2}}>
                  {new Date(j.updated_at).toLocaleDateString("en-CA")}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".1em",textTransform:"uppercase",padding:"3px 8px",background:j.status==="final"?"#e6f4ec":"#fff8e6",color:j.status==="final"?"#2a7a4b":"#7a5500",border:`1px solid ${j.status==="final"?"#2a7a4b":"#b8892e"}`}}>
                  {j.status||"draft"}
                </span>
                <button onClick={e=>deleteJob(j.id,e)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".8rem",padding:"4px 6px"}}>âœ•</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUILDER PAGE */}
      {page==="builder"&&(
        <>
          <div style={S.steps}>
            {[["01","Job Details"],["02","Artwork & Placements"],["03","AI Review"],["04","Fine-Tune"],["05","Export"]].map(([n,lbl],i)=>(
              <div key={i} style={S.step(step===i+1,step>i+1)} onClick={()=>step>i+1&&setStep(i+1)}>
                <div style={S.stepNum(step===i+1)}>{`Step ${n}`}</div>
                <div style={S.stepLbl(step===i+1,step>i+1)}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={S.wrap}>

            {/* STEP 1 */}
            {step===1&&(
              <div>
                <div style={S.secTitle}><span style={S.secN}>01</span> Job &amp; Garment Details</div>
                <div style={S.grid2}>
                  {[["Job #","num","TN-2026-0147"],["Client Name","client","e.g. Coastal Fitness Co."],["Garment Style","style","e.g. Gildan 18500 Hoodie"],["Garment Colour","colour","e.g. Sport Grey"]].map(([lbl,key,ph])=>(
                    <div key={key}><label style={S.label}>{lbl}</label><input style={S.input} placeholder={ph} value={job[key]} onChange={e=>setJob(j=>({...j,[key]:e.target.value}))}/></div>
                  ))}
                </div>
                <hr style={S.divider}/>
                <div style={S.secTitle}><span style={S.secN}>+</span> Sizes &amp; Quantities</div>
                <div style={S.notice("info")}>Check the sizes needed and enter quantities. Total auto-calculates.</div>
                <div style={{background:"#fffdf8",border:"1px solid #d4cdc0",padding:"14px 16px",marginBottom:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
                    {ALL_SIZES.map(s=>(
                      <label key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <input type="checkbox" checked={sizes[s].active} onChange={e=>setSizes(z=>({...z,[s]:{...z[s],active:e.target.checked,qty:e.target.checked?z[s].qty:""}}))} style={{accentColor:"#c8372d",width:13,height:13}}/>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".1em",textTransform:"uppercase",color:sizes[s].active?"#0f0f0f":"#aaa",fontWeight:sizes[s].active?600:400}}>{s}</span>
                        </div>
                        <input
                          type="number" min="0"
                          placeholder="0"
                          value={sizes[s].qty}
                          disabled={!sizes[s].active}
                          onChange={e=>setSizes(z=>({...z,[s]:{...z[s],qty:e.target.value}}))}
                          style={{width:"100%",background:sizes[s].active?"#fff":"#f0ece4",border:"1px solid #d4cdc0",borderBottom:`2px solid ${sizes[s].active?"#0f0f0f":"#d4cdc0"}`,padding:"5px 6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:".72rem",textAlign:"center",color:sizes[s].active?"#0f0f0f":"#ccc",outline:"none"}}
                        />
                      </label>
                    ))}
                  </div>
                  {/* Total bar */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #e8e2d8"}}>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                      {ALL_SIZES.filter(s=>sizes[s].active&&sizes[s].qty).map(s=>(
                        <span key={s} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".08em",color:"#555"}}>{s}: <strong>{sizes[s].qty}</strong></span>
                      ))}
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".06em",color:"#0f0f0f",whiteSpace:"nowrap",marginLeft:16}}>
                      Total: {ALL_SIZES.filter(s=>sizes[s].active).reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0)} units
                    </div>
                  </div>
                </div>
                <hr style={S.divider}/>
                <div style={S.notice("info")}>Upload a photo for each view. Front is required; Back and Other are optional.</div>
                <div style={S.grid3}>
                  {["front","back","other"].map(view=>(
                    <label key={view} style={{border:`2px ${garments[view]?"solid #4caf7d":"dashed #d4cdc0"}`,background:"#fffdf8",padding:14,textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:90,position:"relative",gap:4}}>
                      <input type="file" accept="image/*" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}} onChange={e=>loadGarmentView(e,view)}/>
                      {garments[view]?<img src={garments[view].dataURL} style={{maxHeight:52,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:"1.3rem"}}>ðŸ‘•</span>}
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:garments[view]?"#4caf7d":"#aaa"}}>
                        {garments[view]?"âœ“ "+garments[view].name.substring(0,16):view.charAt(0).toUpperCase()+view.slice(1)+(view==="front"?" *":"")}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,marginTop:28}}>
                  <button style={S.btn()} onClick={()=>goStep(2)}>Next â€” Artwork &amp; Placements â†’</button>
                  <button style={S.btn("outline")} onClick={()=>saveJob("draft")}>ðŸ’¾ Save Draft</button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <div>
                <div style={S.secTitle}><span style={S.secN}>02</span> Artwork Library</div>
                <div style={S.notice("info")}>Upload all logos/artwork for this job.</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
                  {artwork.map(a=>(
                    <div key={a.id} style={{background:"#fffdf8",border:"2px solid #d4cdc0",padding:8,display:"flex",flexDirection:"column",alignItems:"center",gap:4,width:78,position:"relative"}}>
                      <img src={a.dataURL} style={{width:54,height:54,objectFit:"contain",background:"#fff",padding:2}}/>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".44rem",letterSpacing:".06em",textTransform:"uppercase",color:"#888",textAlign:"center",wordBreak:"break-all",lineHeight:1.3}}>{a.name.replace(/\.[^.]+$/,"").substring(0,10)}</div>
                      <button onClick={()=>removeArt(a.id)} style={{position:"absolute",top:2,right:2,background:"none",border:"none",color:"#ccc",fontSize:".65rem",cursor:"pointer",padding:"1px 3px"}}>âœ•</button>
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
                      <button onClick={()=>removeRow(p._id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".78rem"}}>âœ• Remove</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:10}}>
                      {[["View","view","select",VIEW_OPTIONS],["Placement","placement","select",PLACEMENT_OPTIONS],["Artwork","artId","artSelect",[]],["Decoration","decType","select",DEC_TYPES]].map(([lbl,key,type,opts])=>(
                        <div key={key}>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>{lbl}</div>
                          {type==="artSelect"
                            ?<select style={S.select} value={p.artId} onChange={e=>updateRow(p._id,"artId",e.target.value)}><option value="">â€” Select â€”</option>{artwork.map(a=><option key={a.id} value={a.id}>{a.name.replace(/\.[^.]+$/,"").substring(0,16)}</option>)}</select>
                            :<select style={S.select} value={p[key]} onChange={e=>updateRow(p._id,key,e.target.value)}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>}
                        </div>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:8}}>
                      {[["Art Width (in)","width",'e.g. 3.5"'],["From Low Collar (in)","fromCollar",'e.g. 3"'],["Ink / Thread Colours","colours","e.g. PMS 185, White"]].map(([lbl,key,ph])=>(
                        <div key={key}>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>{lbl}</div>
                          <input style={S.input} placeholder={ph} value={p[key]} onChange={e=>updateRow(p._id,key,e.target.value)}/>
                        </div>
                      ))}
                    </div>
                    <textarea style={{...S.textarea,marginTop:8}} placeholder="Extra notes for this placement" value={p.notes} onChange={e=>updateRow(p._id,"notes",e.target.value)}/>
                  </div>
                ))}
                <button onClick={addRow} style={{background:"none",border:"1px dashed #d4cdc0",color:"#aaa",fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:9,cursor:"pointer",textAlign:"center",width:"100%",marginBottom:4}}>+ Add Placement</button>
                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button style={S.btn("outline")} onClick={()=>setStep(1)}>â† Back</button>
                  <button style={S.btn("red")} onClick={()=>goStep(3)}>Send to AI for Review â†’</button>
                  <button style={S.btn("outline")} onClick={()=>saveJob("draft")}>ðŸ’¾ Save Draft</button>
                </div>
              </div>
            )}

            {/* STEP 3 â€” AI REVIEW */}
            {step===3&&(
              <div>
                <div style={S.secTitle}><span style={S.secN}>03</span> AI Placement Review</div>
                {aiStatus==="thinking"&&(
                  <div style={{...S.notice("warn"),display:"flex",alignItems:"center",gap:8}}>
                    <span style={{display:"inline-flex",gap:3}}>{[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,background:"currentColor",borderRadius:"50%",display:"inline-block",animation:`pulse 1.2s ${d}s infinite`}}/>)}</span>
                    Reading your job specs and calculating placements...
                    <style>{`@keyframes pulse{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
                  </div>
                )}
                {aiStatus==="error"&&<div style={{...S.notice("warn"),borderColor:"#c8372d",background:"#fdf0ee",color:"#c8372d"}}>âš  {aiError}</div>}
                {aiStatus==="done"&&(
                  <div>
                    <div style={S.notice("info")}>âœ“ {aiIntro}</div>
                    {aiPlan.map((p,i)=>{
                      const art=artwork.find(a=>a.id==p.artId);
                      return(
                        <div key={i} style={S.sumCard}>
                          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".08em"}}>{p.placement}</div>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d"}}>{(p.view||"front").toUpperCase()} Â· {p.decType||""}</div>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 16px"}}>
                            {[["Artwork",p.artName||(art?.name.replace(/\.[^.]+$/,"")||"â€”")],p.specWidth&&["Art Width",p.specWidth+'"'],p.specFromCollar&&["From Collar",p.specFromCollar+'"'],p.specFromCentre&&["From Centre",p.specFromCentre+'"'],p.colours&&["Colours",p.colours],["Position",`x:${Math.round(p.x*100)}%  y:${Math.round(p.y*100)}%  scale:${Math.round(p.scale)}%`]].filter(Boolean).map(([k,v],ki)=>(
                              <div key={ki} style={{display:"contents"}}>
                                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",color:"#aaa"}}>{k}</span>
                                <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",fontWeight:500}}>{v}</span>
                              </div>
                            ))}
                          </div>
                          {p.notes&&<div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".76rem",color:"#666",fontStyle:"italic",marginTop:8,paddingTop:8,borderTop:"1px solid #e8e2d8"}}>{p.notes}</div>}
                        </div>
                      );
                    })}
                    <div><label style={S.label}>Revision notes (optional)</label><textarea style={S.textarea} placeholder='e.g. "Make the back logo larger, about 11 inches."' value={revisionNotes} onChange={e=>setRevisionNotes(e.target.value)}/></div>
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}}>
                  <button style={S.btn("outline")} onClick={()=>setStep(2)}>â† Back</button>
                  {aiStatus==="done"&&<button style={S.btn()} onClick={()=>setStep(4)}>Fine-Tune Placements â†’</button>}
                  {(aiStatus==="done"||aiStatus==="error")&&<button style={S.btn("outline")} onClick={()=>runAI()}>â†º Re-run{revisionNotes?" with Changes":""}</button>}
                  <button style={S.btn("outline")} onClick={()=>saveJob("draft")}>ðŸ’¾ Save Draft</button>
                </div>
              </div>
            )}

            {/* STEP 4 â€” FINE-TUNE */}
            {step===4&&aiPlan.length>0&&(
              <FineTuneCanvas
                garments={garments}
                artwork={artwork}
                aiPlan={aiPlan}
                onConfirm={handleFineTuneConfirm}
                onBack={()=>setStep(3)}
              />
            )}

            {/* STEP 5 â€” EXPORT */}
            {step===5&&(
              <div>
                <div style={S.secTitle}><span style={S.secN}>05</span> Final Mockup</div>
                {saveStatus==="saved"&&<div style={S.notice("success")}>âœ“ Job saved successfully</div>}
                <div style={{background:"#111",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400,backgroundImage:"linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)",backgroundSize:"28px 28px",padding:16}}>
                  {!mockupBuilt&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".16em",textTransform:"uppercase",color:"#333"}}>Building...</span>}
                  <canvas ref={canvasRef} style={{display:mockupBuilt?"block":"none",maxWidth:"100%",boxShadow:"0 0 0 1px #2a2a2a,0 16px 48px rgba(0,0,0,.7)"}}/>
                </div>
                <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
                  <button style={S.btn()} onClick={exportPNG}>â¬‡ Export PNG</button>
                  <button style={S.btn()} onClick={exportJPG}>â¬‡ Export JPG</button>
                  <button style={S.btn("green")} onClick={()=>saveJob("final")}>ðŸ’¾ Save as Final</button>
                  <button style={S.btn("outline")} onClick={()=>saveJob("draft")}>ðŸ’¾ Save Draft</button>
                  <button style={S.btn("outline")} onClick={()=>setStep(4)}>â† Back to Fine-Tune</button>
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {toast&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#0f0f0f",color:"#f5f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".12em",textTransform:"uppercase",padding:"9px 18px",borderLeft:"3px solid #c8372d",zIndex:9999,whiteSpace:"nowrap"}}>
          {toast}
        </div>
      )}
    </div>
  );
}

