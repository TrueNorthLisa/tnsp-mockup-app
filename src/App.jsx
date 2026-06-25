import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL||"").replace(/\/+$/,"").replace(/\/rest\/v1$/,"");
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
  if (!res.ok) throw new Error(`Supabase ${res.status} at ${url}: ${text.substring(0,300)}`);
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
  const [orderName, setOrderName] = useState("");
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
  const [sewOutImage, setSewOutImage] = useState(null); // {url, img} — bypasses full flow
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
  const cleanExportRef = useRef(null);

  useEffect(()=>{
    const link=document.createElement("link");link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  },[]);
  useEffect(()=>{ if(page==="jobs") loadJobs(); },[page]);
  useEffect(()=>{ loadGarmentList(); loadCustomers(); },[]);

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2800);}

  const [jobsError, setJobsError] = useState("");

  async function loadJobs(){
    setJobsLoading(true);
    setJobsError("");
    try{
      const d=await sb("GET","/jobs?select=*&source=eq.mockup");
      const all=Array.isArray(d)?d:[];
      setJobs(all.filter(j=>j.status!=="archived").sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0)));
    }catch(e){
      console.error("loadJobs error:",e);
      setJobsError(e.message);
      showToast("Jobs error: "+e.message.substring(0,80));
    }
    setJobsLoading(false);
  }

  async function archiveJob(id,e){e.stopPropagation();await sb("PATCH",`/jobs?id=eq.${id}`,{status:"archived"});setJobs(j=>j.filter(x=>x.id!==id));showToast("Job archived");}
  async function searchArchive(){
    if(!archiveSearch.trim())return;setArchiveSearching(true);
    try{const q=archiveSearch.trim();const d=await sb("GET",`/jobs?select=id,job_num,client,garment_style,garment_colour,status,due_date&source=eq.mockup&status=in.(final,archived)&or=(client.ilike.*${q}*,job_num.ilike.*${q}*)&limit=20`);setArchiveResults(Array.isArray(d)?d:[]);}
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
    setMockupBuilt(false);setSavedJobId(null);setSaveStatus("");setStep(1);setPage("builder");setSewOutImage(null);setOrderName("");setPrintRunName("");
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
        job_num:jobNum,order_name:orderName,client:cust.company||cust.contact_name,garment_style:`${selBrand} ${selStyle}`.trim(),garment_colour:selColour,
        status,due_date:dueDate||null,decoration_types:decTypes,special_instructions:specialInstructions,press_check:pressCheck,bold_print:boldPrint,vintage_print:vintagePrint,
        customer_id:custId,garment_id:garmentId,
        shipping_address:{address:cust.address,city:cust.city,province:cust.province,postal:cust.postal},
        placements,ai_plan:planOverride||aiPlan,sizes,garment_urls:garmentUrls,artwork_data:artData,
        sew_out_image:sewOutImage?.canvas?.toDataURL("image/jpeg",.8)||null,
        source:"mockup",
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
      setJobNum(j.job_num||"");setOrderName(j.order_name||"");setDueDate(j.due_date||"");setDecTypes(j.decoration_types||[]);setSpecialInstructions(j.special_instructions||"");setPressCheck(j.press_check||false);setBoldPrint(j.bold_print||false);setVintagePrint(j.vintage_print||false);
      // Restore customer mockup image if saved
      if(j.sew_out_image){
        const img=new Image(); img.onload=()=>{
          const canvas=document.createElement("canvas");
          canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
          canvas.getContext("2d").drawImage(img,0,0);
          setSewOutImage({url:j.sew_out_image,img,canvas});
        }; img.src=j.sew_out_image;
      } else { setSewOutImage(null); }
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
    const GAP=14;

    // Split into main row (front/back/other) and sleeve row (sleeve_left/sleeve_right)
    const mainViews=lv.filter(k=>!["sleeve_left","sleeve_right"].includes(k));
    const sleeveViews=lv.filter(k=>["sleeve_left","sleeve_right"].includes(k));
    const hasSleeveRow=sleeveViews.length>0;

    // Build canvases for each view
    const mainVCs=mainViews.map(k=>buildVC(k,plan,viewLabels[k]||k)).filter(Boolean);
    const sleeveVCs=sleeveViews.map(k=>buildVC(k,plan,viewLabels[k]||k,true)).filter(Boolean);

    const specW=400;
    const mainRowW=mainVCs.reduce((s,c)=>s+c.width,0)+(mainVCs.length-1)*GAP;
    const mainRowH=mainVCs.length?Math.max(...mainVCs.map(c=>c.height)):0;
    const sleeveRowW=sleeveVCs.reduce((s,c)=>s+c.width,0)+(sleeveVCs.length-1)*GAP;
    const sleeveRowH=sleeveVCs.length?Math.max(...sleeveVCs.map(c=>c.height)):0;

    const contentW=Math.max(mainRowW,sleeveRowW);
    const contentH=mainRowH+(hasSleeveRow?GAP+sleeveRowH:0);

    // Build clean garment-only canvas (used on work order page 2)
    const cleanComb=document.createElement("canvas");
    cleanComb.width=contentW; cleanComb.height=contentH;
    const cleanCC=cleanComb.getContext("2d");
    cleanCC.fillStyle="#ede8df"; cleanCC.fillRect(0,0,contentW,contentH);
    let xOff=0;
    mainVCs.forEach(vc=>{cleanCC.drawImage(vc,xOff,0);xOff+=vc.width+GAP;});
    if(hasSleeveRow){ xOff=0; sleeveVCs.forEach(vc=>{cleanCC.drawImage(vc,xOff,mainRowH+GAP);xOff+=vc.width+GAP;}); }

    // Build customer-facing mockup WITH spec sheet on the right
    const specC=buildSpec(contentH);
    const comb=document.createElement("canvas");
    comb.width=contentW+GAP+specC.width; comb.height=contentH;
    const cc=comb.getContext("2d");
    cc.fillStyle="#ede8df"; cc.fillRect(0,0,comb.width,comb.height);
    cc.drawImage(cleanComb,0,0);
    cc.drawImage(specC,contentW+GAP,0);

    // exportRef = customer version (with spec sheet) for PNG/JPG exports
    // cleanRef = garment-only version for work order page 2
    exportRef.current=comb;
    cleanExportRef.current=cleanComb;
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.width=comb.width;canvas.height=comb.height;
    canvas.getContext("2d").drawImage(comb,0,0);setMockupBuilt(true);
  }

  function buildVC(vk,plan,viewLabel,small=false){
    const activePlan=plan||aiPlan;
    const g=garments[vk];if(!g)return null;const img=g.img;
    const maxW=small?420:680;const maxH=small?500:800;
    const r=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
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
    const PW=500;const sc=document.createElement("canvas");sc.width=PW;sc.height=height;const sx=sc.getContext("2d");
    sx.fillStyle="#f5f0e8";sx.fillRect(0,0,PW,height);sx.fillStyle="#c8372d";sx.fillRect(0,0,4,height);
    sx.fillStyle="#0f0f0f";sx.fillRect(0,0,PW,80);
    sx.font="bold 28px Bebas Neue,sans-serif";sx.fillStyle="#f5f0e8";sx.fillText("TRUE NORTH",16,32);
    sx.font="12px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText("SCREEN PRINTING & EMBROIDERY",16,52);
    sx.font="11px IBM Plex Mono,monospace";sx.fillStyle="#888";sx.fillText("PLACEMENT SPECIFICATION SHEET",16,68);
    let y=96;
    const mr=(k,v)=>{sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#888";sx.fillText(k.toUpperCase(),16,y);sx.font="14px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(v||"",130,y);y+=20;};
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
      sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#888";sx.fillText("SIZE BREAKDOWN",16,y);
      const sstr=asSizes.map(s=>`${s}:${sizes[s].qty}`).join("  ");
      sx.font="12px IBM Plex Mono,monospace";sx.fillStyle="#0f0f0f";
      let line="";let ly=y;const words=sstr.split("  ");
      words.forEach(w=>{const t=line?line+"  "+w:w;if(sx.measureText(t).width>PW-30&&line){sx.fillText(line,16,ly+14);line=w;ly+=16;}else{line=t;}});
      if(line)sx.fillText(line,16,ly+14);y=ly+30;
    }
    if(specialInstructions)mr("Notes",specialInstructions.substring(0,80));
    y+=6;sx.fillStyle="#d4cdc0";sx.fillRect(16,y,PW-32,1);y+=16;
    aiPlan.forEach((p,i)=>{
      const ch=ehH(p)+20;
      sx.fillStyle="#fff";sx.fillRect(12,y-2,PW-24,ch+8);sx.strokeStyle="#e0dbd3";sx.lineWidth=1;sx.strokeRect(12,y-2,PW-24,ch+8);sx.fillStyle="#c8372d";sx.fillRect(12,y-2,4,ch+8);
      sx.font="bold 11px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText(`PLACEMENT ${i+1} — ${(viewLabels[p.view]||p.view||"FRONT").toUpperCase()}`,22,y+14);
      sx.font="bold 16px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(p.placement||"",22,y+32);
      if(p.decType){sx.fillStyle="rgba(200,55,45,.12)";const tw=sx.measureText(p.decType.toUpperCase()).width+12;sx.fillRect(22,y+36,tw,16);sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText(p.decType.toUpperCase(),28,y+48);}
      let ry=y+(p.decType?60:44);
      const sr=(k,v)=>{if(!v)return;sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#999";sx.fillText(k.toUpperCase(),22,ry);sx.font="13px IBM Plex Sans,sans-serif";sx.fillStyle="#222";const words=v.split(" ");let line="";const mw=PW-170;words.forEach(w=>{const t=line?line+" "+w:w;if(sx.measureText(t).width>mw&&line){sx.fillText(line,140,ry);line=w;ry+=16;}else{line=t;}});if(line)sx.fillText(line,140,ry);ry+=18;};
      if(p.artName)sr("Artwork",p.artName);if(p.specWidth)sr("Art Width",p.specWidth+'"');if(p.specFromCollar)sr("From Collar",p.specFromCollar+'"');if(p.colours)sr("Colours",p.colours);if(p.notes)sr("Notes",p.notes);
      y+=ch+18;
    });
    const fY=height-28;sx.fillStyle="#0f0f0f";sx.fillRect(0,fY,PW,28);
    sx.font="11px IBM Plex Mono,monospace";sx.fillStyle="#666";
    sx.fillText("truenorthscreenprinting.ca · Vancouver, BC",16,fY+18);
    sx.fillText(new Date().toLocaleDateString("en-CA"),PW-76,fY+18);
    return sc;
  }

  // Builds a customer-facing mockup combining the uploaded image + a spec panel
  function buildCustomerMockup(mockupImg){
    const PAD=16;
    const SP=480;          // wider panel — plenty of room for long colour strings
    const GAP=12;

    // Scale image to fit nicely beside the panel
    const maxImgW=Math.max(600, mockupImg.width);
    const scaleH=700/mockupImg.height;
    const scaleW=maxImgW/mockupImg.width;
    const sc=Math.min(scaleH,scaleW,1);
    const imgW=Math.round(mockupImg.width*sc);
    const imgH=Math.round(mockupImg.height*sc);
    const PH=Math.max(imgH,800);
    const PW=imgW+GAP+SP;

    const cc=document.createElement("canvas"); cc.width=PW; cc.height=PH;
    const cx=cc.getContext("2d");
    cx.fillStyle="#f5f0e8"; cx.fillRect(0,0,PW,PH);

    // Image — white background, centred vertically
    cx.fillStyle="#ffffff"; cx.fillRect(0,0,imgW,PH);
    const dyo=Math.round((PH-imgH)/2);
    cx.drawImage(mockupImg,0,dyo,imgW,imgH);

    // Panel
    const px=imgW+GAP;
    const textW=SP-PAD*2;  // usable text width — critical for wrapping
    cx.fillStyle="#f5f0e8"; cx.fillRect(px,0,SP,PH);
    cx.fillStyle="#c8372d"; cx.fillRect(px,0,4,PH);

    // Header
    cx.fillStyle="#0f0f0f"; cx.fillRect(px,0,SP,72);
    cx.font="bold 30px Bebas Neue,sans-serif"; cx.fillStyle="#f5f0e8";
    cx.fillText("TRUE NORTH",px+PAD,36);
    cx.font="bold 11px IBM Plex Mono,monospace"; cx.fillStyle="#c8372d";
    cx.fillText("SCREEN PRINTING & EMBROIDERY",px+PAD,54);
    cx.font="10px IBM Plex Mono,monospace"; cx.fillStyle="#666";
    cx.fillText("ORDER SPECIFICATION",px+PAD,68);

    let y=88;

    // Wraps text, returns updated y
    const wrap=(text,font,color,lineH)=>{
      cx.font=font; cx.fillStyle=color;
      const words=String(text).split(" "); let line="";
      words.forEach(w=>{
        const test=line?line+" "+w:w;
        if(cx.measureText(test).width>textW&&line){
          cx.fillText(line,px+PAD,y); line=w; y+=lineH;
        } else line=test;
      });
      if(line) cx.fillText(line,px+PAD,y);
      y+=lineH;
    };

    // Label + value field
    const field=(lbl,val)=>{
      if(!val||y>PH-48) return;
      cx.font="bold 10px IBM Plex Mono,monospace"; cx.fillStyle="#999";
      cx.fillText(lbl.toUpperCase(),px+PAD,y); y+=14;
      wrap(val,"14px IBM Plex Sans,sans-serif","#111",18);
      y+=4;
    };

    const ga=[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`].filter(Boolean).join(" ");
    field("Job #",jobNum);
    field("Client",cust.company||cust.contact_name||"");
    if(cust.contact_name&&cust.company) field("Contact",cust.contact_name);
    field("Garment",ga||"");
    field("Colour",selColour||"");
    if(dueDate) field("Due Date",new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"}));
    if(decTypes.length) field("Decoration",decTypes.join(", "));

    // Sizes
    const asSizes=ALL_SIZES.filter(s=>sizes[s]?.active&&sizes[s]?.qty);
    if(asSizes.length){
      const total=asSizes.reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0);
      y+=4; cx.fillStyle="#d4cdc0"; cx.fillRect(px+PAD,y,textW,1); y+=12;
      cx.font="bold 10px IBM Plex Mono,monospace"; cx.fillStyle="#999";
      cx.fillText("SIZE BREAKDOWN",px+PAD,y); y+=14;

      const rows=[asSizes.slice(0,6), asSizes.slice(6)].filter(r=>r.length);
      rows.forEach(row=>{
        const scw=Math.floor(textW/row.length);
        // Size labels
        cx.font="bold 12px IBM Plex Mono,monospace"; cx.fillStyle="#444";
        row.forEach((s,i)=>cx.fillText(s,px+PAD+i*scw,y)); y+=20;
        // Quantities
        cx.font="bold 24px IBM Plex Sans,sans-serif"; cx.fillStyle="#c8372d";
        row.forEach((s,i)=>cx.fillText(sizes[s].qty,px+PAD+i*scw,y)); y+=36;
      });

      cx.font="bold 12px IBM Plex Mono,monospace"; cx.fillStyle="#666";
      cx.fillText(`TOTAL: ${total} UNITS`,px+PAD,y); y+=26;
    }

    // Placements
    if(aiPlan.length){
      y+=8; cx.fillStyle="#d4cdc0"; cx.fillRect(px+PAD,y,textW,1); y+=16;
      cx.font="bold 10px IBM Plex Mono,monospace"; cx.fillStyle="#999";
      cx.fillText("PLACEMENTS",px+PAD,y); y+=20;

      const vl={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};

      aiPlan.forEach((p,i)=>{
        if(y>PH-60) return;

        // Placement name
        cx.font="bold 15px IBM Plex Sans,sans-serif"; cx.fillStyle="#0f0f0f";
        cx.fillText(`${i+1}. ${p.placement||""}`,px+PAD,y+14); y+=24;

        // View + dec type
        const tag=[(vl[p.view]||p.view||"Front").toUpperCase(),p.decType?.toUpperCase()].filter(Boolean).join("  ·  ");
        cx.font="bold 10px IBM Plex Mono,monospace"; cx.fillStyle="#c8372d";
        cx.fillText(tag,px+PAD,y); y+=20;

        // Ink colours — full wrap
        if(p.colours){
          cx.font="bold 10px IBM Plex Mono,monospace"; cx.fillStyle="#888";
          cx.fillText("INK / THREAD COLOURS",px+PAD,y); y+=16;
          wrap(p.colours,"13px IBM Plex Sans,sans-serif","#222",19);
          y+=4;
        }

        // Measurements on one line
        const specs=[p.specWidth&&`Width: ${p.specWidth}"`, p.specFromCollar&&`From Collar: ${p.specFromCollar}"`].filter(Boolean);
        if(specs.length){
          wrap(specs.join("     "),"11px IBM Plex Mono,monospace","#666",17);
          y+=4;
        }

        if(p.notes){
          wrap("Note: "+p.notes,"italic 12px IBM Plex Sans,sans-serif","#888",18);
        }

        y+=18;
      });
    }

    // Footer
    cx.fillStyle="#0f0f0f"; cx.fillRect(px,PH-26,SP,26);
    cx.font="10px IBM Plex Mono,monospace"; cx.fillStyle="#555";
    cx.fillText("truenorthscreenprinting.ca  ·  604-874-4488",px+PAD,PH-10);
    return cc;
  }

  function buildWorkOrder(){
    // Landscape 8.5×11" — 1056×816 base, printed at 96dpi fits perfectly on page
    const PW=1056, PH=816;
    const wc=document.createElement("canvas"); wc.width=PW; wc.height=PH;
    const wx=wc.getContext("2d");

    // Font helpers — all sizes relative to PH so nothing is tiny
    const F={
      xl:  s=>`bold ${Math.round(PH*s)}px Bebas Neue,sans-serif`,
      hd:  s=>`bold ${Math.round(PH*s)}px IBM Plex Mono,monospace`,
      body:s=>`${Math.round(PH*s)}px IBM Plex Sans,sans-serif`,
      mono:s=>`${Math.round(PH*s)}px IBM Plex Mono,monospace`,
      bld: s=>`bold ${Math.round(PH*s)}px IBM Plex Sans,sans-serif`,
    };
    const P=16; // base padding

    // ── BACKGROUND ──────────────────────────────────────────────────────────
    wx.fillStyle="#ffffff"; wx.fillRect(0,0,PW,PH);

    // ── HEADER (full width) ──────────────────────────────────────────────────
    const HDR=Math.round(PH*0.09);
    wx.fillStyle="#0f0f0f"; wx.fillRect(0,0,PW,HDR);
    wx.font=F.xl(0.068); wx.fillStyle="#f5f0e8";
    wx.fillText("TRUE NORTH",P,HDR*0.75);
    wx.font=F.mono(0.022); wx.fillStyle="#c8372d";
    wx.fillText("SCREEN PRINTING & EMBROIDERY  ·  PRODUCTION WORK ORDER",P,HDR*0.93);
    // Order name + due date in header
    wx.textAlign="right";
    if(orderName){
      wx.font=F.xl(0.048); wx.fillStyle="#f5f0e8";
      wx.fillText(orderName.toUpperCase(),PW-P,HDR*0.55);
    }
    // Due date — highlighted gold
    if(dueDate){
      const dueFmt=new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"});
      wx.font=F.hd(0.022); wx.fillStyle="#e8c547";
      wx.fillText(`DUE: ${dueFmt}`,PW-P,HDR*0.78);
    }
    wx.font=F.mono(0.015); wx.fillStyle="#555";
    wx.fillText(`JOB #${jobNum||"TBD"}  ·  ${new Date().toLocaleDateString("en-CA")}`,PW-P,HDR*0.94);
    wx.textAlign="left";
    wx.fillStyle="#c8372d"; wx.fillRect(0,HDR,PW,3);

    // Production flags
    let bodyY=HDR+3;
    if(pressCheck||boldPrint||vintagePrint){
      const FH=Math.round(PH*0.045);
      wx.fillStyle="#1a0000"; wx.fillRect(0,bodyY,PW,FH);
      let ft=""; if(pressCheck)ft+="⚠  PRESS CHECK REQUIRED     "; if(boldPrint)ft+="●  BOLD PRINT     "; if(vintagePrint)ft+="●  VINTAGE / DISTRESSED";
      wx.font=F.hd(0.026); wx.fillStyle=pressCheck?"#ff4444":"#f5f0e8";
      wx.fillText(ft.trim(),P,bodyY+FH*0.72); bodyY+=FH;
    }
    bodyY+=Math.round(PH*0.012);

    // ── CONTENT: Three columns top section ──────────────────────────────────
    const TOP_H=Math.round(PH*0.38);
    const totalW=PW-P*4;
    const cw0=Math.floor(totalW*0.38); // Customer — wider
    const cw1=Math.floor(totalW*0.30); // Garment
    const cw2=totalW-cw0-cw1;          // Sizes
    const cx0=P, cx1=P*2+cw0, cx2=P*3+cw0+cw1;

    // Helper: section header bar
    const secBar=(x,y,w,txt)=>{
      const bh=Math.round(PH*0.034);
      wx.fillStyle="#f0ede8"; wx.fillRect(x,y,w,bh);
      wx.fillStyle="#c8372d"; wx.fillRect(x,y,4,bh);
      wx.font=F.hd(0.021); wx.fillStyle="#0f0f0f";
      wx.fillText(txt,x+8,y+bh*0.74);
      return y+bh+Math.round(PH*0.012);
    };

    // Helper: label+value field
    const field=(x,y,w,lbl,val)=>{
      if(!val) return y;
      const lh=Math.round(PH*0.017); const vh=Math.round(PH*0.028); const gap=Math.round(PH*0.006);
      wx.font=F.hd(0.014); wx.fillStyle="#aaa"; wx.fillText(lbl.toUpperCase(),x,y+lh);
      wx.font=F.body(0.026); wx.fillStyle="#0f0f0f";
      // Wrap long values like shipping address onto 2 lines
      const maxW=w-8;
      if(wx.measureText(val).width>maxW){
        // Try to split at a comma or space near the middle
        const mid=Math.floor(val.length/2);
        let split=val.lastIndexOf(",",mid+10);
        if(split<0) split=val.lastIndexOf(" ",mid+10);
        if(split>0){
          const line1=val.slice(0,split).trim();
          const line2=val.slice(split+1).trim();
          wx.fillText(line1,x,y+lh+vh);
          wx.fillText(line2,x,y+lh+vh+Math.round(PH*0.026));
          return y+lh+vh+Math.round(PH*0.026)+gap+Math.round(PH*0.012);
        }
        let txt=val; while(wx.measureText(txt).width>maxW&&txt.length>3) txt=txt.slice(0,-2)+"…";
        wx.fillText(txt,x,y+lh+vh);
      } else {
        wx.fillText(val,x,y+lh+vh);
      }
      return y+lh+vh+gap+Math.round(PH*0.010);
    };

    // Col 0: Customer
    let y0=bodyY;
    y0=secBar(cx0,y0,cw0,"CUSTOMER");
    y0=field(cx0,y0,cw0,"Client",cust.company||cust.contact_name||"");
    y0=field(cx0,y0,cw0,"Contact",cust.contact_name||"");
    y0=field(cx0,y0,cw0,"Email",cust.email||"");
    y0=field(cx0,y0,cw0,"Phone",cust.phone||"");
    y0=field(cx0,y0,cw0,"Ship To",[cust.address,cust.city,cust.province,cust.postal].filter(Boolean).join(", ")||"");

    // Col 1: Garment
    let y1=bodyY;
    y1=secBar(cx1,y1,cw1,"GARMENT");
    y1=field(cx1,y1,cw1,"Brand / Style",[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`].filter(Boolean).join(" ")||"");
    y1=field(cx1,y1,cw1,"Colour",selColour||"");
    y1=field(cx1,y1,cw1,"Decoration",decTypes.join(", ")||"");
    if(specialInstructions) y1=field(cx1,y1,cw1,"Notes",specialInstructions.substring(0,55));

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL||"").replace(/\/+$/,"").replace(/\/rest\/v1$/,"");
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
  if (!res.ok) throw new Error(`Supabase ${res.status} at ${url}: ${text.substring(0,300)}`);
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
-e 
}
}
