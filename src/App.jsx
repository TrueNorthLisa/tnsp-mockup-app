import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sb = async (method, path, body) => {
  if (!SUPABASE_URL || SUPABASE_URL === "undefined") {
    throw new Error(`VITE_SUPABASE_URL is not set — check Netlify environment variables and redeploy.`);
  }
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
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
  if (!res.ok) throw new Error(`Supabase ${res.status} at ${path}: ${text.substring(0,200)}`);
  return text ? JSON.parse(text) : [];
};

const ALL_SIZES = ["2T","3T","4T","5T","6T","YS","YM","YL","XS","S","M","L","XL","2XL","3XL","One Size"];
const DEC_TYPES = ["Screen Print","Embroidery","Heat Transfer","DTG","Patch"];
const PLACEMENT_OPTIONS = ["Left Chest","Right Chest","Centre Front","Full Front","Centre Back","Full Back","Sleeve — Left","Sleeve — Right","Neck / Collar","Left Hip","Right Hip","Shoulder","Custom"];
const VIEW_OPTIONS = ["Front","Back","Sleeve — Left","Sleeve — Right","Other"];
const BRANDS = ["Gildan","Comfort Colors","Next Level","Bella+Canvas"];
const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

// Map view name to garment key — handles all variants AI might return
const VIEW_TO_KEY = {
  "front": "front",
  "back": "back",
  "sleeve — left": "sleeve_left",
  "sleeve — right": "sleeve_right",
  "sleeve_left": "sleeve_left",
  "sleeve_right": "sleeve_right",
  "sleeve left": "sleeve_left",
  "sleeve right": "sleeve_right",
  "left sleeve": "sleeve_left",
  "right sleeve": "sleeve_right",
  "other": "other",
};

function normalizeView(v) {
  if(!v) return "front";
  const key = v.toLowerCase().trim().replace(/\s*[—-]\s*/g,"_").replace(/\s+/g,"_");
  return VIEW_TO_KEY[key] || VIEW_TO_KEY[v.toLowerCase().trim()] || "front";
}

const S = {
  body:    {fontFamily:"'IBM Plex Sans',sans-serif",background:"#f5f0e8",minHeight:"100vh",color:"#0f0f0f"},
  header:  {background:"#0f0f0f",borderBottom:"3px solid #c8372d",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  brand:   {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.7rem",letterSpacing:".08em",color:"#f5f0e8"},
  bspan:   {color:"#c8372d"},
  bsub:    {fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".18em",textTransform:"uppercase",color:"#444",marginTop:2},
  tag:     {fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",border:"1px solid #333",color:"#666",padding:"5px 11px"},
  wrap:    {maxWidth:880,margin:"0 auto",padding:"28px 20px 80px"},
  sec:     {fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",letterSpacing:".1em",borderBottom:"2px solid #0f0f0f",paddingBottom:5,marginBottom:14,display:"flex",alignItems:"baseline",gap:10},
  secn:    {fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",color:"#c8372d"},
  lbl:     {fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#555",display:"block",marginBottom:3},
  inp:     {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"8px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".88rem",color:"#0f0f0f",outline:"none",width:"100%"},
  sel:     {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",color:"#0f0f0f",outline:"none",width:"100%",appearance:"none"},
  ta:      {background:"#fffdf8",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 10px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".82rem",color:"#0f0f0f",outline:"none",width:"100%",resize:"vertical",minHeight:64},
  btn:     (v="p")=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".14em",textTransform:"uppercase",padding:"11px 22px",cursor:"pointer",border:"2px solid #0f0f0f",background:v==="p"?"#0f0f0f":v==="r"?"#c8372d":v==="g"?"#2a7a4b":"transparent",color:v==="o"?"#0f0f0f":"#f5f0e8"}),
  note:    (t)=>({fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".1em",textTransform:"uppercase",padding:"9px 13px",marginBottom:14,borderLeft:`3px solid ${t==="i"?"#2a5abd":t==="w"?"#b8892e":t==="s"?"#2a7a4b":"#c8372d"}`,background:t==="i"?"#e8f0fe":t==="w"?"#fff8e6":t==="s"?"#e6f4ec":"#fdf0ee",color:t==="i"?"#2a5abd":t==="w"?"#7a5500":t==="s"?"#1b5e38":"#c8372d"}),
  g2:      {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  g3:      {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12},
  g4:      {display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10},
  div:     {border:"none",borderTop:"1px solid #d4cdc0",margin:"20px 0"},
  card:    {background:"#fff",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"14px 16px",marginBottom:10},
  prow:    {background:"#fffdf8",border:"1px solid #d4cdc0",borderLeft:"3px solid #c8372d",padding:"12px 14px",marginBottom:10},
  jcard:   {background:"#fff",border:"1px solid #d4cdc0",padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"},
};

function emptySizes() { return Object.fromEntries(ALL_SIZES.map(s=>[s,{active:false,qty:""}])); }

// ── FINE-TUNE CANVAS ──
function FineTuneCanvas({ garments, artwork, aiPlan, onConfirm, onBack }) {
  // Include sleeve views
  const loadedViews = ["front","back","sleeve_left","sleeve_right","other"].filter(k=>garments[k]);
  const viewLabels = { front:"Front", back:"Back", sleeve_left:"Left Sleeve", sleeve_right:"Right Sleeve", other:"Other" };
  const [viewKey, setViewKey] = useState(loadedViews[0]||"front");
  const [layers, setLayers] = useState(()=>aiPlan.map((p,i)=>({
    id:i, placement:p.placement,
    view: normalizeView(p.view),
    artId:p.artId, x:p.x||.5, y:p.y||.4, scale:p.scale||20, flipped:false, visible:true
  })));
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOX, setDragOX] = useState(0);
  const [dragOY, setDragOY] = useState(0);
  const [rsScale, setRsScale] = useState(0);
  const [rsDist, setRsDist] = useState(0);
  const canvasRef = useRef(null);

  useEffect(()=>{ renderCanvas(); },[layers,selected,viewKey,garments,artwork]);

  function renderCanvas() {
    const canvas=canvasRef.current; if(!canvas) return;
    const g=garments[viewKey]; if(!g) return;
    const ctx=canvas.getContext("2d"); const cw=canvas.width,ch=canvas.height;
    ctx.clearRect(0,0,cw,ch); ctx.fillStyle="#fff"; ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(g.img,0,0,cw,ch);
    layers.filter(l=>l.view===viewKey&&l.visible).forEach(l=>{
      const art=artwork.find(a=>a.id==l.artId); if(!art) return;
      const aw=(l.scale/100)*cw, ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
      const ax=l.x*cw, ay=l.y*ch;
      ctx.save(); ctx.translate(ax,ay); if(l.flipped) ctx.scale(-1,1);
      ctx.drawImage(art.img,-aw/2,-ah/2,aw,ah); ctx.restore();
      if(l.id===selected){
        ctx.save(); ctx.translate(ax,ay);
        ctx.strokeStyle="rgba(200,55,45,.8)"; ctx.lineWidth=2; ctx.setLineDash([5,4]);
        ctx.strokeRect(-aw/2-4,-ah/2-4,aw+8,ah+8); ctx.setLineDash([]);
        [[-aw/2-4,-ah/2-4],[aw/2+4,-ah/2-4],[-aw/2-4,ah/2+4],[aw/2+4,ah/2+4]].forEach(([hx,hy])=>{
          ctx.fillStyle="#c8372d"; ctx.fillRect(hx-7,hy-7,14,14);
          ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.strokeRect(hx-7,hy-7,14,14);
        });
        ctx.font=`bold ${Math.max(9,cw*.014)}px IBM Plex Mono,monospace`;
        ctx.fillStyle="rgba(200,55,45,.9)"; ctx.fillText(l.placement,-aw/2-4,-ah/2-9);
        ctx.restore();
      }
    });
  }

  function gpt(e){const r=canvasRef.current.getBoundingClientRect();return{x:(e.clientX-r.left)*canvasRef.current.width/r.width,y:(e.clientY-r.top)*canvasRef.current.height/r.height};}
  function hitCorner(p,l){
    const art=artwork.find(a=>a.id==l.artId); if(!art) return false;
    const cw=canvasRef.current.width,ch=canvasRef.current.height;
    const aw=(l.scale/100)*cw,ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
    const ax=l.x*cw,ay=l.y*ch;
    return [[-aw/2-4,-ah/2-4],[aw/2+4,-ah/2-4],[-aw/2-4,ah/2+4],[aw/2+4,ah/2+4]].some(([hx,hy])=>Math.abs(p.x-(ax+hx))<12&&Math.abs(p.y-(ay+hy))<12);
  }
  function hitLayer(p,l){
    const art=artwork.find(a=>a.id==l.artId); if(!art) return false;
    const cw=canvasRef.current.width,ch=canvasRef.current.height;
    const aw=(l.scale/100)*cw,ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
    const ax=l.x*cw,ay=l.y*ch;
    return p.x>=ax-aw/2-10&&p.x<=ax+aw/2+10&&p.y>=ay-ah/2-10&&p.y<=ay+ah/2+10;
  }
  function onMD(e){
    const p=gpt(e);
    if(selected!==null){const sel=layers.find(l=>l.id===selected);if(sel&&sel.view===viewKey&&hitCorner(p,sel)){const cw=canvasRef.current.width,ch=canvasRef.current.height;const dist=Math.sqrt((p.x-sel.x*cw)**2+(p.y-sel.y*ch)**2);setResizing(true);setRsScale(sel.scale);setRsDist(dist);return;}}
    const vl=layers.filter(l=>l.view===viewKey&&l.visible).reverse();
    for(const l of vl){if(hitLayer(p,l)){setSelected(l.id);const cw=canvasRef.current.width,ch=canvasRef.current.height;setDragging(true);setDragOX(p.x-l.x*cw);setDragOY(p.y-l.y*ch);return;}}
    setSelected(null);
  }
  function onMM(e){
    const p=gpt(e);const cw=canvasRef.current.width,ch=canvasRef.current.height;
    if(resizing&&selected!==null){const sel=layers.find(l=>l.id===selected);if(!sel)return;const dist=Math.sqrt((p.x-sel.x*cw)**2+(p.y-sel.y*ch)**2);if(rsDist>0){const ns=Math.max(2,Math.min(200,rsScale*(dist/rsDist)));setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.round(ns)}:l));}return;}
    if(dragging&&selected!==null){setLayers(ls=>ls.map(l=>l.id===selected?{...l,x:Math.max(.05,Math.min(.95,(p.x-dragOX)/cw)),y:Math.max(.05,Math.min(.95,(p.y-dragOY)/ch))}:l));}
  }
  function onMU(){setDragging(false);setResizing(false);}
  function onWhl(e){e.preventDefault();if(selected===null)return;setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.max(2,Math.min(200,l.scale+(e.deltaY>0?-1:1)))}:l));}
  function nudge(dx,dy){if(selected===null)return;const cw=canvasRef.current?.width||600,ch=canvasRef.current?.height||700;setLayers(ls=>ls.map(l=>l.id===selected?{...l,x:Math.max(.05,Math.min(.95,l.x+dx/cw)),y:Math.max(.05,Math.min(.95,l.y+dy/ch))}:l));}
  function scaleStep(d){if(selected===null)return;setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.max(2,Math.min(200,l.scale+d))}:l));}
  function handleConfirm(){onConfirm(aiPlan.map((p,i)=>{const l=layers.find(l=>l.id===i);return l?{...p,x:l.x,y:l.y,scale:l.scale}:p;}));}
  const selL=selected!==null?layers.find(l=>l.id===selected):null;

  return (
    <div>
      <div style={S.sec}><span style={S.secn}>04</span> Fine-Tune Placements</div>
      <div style={S.note("i")}>Drag artwork to reposition · Drag corner handles to resize · Scroll to scale</div>
      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          {loadedViews.length>1&&(
            <div style={{display:"flex",gap:0,marginBottom:10,border:"1px solid #d4cdc0",width:"fit-content",flexWrap:"wrap"}}>
              {loadedViews.map(v=><button key={v} onClick={()=>setViewKey(v)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:"7px 16px",background:viewKey===v?"#0f0f0f":"transparent",color:viewKey===v?"#f5f0e8":"#888",border:"none",borderRight:"1px solid #d4cdc0",cursor:"pointer"}}>{viewLabels[v]||v}</button>)}
            </div>
          )}
          <div style={{background:"#111",lineHeight:0}}>
            <canvas ref={canvasRef} width={640} height={750} style={{maxWidth:"100%",cursor:dragging?"grabbing":resizing?"nwse-resize":"default",display:"block"}} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWhl}/>
          </div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {[["←",-4,0],["→",4,0],["↑",0,-4],["↓",0,4]].map(([l,dx,dy])=><button key={l} onClick={()=>nudge(dx,dy)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>{l}</button>)}
            <button onClick={()=>scaleStep(-1)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>− Size</button>
            <button onClick={()=>scaleStep(1)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>+ Size</button>
            <button onClick={()=>{if(selected!==null)setLayers(ls=>ls.map(l=>l.id===selected?{...l,flipped:!l.flipped}:l));}} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>⇆ Flip</button>
          </div>
        </div>
        <div style={{width:210,flexShrink:0}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Placements</div>
          {layers.map(l=>{
            const art=artwork.find(a=>a.id==l.artId);const isSel=l.id===selected;
            return <div key={l.id} onClick={()=>{setSelected(l.id);setViewKey(l.view);}} style={{background:isSel?"#0f0f0f":"#fff",border:`1px solid ${isSel?"#c8372d":"#d4cdc0"}`,borderLeft:`3px solid ${isSel?"#c8372d":"#d4cdc0"}`,padding:"8px 10px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              {art&&<img src={art.dataURL} style={{width:28,height:28,objectFit:"contain",background:"#f5f0e8",padding:2,flexShrink:0}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".08em",textTransform:"uppercase",color:isSel?"#f5f0e8":"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.placement}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:isSel?"#aaa":"#bbb",marginTop:2}}>{(viewLabels[l.view]||l.view).toUpperCase()} · {Math.round(l.scale)}%</div>
              </div>
              <button onClick={e=>{e.stopPropagation();setLayers(ls=>ls.map(x=>x.id===l.id?{...x,visible:!x.visible}:x));}} style={{background:"none",border:"none",color:isSel?"#aaa":"#ccc",fontSize:".72rem",cursor:"pointer",padding:2}}>{l.visible?"👁":"🚫"}</button>
            </div>;
          })}
          {selL&&<div style={{marginTop:12,background:"#fff",border:"1px solid #d4cdc0",padding:"10px 12px"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Selected</div>
            {[["X",Math.round(selL.x*100)+"%"],["Y",Math.round(selL.y*100)+"%"],["Scale",Math.round(selL.scale)+"%"],["View",viewLabels[selL.view]||selL.view]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".08em",textTransform:"uppercase",color:"#aaa"}}>{k}</span><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",color:"#0f0f0f",fontWeight:500}}>{v}</span></div>)}
          </div>}
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}>
        <button style={S.btn("o")} onClick={onBack}>← Back to AI Review</button>
        <button style={S.btn()} onClick={handleConfirm}>Looks Good — Generate Final →</button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("jobs");
  const [jobNum, setJobNum] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [decTypes, setDecTypes] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [pressCheck, setPressCheck] = useState(false);
  const [boldPrint, setBoldPrint] = useState(false);
  const [vintagePrint, setVintagePrint] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState("");
  const [custId, setCustId] = useState(null);
  const [cust, setCust] = useState({company:"",contact_name:"",email:"",phone:"",address:"",city:"",province:"BC",postal:""});
  const [custSuggestions, setCustSuggestions] = useState([]);
  const [garmentList, setGarmentList] = useState([]);
  const [selBrand, setSelBrand] = useState("");
  const [selStyle, setSelStyle] = useState("");
  const [selStyleNum, setSelStyleNum] = useState("");
  const [selColour, setSelColour] = useState("");
  const [garmentId, setGarmentId] = useState(null);
  // garments now includes sleeve_left and sleeve_right
  const [garments, setGarments] = useState({front:null,back:null,sleeve_left:null,sleeve_right:null,other:null});
  const [sizes, setSizes] = useState(emptySizes());
  const [artwork, setArtwork] = useState([]);
  const [artCounter, setArtCounter] = useState(1);
  const [placements, setPlacements] = useState([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);
  const [rowCounter, setRowCounter] = useState(2);
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiPlan, setAiPlan] = useState([]);
  const [aiIntro, setAiIntro] = useState("");
  const [aiError, setAiError] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [mockupBuilt, setMockupBuilt] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveResults, setArchiveResults] = useState([]);
  const [archiveSearching, setArchiveSearching] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [savedJobId, setSavedJobId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [toast, setToast] = useState("");
  const [step, setStep] = useState(1);
  const canvasRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(()=>{
    const link=document.createElement("link");link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  },[]);
  useEffect(()=>{ if(page==="jobs") loadJobs(); },[page]);
  useEffect(()=>{ loadGarmentList(); loadCustomers(); },[]);

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2800);}

  async function loadJobs(){
    setJobsLoading(true);
    try{const d=await sb("GET","/jobs?select=id,job_num,client,garment_style,garment_colour,status,due_date,updated_at&status=in.(draft,in-progress)&order=updated_at.desc");setJobs(Array.isArray(d)?d:[]);}
    catch(e){showToast("Could not load jobs");}
    setJobsLoading(false);
  }

  async function archiveJob(id,e){e.stopPropagation();await sb("PATCH",`/jobs?id=eq.${id}`,{status:"archived"});setJobs(j=>j.filter(x=>x.id!==id));showToast("Job archived");}
  async function searchArchive(){
    if(!archiveSearch.trim())return;setArchiveSearching(true);
    try{const q=archiveSearch.trim();const d=await sb("GET",`/jobs?select=id,job_num,client,garment_style,garment_colour,status,due_date,updated_at&status=in.(final,archived)&or=(client.ilike.*${q}*,job_num.ilike.*${q}*)&order=updated_at.desc&limit=20`);setArchiveResults(Array.isArray(d)?d:[]);}
    catch(e){showToast("Search failed: "+e.message);}
    setArchiveSearching(false);
  }
  async function deleteJob(id,e){e.stopPropagation();if(!confirm("Delete this job?"))return;await sb("DELETE",`/jobs?id=eq.${id}`);setJobs(j=>j.filter(x=>x.id!==id));showToast("Job deleted");}

  function resetAll(){
    setJobNum("");setDueDate("");setDecTypes([]);setSpecialInstructions("");setPressCheck(false);setBoldPrint(false);setVintagePrint(false);
    setCustId(null);setCustSearch("");setCust({company:"",contact_name:"",email:"",phone:"",address:"",city:"",province:"BC",postal:""});
    setSelBrand("");setSelStyle("");setSelStyleNum("");setSelColour("");setGarmentId(null);
    setGarments({front:null,back:null,sleeve_left:null,sleeve_right:null,other:null});setSizes(emptySizes());
    setArtwork([]);setArtCounter(1);
    setPlacements([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);setRowCounter(2);
    setAiPlan([]);setAiStatus("idle");setAiIntro("");setAiError("");setRevisionNotes("");
    setMockupBuilt(false);setSavedJobId(null);setSaveStatus("");setStep(1);setPage("builder");
  }

  async function newJob(){
    try{
      const d=await sb("GET","/settings?key=eq.last_job_num&select=value");
      const last=parseInt(d?.[0]?.value||"26300");
      setJobNum(String(last+1));
      await sb("PATCH","/settings?key=eq.last_job_num",{value:String(last+1)});
    }catch(e){setJobNum("");}
    resetAll();
  }

  async function loadCustomers(){
    try{const d=await sb("GET","/customers?select=*&order=company.asc");setCustomers(Array.isArray(d)?d:[]);}catch(e){}
  }
  function searchCustomers(q){
    setCustSearch(q);if(!q){setCustSuggestions([]);return;}
    setCustSuggestions(customers.filter(c=>(c.company||"").toLowerCase().includes(q.toLowerCase())||(c.contact_name||"").toLowerCase().includes(q.toLowerCase())).slice(0,6));
  }
  function selectCustomer(c){
    setCustId(c.id);setCust({company:c.company||"",contact_name:c.contact_name||"",email:c.email||"",phone:c.phone||"",address:c.address||"",city:c.city||"",province:c.province||"BC",postal:c.postal||""});
    setCustSearch(c.company||c.contact_name||"");setCustSuggestions([]);
  }
  async function saveCustomer(){
    try{
      if(custId){await sb("PATCH",`/customers?id=eq.${custId}`,{...cust,updated_at:new Date().toISOString()});}
      else{const r=await sb("POST","/customers",cust);if(r?.[0]?.id)setCustId(r[0].id);}
      await loadCustomers();
    }catch(e){}
  }

  async function loadGarmentList(){
    try{const d=await sb("GET","/garments?select=*&order=brand.asc,style_name.asc");setGarmentList(Array.isArray(d)?d:[]);}
    catch(e){console.error("loadGarmentList error",e);}
  }

  const brands=[...new Set(garmentList.map(g=>g.brand))].filter(Boolean);
  const styles=[...new Set(garmentList.filter(g=>g.brand===selBrand).map(g=>g.style_name))].filter(Boolean);
  const colours=garmentList.filter(g=>g.brand===selBrand&&g.style_name===selStyle);

  function selectColour(g){
    setSelColour(g.colour);setGarmentId(g.id);setSelStyleNum(g.style_num||"");
    const newG={front:null,back:null,sleeve_left:null,sleeve_right:null,other:null};
    const loadImg=(url,view)=>new Promise(res=>{
      if(!url){res();return;}
      const img=new Image();img.crossOrigin="anonymous";
      img.onload=()=>{newG[view]={img,name:view+" view",dataURL:url};res();};
      img.onerror=()=>res();img.src=url;
    });
    Promise.all([
      loadImg(g.front_url,"front"),
      loadImg(g.back_url,"back"),
      loadImg(g.sleeve_left_url,"sleeve_left"),
      loadImg(g.sleeve_right_url,"sleeve_right"),
      loadImg(g.photo_url,"other")
    ]).then(()=>{setGarments({...newG});showToast("Garment loaded");});
  }

  function loadArtFiles(e){
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{const img=new Image();img.onload=()=>setArtwork(prev=>[...prev,{id:artCounter+prev.length,img,name:file.name,dataURL:ev.target.result}]);img.src=ev.target.result;};
      reader.readAsDataURL(file);
    });
    setArtCounter(c=>c+e.target.files.length);e.target.value="";
  }
  function removeArt(id){setArtwork(a=>a.filter(x=>x.id!==id));}

  function addRow(){setPlacements(p=>[...p,{_id:rowCounter,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);setRowCounter(c=>c+1);}
  function removeRow(id){setPlacements(p=>p.filter(x=>x._id!==id));}
  function updateRow(id,key,val){setPlacements(p=>p.map(x=>x._id===id?{...x,[key]:val}:x));}

  async function runAI(){
    setAiStatus("thinking");setAiPlan([]);setAiIntro("");setAiError("");
    if(!garments.front){setAiStatus("error");setAiError("No front garment photo loaded.");return;}
    if(!placements.length){setAiStatus("error");setAiError("Please add at least one placement.");return;}
    const artNames=artwork.map(a=>`ID ${a.id}: "${a.name.replace(/\.[^.]+$/,"")}"`).join(", ")||"none";
    const lv=Object.entries(garments).filter(([,v])=>v).map(([k])=>k).join(", ");
    const pd=placements.map((p,i)=>{
      const viewKey=VIEW_TO_KEY[(p.view||"front").toLowerCase()]||"front";
      const an=artwork.find(a=>a.id==p.artId)?.name.replace(/\.[^.]+$/,"")||"unassigned";
      return `Placement ${i+1}:\n  - View: ${p.view} (key: ${viewKey})\n  - Position: ${p.placement}\n  - Artwork: "${an}" (ID: ${p.artId||"none"})\n  - Art width: ${p.width||"not specified"} inches\n  - From low collar point: ${p.fromCollar||"not specified"} inches\n  - Decoration: ${p.decType}\n  - Colours: ${p.colours||"not specified"}\n  - Notes: ${p.notes||"none"}`;
    }).join("\n\n");
    const prompt=`You are a production assistant at True North Screen Printing & Embroidery in Vancouver, BC.
Interpret this mockup placement brief and return a confirmed placement plan as JSON only.

JOB: ${jobNum||"n/a"} | Client: ${cust.company||"n/a"} | Garment: ${selBrand} ${selStyle}${selStyleNum?` (${selStyleNum})`:""} - ${selColour}
Loaded views: ${lv}

STANDARD POSITIONS: Left Chest: x=0.65,y=0.33 | Right Chest: x=0.32,y=0.33 | Centre Front: x=0.50,y=0.38 | Full Front: x=0.50,y=0.45 | Centre Back: x=0.50,y=0.30 | Full Back: x=0.50,y=0.38 | Sleeve Left: x=0.50,y=0.40 | Sleeve Right: x=0.50,y=0.40

ARTWORK: ${artNames}
PLACEMENTS:
${pd}
${revisionNotes?`REVISION NOTES: ${revisionNotes}`:""}

IMPORTANT: Use view keys exactly as: "front", "back", "sleeve_left", "sleeve_right", "other"
Return ONLY valid JSON, no markdown.

{"intro":"summary","placements":[{"placement":"Left Chest","view":"front","artId":1,"artName":"logo","x":0.65,"y":0.33,"scale":15.9,"decType":"Screen Print","colours":"PMS 185","specWidth":"3.5","specFromCollar":"3","notes":""}]}`;

    try{
      const r=await fetch("/.netlify/functions/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const text=await r.text();if(!r.ok)throw new Error(`Server error ${r.status}: ${text.substring(0,300)}`);
      let data;try{data=JSON.parse(text);}catch(e){throw new Error("Could not parse server response.");}
      if(data.error)throw new Error(data.error);
      const raw=data.content?.find(b=>b.type==="text")?.text||"";
      if(!raw)throw new Error("Empty response — check ANTHROPIC_API_KEY in Netlify.");
      const clean=raw.replace(/```json|```/g,"").trim();
      let plan;try{plan=JSON.parse(clean);}catch(e){throw new Error("AI returned invalid JSON.");}
      setAiPlan((plan.placements||[]).map(p=>({...p,view:normalizeView(p.view)}))); setAiIntro(plan.intro||"Placement plan ready.");setAiStatus("done");
    }catch(err){setAiStatus("error");setAiError(err.message);}
  }

  function skipAI(){
    const DEFAULTS={
      "Left Chest":{x:.65,y:.33,scale:18},"Right Chest":{x:.32,y:.33,scale:18},
      "Centre Front":{x:.50,y:.38,scale:26},"Full Front":{x:.50,y:.45,scale:54},
      "Centre Back":{x:.50,y:.30,scale:26},"Full Back":{x:.50,y:.38,scale:56},
      "Sleeve — Left":{x:.50,y:.40,scale:11},"Sleeve — Right":{x:.50,y:.40,scale:11},
      "Neck / Collar":{x:.50,y:.18,scale:12},"Left Hip":{x:.65,y:.68,scale:14},
      "Right Hip":{x:.32,y:.68,scale:14},"Shoulder":{x:.50,y:.14,scale:10},"Custom":{x:.50,y:.40,scale:24},
    };
    const plan=placements.map(p=>{
      const art=artwork.find(a=>a.id==p.artId);
      const def=DEFAULTS[p.placement]||{x:.50,y:.40,scale:22};
      const viewKey=VIEW_TO_KEY[(p.view||"front").toLowerCase()]||"front";
      return {placement:p.placement,view:normalizeView(p.view),artId:p.artId,artName:art?.name.replace(/\.[^.]+$/,"")||"",x:def.x,y:def.y,scale:def.scale,decType:p.decType,colours:p.colours,specWidth:p.width,specFromCollar:p.fromCollar,notes:p.notes};
    });
    setAiPlan(plan);setStep(5);showToast("Skipped AI — drag to fine-tune positions");
  }

  function handleFineTuneConfirm(ap){setAiPlan(ap);setStep(6);setTimeout(()=>renderMockup(ap),150);}

  async function saveJob(status="draft",planOverride){
    setSaveStatus("saving");
    try{
      const garmentUrls={};
      for(const [view,g] of Object.entries(garments)){
        if(!g||typeof g.dataURL==="string"&&g.dataURL.startsWith("http")){if(g)garmentUrls[view]=g.dataURL;continue;}
        const c=document.createElement("canvas");const ratio=Math.min(400/g.img.naturalWidth,1);
        c.width=Math.round(g.img.naturalWidth*ratio);c.height=Math.round(g.img.naturalHeight*ratio);
        c.getContext("2d").drawImage(g.img,0,0,c.width,c.height);garmentUrls[view]=c.toDataURL("image/jpeg",.6);
      }
      const artData=artwork.map(a=>{const c=document.createElement("canvas");const r=Math.min(300/a.img.naturalWidth,1);c.width=Math.round(a.img.naturalWidth*r);c.height=Math.round(a.img.naturalHeight*r);c.getContext("2d").drawImage(a.img,0,0,c.width,c.height);return{id:a.id,name:a.name,dataURL:c.toDataURL("image/png")};});
      await saveCustomer();
      const payload={
        job_num:jobNum,client:cust.company||cust.contact_name,garment_style:`${selBrand} ${selStyle}`.trim(),garment_colour:selColour,
        status,due_date:dueDate||null,decoration_types:decTypes,special_instructions:specialInstructions,press_check:pressCheck,bold_print:boldPrint,vintage_print:vintagePrint,
        customer_id:custId,garment_id:garmentId,
        shipping_address:{address:cust.address,city:cust.city,province:cust.province,postal:cust.postal},
        placements,ai_plan:planOverride||aiPlan,sizes,garment_urls:garmentUrls,artwork_data:artData,
        updated_at:new Date().toISOString(),
      };
      if(savedJobId){await sb("PATCH",`/jobs?id=eq.${savedJobId}`,payload);}
      else{const r=await sb("POST","/jobs",payload);if(r?.[0]?.id)setSavedJobId(r[0].id);}
      setSaveStatus("saved");showToast(status==="final"?"Saved as final ✓":"Draft saved ✓");
    }catch(e){setSaveStatus("error");showToast("Save failed: "+e.message);}
  }

  async function loadJob(jobId){
    try{
      const d=await sb("GET",`/jobs?id=eq.${jobId}&select=*`);const j=d[0];if(!j)return;
      setJobNum(j.job_num||"");setDueDate(j.due_date||"");setDecTypes(j.decoration_types||[]);setSpecialInstructions(j.special_instructions||"");setPressCheck(j.press_check||false);setBoldPrint(j.bold_print||false);setVintagePrint(j.vintage_print||false);
      setSavedJobId(j.id);setSaveStatus("saved");setPlacements(j.placements||[]);setAiPlan(j.ai_plan||[]);
      setAiStatus(j.ai_plan?.length?"done":"idle");setSizes(j.sizes||emptySizes());
      if(j.customer_id){const cd=await sb("GET",`/customers?id=eq.${j.customer_id}&select=*`);if(cd?.[0])selectCustomer(cd[0]);}
      else{setCust({company:j.client||"",contact_name:"",email:"",phone:"",address:(j.shipping_address?.address||""),city:(j.shipping_address?.city||""),province:(j.shipping_address?.province||"BC"),postal:(j.shipping_address?.postal||"")});}
      const gUrls=j.garment_urls||{};const newG={front:null,back:null,sleeve_left:null,sleeve_right:null,other:null};
      await Promise.all(Object.entries(gUrls).map(([view,url])=>new Promise(res=>{
        if(!url){res();return;}const img=new Image();img.crossOrigin="anonymous";
        img.onload=()=>{newG[view]={img,name:view+" view",dataURL:url};res();};img.onerror=()=>res();img.src=url;
      })));
      setGarments(newG);
      if(j.garment_style){const parts=j.garment_style.split(" ");setSelBrand(parts[0]||"");setSelStyle(parts.slice(1).join(" ")||"");}
      setSelColour(j.garment_colour||"");setGarmentId(j.garment_id||null);
      if(j.garment_id){const gm=garmentList.find(g=>g.id===j.garment_id);if(gm)setSelStyleNum(gm.style_num||"");}
      const artData=j.artwork_data||[];const newArt=[];
      await Promise.all(artData.map((a,idx)=>new Promise(res=>{const img=new Image();img.onload=()=>{newArt[idx]={id:a.id,img,name:a.name,dataURL:a.dataURL};res();};img.src=a.dataURL;})));
      setArtwork(newArt.filter(Boolean));if(newArt.length)setArtCounter(Math.max(...newArt.map(a=>a.id))+1);
      const targetStep=(j.status==="final"||j.status==="archived")&&j.ai_plan?.length?6:1;
      setStep(targetStep);setPage("builder");
      if(targetStep===6)setTimeout(()=>renderMockup(j.ai_plan),300);
      showToast("Job loaded");
    }catch(e){showToast("Could not load job: "+e.message);}
  }

  function renderMockup(planOverride){
    const plan=planOverride||aiPlan;
    const orderedViews=["front","back","sleeve_left","sleeve_right","other"];
    const lv=orderedViews.filter(k=>garments[k]);
    if(!lv.length)return;
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
    const GAP=14;const vcs=lv.map(k=>buildVC(k,plan,viewLabels[k]||k)).filter(Boolean);
    const tw=vcs.reduce((s,c)=>s+c.width,0)+(vcs.length-1)*GAP;const mh=Math.max(...vcs.map(c=>c.height));
    const specC=buildSpec(mh);const comb=document.createElement("canvas");
    comb.width=tw+GAP+specC.width;comb.height=mh;const cc=comb.getContext("2d");
    cc.fillStyle="#ede8df";cc.fillRect(0,0,comb.width,comb.height);
    let xOff=0;vcs.forEach(vc=>{cc.drawImage(vc,xOff,Math.round((mh-vc.height)/2));xOff+=vc.width+GAP;});
    cc.drawImage(specC,xOff,0);exportRef.current=comb;
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.width=comb.width;canvas.height=comb.height;canvas.getContext("2d").drawImage(comb,0,0);setMockupBuilt(true);
  }

  function buildVC(vk,plan,viewLabel){
    const activePlan=plan||aiPlan;
    const g=garments[vk];if(!g)return null;const img=g.img;
    const r=Math.min(680/img.naturalWidth,800/img.naturalHeight);
    const vw=Math.round(img.naturalWidth*r),vh=Math.round(img.naturalHeight*r);
    const vc=document.createElement("canvas");vc.width=vw;vc.height=vh;const vx=vc.getContext("2d");
    vx.fillStyle="#fff";vx.fillRect(0,0,vw,vh);vx.drawImage(img,0,0,vw,vh);
    activePlan.filter(p=>normalizeView(p.view)===vk).forEach(p=>{
      const art=artwork.find(a=>a.id==p.artId);if(!art)return;
      const aw=(Math.max(2,Math.min(200,p.scale||22))/100)*vw,ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
      vx.save();vx.translate((p.x||.5)*vw,(p.y||.4)*vh);vx.drawImage(art.img,-aw/2,-ah/2,aw,ah);vx.restore();
    });
    const fs=Math.max(10,vw*.018);
    vx.fillStyle="rgba(0,0,0,.5)";vx.fillRect(0,0,vw,fs*1.8);
    vx.font=`500 ${fs*.88}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(245,240,232,.9)";vx.fillText((viewLabel||vk).toUpperCase()+" VIEW",10,fs*1.3);
    vx.fillStyle="rgba(0,0,0,.38)";vx.fillRect(0,vh-fs*2.8,vw,fs*2.8);
    vx.font=`500 ${fs*.9}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(245,240,232,.82)";vx.fillText("TRUE NORTH SCREEN PRINTING",10,vh-fs*1.75);
    vx.font=`${fs*.74}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(200,55,45,.85)";
    const meta=[jobNum&&"JOB #"+jobNum,cust.company&&cust.company.toUpperCase()].filter(Boolean).join("  .  ");
    if(meta)vx.fillText(meta,10,vh-fs*.78);return vc;
  }

  function buildSpec(height){
    const PW=400;const sc=document.createElement("canvas");sc.width=PW;sc.height=height;const sx=sc.getContext("2d");
    sx.fillStyle="#f5f0e8";sx.fillRect(0,0,PW,height);sx.fillStyle="#c8372d";sx.fillRect(0,0,3,height);
    sx.fillStyle="#0f0f0f";sx.fillRect(0,0,PW,66);
    sx.font="bold 24px Bebas Neue,sans-serif";sx.fillStyle="#f5f0e8";sx.fillText("TRUE NORTH",14,27);
    sx.font="10px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText("SCREEN PRINTING & EMBROIDERY",14,44);
    sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#555";sx.fillText("PLACEMENT SPECIFICATION SHEET",14,59);
    let y=82;
    const mr=(k,v)=>{sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#aaa";sx.fillText(k.toUpperCase(),14,y);sx.font="500 11px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(v||"",115,y);y+=17;};
    if(jobNum)mr("Job #",jobNum);if(cust.company)mr("Client",cust.company);if(cust.contact_name)mr("Contact",cust.contact_name);
    if(cust.email)mr("Email",cust.email);if(cust.phone)mr("Phone",cust.phone);
    const ga=[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`,selColour].filter(Boolean).join(" ");if(ga)mr("Garment",ga);
    if(dueDate)mr("Due Date",new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"}));
    if(decTypes.length)mr("Decoration",decTypes.join(", "));
    const flags=[];if(pressCheck)flags.push("PRESS CHECK REQUIRED");if(boldPrint)flags.push("BOLD PRINT");if(vintagePrint)flags.push("VINTAGE / DISTRESSED");
    if(flags.length)mr("Print Options",flags.join("  |  "));
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
    const lv=Object.entries(garments).filter(([,v])=>v).map(([k])=>viewLabels[k]||k);
    if(lv.length)mr("Views",lv.join(" + "));
    const asSizes=ALL_SIZES.filter(s=>sizes[s]?.active&&sizes[s]?.qty);
    if(asSizes.length){
      const total=asSizes.reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0);
      mr("Total Units",String(total));
      sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#aaa";sx.fillText("SIZE BREAKDOWN",14,y);
      const sstr=asSizes.map(s=>`${s}:${sizes[s].qty}`).join("  ");
      sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#0f0f0f";
      let line="";let ly=y;const words=sstr.split("  ");
      words.forEach(w=>{const t=line?line+"  "+w:w;if(sx.measureText(t).width>PW-30&&line){sx.fillText(line,14,ly+12);line=w;ly+=13;}else{line=t;}});
      if(line)sx.fillText(line,14,ly+12);y=ly+26;
    }
    if(specialInstructions)mr("Notes",specialInstructions.substring(0,60));
    y+=4;sx.fillStyle="#d4cdc0";sx.fillRect(14,y,PW-28,1);y+=12;
    aiPlan.forEach((p,i)=>{
      const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
      const ch=ehH(p);
      sx.fillStyle="#fff";sx.fillRect(11,y-2,PW-22,ch+6);sx.strokeStyle="#e0dbd3";sx.lineWidth=1;sx.strokeRect(11,y-2,PW-22,ch+6);sx.fillStyle="#c8372d";sx.fillRect(11,y-2,3,ch+6);
      sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText(`PLACEMENT ${i+1} - ${(viewLabels[p.view]||p.view||"FRONT").toUpperCase()}`,20,y+11);
      sx.font="bold 13px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(p.placement||"",20,y+26);
      if(p.decType){sx.fillStyle="rgba(200,55,45,.12)";const tw=sx.measureText(p.decType.toUpperCase()).width+10;sx.fillRect(20,y+30,tw,13);sx.font="8px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText(p.decType.toUpperCase(),25,y+40);}
      let ry=y+(p.decType?50:38);
      const sr=(k,v)=>{if(!v)return;sx.font="8px IBM Plex Mono,monospace";sx.fillStyle="#999";sx.fillText(k.toUpperCase(),20,ry);sx.font="11px IBM Plex Sans,sans-serif";sx.fillStyle="#222";const words=v.split(" ");let line="";const mw=PW-155;words.forEach(w=>{const t=line?line+" "+w:w;if(sx.measureText(t).width>mw&&line){sx.fillText(line,128,ry);line=w;ry+=13;}else{line=t;}});if(line)sx.fillText(line,128,ry);ry+=15;};
      if(p.artName)sr("Artwork",p.artName);if(p.specWidth)sr("Art Width",p.specWidth+'"');if(p.specFromCollar)sr("From Collar",p.specFromCollar+'"');if(p.colours)sr("Colours",p.colours);if(p.notes)sr("Notes",p.notes);
      y+=ch+13;
    });
    const fY=height-24;sx.fillStyle="#0f0f0f";sx.fillRect(0,fY,PW,24);
    sx.font="9px IBM Plex Mono,monospace";sx.fillStyle="#555";
    sx.fillText("truenorthscreenprinting.ca - Vancouver, BC",14,fY+15);
    sx.fillText(new Date().toLocaleDateString("en-CA"),PW-66,fY+15);
    return sc;
  }

  function buildWorkOrder(){
    const PW=860,PH=1400;const wc=document.createElement("canvas");wc.width=PW;wc.height=PH;const wx=wc.getContext("2d");
    wx.fillStyle="#ffffff";wx.fillRect(0,0,PW,PH);
    wx.fillStyle="#0f0f0f";wx.fillRect(0,0,PW,80);
    wx.font="bold 44px Bebas Neue,sans-serif";wx.fillStyle="#f5f0e8";wx.fillText("TRUE NORTH",24,52);
    wx.font="12px IBM Plex Mono,monospace";wx.fillStyle="#c8372d";wx.fillText("SCREEN PRINTING & EMBROIDERY  |  PRODUCTION WORK ORDER",24,68);
    wx.font="bold 22px Bebas Neue,sans-serif";wx.fillStyle="#c8372d";wx.textAlign="right";wx.fillText(`JOB #${jobNum||""}`,PW-24,48);
    wx.font="10px IBM Plex Mono,monospace";wx.fillStyle="#888";wx.fillText(new Date().toLocaleDateString("en-CA"),PW-24,66);
    wx.textAlign="left";
    let y=104;
    function section(title){wx.fillStyle="#f5f0e8";wx.fillRect(0,y,PW,26);wx.fillStyle="#c8372d";wx.fillRect(0,y,4,26);wx.font="bold 15px Bebas Neue,sans-serif";wx.fillStyle="#0f0f0f";wx.fillText(title,12,y+18);y+=34;}
    function row(k,v,col2k,col2v){
      wx.font="10px IBM Plex Mono,monospace";wx.fillStyle="#aaa";wx.fillText(k.toUpperCase(),24,y);
      wx.font="14px IBM Plex Sans,sans-serif";wx.fillStyle="#0f0f0f";wx.fillText(v||"",24,y+16);
      if(col2k){wx.font="10px IBM Plex Mono,monospace";wx.fillStyle="#aaa";wx.fillText(col2k.toUpperCase(),PW/2+20,y);wx.font="14px IBM Plex Sans,sans-serif";wx.fillStyle="#0f0f0f";wx.fillText(col2v||"",PW/2+20,y+16);}
      y+=36;
    }
    section("CUSTOMER & JOB");
    row("Client",cust.company||cust.contact_name,"Contact",cust.contact_name);
    row("Email",cust.email,"Phone",cust.phone);
    row("Ship To",[cust.address,cust.city,cust.province,cust.postal].filter(Boolean).join(", "),"Due Date",dueDate?new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"}):"");
    section("GARMENT");
    row("Style",[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`].filter(Boolean).join(" "),"Colour",selColour);
    row("Decoration",decTypes.join(", "),"","");
    section("SIZES & QUANTITIES");
    const asSizes=ALL_SIZES.filter(s=>sizes[s]?.active&&sizes[s]?.qty);
    if(asSizes.length){
      const colW=Math.floor((PW-48)/asSizes.length);
      wx.fillStyle="#f5f0e8";wx.fillRect(24,y,PW-48,24);
      asSizes.forEach((s,i)=>{wx.font="bold 12px IBM Plex Mono,monospace";wx.fillStyle="#0f0f0f";wx.fillText(s,24+i*colW+8,y+17);});
      y+=24;
      wx.fillStyle="#fff";wx.fillRect(24,y,PW-48,38);wx.strokeStyle="#d4cdc0";wx.lineWidth=1;wx.strokeRect(24,y,PW-48,38);
      asSizes.forEach((s,i)=>{wx.font="bold 20px IBM Plex Sans,sans-serif";wx.fillStyle="#0f0f0f";wx.fillText(sizes[s].qty,24+i*colW+8,y+27);});
      y+=38;
      const total=asSizes.reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0);
      wx.font="bold 14px IBM Plex Mono,monospace";wx.fillStyle="#c8372d";wx.fillText(`TOTAL: ${total} UNITS`,24,y+20);y+=34;
    }
    section("PRINT / EMBROIDERY PLACEMENTS");
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
    aiPlan.forEach((p,i)=>{
      wx.fillStyle="#f5f0e8";wx.fillRect(24,y,PW-48,24);wx.fillStyle="#c8372d";wx.fillRect(24,y,3,24);
      wx.font="bold 12px IBM Plex Mono,monospace";wx.fillStyle="#c8372d";wx.fillText(`PLACEMENT ${i+1} - ${(viewLabels[p.view]||p.view||"FRONT").toUpperCase()} - ${p.placement||""}`,30,y+17);y+=26;
      wx.fillStyle="#fff";wx.fillRect(24,y,PW-48,64);wx.strokeStyle="#d4cdc0";wx.lineWidth=1;wx.strokeRect(24,y,PW-48,64);
      const cols=[`Artwork: ${p.artName||""}`,`Art Width: ${p.specWidth?p.specWidth+'"':""}`,`From Collar: ${p.specFromCollar?p.specFromCollar+'"':""}`,`Colours: ${p.colours||""}`];
      cols.forEach((txt,ci)=>{wx.font="12px IBM Plex Sans,sans-serif";wx.fillStyle="#333";wx.fillText(txt,(PW-48)/4*ci+30,y+24);});
      if(p.notes){wx.font="italic 11px IBM Plex Sans,sans-serif";wx.fillStyle="#666";wx.fillText("Notes: "+p.notes,30,y+50);}
      y+=68;
    });
    if(exportRef.current){
      section("DIGITAL MOCKUP");
      const thumb=exportRef.current;const maxW=PW-48;const maxH=280;
      const r=Math.min(maxW/thumb.width,maxH/thumb.height);
      const tw=Math.round(thumb.width*r);const th=Math.round(thumb.height*r);
      wx.fillStyle="#fff";wx.fillRect(24,y,tw+2,th+2);wx.strokeStyle="#d4cdc0";wx.lineWidth=1;wx.strokeRect(24,y,tw+2,th+2);
      wx.drawImage(thumb,25,y+1,tw,th);y+=th+16;
    }
    if(pressCheck||boldPrint||vintagePrint){
      wx.fillStyle="#0f0f0f";wx.fillRect(0,y,PW,36);
      let flagText="";if(pressCheck)flagText+="⚠ PRESS CHECK REQUIRED    ";if(boldPrint)flagText+="BOLD PRINT    ";if(vintagePrint)flagText+="VINTAGE / DISTRESSED";
      wx.font="bold 13px IBM Plex Mono,monospace";wx.fillStyle=pressCheck?"#c8372d":"#f5f0e8";wx.fillText(flagText.trim(),24,y+24);y+=44;
    }
    if(specialInstructions){section("SPECIAL INSTRUCTIONS");wx.fillStyle="#fff";wx.fillRect(24,y,PW-48,50);wx.strokeStyle="#d4cdc0";wx.lineWidth=1;wx.strokeRect(24,y,PW-48,50);wx.font="11px IBM Plex Sans,sans-serif";wx.fillStyle="#333";wx.fillText(specialInstructions,30,y+20);y+=54;}
    y=Math.max(y,PH-180);section("QC & SIGN-OFF");
    const swatchSize=110;wx.fillStyle="#fff";wx.fillRect(24,y,swatchSize,swatchSize);wx.strokeStyle="#0f0f0f";wx.lineWidth=1.5;wx.strokeRect(24,y,swatchSize,swatchSize);
    wx.strokeStyle="#e0dbd3";wx.lineWidth=1;wx.beginPath();wx.moveTo(24,y);wx.lineTo(24+swatchSize,y+swatchSize);wx.stroke();wx.beginPath();wx.moveTo(24+swatchSize,y);wx.lineTo(24,y+swatchSize);wx.stroke();
    wx.font="8px IBM Plex Mono,monospace";wx.fillStyle="#aaa";wx.textAlign="center";wx.fillText("INK SWATCH",24+swatchSize/2,y+swatchSize+12);wx.fillText("(apply sample here)",24+swatchSize/2,y+swatchSize+24);wx.textAlign="left";
    const soy=y+20;wx.fillStyle="#d4cdc0";wx.fillRect(160,soy+20,280,1);wx.fillRect(160,soy+70,280,1);wx.fillRect(160,soy+120,280,1);
    wx.font="8px IBM Plex Mono,monospace";wx.fillStyle="#aaa";wx.fillText("PRODUCTION SIGN-OFF",160,soy+32);wx.fillText("QC CHECK",160,soy+82);wx.fillText("DATE COMPLETED",160,soy+132);
    return wc;
  }

  function ehH(p){let h=p.decType?54:40;if(p.artName)h+=15;if(p.specWidth)h+=15;if(p.specFromCollar)h+=15;if(p.colours)h+=15+Math.ceil((p.colours.length||0)/36)*13;if(p.notes)h+=15+Math.ceil((p.notes.length||0)/36)*13;return Math.max(h,55);}
  function exportPNG(){if(!exportRef.current)return;const a=document.createElement("a");a.download=`TNSP-Mockup-${jobNum||"draft"}.png`;a.href=exportRef.current.toDataURL("image/png");a.click();}
  function exportJPG(){if(!exportRef.current)return;const a=document.createElement("a");a.download=`TNSP-Mockup-${jobNum||"draft"}.jpg`;a.href=exportRef.current.toDataURL("image/jpeg",.93);a.click();}
  async function exportWorkOrder(){
    try{await document.fonts.ready;const wo=buildWorkOrder();if(!wo){showToast("Could not build work order");return;}const a=document.createElement("a");a.download=`TNSP-WorkOrder-${jobNum||"draft"}.png`;a.href=wo.toDataURL("image/png");a.click();}
    catch(e){showToast("Work order error: "+e.message);}
  }

  const safeSizes={...emptySizes(),...sizes};
  const totalUnits=ALL_SIZES.filter(s=>safeSizes[s]?.active).reduce((sum,s)=>sum+(parseInt(safeSizes[s].qty)||0),0);

  return (
    <div style={S.body}>
      <div style={S.header}>
        <div><div style={S.brand}>TRUE<span style={S.bspan}>NORTH</span></div><div style={S.bsub}>Screen Printing & Embroidery</div></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {page==="builder"&&<button style={{...S.tag,cursor:"pointer",color:"#aaa"}} onClick={()=>setPage("jobs")}>← All Jobs</button>}
          <div style={S.tag}>Job Builder</div>
        </div>
      </div>

      {page==="jobs"&&(
        <div style={S.wrap}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={S.sec}><span style={S.secn}>✦</span> Active Jobs</div>
            <button style={S.btn("r")} onClick={newJob}>+ New Job</button>
          </div>
          {jobsLoading&&<div style={S.note("i")}>Loading...</div>}
          {!jobsLoading&&jobs.length===0&&<div style={S.note("i")}>No active jobs — click New Job to get started.</div>}
          {jobs.map(j=>(
            <div key={j.id} style={S.jcard} onClick={()=>loadJob(j.id)}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#c8372d"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#d4cdc0"}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.15rem",letterSpacing:".06em"}}>{j.client||"Unnamed"}{j.job_num&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",color:"#c8372d",marginLeft:10}}>#{j.job_num}</span>}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",textTransform:"uppercase",color:"#aaa",marginTop:2}}>{j.garment_style}{j.garment_colour?" - "+j.garment_colour:""}{j.due_date&&<span style={{marginLeft:10,color:"#888"}}>Due: {new Date(j.due_date+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</span>}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",textTransform:"uppercase",padding:"3px 8px",background:"#fff8e6",color:"#7a5500",border:"1px solid #b8892e"}}>{j.status||"draft"}</span>
                <button onClick={e=>archiveJob(j.id,e)} style={{background:"none",border:"1px solid #d4cdc0",color:"#888",cursor:"pointer",fontSize:".52rem",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:".08em",textTransform:"uppercase",padding:"3px 8px"}}>Archive</button>
                <button onClick={e=>deleteJob(j.id,e)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".8rem"}}>✕</button>
              </div>
            </div>
          ))}
          <hr style={S.div}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={S.sec} onClick={()=>setShowArchive(v=>!v)}><span style={S.secn}>↓</span> Archive {showArchive?"▲":"▼"}</div>
          </div>
          {showArchive&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input style={{...S.inp,flex:1}} value={archiveSearch} onChange={e=>setArchiveSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchArchive()} placeholder="Search by client name or job #..."/>
                <button style={S.btn()} onClick={searchArchive}>{archiveSearching?"...":"Search"}</button>
              </div>
              {archiveResults.length===0&&archiveSearch&&!archiveSearching&&<div style={S.note("i")}>No archived jobs found for "{archiveSearch}"</div>}
              {archiveResults.map(j=>(
                <div key={j.id} style={{...S.jcard,borderLeft:"3px solid #d4cdc0"}} onClick={()=>loadJob(j.id)}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#888"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#d4cdc0"}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".06em",color:"#555"}}>{j.client||"Unnamed"}{j.job_num&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",color:"#888",marginLeft:10}}>#{j.job_num}</span>}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",textTransform:"uppercase",color:"#bbb",marginTop:2}}>{j.garment_style}{j.garment_colour?" - "+j.garment_colour:""}{j.due_date&&<span style={{marginLeft:10}}>Due: {new Date(j.due_date+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</span>}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",textTransform:"uppercase",padding:"3px 8px",background:j.status==="final"?"#e6f4ec":"#f5f0e8",color:j.status==="final"?"#2a7a4b":"#888",border:`1px solid ${j.status==="final"?"#2a7a4b":"#d4cdc0"}`}}>{j.status}</span>
                    <button onClick={e=>deleteJob(j.id,e)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".8rem"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <hr style={S.div}/>
          <div style={S.sec}><span style={S.secn}>⚙</span> Garment Library</div>
          <div style={S.note("i")}>Add garments here so they appear in the job builder. Upload front, back, and sleeve photos to Supabase storage and paste the public URLs.</div>
          <GarmentManager garmentList={garmentList} onRefresh={loadGarmentList}/>
        </div>
      )}

      {page==="builder"&&(
        <>
          <div style={{display:"flex",background:"#0f0f0f",borderBottom:"2px solid #0f0f0f"}}>
            {[["01","Intake"],["02","Garment"],["03","Artwork"],["04","AI Review"],["05","Fine-Tune"],["06","Export"]].map(([n,lbl],i)=>(
              <div key={i} style={{flex:1,padding:"10px 12px",borderRight:"1px solid #2a2a2a",background:step===i+1?"#1a1a1a":step>i+1?"#111":"transparent",cursor:"pointer"}} onClick={()=>setStep(i+1)}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".14em",textTransform:"uppercase",color:step===i+1?"#c8372d":"#3a3a3a"}}>{`Step ${n}`}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".76rem",fontWeight:500,color:step===i+1?"#f5f0e8":step>i+1?"#3a3a3a":"#555",marginTop:2}}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={S.wrap}>
            {step===1&&(
              <div>
                <div style={S.sec}><span style={S.secn}>01</span> Job Intake</div>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Job # <span style={{color:"#c8372d"}}>*</span></label><input style={S.inp} value={jobNum} onChange={e=>setJobNum(e.target.value)} placeholder="Auto-filled"/></div>
                  <div><label style={S.lbl}>Due Date</label><input type="date" style={S.inp} value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={S.lbl}>Decoration Type(s)</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {DEC_TYPES.map(t=>(
                      <label key={t} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"6px 12px",border:`1px solid ${decTypes.includes(t)?"#c8372d":"#d4cdc0"}`,background:decTypes.includes(t)?"#fdf0ee":"#fffdf8"}}>
                        <input type="checkbox" checked={decTypes.includes(t)} onChange={e=>setDecTypes(d=>e.target.checked?[...d,t]:d.filter(x=>x!==t))} style={{accentColor:"#c8372d"}}/>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".1em",textTransform:"uppercase",color:decTypes.includes(t)?"#c8372d":"#666"}}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={S.lbl}>Production Options</label>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {[[pressCheck,setPressCheck,"Press Check Required","⚠","#c8372d"],[boldPrint,setBoldPrint,"Bold Print","B","#0f0f0f"],[vintagePrint,setVintagePrint,"Vintage / Distressed","V","#7a5500"]].map(([val,setter,label,icon,activeColor])=>(
                      <label key={label} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"10px 14px",border:`2px solid ${val?activeColor:"#d4cdc0"}`,background:val?"#fdf8f0":"#fffdf8"}}>
                        <input type="checkbox" checked={val} onChange={e=>setter(e.target.checked)} style={{accentColor:activeColor,width:15,height:15}}/>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".12em",textTransform:"uppercase",color:val?activeColor:"#888",fontWeight:val?600:400}}>{icon} {label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:14}}><label style={S.lbl}>Special Instructions</label><textarea style={S.ta} value={specialInstructions} onChange={e=>setSpecialInstructions(e.target.value)} placeholder="Any special notes for production..."/></div>
                <hr style={S.div}/>
                <div style={S.sec}><span style={S.secn}>+</span> Customer</div>
                <div style={{position:"relative",marginBottom:14}}>
                  <label style={S.lbl}>Search Existing Customers</label>
                  <input style={S.inp} value={custSearch} onChange={e=>searchCustomers(e.target.value)} placeholder="Type company or contact name..."/>
                  {custSuggestions.length>0&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #d4cdc0",zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
                      {custSuggestions.map(c=>(
                        <div key={c.id} onClick={()=>selectCustomer(c)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f0ece4",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".86rem"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f0e8"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                          <strong>{c.company}</strong>{c.contact_name&&<span style={{color:"#888",marginLeft:8,fontSize:".8rem"}}>{c.contact_name}</span>}
                          {c.email&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",color:"#aaa"}}>{c.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={S.g2}>
                  <div><label style={S.lbl}>Company Name</label><input style={S.inp} value={cust.company} onChange={e=>setCust(c=>({...c,company:e.target.value}))} placeholder="e.g. Coastal Fitness Co."/></div>
                  <div><label style={S.lbl}>Contact Name</label><input style={S.inp} value={cust.contact_name} onChange={e=>setCust(c=>({...c,contact_name:e.target.value}))} placeholder="e.g. Jamie Lee"/></div>
                  <div><label style={S.lbl}>Email</label><input style={S.inp} value={cust.email} onChange={e=>setCust(c=>({...c,email:e.target.value}))} placeholder="jamie@example.com"/></div>
                  <div><label style={S.lbl}>Phone</label><input style={S.inp} value={cust.phone} onChange={e=>setCust(c=>({...c,phone:e.target.value}))} placeholder="604-000-0000"/></div>
                </div>
                <div style={{marginBottom:14}}><label style={S.lbl}>Shipping Address</label><input style={S.inp} value={cust.address} onChange={e=>setCust(c=>({...c,address:e.target.value}))} placeholder="Street address"/></div>
                <div style={S.g3}>
                  <div><label style={S.lbl}>City</label><input style={S.inp} value={cust.city} onChange={e=>setCust(c=>({...c,city:e.target.value}))} placeholder="Vancouver"/></div>
                  <div><label style={S.lbl}>Province</label><select style={S.sel} value={cust.province} onChange={e=>setCust(c=>({...c,province:e.target.value}))}>{CA_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={S.lbl}>Postal Code</label><input style={S.inp} value={cust.postal} onChange={e=>setCust(c=>({...c,postal:e.target.value}))} placeholder="V6B 1A1"/></div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button style={S.btn()} onClick={()=>{loadGarmentList();setStep(2);}}>Next - Garment Selection →</button>
                  <button style={S.btn("o")} onClick={()=>saveJob("draft")}>Save Draft</button>
                </div>
              </div>
            )}

            {step===2&&(
              <div>
                <div style={S.sec}><span style={S.secn}>02</span> Garment Selection</div>
                <div style={S.note("i")}>Select brand, style, and colour — garment photos load automatically from the library.</div>
                <div style={S.g3}>
                  <div>
                    <label style={S.lbl}>Brand</label>
                    <select style={S.sel} value={selBrand} onChange={e=>{setSelBrand(e.target.value);setSelStyle("");setSelColour("");setGarmentId(null);}}>
                      <option value="">— Select brand —</option>
                      {brands.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Style</label>
                    <select style={S.sel} value={selStyle} onChange={e=>{setSelStyle(e.target.value);setSelColour("");setGarmentId(null);}} disabled={!selBrand}>
                      <option value="">— Select style —</option>
                      {styles.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Colour</label>
                    <select style={S.sel} value={selColour} onChange={e=>{const g=colours.find(x=>x.colour===e.target.value);if(g)selectColour(g);}} disabled={!selStyle}>
                      <option value="">— Select colour —</option>
                      {colours.map(c=><option key={c.id} value={c.colour}>{c.colour}</option>)}
                    </select>
                  </div>
                </div>

                {/* Garment preview — now shows all 5 views */}
                {Object.entries({front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"}).filter(([k])=>garments[k]).length>0&&(
                  <div style={{display:"flex",gap:12,marginTop:16,marginBottom:8,flexWrap:"wrap"}}>
                    {Object.entries({front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"}).filter(([k])=>garments[k]).map(([k,label])=>(
                      <div key={k} style={{border:"1px solid #d4cdc0",background:"#fff",padding:10,textAlign:"center"}}>
                        <img src={garments[k].dataURL} style={{maxHeight:140,maxWidth:180,objectFit:"contain"}}/>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".1em",textTransform:"uppercase",color:"#aaa",marginTop:6}}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual upload — now 5 slots including sleeves */}
                <div style={{marginTop:12}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",color:"#888",marginBottom:8}}>Or upload garment photos manually</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                    {[["front","Front *"],["back","Back"],["sleeve_left","Left Sleeve"],["sleeve_right","Right Sleeve"],["other","Other"]].map(([view,label])=>(
                      <label key={view} style={{border:`2px ${garments[view]?"solid #4caf7d":"dashed #d4cdc0"}`,background:"#fffdf8",padding:12,textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:80,position:"relative",gap:4}}>
                        <input type="file" accept="image/*" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}} onChange={e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{const img=new Image();img.onload=()=>setGarments(g=>({...g,[view]:{img,name:file.name,dataURL:ev.target.result}}));img.src=ev.target.result;};reader.readAsDataURL(file);e.target.value="";}}/>
                        {garments[view]?<img src={garments[view].dataURL} style={{maxHeight:44,maxWidth:"100%",objectFit:"contain"}}/>:<span style={{fontSize:"1.1rem"}}>👕</span>}
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",letterSpacing:".1em",textTransform:"uppercase",color:garments[view]?"#4caf7d":"#aaa"}}>{garments[view]?"✓ "+label:label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={S.div}/>
                <div style={S.sec}><span style={S.secn}>+</span> Sizes & Quantities</div>
                <div style={{background:"#fffdf8",border:"1px solid #d4cdc0",padding:"14px 16px",marginBottom:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:8}}>
                    {ALL_SIZES.filter(s=>s!=="One Size").map(s=>(
                      <label key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <input type="checkbox" checked={safeSizes[s]?.active||false} onChange={e=>setSizes(z=>({...z,[s]:{...(z[s]||{}),active:e.target.checked,qty:e.target.checked?(z[s]?.qty||""):""}}))} style={{accentColor:"#c8372d",width:13,height:13}}/>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".1em",textTransform:"uppercase",color:safeSizes[s]?.active?"#0f0f0f":"#aaa",fontWeight:safeSizes[s]?.active?600:400}}>{s}</span>
                        </div>
                        <input type="number" min="0" placeholder="0" value={safeSizes[s]?.qty||""} disabled={!safeSizes[s]?.active} onChange={e=>setSizes(z=>({...z,[s]:{...(z[s]||{}),qty:e.target.value}}))} style={{width:"100%",background:safeSizes[s]?.active?"#fff":"#f0ece4",border:"1px solid #d4cdc0",borderBottom:`2px solid ${safeSizes[s]?.active?"#0f0f0f":"#d4cdc0"}`,padding:"5px 6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:".72rem",textAlign:"center",color:safeSizes[s]?.active?"#0f0f0f":"#ccc",outline:"none"}}/>
                      </label>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 10px",background:safeSizes["One Size"]?.active?"#fdf0ee":"#f5f0e8",border:`1px solid ${safeSizes["One Size"]?.active?"#c8372d":"#d4cdc0"}`,marginBottom:10}}>
                    <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                      <input type="checkbox" checked={safeSizes["One Size"]?.active||false} onChange={e=>setSizes(z=>({...z,["One Size"]:{...z["One Size"],active:e.target.checked,qty:e.target.checked?z["One Size"]?.qty:""}}))} style={{accentColor:"#c8372d",width:13,height:13}}/>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".1em",textTransform:"uppercase",color:safeSizes["One Size"]?.active?"#c8372d":"#888",fontWeight:safeSizes["One Size"]?.active?600:400}}>One Size</span>
                    </label>
                    <input type="number" min="0" placeholder="qty" value={safeSizes["One Size"]?.qty||""} disabled={!safeSizes["One Size"]?.active} onChange={e=>setSizes(z=>({...z,["One Size"]:{...z["One Size"],qty:e.target.value}}))} style={{width:80,background:safeSizes["One Size"]?.active?"#fff":"#f0ece4",border:"1px solid #d4cdc0",borderBottom:`2px solid ${safeSizes["One Size"]?.active?"#0f0f0f":"#d4cdc0"}`,padding:"5px 8px",fontFamily:"'IBM Plex Mono',monospace",fontSize:".72rem",textAlign:"center",color:safeSizes["One Size"]?.active?"#0f0f0f":"#ccc",outline:"none"}}/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #e8e2d8"}}>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{ALL_SIZES.filter(s=>safeSizes[s]?.active&&safeSizes[s]?.qty).map(s=><span key={s} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",color:"#555"}}>{s}: <strong>{safeSizes[s].qty}</strong></span>)}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",color:"#0f0f0f",whiteSpace:"nowrap",marginLeft:16}}>Total: {totalUnits} units</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button style={S.btn("o")} onClick={()=>setStep(1)}>← Back</button>
                  <button style={S.btn()} onClick={()=>setStep(3)}>Next - Artwork & Placements →</button>
                  <button style={S.btn("o")} onClick={()=>saveJob("draft")}>Save Draft</button>
                </div>
              </div>
            )}

            {step===3&&(
              <div>
                <div style={S.sec}><span style={S.secn}>03</span> Artwork & Placements</div>
                <div style={S.note("i")}>Upload all logos/artwork, then define each placement below.</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
                  {artwork.map(a=>(
                    <div key={a.id} style={{background:"#fffdf8",border:"2px solid #d4cdc0",padding:8,display:"flex",flexDirection:"column",alignItems:"center",gap:4,width:78,position:"relative"}}>
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
                <hr style={S.div}/>
                <div style={S.sec}><span style={S.secn}>+</span> Placements</div>
                {placements.map((p,idx)=>(
                  <div key={p._id} style={S.prow}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d"}}>Placement {idx+1}</span>
                      <button onClick={()=>removeRow(p._id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".78rem"}}>✕ Remove</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:10}}>
                      <div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>View</div>
                        <select style={S.sel} value={p.view} onChange={e=>updateRow(p._id,"view",e.target.value)}>
                          {VIEW_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>Placement</div>
                        <select style={S.sel} value={p.placement} onChange={e=>updateRow(p._id,"placement",e.target.value)}>
                          {PLACEMENT_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>Artwork</div>
                        <select style={S.sel} value={p.artId} onChange={e=>updateRow(p._id,"artId",e.target.value)}>
                          <option value="">— Select —</option>
                          {artwork.map(a=><option key={a.id} value={a.id}>{a.name.replace(/\.[^.]+$/,"").substring(0,16)}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>Decoration</div>
                        <select style={S.sel} value={p.decType} onChange={e=>updateRow(p._id,"decType",e.target.value)}>
                          {DEC_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:8}}>
                      {[["Art Width (in)","width",'e.g. 3.5"'],["From Low Collar (in)","fromCollar",'e.g. 3"'],["Ink / Thread Colours","colours","e.g. PMS 185, White"]].map(([lbl,key,ph])=>(
                        <div key={key}><div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".12em",textTransform:"uppercase",color:"#888",marginBottom:3}}>{lbl}</div><input style={S.inp} placeholder={ph} value={p[key]} onChange={e=>updateRow(p._id,key,e.target.value)}/></div>
                      ))}
                    </div>
                    <textarea style={{...S.ta,marginTop:8}} placeholder="Extra notes for this placement" value={p.notes} onChange={e=>updateRow(p._id,"notes",e.target.value)}/>
                  </div>
                ))}
                <button onClick={addRow} style={{background:"none",border:"1px dashed #d4cdc0",color:"#aaa",fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:9,cursor:"pointer",textAlign:"center",width:"100%",marginBottom:4}}>+ Add Placement</button>
                <div style={{display:"flex",gap:10,marginTop:24}}>
                  <button style={S.btn("o")} onClick={()=>setStep(2)}>← Back</button>
                  <button style={S.btn("r")} onClick={()=>{setStep(4);runAI();}}>Send to AI →</button>
                  <button style={S.btn("o")} onClick={skipAI}>Skip AI — Place Manually →</button>
                  <button style={S.btn("o")} onClick={()=>saveJob("draft")}>Save Draft</button>
                </div>
              </div>
            )}

            {step===4&&(
              <div>
                <div style={S.sec}><span style={S.secn}>04</span> AI Placement Review</div>
                {aiStatus==="thinking"&&<div style={{...S.note("w"),display:"flex",alignItems:"center",gap:8}}><span style={{display:"inline-flex",gap:3}}>{[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,background:"currentColor",borderRadius:"50%",display:"inline-block",animation:`pulse 1.2s ${d}s infinite`}}/>)}</span>Calculating placements...<style>{`@keyframes pulse{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style></div>}
                {aiStatus==="error"&&<div style={{...S.note("w"),borderColor:"#c8372d",background:"#fdf0ee",color:"#c8372d"}}>⚠ {aiError}</div>}
                {aiStatus==="done"&&(
                  <div>
                    <div style={S.note("i")}>✓ {aiIntro}</div>
                    {aiPlan.map((p,i)=>{
                      const art=artwork.find(a=>a.id==p.artId);
                      const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
                      return <div key={i} style={S.card}>
                        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".08em"}}>{p.placement}</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d"}}>{viewLabels[p.view]||p.view||"FRONT"} · {p.decType||""}</div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 16px"}}>
                          {[["Artwork",p.artName||(art?.name.replace(/\.[^.]+$/,"")||"")],p.specWidth&&["Art Width",p.specWidth+'"'],p.specFromCollar&&["From Collar",p.specFromCollar+'"'],p.colours&&["Colours",p.colours],["Position",`x:${Math.round(p.x*100)}%  y:${Math.round(p.y*100)}%  scale:${Math.round(p.scale)}%`]].filter(Boolean).map(([k,v],ki)=>(
                            <div key={ki} style={{display:"contents"}}><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",color:"#aaa"}}>{k}</span><span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",fontWeight:500}}>{v}</span></div>
                          ))}
                        </div>
                        {p.notes&&<div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".76rem",color:"#666",fontStyle:"italic",marginTop:8,paddingTop:8,borderTop:"1px solid #e8e2d8"}}>{p.notes}</div>}
                      </div>;
                    })}
                    <div><label style={S.lbl}>Revision notes (optional)</label><textarea style={S.ta} placeholder='e.g. "Make the back logo larger"' value={revisionNotes} onChange={e=>setRevisionNotes(e.target.value)}/></div>
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginTop:24,flexWrap:"wrap"}}>
                  <button style={S.btn("o")} onClick={()=>setStep(3)}>← Back</button>
                  {aiStatus==="done"&&<button style={S.btn()} onClick={()=>setStep(5)}>Fine-Tune →</button>}
                  {(aiStatus==="done"||aiStatus==="error")&&<button style={S.btn("o")} onClick={runAI}>↺ Re-run{revisionNotes?" with Changes":""}</button>}
                  <button style={S.btn("o")} onClick={()=>saveJob("draft")}>Save Draft</button>
                </div>
              </div>
            )}

            {step===5&&aiPlan.length>0&&(
              <FineTuneCanvas garments={garments} artwork={artwork} aiPlan={aiPlan} onConfirm={handleFineTuneConfirm} onBack={()=>setStep(4)}/>
            )}

            {step===6&&(
              <div>
                <div style={S.sec}><span style={S.secn}>06</span> Export</div>
                {saveStatus==="saved"&&<div style={S.note("s")}>✓ Job saved</div>}
                <div style={{background:"#111",display:"flex",alignItems:"center",justifyContent:"center",minHeight:400,padding:16,backgroundImage:"linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)",backgroundSize:"28px 28px"}}>
                  {!mockupBuilt&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",letterSpacing:".16em",textTransform:"uppercase",color:"#333"}}>Building...</span>}
                  <canvas ref={canvasRef} style={{display:mockupBuilt?"block":"none",maxWidth:"100%",boxShadow:"0 0 0 1px #2a2a2a,0 16px 48px rgba(0,0,0,.7)"}}/>
                </div>
                <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
                  <button style={S.btn()} onClick={exportPNG}>⬇ Client Mockup PNG</button>
                  <button style={S.btn()} onClick={exportJPG}>⬇ Client Mockup JPG</button>
                  <button style={S.btn()} onClick={exportWorkOrder}>⬇ Work Order PNG</button>
                  <button style={S.btn("g")} onClick={()=>saveJob("final")}>Save as Final</button>
                  <button style={S.btn("o")} onClick={()=>saveJob("draft")}>Save Draft</button>
                  <button style={S.btn("o")} onClick={()=>setStep(5)}>← Fine-Tune</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {toast&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#0f0f0f",color:"#f5f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".12em",textTransform:"uppercase",padding:"9px 18px",borderLeft:"3px solid #c8372d",zIndex:9999,whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );
}

// ── GARMENT LIBRARY MANAGER ──
function GarmentManager({ garmentList, onRefresh }) {
  const [form, setForm] = useState({brand:"Gildan",style_num:"",style_name:"",colour:"",colour_hex:"",front_url:"",back_url:"",sleeve_left_url:"",sleeve_right_url:"",photo_url:""});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const brands=["Gildan","Comfort Colors","Next Level","Bella+Canvas","Other..."];

  async function addGarment() {
    if(!form.style_name||!form.colour){setMsg("Style name and colour are required.");return;}
    if(!form.front_url&&!form.back_url){setMsg("Please add at least a front or back photo URL.");return;}
    setSaving(true);setMsg("");
    try{
      await sb("POST","/garments",form);
      setMsg("Garment added successfully ✓");
      setForm(f=>({...f,style_num:"",colour:"",colour_hex:"",front_url:"",back_url:"",sleeve_left_url:"",sleeve_right_url:"",photo_url:""}));
      onRefresh();
    }catch(e){setMsg("Error: "+e.message);}
    setSaving(false);
  }

  async function deleteGarment(id){
    if(!confirm("Remove this garment?"))return;
    try{await sb("DELETE",`/garments?id=eq.${id}`);onRefresh();}catch(e){}
    onRefresh();
  }

  const fldStyle={background:"#fff",border:"1px solid #d4cdc0",borderBottom:"2px solid #0f0f0f",padding:"7px 8px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".82rem",outline:"none",width:"100%",appearance:"none"};
  const lblStyle={fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#777",display:"block",marginBottom:3};

  return (
    <div>
      <div style={{background:"#fffdf8",border:"1px solid #d4cdc0",padding:"16px",marginBottom:16}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d",marginBottom:12}}>Add Garment to Library</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <label style={lblStyle}>Brand</label>
            <select style={fldStyle} value={form.brand} onChange={e=>{setForm(f=>({...f,brand:e.target.value==="Other..."?"":e.target.value}));if(e.target.value==="Other...")setCustomBrand("");}}>
              {brands.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            {(form.brand===""||!["Gildan","Comfort Colors","Next Level","Bella+Canvas"].includes(form.brand))&&(
              <input style={{...fldStyle,marginTop:6}} value={customBrand||form.brand} onChange={e=>{setCustomBrand(e.target.value);setForm(f=>({...f,brand:e.target.value}));}} placeholder="Type brand name..."/>
            )}
          </div>
          <div><label style={lblStyle}>Style # (optional)</label><input style={fldStyle} value={form.style_num} onChange={e=>setForm(f=>({...f,style_num:e.target.value}))} placeholder="e.g. 5000"/></div>
          <div><label style={lblStyle}>Style Name <span style={{color:"#c8372d"}}>*</span></label><input style={fldStyle} value={form.style_name} onChange={e=>setForm(f=>({...f,style_name:e.target.value}))} placeholder="e.g. Heavy Cotton Tee"/></div>
          <div><label style={lblStyle}>Colour Name <span style={{color:"#c8372d"}}>*</span></label><input style={fldStyle} value={form.colour} onChange={e=>setForm(f=>({...f,colour:e.target.value}))} placeholder="e.g. Sport Grey"/></div>
          <div><label style={lblStyle}>Front Photo URL</label><input style={fldStyle} value={form.front_url} onChange={e=>setForm(f=>({...f,front_url:e.target.value}))} placeholder="https://...supabase.co/.../front.jpg"/></div>
          <div><label style={lblStyle}>Back Photo URL</label><input style={fldStyle} value={form.back_url} onChange={e=>setForm(f=>({...f,back_url:e.target.value}))} placeholder="https://...supabase.co/.../back.jpg"/></div>
          <div><label style={lblStyle}>Left Sleeve URL</label><input style={fldStyle} value={form.sleeve_left_url} onChange={e=>setForm(f=>({...f,sleeve_left_url:e.target.value}))} placeholder="https://...supabase.co/.../sleeve-left.jpg"/></div>
          <div><label style={lblStyle}>Right Sleeve URL</label><input style={fldStyle} value={form.sleeve_right_url} onChange={e=>setForm(f=>({...f,sleeve_right_url:e.target.value}))} placeholder="https://...supabase.co/.../sleeve-right.jpg"/></div>
        </div>
        {msg&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".1em",textTransform:"uppercase",color:msg.includes("✓")?"#2a7a4b":"#c8372d",marginBottom:8,padding:"8px 10px",background:msg.includes("✓")?"#e6f4ec":"#fdf0ee",borderLeft:`3px solid ${msg.includes("✓")?"#2a7a4b":"#c8372d"}`}}>{msg}</div>}
        <button onClick={addGarment} disabled={saving} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".58rem",letterSpacing:".14em",textTransform:"uppercase",padding:"10px 20px",cursor:saving?"not-allowed":"pointer",border:"2px solid #0f0f0f",background:saving?"#555":"#0f0f0f",color:"#f5f0e8"}}>
          {saving?"Adding...":"+ Add to Library"}
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {garmentList.map(g=>(
          <div key={g.id} style={{background:"#fff",border:"1px solid #d4cdc0",padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
            {(g.front_url||g.back_url)&&<img src={g.front_url||g.back_url} style={{width:44,height:44,objectFit:"contain",background:"#f5f0e8"}} crossOrigin="anonymous" onError={e=>e.target.style.display="none"}/>}
            <div style={{flex:1}}>
              <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".88rem",fontWeight:500}}>{g.brand} {g.style_name}{g.style_num&&` (${g.style_num})`}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".08em",textTransform:"uppercase",color:"#aaa",marginTop:2}}>{g.colour}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:"#ccc",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
                {g.front_url&&<span>✓ Front</span>}
                {g.back_url&&<span>✓ Back</span>}
                {g.sleeve_left_url&&<span>✓ L Sleeve</span>}
                {g.sleeve_right_url&&<span>✓ R Sleeve</span>}
              </div>
            </div>
            <button onClick={()=>deleteGarment(g.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:".8rem",flexShrink:0}}>✕</button>
          </div>
        ))}
        {garmentList.length===0&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".1em",textTransform:"uppercase",color:"#bbb",padding:"10px 0"}}>No garments in library yet</div>}
      </div>
    </div>
  );
}

