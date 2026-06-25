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

// ── PLACEMENT DEFAULTS (used when entering fine-tune without AI) ──
const PLACEMENT_DEFAULTS = {
  "Left Chest":      {x:.65,y:.33,scale:18},
  "Right Chest":     {x:.32,y:.33,scale:18},
  "Centre Front":    {x:.50,y:.38,scale:26},
  "Full Front":      {x:.50,y:.45,scale:54},
  "Centre Back":     {x:.50,y:.30,scale:26},
  "Full Back":       {x:.50,y:.38,scale:56},
  "Sleeve — Left":   {x:.50,y:.40,scale:11},
  "Sleeve — Right":  {x:.50,y:.40,scale:11},
  "Neck / Collar":   {x:.50,y:.18,scale:12},
  "Left Hip":        {x:.65,y:.68,scale:14},
  "Right Hip":       {x:.32,y:.68,scale:14},
  "Shoulder":        {x:.50,y:.14,scale:10},
  "Custom":          {x:.50,y:.40,scale:24},
};

// ── FINE-TUNE CANVAS ──
// FT_W / FT_H are the canonical fine-tune canvas dimensions.
// These are stored on each plan entry as _ftW/_ftH so buildVC can
// render at the correct scale regardless of its own canvas size.
const FT_W = 640;
const FT_H = 750;

function FineTuneCanvas({ garments, artwork, plan, onConfirm, onBack }) {
  const loadedViews = ["front","back","sleeve_left","sleeve_right","other"].filter(k=>garments[k]);
  const viewLabels = { front:"Front", back:"Back", sleeve_left:"Left Sleeve", sleeve_right:"Right Sleeve", other:"Other" };
  const [viewKey, setViewKey] = useState(loadedViews[0]||"front");
  const [layers, setLayers] = useState(()=>plan.map((p,i)=>({
    id:i,
    placement: p.placement,
    view: normalizeView(p.view),
    artId: p.artId,
    x: p.x || PLACEMENT_DEFAULTS[p.placement]?.x || .5,
    y: p.y || PLACEMENT_DEFAULTS[p.placement]?.y || .4,
    scale: p.scale || PLACEMENT_DEFAULTS[p.placement]?.scale || 22,
    flipped: false,
    visible: true,
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
    const ctx=canvas.getContext("2d");
    const cw=canvas.width, ch=canvas.height;
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

  function gpt(e){
    const r=canvasRef.current.getBoundingClientRect();
    return{x:(e.clientX-r.left)*canvasRef.current.width/r.width,y:(e.clientY-r.top)*canvasRef.current.height/r.height};
  }
  function hitCorner(p,l){
    const art=artwork.find(a=>a.id==l.artId); if(!art) return false;
    const cw=canvasRef.current.width,ch=canvasRef.current.height;
    const aw=(l.scale/100)*cw,ah=aw*(art.img.naturalHeight/art.img.naturalWidth);
    const ax=l.x*cw,ay=l.y*ch;
    return [[-aw/2-4,-ah/2-4],[aw/2+4,-ah/2-4],[-aw/2-4,ah/2+4],[aw/2+4,ah/2+4]]
      .some(([hx,hy])=>Math.abs(p.x-(ax+hx))<12&&Math.abs(p.y-(ay+hy))<12);
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
    if(selected!==null){
      const sel=layers.find(l=>l.id===selected);
      if(sel&&sel.view===viewKey&&hitCorner(p,sel)){
        const cw=canvasRef.current.width,ch=canvasRef.current.height;
        const dist=Math.sqrt((p.x-sel.x*cw)**2+(p.y-sel.y*ch)**2);
        setResizing(true);setRsScale(sel.scale);setRsDist(dist);return;
      }
    }
    const vl=layers.filter(l=>l.view===viewKey&&l.visible).reverse();
    for(const l of vl){
      if(hitLayer(p,l)){
        setSelected(l.id);
        const cw=canvasRef.current.width,ch=canvasRef.current.height;
        setDragging(true);setDragOX(p.x-l.x*cw);setDragOY(p.y-l.y*ch);return;
      }
    }
    setSelected(null);
  }
  function onMM(e){
    const p=gpt(e);const cw=canvasRef.current.width,ch=canvasRef.current.height;
    if(resizing&&selected!==null){
      const sel=layers.find(l=>l.id===selected);if(!sel)return;
      const dist=Math.sqrt((p.x-sel.x*cw)**2+(p.y-sel.y*ch)**2);
      if(rsDist>0){const ns=Math.max(2,Math.min(200,rsScale*(dist/rsDist)));setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.round(ns)}:l));}
      return;
    }
    if(dragging&&selected!==null){
      setLayers(ls=>ls.map(l=>l.id===selected?{...l,x:Math.max(.05,Math.min(.95,(p.x-dragOX)/cw)),y:Math.max(.05,Math.min(.95,(p.y-dragOY)/ch))}:l));
    }
  }
  function onMU(){setDragging(false);setResizing(false);}
  function onWhl(e){
    e.preventDefault();if(selected===null)return;
    setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.max(2,Math.min(200,l.scale+(e.deltaY>0?-1:1)))}:l));
  }
  function nudge(dx,dy){
    if(selected===null)return;
    const cw=canvasRef.current?.width||FT_W,ch=canvasRef.current?.height||FT_H;
    setLayers(ls=>ls.map(l=>l.id===selected?{...l,x:Math.max(.05,Math.min(.95,l.x+dx/cw)),y:Math.max(.05,Math.min(.95,l.y+dy/ch))}:l));
  }
  function scaleStep(d){
    if(selected===null)return;
    setLayers(ls=>ls.map(l=>l.id===selected?{...l,scale:Math.max(2,Math.min(200,l.scale+d))}:l));
  }

  // KEY FIX: store _ftW so buildVC knows the reference canvas width for this scale value
  function handleConfirm(){
    const cw = canvasRef.current?.width || FT_W;
    const ch = canvasRef.current?.height || FT_H;
    onConfirm(plan.map((p,i)=>{
      const l=layers.find(l=>l.id===i);
      return l ? {...p, x:l.x, y:l.y, scale:l.scale, flipped:l.flipped, _ftW:cw, _ftH:ch} : p;
    }));
  }

  const selL=selected!==null?layers.find(l=>l.id===selected):null;

  return (
    <div>
      <div style={S.sec}><span style={S.secn}>03</span> Fine-Tune Placements</div>
      <div style={S.note("i")}>Drag artwork to reposition · Drag corner handles to resize · Scroll to scale</div>
      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          {loadedViews.length>1&&(
            <div style={{display:"flex",gap:0,marginBottom:10,border:"1px solid #d4cdc0",width:"fit-content",flexWrap:"wrap"}}>
              {loadedViews.map(v=>(
                <button key={v} onClick={()=>setViewKey(v)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".12em",textTransform:"uppercase",padding:"7px 16px",background:viewKey===v?"#0f0f0f":"transparent",color:viewKey===v?"#f5f0e8":"#888",border:"none",borderRight:"1px solid #d4cdc0",cursor:"pointer"}}>
                  {viewLabels[v]||v}
                </button>
              ))}
            </div>
          )}
          <div style={{background:"#111",lineHeight:0}}>
            <canvas
              ref={canvasRef}
              width={FT_W}
              height={FT_H}
              style={{maxWidth:"100%",cursor:dragging?"grabbing":resizing?"nwse-resize":"default",display:"block"}}
              onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWhl}
            />
          </div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {[["←",-4,0],["→",4,0],["↑",0,-4],["↓",0,4]].map(([l,dx,dy])=>(
              <button key={l} onClick={()=>nudge(dx,dy)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>{l}</button>
            ))}
            <button onClick={()=>scaleStep(-1)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>− Size</button>
            <button onClick={()=>scaleStep(1)} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>+ Size</button>
            <button onClick={()=>{if(selected!==null)setLayers(ls=>ls.map(l=>l.id===selected?{...l,flipped:!l.flipped}:l));}} style={{...S.btn("o"),padding:"7px 14px",fontSize:".7rem"}}>⇆ Flip</button>
          </div>
        </div>
        <div style={{width:210,flexShrink:0}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Placements</div>
          {layers.map(l=>{
            const art=artwork.find(a=>a.id==l.artId);const isSel=l.id===selected;
            return (
              <div key={l.id} onClick={()=>{setSelected(l.id);setViewKey(l.view);}} style={{background:isSel?"#0f0f0f":"#fff",border:`1px solid ${isSel?"#c8372d":"#d4cdc0"}`,borderLeft:`3px solid ${isSel?"#c8372d":"#d4cdc0"}`,padding:"8px 10px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                {art&&<img src={art.dataURL} style={{width:28,height:28,objectFit:"contain",background:"#f5f0e8",padding:2,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".08em",textTransform:"uppercase",color:isSel?"#f5f0e8":"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.placement}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:isSel?"#aaa":"#bbb",marginTop:2}}>{(viewLabels[l.view]||l.view).toUpperCase()} · {Math.round(l.scale)}%</div>
                </div>
                <button onClick={e=>{e.stopPropagation();setLayers(ls=>ls.map(x=>x.id===l.id?{...x,visible:!x.visible}:x));}} style={{background:"none",border:"none",color:isSel?"#aaa":"#ccc",fontSize:".72rem",cursor:"pointer",padding:2}}>{l.visible?"👁":"🚫"}</button>
              </div>
            );
          })}
          {selL&&(
            <div style={{marginTop:12,background:"#fff",border:"1px solid #d4cdc0",padding:"10px 12px"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",color:"#c8372d",marginBottom:8}}>Selected</div>
              {[["X",Math.round(selL.x*100)+"%"],["Y",Math.round(selL.y*100)+"%"],["Scale",Math.round(selL.scale)+"%"],["View",(viewLabels[selL.view]||selL.view)]].map(([k,v])=>(
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
        <button style={S.btn("o")} onClick={onBack}>← Back to Placements</button>
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

// ── MAIN APP ──
export default function App() {
  const [page, setPage] = useState("jobs");
  const [jobNum, setJobNum] = useState("");
  const [orderName, setOrderName] = useState("");
  const [printRunName, setPrintRunName] = useState("");
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
  const [garments, setGarments] = useState({front:null,back:null,sleeve_left:null,sleeve_right:null,other:null});
  const [sizes, setSizes] = useState(emptySizes());
  const [artwork, setArtwork] = useState([]);
  const [artCounter, setArtCounter] = useState(1);
  const [placements, setPlacements] = useState([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);
  const [rowCounter, setRowCounter] = useState(2);
  // plan = the confirmed fine-tuned placement data (replaces aiPlan)
  const [plan, setPlan] = useState([]);
  const [mockupBuilt, setMockupBuilt] = useState(false);
  const [sewOutImage, setSewOutImage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveResults, setArchiveResults] = useState([]);
  const [archiveSearching, setArchiveSearching] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [savedJobId, setSavedJobId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [toast, setToast] = useState("");
  // Steps: 1=job info, 2=placements+artwork, 3=fine-tune, 4=export
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

  async function loadJobs(){
    setJobsLoading(true);setJobsError("");
    try{
      const d=await sb("GET","/jobs?select=*&source=eq.mockup");
      const all=Array.isArray(d)?d:[];
      setJobs(all.filter(j=>j.status!=="archived").sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0)));
    }catch(e){console.error("loadJobs error:",e);setJobsError(e.message);showToast("Jobs error: "+e.message.substring(0,80));}
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
    setJobNum("");setOrderName("");setPrintRunName("");setDueDate("");setDecTypes([]);setSpecialInstructions("");setPressCheck(false);setBoldPrint(false);setVintagePrint(false);
    setCustId(null);setCustSearch("");setCust({company:"",contact_name:"",email:"",phone:"",address:"",city:"",province:"BC",postal:""});
    setSelBrand("");setSelStyle("");setSelStyleNum("");setSelColour("");setGarmentId(null);
    setGarments({front:null,back:null,sleeve_left:null,sleeve_right:null,other:null});setSizes(emptySizes());
    setArtwork([]);setArtCounter(1);
    setPlacements([{_id:1,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);setRowCounter(2);
    setPlan([]);setMockupBuilt(false);setSavedJobId(null);setSaveStatus("");
    setStep(1);setPage("builder");setSewOutImage(null);
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
      loadImg(g.photo_url,"other"),
    ]).then(()=>{setGarments({...newG});showToast("Garment loaded");});
  }

  function loadArtFiles(e){
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        const img=new Image();
        img.onload=()=>setArtwork(prev=>[...prev,{id:artCounter+prev.length,img,name:file.name,dataURL:ev.target.result}]);
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    setArtCounter(c=>c+e.target.files.length);e.target.value="";
  }
  function removeArt(id){setArtwork(a=>a.filter(x=>x.id!==id));}

  function addRow(){setPlacements(p=>[...p,{_id:rowCounter,view:"Front",placement:"Left Chest",artId:"",width:"",fromCollar:"",decType:"Screen Print",colours:"",notes:""}]);setRowCounter(c=>c+1);}
  function removeRow(id){setPlacements(p=>p.filter(x=>x._id!==id));}
  function updateRow(id,key,val){setPlacements(p=>p.map(x=>x._id===id?{...x,[key]:val}:x));}

  // Build the default plan from placements when entering fine-tune (no AI)
  function buildDefaultPlan(){
    return placements.map(p=>{
      const art=artwork.find(a=>a.id==p.artId);
      const def=PLACEMENT_DEFAULTS[p.placement]||{x:.50,y:.40,scale:22};
      return {
        placement: p.placement,
        view: normalizeView(p.view),
        artId: p.artId,
        artName: art?.name.replace(/\.[^.]+$/,"")||"",
        x: def.x, y: def.y, scale: def.scale,
        decType: p.decType,
        colours: p.colours,
        specWidth: p.width,
        specFromCollar: p.fromCollar,
        notes: p.notes,
        _ftW: FT_W,
        _ftH: FT_H,
      };
    });
  }

  function goToFineTune(){
    if(!garments.front&&!garments.back){showToast("Please load a garment first.");return;}
    if(!placements.length){showToast("Please add at least one placement.");return;}
    // If we already have a confirmed plan, use it; otherwise build defaults
    if(!plan.length) setPlan(buildDefaultPlan());
    setStep(3);
  }

  function handleFineTuneConfirm(confirmedPlan){
    setPlan(confirmedPlan);
    setStep(4);
    setTimeout(()=>renderMockup(confirmedPlan),150);
  }

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
      const activePlan=planOverride||plan;
      const payload={
        job_num:jobNum,order_name:orderName,client:cust.company||cust.contact_name,garment_style:`${selBrand} ${selStyle}`.trim(),garment_colour:selColour,
        status,due_date:dueDate||null,decoration_types:decTypes,special_instructions:specialInstructions,press_check:pressCheck,bold_print:boldPrint,vintage_print:vintagePrint,
        customer_id:custId,garment_id:garmentId,
        shipping_address:{address:cust.address,city:cust.city,province:cust.province,postal:cust.postal},
        placements,ai_plan:activePlan,sizes,garment_urls:garmentUrls,artwork_data:artData,
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
      setJobNum(j.job_num||"");setOrderName(j.order_name||"");setPrintRunName("");setDueDate(j.due_date||"");
      setDecTypes(j.decoration_types||[]);setSpecialInstructions(j.special_instructions||"");
      setPressCheck(j.press_check||false);setBoldPrint(j.bold_print||false);setVintagePrint(j.vintage_print||false);
      if(j.sew_out_image){
        const img=new Image();img.onload=()=>{const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.getContext("2d").drawImage(img,0,0);setSewOutImage({url:j.sew_out_image,img,canvas});};img.src=j.sew_out_image;
      }else{setSewOutImage(null);}
      setSavedJobId(j.id);setSaveStatus("saved");setPlacements(j.placements||[]);
      const loadedPlan=j.ai_plan||[];
      // Ensure _ftW is set on loaded plans (backcompat: old saves won't have it)
      setPlan(loadedPlan.map(p=>({...p,_ftW:p._ftW||FT_W,_ftH:p._ftH||FT_H})));
      setSizes(j.sizes||emptySizes());
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
      const targetStep=(j.status==="final"||j.status==="archived")&&loadedPlan.length?4:1;
      setStep(targetStep);setPage("builder");
      if(targetStep===4)setTimeout(()=>renderMockup(loadedPlan),300);
      showToast("Job loaded");
    }catch(e){showToast("Could not load job: "+e.message);}
  }

  // ── RENDER MOCKUP ──
  // KEY FIX: buildVC now reads p._ftW to reproduce the correct scale
  // regardless of the export canvas size.
  function renderMockup(planOverride){
    const activePlan=planOverride||plan;
    const orderedViews=["front","back","sleeve_left","sleeve_right","other"];
    const lv=orderedViews.filter(k=>garments[k]);
    if(!lv.length)return;
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
    const GAP=14;
    const mainViews=lv.filter(k=>!["sleeve_left","sleeve_right"].includes(k));
    const sleeveViews=lv.filter(k=>["sleeve_left","sleeve_right"].includes(k));
    const hasSleeveRow=sleeveViews.length>0;
    const mainVCs=mainViews.map(k=>buildVC(k,activePlan,viewLabels[k]||k)).filter(Boolean);
    const sleeveVCs=sleeveViews.map(k=>buildVC(k,activePlan,viewLabels[k]||k,true)).filter(Boolean);
    const mainRowW=mainVCs.reduce((s,c)=>s+c.width,0)+(mainVCs.length-1)*GAP;
    const mainRowH=mainVCs.length?Math.max(...mainVCs.map(c=>c.height)):0;
    const sleeveRowW=sleeveVCs.reduce((s,c)=>s+c.width,0)+(sleeveVCs.length-1)*GAP;
    const contentW=Math.max(mainRowW,sleeveRowW);
    const sleeveRowH=sleeveVCs.length?Math.max(...sleeveVCs.map(c=>c.height)):0;
    const contentH=mainRowH+(hasSleeveRow?GAP+sleeveRowH:0);
    const cleanComb=document.createElement("canvas");
    cleanComb.width=contentW;cleanComb.height=contentH; // garment canvas stays at garment height
    const cleanCC=cleanComb.getContext("2d");
    cleanCC.fillStyle="#ede8df";cleanCC.fillRect(0,0,contentW,contentH);
    let xOff=0;
    mainVCs.forEach(vc=>{cleanCC.drawImage(vc,xOff,0);xOff+=vc.width+GAP;});
    if(hasSleeveRow){xOff=0;sleeveVCs.forEach(vc=>{cleanCC.drawImage(vc,xOff,mainRowH+GAP);xOff+=vc.width+GAP;});}
    const specC=buildSpec(activePlan,contentH);
    // specC calculates its own height — use whichever is taller for the combined canvas
    const totalH=Math.max(contentH,specC.height);
    const comb=document.createElement("canvas");
    comb.width=contentW+GAP+specC.width;comb.height=totalH;
    const cc=comb.getContext("2d");
    cc.fillStyle="#ede8df";cc.fillRect(0,0,comb.width,totalH);
    cc.drawImage(cleanComb,0,0);
    cc.drawImage(specC,contentW+GAP,0);
    exportRef.current=comb;
    cleanExportRef.current=cleanComb;
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.width=comb.width;canvas.height=comb.height;
    canvas.getContext("2d").drawImage(comb,0,0);
    setMockupBuilt(true);
  }

  function buildVC(vk, activePlan, viewLabel, small=false){
    const g=garments[vk];if(!g)return null;
    const img=g.img;
    const maxW=small?420:680;const maxH=small?500:800;
    const r=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
    const vw=Math.round(img.naturalWidth*r),vh=Math.round(img.naturalHeight*r);
    const vc=document.createElement("canvas");vc.width=vw;vc.height=vh;
    const vx=vc.getContext("2d");
    vx.fillStyle="#fff";vx.fillRect(0,0,vw,vh);vx.drawImage(img,0,0,vw,vh);
    activePlan.filter(p=>normalizeView(p.view)===vk).forEach(p=>{
      const art=artwork.find(a=>a.id==p.artId);if(!art)return;
      // Use the fine-tune canvas dimensions as the reference for both scale AND position.
      // p.x and p.y are fractions of the fine-tune canvas — we convert them to
      // fractions of the garment image by scaling through the ft canvas aspect ratio,
      // then apply to the export canvas. This keeps placement identical to fine-tune.
      const refW = p._ftW || FT_W;
      const refH = p._ftH || FT_H;
      // Scale: artwork pixel width = (scale% of refW), then scale proportionally to vw
      const aw = (Math.max(2,Math.min(200,p.scale||22))/100) * vw * (refW/refW);
      const ah = aw*(art.img.naturalHeight/art.img.naturalWidth);
      // Position: convert ft-canvas pixel position → fraction → export canvas pixel
      const ax = (p.x||.5) * vw;
      const ay = (p.y||.4) * (vw / refW * refH); // keep aspect-ratio-correct y
      // Clamp so artwork never goes off canvas
      const clampedAy = Math.min(ay, vh - ah/2 - 4);
      vx.save();
      vx.translate(ax, clampedAy);
      if(p.flipped) vx.scale(-1,1);
      vx.drawImage(art.img,-aw/2,-ah/2,aw,ah);
      vx.restore();
    });
    const fs=Math.max(10,vw*.018);
    vx.fillStyle="rgba(0,0,0,.5)";vx.fillRect(0,0,vw,fs*1.8);
    vx.font=`500 ${fs*.88}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(245,240,232,.9)";
    vx.fillText((viewLabel||vk).toUpperCase()+" VIEW",10,fs*1.3);
    vx.fillStyle="rgba(0,0,0,.38)";vx.fillRect(0,vh-fs*2.8,vw,fs*2.8);
    vx.font=`500 ${fs*.9}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(245,240,232,.82)";
    vx.fillText("TRUE NORTH SCREEN PRINTING",10,vh-fs*1.75);
    vx.font=`${fs*.74}px IBM Plex Mono,monospace`;vx.fillStyle="rgba(200,55,45,.85)";
    const meta=[jobNum&&"JOB #"+jobNum,cust.company&&cust.company.toUpperCase()].filter(Boolean).join("  .  ");
    if(meta)vx.fillText(meta,10,vh-fs*.78);
    return vc;
  }

  function ehH(p){
    let h=p.decType?76:56;
    if(p.artName)h+=20;if(p.specWidth)h+=20;if(p.specFromCollar)h+=20;if(p.colours)h+=20;if(p.notes)h+=20;
    return h;
  }

  function buildSpec(activePlan, contentH){
    const PW=500;
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};

    // ── PASS 1: calculate how tall the spec panel needs to be ──
    let neededH = 96; // header + top padding
    // Meta rows: each is 20px
    const metaRows = [
      jobNum, cust.company, cust.contact_name, cust.email, cust.phone,
      [selBrand,selStyle,selStyleNum&&`(${selStyleNum})`,selColour].filter(Boolean).join(" "),
      dueDate, decTypes.length?decTypes.join(", "):null,
      (pressCheck||boldPrint||vintagePrint)?"flags":null,
      Object.entries(garments).filter(([,v])=>v).length?"views":null,
    ].filter(Boolean);
    neededH += metaRows.length * 20;
    const asSizes=ALL_SIZES.filter(s=>sizes[s]?.active&&sizes[s]?.qty);
    if(asSizes.length){ neededH += 20; neededH += 30; } // total units + size row
    if(specialInstructions) neededH += 20;
    neededH += 22; // divider + gap
    activePlan.forEach(p=>{ neededH += ehH(p) + 20 + 18; });
    neededH += 48; // footer
    // The spec panel must be at least as tall as the garment canvas beside it
    const height = Math.max(neededH, contentH);

    // ── PASS 2: draw ──
    const sc=document.createElement("canvas");sc.width=PW;sc.height=height;
    const sx=sc.getContext("2d");
    sx.fillStyle="#f5f0e8";sx.fillRect(0,0,PW,height);
    sx.fillStyle="#c8372d";sx.fillRect(0,0,4,height);
    sx.fillStyle="#0f0f0f";sx.fillRect(0,0,PW,80);
    sx.font="bold 28px Bebas Neue,sans-serif";sx.fillStyle="#f5f0e8";sx.fillText("TRUE NORTH",16,32);
    sx.font="12px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";sx.fillText("SCREEN PRINTING & EMBROIDERY",16,52);
    sx.font="11px IBM Plex Mono,monospace";sx.fillStyle="#888";sx.fillText("PLACEMENT SPECIFICATION SHEET",16,68);
    let y=96;
    const mr=(k,v)=>{sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#888";sx.fillText(k.toUpperCase(),16,y);sx.font="14px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(v||"",130,y);y+=20;};
    if(jobNum)mr("Job #",jobNum);
    if(cust.company)mr("Client",cust.company);
    if(cust.contact_name)mr("Contact",cust.contact_name);
    if(cust.email)mr("Email",cust.email);
    if(cust.phone)mr("Phone",cust.phone);
    const ga=[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`,selColour].filter(Boolean).join(" ");if(ga)mr("Garment",ga);
    if(dueDate)mr("Due Date",new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"}));
    if(decTypes.length)mr("Decoration",decTypes.join(", "));
    const flags=[];if(pressCheck)flags.push("PRESS CHECK REQUIRED");if(boldPrint)flags.push("BOLD PRINT");if(vintagePrint)flags.push("VINTAGE / DISTRESSED");
    if(flags.length)mr("Print Options",flags.join("  |  "));
    const lv=Object.entries(garments).filter(([,v])=>v).map(([k])=>viewLabels[k]||k);
    if(lv.length)mr("Views",lv.join(" + "));
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
    activePlan.forEach((p,i)=>{
      const ch=ehH(p)+20;
      sx.fillStyle="#fff";sx.fillRect(12,y-2,PW-24,ch+8);
      sx.strokeStyle="#e0dbd3";sx.lineWidth=1;sx.strokeRect(12,y-2,PW-24,ch+8);
      sx.fillStyle="#c8372d";sx.fillRect(12,y-2,4,ch+8);
      sx.font="bold 11px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";
      sx.fillText(`PLACEMENT ${i+1} — ${(viewLabels[p.view]||p.view||"FRONT").toUpperCase()}`,22,y+14);
      sx.font="bold 16px IBM Plex Sans,sans-serif";sx.fillStyle="#0f0f0f";sx.fillText(p.placement||"",22,y+32);
      if(p.decType){
        sx.fillStyle="rgba(200,55,45,.12)";
        const tw=sx.measureText(p.decType.toUpperCase()).width+12;
        sx.fillRect(22,y+36,tw,16);
        sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#c8372d";
        sx.fillText(p.decType.toUpperCase(),28,y+48);
      }
      let ry=y+(p.decType?60:44);
      const sr=(k,v)=>{
        if(!v)return;
        sx.font="bold 10px IBM Plex Mono,monospace";sx.fillStyle="#999";sx.fillText(k.toUpperCase(),22,ry);
        sx.font="13px IBM Plex Sans,sans-serif";sx.fillStyle="#222";
        const words=v.split(" ");let line="";const mw=PW-170;
        words.forEach(w=>{const t=line?line+" "+w:w;if(sx.measureText(t).width>mw&&line){sx.fillText(line,140,ry);line=w;ry+=16;}else{line=t;}});
        if(line)sx.fillText(line,140,ry);ry+=18;
      };
      if(p.artName)sr("Artwork",p.artName);
      if(p.specWidth)sr("Art Width",p.specWidth+'"');
      if(p.specFromCollar)sr("From Collar",p.specFromCollar+'"');
      if(p.colours)sr("Colours",p.colours);
      if(p.notes)sr("Notes",p.notes);
      y+=ch+18;
    });
    // Footer always at the actual bottom of the canvas
    const fY=height-28;
    sx.fillStyle="#0f0f0f";sx.fillRect(0,fY,PW,28);
    sx.font="11px IBM Plex Mono,monospace";sx.fillStyle="#666";
    sx.fillText("truenorthscreenprinting.ca · Vancouver, BC",16,fY+18);
    sx.fillText(new Date().toLocaleDateString("en-CA"),PW-76,fY+18);
    return sc;
  }

  function buildWorkOrder(){
    const PW=1056,PH=816;
    const wc=document.createElement("canvas");wc.width=PW;wc.height=PH;
    const wx=wc.getContext("2d");
    const F={
      xl:  s=>`bold ${Math.round(PH*s)}px Bebas Neue,sans-serif`,
      hd:  s=>`bold ${Math.round(PH*s)}px IBM Plex Mono,monospace`,
      body:s=>`${Math.round(PH*s)}px IBM Plex Sans,sans-serif`,
      mono:s=>`${Math.round(PH*s)}px IBM Plex Mono,monospace`,
      bld: s=>`bold ${Math.round(PH*s)}px IBM Plex Sans,sans-serif`,
    };
    const P=16;
    wx.fillStyle="#ffffff";wx.fillRect(0,0,PW,PH);
    const HDR=Math.round(PH*0.09);
    wx.fillStyle="#0f0f0f";wx.fillRect(0,0,PW,HDR);
    wx.font=F.xl(0.068);wx.fillStyle="#f5f0e8";wx.fillText("TRUE NORTH",P,HDR*0.75);
    wx.font=F.mono(0.022);wx.fillStyle="#c8372d";wx.fillText("SCREEN PRINTING & EMBROIDERY  ·  PRODUCTION WORK ORDER",P,HDR*0.93);
    wx.textAlign="right";
    if(orderName){wx.font=F.xl(0.048);wx.fillStyle="#f5f0e8";wx.fillText(orderName.toUpperCase(),PW-P,HDR*0.55);}
    if(dueDate){const dueFmt=new Date(dueDate+"T00:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"});wx.font=F.hd(0.022);wx.fillStyle="#e8c547";wx.fillText(`DUE: ${dueFmt}`,PW-P,HDR*0.78);}
    wx.font=F.mono(0.015);wx.fillStyle="#555";wx.fillText(`JOB #${jobNum||"TBD"}  ·  ${new Date().toLocaleDateString("en-CA")}`,PW-P,HDR*0.94);
    wx.textAlign="left";wx.fillStyle="#c8372d";wx.fillRect(0,HDR,PW,3);
    let bodyY=HDR+3;
    if(pressCheck||boldPrint||vintagePrint){
      const FH=Math.round(PH*0.045);
      wx.fillStyle="#1a0000";wx.fillRect(0,bodyY,PW,FH);
      let ft="";if(pressCheck)ft+="⚠  PRESS CHECK REQUIRED     ";if(boldPrint)ft+="●  BOLD PRINT     ";if(vintagePrint)ft+="●  VINTAGE / DISTRESSED";
      wx.font=F.hd(0.026);wx.fillStyle=pressCheck?"#ff4444":"#f5f0e8";wx.fillText(ft.trim(),P,bodyY+FH*0.72);bodyY+=FH;
    }
    bodyY+=Math.round(PH*0.012);
    const totalW=PW-P*4;
    const cw0=Math.floor(totalW*0.38);const cw1=Math.floor(totalW*0.30);const cw2=totalW-cw0-cw1;
    const cx0=P,cx1=P*2+cw0,cx2=P*3+cw0+cw1;
    const secBar=(x,y,w,txt)=>{
      const bh=Math.round(PH*0.034);wx.fillStyle="#f0ede8";wx.fillRect(x,y,w,bh);wx.fillStyle="#c8372d";wx.fillRect(x,y,4,bh);
      wx.font=F.hd(0.021);wx.fillStyle="#0f0f0f";wx.fillText(txt,x+8,y+bh*0.74);return y+bh+Math.round(PH*0.012);
    };
    const field=(x,y,w,lbl,val)=>{
      if(!val)return y;
      const lh=Math.round(PH*0.017);const vh=Math.round(PH*0.028);const gap=Math.round(PH*0.006);
      wx.font=F.hd(0.014);wx.fillStyle="#aaa";wx.fillText(lbl.toUpperCase(),x,y+lh);
      wx.font=F.body(0.026);wx.fillStyle="#0f0f0f";
      const maxW=w-8;
      if(wx.measureText(val).width>maxW){
        const mid=Math.floor(val.length/2);let split=val.lastIndexOf(",",mid+10);
        if(split<0)split=val.lastIndexOf(" ",mid+10);
        if(split>0){const line1=val.slice(0,split).trim();const line2=val.slice(split+1).trim();wx.fillText(line1,x,y+lh+vh);wx.fillText(line2,x,y+lh+vh+Math.round(PH*0.026));return y+lh+vh+Math.round(PH*0.026)+gap+Math.round(PH*0.012);}
        let txt=val;while(wx.measureText(txt).width>maxW&&txt.length>3)txt=txt.slice(0,-2)+"…";wx.fillText(txt,x,y+lh+vh);
      }else{wx.fillText(val,x,y+lh+vh);}
      return y+lh+vh+gap+Math.round(PH*0.010);
    };
    let y0=bodyY;
    y0=secBar(cx0,y0,cw0,"CUSTOMER");
    y0=field(cx0,y0,cw0,"Client",cust.company||cust.contact_name||"");
    y0=field(cx0,y0,cw0,"Contact",cust.contact_name||"");
    y0=field(cx0,y0,cw0,"Email",cust.email||"");
    y0=field(cx0,y0,cw0,"Phone",cust.phone||"");
    y0=field(cx0,y0,cw0,"Ship To",[cust.address,cust.city,cust.province,cust.postal].filter(Boolean).join(", ")||"");
    let y1=bodyY;
    y1=secBar(cx1,y1,cw1,"GARMENT");
    y1=field(cx1,y1,cw1,"Brand / Style",[selBrand,selStyle,selStyleNum&&`(${selStyleNum})`].filter(Boolean).join(" ")||"");
    y1=field(cx1,y1,cw1,"Colour",selColour||"");
    y1=field(cx1,y1,cw1,"Decoration",decTypes.join(", ")||"");
    if(specialInstructions)y1=field(cx1,y1,cw1,"Notes",specialInstructions.substring(0,55));
    let y2=bodyY;
    y2=secBar(cx2,y2,cw2,"SIZES");
    const asSizes=ALL_SIZES.filter(s=>sizes[s]?.active&&sizes[s]?.qty);
    if(asSizes.length){
      const total=asSizes.reduce((sum,s)=>sum+(parseInt(sizes[s].qty)||0),0);
      y2=field(cx2,y2,cw2,"Total Units",String(total));
      const chunk=4;for(let i=0;i<asSizes.length;i+=chunk){
        const row=asSizes.slice(i,i+chunk);const scw=Math.floor(cw2/chunk);
        wx.font=F.hd(0.016);wx.fillStyle="#888";row.forEach((s,j)=>wx.fillText(s,cx2+j*scw,y2+14));y2+=18;
        wx.font=F.bld(0.030);wx.fillStyle="#c8372d";row.forEach((s,j)=>wx.fillText(sizes[s].qty,cx2+j*scw,y2+20));y2+=28;
      }
    }
    const divY=Math.max(y0,y1,y2)+Math.round(PH*0.02);
    wx.fillStyle="#d4cdc0";wx.fillRect(P,divY,PW-P*2,1);
    const botY=divY+Math.round(PH*0.014);
    const placW=Math.floor((PW-P*2-12*(plan.length-1||0))/Math.max(plan.length,1));
    const viewLabels={front:"Front",back:"Back",sleeve_left:"Left Sleeve",sleeve_right:"Right Sleeve",other:"Other"};
    plan.forEach((p,i)=>{
      const px=P+i*(placW+12);let py=botY;
      wx.fillStyle="#f5f0e8";wx.fillRect(px,py,placW,PH-botY-P);
      wx.fillStyle="#c8372d";wx.fillRect(px,py,3,PH-botY-P);
      py+=Math.round(PH*0.012);
      wx.font=F.mono(0.016);wx.fillStyle="#c8372d";wx.fillText(`${i+1} — ${(viewLabels[p.view]||p.view||"").toUpperCase()}`,px+8,py+12);py+=22;
      wx.font=F.bld(0.030);wx.fillStyle="#0f0f0f";wx.fillText(p.placement||"",px+8,py+22);py+=30;
      if(p.decType){wx.font=F.hd(0.017);wx.fillStyle="#666";wx.fillText(p.decType.toUpperCase(),px+8,py+14);py+=22;}
      if(p.colours){wx.font=F.mono(0.015);wx.fillStyle="#444";wx.fillText(p.colours.substring(0,30),px+8,py+14);py+=20;}
      if(p.specWidth){wx.font=F.mono(0.015);wx.fillStyle="#888";wx.fillText(`W: ${p.specWidth}"`,px+8,py+14);py+=18;}
      if(p.specFromCollar){wx.font=F.mono(0.015);wx.fillStyle="#888";wx.fillText(`FC: ${p.specFromCollar}"`,px+8,py+14);py+=18;}
      if(p.notes){wx.font=F.body(0.015);wx.fillStyle="#999";wx.fillText(p.notes.substring(0,40),px+8,py+14);}
    });
    if(cleanExportRef.current){
      const src=cleanExportRef.current;
      const maxH=Math.round(PH*0.28);const maxW=Math.round(PW*0.32);
      const sc=Math.min(maxW/src.width,maxH/src.height,1);
      const iw=Math.round(src.width*sc),ih=Math.round(src.height*sc);
      const ix=PW-P-iw,iy=PH-P-ih;
      wx.fillStyle="#fff";wx.fillRect(ix-2,iy-2,iw+4,ih+4);
      wx.drawImage(src,ix,iy,iw,ih);
    }
    const footY=PH-Math.round(PH*0.038);
    wx.fillStyle="#0f0f0f";wx.fillRect(0,footY,PW,PH-footY);
    wx.font=F.mono(0.016);wx.fillStyle="#555";wx.fillText("truenorthscreenprinting.ca  ·  604-874-4488  ·  Vancouver, BC",P,footY+(PH-footY)*0.65);
    wx.textAlign="right";wx.fillStyle="#666";wx.fillText(`JOB #${jobNum||"TBD"}  ·  ${new Date().toLocaleDateString("en-CA")}`,PW-P,footY+(PH-footY)*0.65);wx.textAlign="left";
    return wc;
  }

  function downloadCanvas(canvas,filename){
    const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download=filename;a.click();
  }

  // ── RENDER ──
  if(page==="garments"){
    return (
      <div style={S.body}>
        {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0f0f0f",color:"#f5f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",padding:"10px 20px",zIndex:999,border:"2px solid #c8372d"}}>{toast}</div>}
        <div style={S.header}>
          <div><div style={S.brand}>TRUE <span style={S.bspan}>NORTH</span></div><div style={S.bsub}>Screen Printing & Embroidery</div></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setPage("jobs")} style={S.btn("o")}>← Jobs</button>
          </div>
        </div>
        <div style={S.wrap}>
          <div style={S.sec}><span style={S.secn}>LIB</span> Garment Library</div>
          <GarmentManager garmentList={garmentList} onRefresh={loadGarmentList}/>
        </div>
      </div>
    );
  }

  if(page==="jobs"){
    return (
      <div style={S.body}>
        {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0f0f0f",color:"#f5f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",padding:"10px 20px",zIndex:999,border:"2px solid #c8372d"}}>{toast}</div>}
        <div style={S.header}>
          <div><div style={S.brand}>TRUE <span style={S.bspan}>NORTH</span></div><div style={S.bsub}>Screen Printing & Embroidery</div></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={()=>setPage("garments")} style={S.btn("o")}>Garment Library</button>
            <button onClick={newJob} style={S.btn()}>+ New Mockup</button>
          </div>
        </div>
        <div style={S.wrap}>
          <div style={S.sec}><span style={S.secn}>JOBS</span> Active Mockups</div>
          {jobsLoading&&<div style={S.note("i")}>Loading jobs…</div>}
          {jobsError&&<div style={S.note("r")}>{jobsError}</div>}
          {!jobsLoading&&!jobs.length&&<div style={S.note("w")}>No active jobs. Click + New Mockup to start.</div>}
          {jobs.map(j=>(
            <div key={j.id} style={S.jcard} onClick={()=>loadJob(j.id)}>
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",letterSpacing:".1em",textTransform:"uppercase",color:"#c8372d",marginBottom:3}}>JOB #{j.job_num}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".95rem",fontWeight:500}}>{j.client||"—"}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".08em",textTransform:"uppercase",color:"#aaa",marginTop:3}}>{j.garment_style}{j.garment_colour&&` · ${j.garment_colour}`}{j.due_date&&` · Due ${j.due_date}`}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",letterSpacing:".1em",textTransform:"uppercase",padding:"3px 8px",background:j.status==="final"?"#e6f4ec":j.status==="draft"?"#fff8e6":"#f5f0e8",color:j.status==="final"?"#2a7a4b":j.status==="draft"?"#7a5500":"#aaa",border:`1px solid ${j.status==="final"?"#2a7a4b":j.status==="draft"?"#b8892e":"#d4cdc0"}`}}>{j.status||"draft"}</span>
                <button onClick={e=>archiveJob(j.id,e)} style={{...S.btn("o"),padding:"6px 12px",fontSize:".5rem"}}>Archive</button>
                <button onClick={e=>deleteJob(j.id,e)} style={{...S.btn("r"),padding:"6px 12px",fontSize:".5rem"}}>Delete</button>
              </div>
            </div>
          ))}
          <hr style={S.div}/>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setShowArchive(v=>!v)} style={S.btn("o")}>{showArchive?"Hide Archive":"Search Archive"}</button>
          </div>
          {showArchive&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input style={{...S.inp,flex:1}} placeholder="Search by client or job #…" value={archiveSearch} onChange={e=>setArchiveSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchArchive()}/>
                <button onClick={searchArchive} style={S.btn()} disabled={archiveSearching}>{archiveSearching?"…":"Search"}</button>
              </div>
              {archiveResults.map(j=>(
                <div key={j.id} style={{...S.jcard,opacity:.8}} onClick={()=>loadJob(j.id)}>
                  <div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".54rem",color:"#c8372d"}}>JOB #{j.job_num}</div>
                    <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".9rem",fontWeight:500}}>{j.client}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:"#aaa"}}>{j.garment_style} · {j.garment_colour}</div>
                  </div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".46rem",color:"#888"}}>{j.status}</span>
                </div>
              ))}
              {!archiveSearching&&archiveResults.length===0&&archiveSearch&&<div style={S.note("w")}>No archived jobs found.</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── BUILDER ──
  return (
    <div style={S.body}>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0f0f0f",color:"#f5f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",padding:"10px 20px",zIndex:999,border:"2px solid #c8372d"}}>{toast}</div>}
      <div style={S.header}>
        <div><div style={S.brand}>TRUE <span style={S.bspan}>NORTH</span></div><div style={S.bsub}>Screen Printing & Embroidery</div></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={S.tag}>JOB #{jobNum||"—"}</div>
          {saveStatus==="saved"&&<div style={{...S.tag,borderColor:"#2a7a4b",color:"#2a7a4b"}}>Saved ✓</div>}
          <button onClick={()=>saveJob("draft")} style={S.btn("o")}>Save Draft</button>
          <button onClick={()=>setPage("jobs")} style={S.btn("o")}>← Jobs</button>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{background:"#0f0f0f",borderBottom:"1px solid #333",padding:"0 28px",display:"flex",gap:0}}>
        {[["01","Job Info",1],["02","Artwork & Placements",2],["03","Fine-Tune",3],["04","Export",4]].map(([n,label,s])=>(
          <div key={s} onClick={()=>s<step&&setStep(s)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".5rem",letterSpacing:".12em",textTransform:"uppercase",padding:"10px 18px",color:step===s?"#f5f0e8":step>s?"#c8372d":"#555",borderBottom:step===s?"2px solid #c8372d":"2px solid transparent",cursor:s<step?"pointer":"default",display:"flex",gap:6,alignItems:"center"}}>
            <span style={{color:step>s?"#c8372d":"inherit"}}>{n}</span> {label}
          </div>
        ))}
      </div>

      <div style={S.wrap}>

        {/* ── STEP 1: Job Info ── */}
        {step===1&&(
          <div>
            <div style={S.sec}><span style={S.secn}>01</span> Job Info</div>
            <div style={S.g3}>
              <div><label style={S.lbl}>Job #</label><input style={S.inp} value={jobNum} onChange={e=>setJobNum(e.target.value)}/></div>
              <div><label style={S.lbl}>Order Name</label><input style={S.inp} value={orderName} onChange={e=>setOrderName(e.target.value)} placeholder="e.g. Spring Drop 2025"/></div>
              <div><label style={S.lbl}>Due Date</label><input style={S.inp} type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
            </div>
            <hr style={S.div}/>
            <div style={S.sec}><span style={S.secn}>01b</span> Customer</div>
            <div style={{position:"relative",marginBottom:14}}>
              <label style={S.lbl}>Search Existing Customer</label>
              <input style={S.inp} value={custSearch} onChange={e=>searchCustomers(e.target.value)} placeholder="Type company or contact name…"/>
              {custSuggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #d4cdc0",zIndex:50,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
                  {custSuggestions.map(c=>(
                    <div key={c.id} onClick={()=>selectCustomer(c)} style={{padding:"8px 12px",cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:".84rem",borderBottom:"1px solid #f0ede8"}}>
                      <span style={{fontWeight:500}}>{c.company}</span>{c.contact_name&&<span style={{color:"#aaa",marginLeft:8,fontSize:".78rem"}}>{c.contact_name}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={S.g2}>
              <div><label style={S.lbl}>Company</label><input style={S.inp} value={cust.company} onChange={e=>setCust(c=>({...c,company:e.target.value}))}/></div>
              <div><label style={S.lbl}>Contact Name</label><input style={S.inp} value={cust.contact_name} onChange={e=>setCust(c=>({...c,contact_name:e.target.value}))}/></div>
              <div><label style={S.lbl}>Email</label><input style={S.inp} value={cust.email} onChange={e=>setCust(c=>({...c,email:e.target.value}))}/></div>
              <div><label style={S.lbl}>Phone</label><input style={S.inp} value={cust.phone} onChange={e=>setCust(c=>({...c,phone:e.target.value}))}/></div>
            </div>
            <div style={S.g3}>
              <div><label style={S.lbl}>Address</label><input style={S.inp} value={cust.address} onChange={e=>setCust(c=>({...c,address:e.target.value}))}/></div>
              <div><label style={S.lbl}>City</label><input style={S.inp} value={cust.city} onChange={e=>setCust(c=>({...c,city:e.target.value}))}/></div>
              <div><label style={S.lbl}>Province</label>
                <select style={S.sel} value={cust.province} onChange={e=>setCust(c=>({...c,province:e.target.value}))}>
                  {CA_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <hr style={S.div}/>
            <div style={S.sec}><span style={S.secn}>01c</span> Garment</div>
            <div style={S.g3}>
              <div>
                <label style={S.lbl}>Brand</label>
                <select style={S.sel} value={selBrand} onChange={e=>{setSelBrand(e.target.value);setSelStyle("");setSelColour("");}}>
                  <option value="">— Select —</option>
                  {brands.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Style</label>
                <select style={S.sel} value={selStyle} onChange={e=>{setSelStyle(e.target.value);setSelColour("");}} disabled={!selBrand}>
                  <option value="">— Select —</option>
                  {styles.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Colour</label>
                <select style={S.sel} value={selColour} onChange={e=>{const g=colours.find(c=>c.colour===e.target.value);if(g)selectColour(g);}} disabled={!selStyle}>
                  <option value="">— Select —</option>
                  {colours.map(c=><option key={c.id} value={c.colour}>{c.colour}</option>)}
                </select>
              </div>
            </div>
            <hr style={S.div}/>
            <div style={S.sec}><span style={S.secn}>01d</span> Sizes</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              {ALL_SIZES.map(s=>(
                <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".48rem",letterSpacing:".1em",textTransform:"uppercase",color:sizes[s].active?"#c8372d":"#bbb",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <input type="checkbox" checked={sizes[s].active} onChange={e=>setSizes(z=>({...z,[s]:{...z[s],active:e.target.checked}}))} style={{accentColor:"#c8372d"}}/>
                    {s}
                  </label>
                  {sizes[s].active&&<input style={{...S.inp,width:42,textAlign:"center",padding:"4px 2px",fontSize:".8rem"}} type="number" min="0" value={sizes[s].qty} onChange={e=>setSizes(z=>({...z,[s]:{...z[s],qty:e.target.value}}))} placeholder="0"/>}
                </div>
              ))}
            </div>
            <hr style={S.div}/>
            <div style={S.sec}><span style={S.secn}>01e</span> Decoration & Options</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
              {DEC_TYPES.map(t=>(
                <label key={t} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5,cursor:"pointer",color:decTypes.includes(t)?"#c8372d":"#666"}}>
                  <input type="checkbox" checked={decTypes.includes(t)} onChange={e=>setDecTypes(d=>e.target.checked?[...d,t]:d.filter(x=>x!==t))} style={{accentColor:"#c8372d"}}/>{t}
                </label>
              ))}
            </div>
            <div style={S.g3}>
              {[["Press Check Required",pressCheck,setPressCheck],["Bold Print",boldPrint,setBoldPrint],["Vintage / Distressed",vintagePrint,setVintagePrint]].map(([lbl,val,set])=>(
                <label key={lbl} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".52rem",letterSpacing:".1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:val?"#c8372d":"#666"}}>
                  <input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} style={{accentColor:"#c8372d"}}/>{lbl}
                </label>
              ))}
            </div>
            <div style={{marginTop:14}}><label style={S.lbl}>Special Instructions</label><textarea style={S.ta} value={specialInstructions} onChange={e=>setSpecialInstructions(e.target.value)} placeholder="Any production notes…"/></div>
            <div style={{marginTop:20,display:"flex",gap:10}}>
              <button style={S.btn()} onClick={()=>setStep(2)}>Next: Artwork & Placements →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Artwork & Placements ── */}
        {step===2&&(
          <div>
            <div style={S.sec}><span style={S.secn}>02</span> Artwork & Placements</div>
            <div style={S.sec}><span style={S.secn}>02a</span> Artwork Files</div>
            <div style={{marginBottom:14}}>
              <label style={{...S.btn(),display:"inline-block",cursor:"pointer"}}>
                + Upload Artwork
                <input type="file" multiple accept="image/*" style={{display:"none"}} onChange={loadArtFiles}/>
              </label>
            </div>
            {artwork.length>0&&(
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
                {artwork.map(a=>(
                  <div key={a.id} style={{background:"#fff",border:"1px solid #d4cdc0",padding:"8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,width:90}}>
                    <img src={a.dataURL} style={{width:60,height:60,objectFit:"contain",background:"#f5f0e8"}}/>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".44rem",letterSpacing:".06em",textTransform:"uppercase",color:"#888",textAlign:"center",wordBreak:"break-all",lineHeight:1.3}}>ID {a.id}<br/>{a.name.replace(/\.[^.]+$/,"").substring(0,14)}</div>
                    <button onClick={()=>removeArt(a.id)} style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:".7rem"}}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <hr style={S.div}/>
            <div style={S.sec}><span style={S.secn}>02b</span> Placements</div>
            {placements.map((row)=>(
              <div key={row._id} style={S.prow}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:8}}>
                  <div>
                    <label style={S.lbl}>View</label>
                    <select style={S.sel} value={row.view} onChange={e=>updateRow(row._id,"view",e.target.value)}>
                      {VIEW_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Placement</label>
                    <select style={S.sel} value={row.placement} onChange={e=>updateRow(row._id,"placement",e.target.value)}>
                      {PLACEMENT_OPTIONS.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Artwork ID</label>
                    <select style={S.sel} value={row.artId} onChange={e=>updateRow(row._id,"artId",e.target.value)}>
                      <option value="">— Select —</option>
                      {artwork.map(a=><option key={a.id} value={a.id}>ID {a.id}: {a.name.replace(/\.[^.]+$/,"").substring(0,18)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Dec Type</label>
                    <select style={S.sel} value={row.decType} onChange={e=>updateRow(row._id,"decType",e.target.value)}>
                      {DEC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
                  <div><label style={S.lbl}>Art Width (in)</label><input style={S.inp} value={row.width} onChange={e=>updateRow(row._id,"width",e.target.value)} placeholder='e.g. 3.5'/></div>
                  <div><label style={S.lbl}>From Collar (in)</label><input style={S.inp} value={row.fromCollar} onChange={e=>updateRow(row._id,"fromCollar",e.target.value)} placeholder='e.g. 3'/></div>
                  <div><label style={S.lbl}>Colours / PMS</label><input style={S.inp} value={row.colours} onChange={e=>updateRow(row._id,"colours",e.target.value)} placeholder="e.g. PMS 185 C"/></div>
                  <div><label style={S.lbl}>Notes</label><input style={S.inp} value={row.notes} onChange={e=>updateRow(row._id,"notes",e.target.value)} placeholder="Any notes…"/></div>
                </div>
                <div style={{marginTop:8}}>
                  <button onClick={()=>removeRow(row._id)} style={{...S.btn("r"),padding:"5px 12px",fontSize:".5rem"}}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={addRow} style={{...S.btn("o"),marginBottom:16}}>+ Add Placement</button>
            <hr style={S.div}/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button style={S.btn("o")} onClick={()=>setStep(1)}>← Back</button>
              <button style={S.btn()} onClick={goToFineTune}>Fine-Tune Placements →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Fine-Tune ── */}
        {step===3&&(
          <FineTuneCanvas
            garments={garments}
            artwork={artwork}
            plan={plan.length?plan:buildDefaultPlan()}
            onConfirm={handleFineTuneConfirm}
            onBack={()=>setStep(2)}
          />
        )}

        {/* ── STEP 4: Export ── */}
        {step===4&&(
          <div>
            <div style={S.sec}><span style={S.secn}>04</span> Export</div>
            {saveStatus==="saved"&&<div style={S.note("s")}>✓ Job Saved</div>}
            {!mockupBuilt&&<div style={S.note("w")}>Rendering mockup…</div>}
            <canvas ref={canvasRef} style={{maxWidth:"100%",display:"block",marginBottom:16,border:"1px solid #d4cdc0"}}/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              <button style={S.btn()} onClick={()=>{if(exportRef.current)downloadCanvas(exportRef.current,`TNSP-${jobNum||"mockup"}-spec.png`);}}>⬇ Download Spec Sheet</button>
              <button style={S.btn("o")} onClick={()=>{if(cleanExportRef.current)downloadCanvas(cleanExportRef.current,`TNSP-${jobNum||"mockup"}-mockup.png`);}}>⬇ Download Mockup Only</button>
              <button style={S.btn("o")} onClick={()=>{const wo=buildWorkOrder();downloadCanvas(wo,`TNSP-${jobNum||"job"}-workorder.png`);}}>⬇ Download Work Order</button>
              <button style={S.btn("g")} onClick={()=>saveJob("final")}>Save as Final ✓</button>
              <button style={S.btn("o")} onClick={()=>{setStep(3);}}>← Back to Fine-Tune</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

