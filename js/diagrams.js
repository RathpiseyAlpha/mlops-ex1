// Sequence and swimlane diagrams, drawn as SVG from the data at the top of this file.
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
const mk=(tag,attrs,text)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,String(attrs[k]));if(text!=null)e.textContent=text;return e};
const tw=(s,pad)=>Math.round(s.length*6.7+pad);
const col={serve:'var(--serve)',code:'var(--code)',data:'var(--data)',model:'var(--model)',ink:'var(--ink)',stop:'var(--stop)',go:'var(--go)'};
const icon=(id,x,y,s)=>{const u=mk('use',{href:'#'+id,x,y,width:s,height:s});return u};
const cubic=(p0,p1,p2,p3)=>({x:(p0.x+3*p1.x+3*p2.x+p3.x)/8,y:(p0.y+3*p1.y+3*p2.y+p3.y)/8});
function wrap(text,max){const out=[];let line='';text.split(' ').forEach(w=>{if((line+' '+w).trim().length>max&&line){out.push(line);line=w}else line=(line+' '+w).trim()});if(line)out.push(line);return out}

/* ---------- sequence diagram ---------- */
const actors=[
 {id:'dev',name:'Developer',sub:'in Jupyter',icon:'i-jupyter'},
 {id:'git',name:'Git',sub:'code history',icon:'i-git'},
 {id:'ci',name:'CI',sub:'code tests',icon:'i-ci'},
 {id:'af',name:'Airflow',sub:'runs the jobs',icon:'i-airflow'},
 {id:'ch',name:'ClickHouse',sub:'data',icon:'i-clickhouse'},
 {id:'ml',name:'MLflow',sub:'models',icon:'i-mlflow'},
 {id:'api',name:'API',sub:'predictions',icon:'i-api'},
 {id:'app',name:'App',sub:'client',icon:'i-app'}
];
const seq=[
 {phase:'A code change reaches Airflow',lane:'code'},
 {from:'dev',to:'git',text:'push commit',lane:'code'},
 {from:'git',to:'ci',text:'run tests',lane:'code'},
 {from:'ci',to:'git',text:'report pass or fail',lane:'code',ret:true},
 {from:'af',to:'git',text:'fetch approved commit',lane:'code'},
 {phase:'New data becomes eligible',lane:'data'},
 {from:'af',to:'ch',text:'write labeled batch',lane:'data'},
 {from:'af',to:'ch',text:'check snapshot is ready',lane:'data'},
 {from:'ch',to:'af',text:'snapshot ID and rows',lane:'data',ret:true},
 {from:'af',to:'af',text:'validate schema and ranges',lane:'data'},
 {phase:'Train and evaluate',lane:'model'},
 {from:'af',to:'ml',text:'start run with commit, snapshot ID and seed',lane:'model'},
 {from:'af',to:'af',text:'fit candidate model',lane:'model'},
 {from:'af',to:'ml',text:'log metrics and model file',lane:'model'},
 {from:'ml',to:'af',text:'new version number',lane:'model',ret:true},
 {phase:'Decide and promote',lane:'model'},
 {from:'af',to:'ml',text:'read champion scores',lane:'model'},
 {from:'ml',to:'af',text:'champion and baseline scores',lane:'model',ret:true},
 {from:'af',to:'ml',text:'move champion alias if all gates pass',lane:'model'},
 {phase:'Score and watch',lane:'data'},
 {from:'af',to:'ml',text:'load models:/iris_classifier@champion',lane:'model'},
 {from:'ml',to:'af',text:'model file',lane:'model',ret:true},
 {from:'af',to:'ch',text:'save predictions with model version',lane:'data'},
 {from:'ch',to:'af',text:'true labels arrive later',lane:'data',ret:true},
 {from:'af',to:'af',text:'compute recent score',lane:'data'},
 {phase:'An app asks for a prediction',lane:'serve'},
 {from:'app',to:'api',text:'POST /predict',lane:'serve'},
 {from:'api',to:'ml',text:'which version is champion?',lane:'model'},
 {from:'ml',to:'api',text:'version 4',lane:'model',ret:true},
 {from:'api',to:'api',text:'predict with the loaded model',lane:'model'},
 {from:'api',to:'ch',text:'save request and prediction',lane:'data'},
 {from:'api',to:'app',text:'label and model_version',lane:'serve',ret:true},
 {from:'app',to:'api',text:'POST /feedback, later',lane:'serve'},
 {from:'api',to:'ch',text:'save true label',lane:'data'},
 {phase:'React and inspect',lane:'ink'},
 {from:'af',to:'ml',text:'if score regressed: point alias to previous version',lane:'model'},
 {from:'dev',to:'ch',text:'inspect predictions and labels',lane:'data'},
 {from:'dev',to:'ml',text:'compare runs and versions',lane:'model'}
];
function renderSequence(){
 const svg=document.getElementById('seqSvg'),head=document.getElementById('seqHead');if(!svg||!head)return;
 const Wd=1160,left=20,sp=(Wd-left*2)/actors.length,xs=id=>left+sp*(actors.findIndex(a=>a.id===id)+.5);
 const rows=[];let y=22,n=0;
 seq.forEach(s=>{if(s.phase){rows.push({...s,y});y+=46}else{n++;rows.push({...s,n,y:y+14});y+=s.from===s.to?58:48}});
 const H=y+16;
 svg.setAttribute('viewBox',`0 0 ${Wd} ${H}`);head.setAttribute('viewBox',`0 0 ${Wd} 100`);
 const defs=mk('defs');const m=mk('marker',{id:'seqHead',viewBox:'0 0 10 10',refX:8.5,refY:5,markerUnits:'userSpaceOnUse',markerWidth:12,markerHeight:12,orient:'auto'});m.append(mk('path',{d:'M1 1.2L8.6 5L1 8.8'}));defs.append(m);svg.append(defs);
 actors.forEach(a=>{svg.append(mk('line',{x1:xs(a.id),x2:xs(a.id),y1:0,y2:H-8,class:'seq-life'}))});
 rows.filter(r=>r.phase).forEach(r=>{const g=mk('g');g.append(mk('rect',{x:6,y:r.y,width:Wd-12,height:30,rx:4,class:'seq-band'}));g.append(mk('rect',{x:6,y:r.y,width:5,height:30,rx:2,fill:col[r.lane]}));g.append(mk('text',{x:24,y:r.y+20,class:'seq-phase',fill:col[r.lane]},r.phase));svg.append(g)});
 actors.forEach(a=>{const x=xs(a.id),w=sp-22,g=mk('g');g.append(mk('rect',{x:x-w/2,y:12,width:w,height:86,rx:6,class:'seq-box'}));g.append(icon(a.icon,x-14,20,28));g.append(mk('text',{x,y:68,class:'seq-name','text-anchor':'middle'},a.name));g.append(mk('text',{x,y:86,class:'seq-sub','text-anchor':'middle'},a.sub));head.append(g)});
 rows.filter(r=>!r.phase).forEach(r=>{
  const g=mk('g'),c=col[r.lane],x1=xs(r.from),x2=xs(r.to),label=`${r.n}. ${r.text}`;
  if(r.from===r.to){
   const d=`M ${x1} ${r.y} C ${x1+52} ${r.y-4}, ${x1+52} ${r.y+26}, ${x1+4} ${r.y+26}`;
   g.append(mk('path',{d,class:'seq-line',stroke:c,'marker-end':'url(#seqHead)'}));
   const w=tw(label,16);g.append(mk('rect',{x:x1+62,y:r.y-1,width:w,height:24,rx:4,class:'seq-bg'}));g.append(mk('text',{x:x1+70,y:r.y+16,class:'seq-label'},label));
  }else{
   const dir=x2>x1?1:-1;
   g.append(mk('line',{x1,x2:x2-dir*3,y1:r.y,y2:r.y,class:'seq-line'+(r.ret?' seq-ret':''),stroke:c,'marker-end':'url(#seqHead)'}));
   const w=tw(label,18),cx=(x1+x2)/2;g.append(mk('rect',{x:cx-w/2,y:r.y-26,width:w,height:21,rx:4,class:'seq-bg'}));g.append(mk('text',{x:cx,y:r.y-11,class:'seq-label','text-anchor':'middle'},label));
  }
  svg.append(g)});
 const list=document.getElementById('seqList');if(list)list.replaceChildren(...seq.map(s=>{const li=document.createElement('li');li.textContent=s.phase?`Phase: ${s.phase}`:`${actors.find(a=>a.id===s.from).name} to ${actors.find(a=>a.id===s.to).name}: ${s.text}`;return li}));
}

/* ---------- swimlane diagram ---------- */
const lanes=[
 {id:'dev',name:'ML developer',icon:'i-person',type:'code'},
 {id:'de',name:'Data engineer',icon:'i-person',type:'code'},
 {id:'git',name:'Git and CI',icon:'i-git'},
 {id:'af',name:'Airflow',icon:'i-airflow'},
 {id:'ch',name:'ClickHouse',icon:'i-clickhouse'},
 {id:'ml',name:'MLflow',icon:'i-mlflow'},
 {id:'api',name:'Prediction API',icon:'i-api'},
 {id:'app',name:'App',icon:'i-app'}
];
const nodes=[
 {id:'a',lane:'dev',row:0,text:'Edit training code and tests',type:'code'},
 {id:'b',lane:'de',row:0,text:'Edit ingestion code and tests',type:'code'},
 {id:'c',lane:'git',row:1,text:'Push commit',type:'code'},
 {id:'d',lane:'git',row:2,text:'Code tests pass?',type:'code',kind:'gate'},
 {id:'e',lane:'af',row:3,text:'Deploy approved commit',type:'code'},
 {id:'x1',lane:'git',row:3,text:'Stop and keep old code',kind:'end'},
 {id:'f',lane:'af',row:4,text:'Run ingestion job',type:'data'},
 {id:'g',lane:'ch',row:5,text:'Store labeled snapshot',type:'data'},
 {id:'h',lane:'af',row:6,text:'Data checks pass?',type:'data',kind:'gate'},
 {id:'i',lane:'af',row:7,text:'Train candidate',type:'model'},
 {id:'x2',lane:'ch',row:7,text:'Stop and record failure',kind:'end'},
 {id:'j',lane:'ml',row:8,text:'Record run and model version',type:'model'},
 {id:'k',lane:'af',row:9,text:'Beats champion and baseline?',type:'model',kind:'gate'},
 {id:'l',lane:'ml',row:10,text:'Move champion alias',type:'model'},
 {id:'x3',lane:'af',row:10,text:'Stop and keep champion',kind:'end'},
 {id:'m',lane:'af',row:11,text:'Score new batch',type:'model'},
 {id:'n',lane:'ch',row:12,text:'Save predictions and later labels',type:'data'},
 {id:'o',lane:'af',row:13,text:'Live score healthy?',type:'data',kind:'gate'},
 {id:'p',lane:'ml',row:14,text:'Point alias to previous version',type:'model'},
 {id:'q',lane:'af',row:14,text:'Keep watching',kind:'end'},
 {id:'s1',lane:'api',row:11,text:'Reload when the champion changes',type:'model'},
 {id:'s2',lane:'app',row:12,text:'POST /predict with features',type:'serve'},
 {id:'s3',lane:'api',row:13,text:'Predict with the champion',type:'model'},
 {id:'s4',lane:'ch',row:14,text:'Save request and prediction',type:'data'},
 {id:'s5',lane:'app',row:14,text:'Show answer; later POST /feedback',type:'serve'}
];
const links=[
 {from:'a',to:'c',text:'push'},{from:'b',to:'c',text:'push'},{from:'c',to:'d',text:'run tests'},
 {from:'d',to:'e',text:'pass: approve',off:18,tone:'go'},{from:'d',to:'x1',text:'fail',off:-18,tone:'stop'},
 {from:'e',to:'f',text:'start'},{from:'f',to:'g',text:'write batch'},{from:'g',to:'h',text:'read snapshot'},
 {from:'h',to:'i',text:'pass',off:-18,tone:'go'},{from:'h',to:'x2',text:'fail',off:18,tone:'stop'},
 {from:'i',to:'j',text:'log run'},{from:'j',to:'k',text:'scores'},
 {from:'k',to:'l',text:'yes: promote',off:18,tone:'go'},{from:'k',to:'x3',text:'no',off:-18,tone:'stop'},
 {from:'l',to:'m',text:'load champion'},{from:'m',to:'n',text:'save scores'},{from:'n',to:'o',text:'true labels'},
 {from:'o',to:'p',text:'regressed: roll back',off:18,tone:'stop'},{from:'o',to:'q',text:'healthy',off:-18,tone:'go'},
 {from:'l',to:'s1',text:'alias moved'},{from:'s1',to:'s3',text:'loaded'},{from:'s2',to:'s3',text:'request'},
 {from:'s3',to:'s4',text:'log',off:-18},{from:'s3',to:'s5',text:'label + version',off:18}
];
function renderSwimlane(){
 const svg=document.getElementById('laneSvg'),head=document.getElementById('laneHead');if(!svg||!head)return;
 const LW=186,HH=78,Y0=22,RP=106,NW=150,NH=58,rows=15,Wd=LW*lanes.length,H=Y0+RP*rows;
 svg.setAttribute('viewBox',`0 0 ${Wd} ${H}`);head.setAttribute('viewBox',`0 0 ${Wd} ${HH}`);
 const laneIdx=id=>lanes.findIndex(l=>l.id===id);
 const cx=nd=>LW*(laneIdx(nd.lane)+.5),cy=nd=>Y0+RP*nd.row+RP/2-8;
 const hh=nd=>nd.kind==='gate'?66:nd.kind==='end'?44:NH;
 const defs=mk('defs');const m=mk('marker',{id:'laneHead',viewBox:'0 0 10 10',refX:8.5,refY:5,markerUnits:'userSpaceOnUse',markerWidth:12,markerHeight:12,orient:'auto'});m.append(mk('path',{d:'M1 1.2L8.6 5L1 8.8'}));defs.append(m);svg.append(defs);
 lanes.forEach((l,i)=>{svg.append(mk('rect',{x:i*LW,y:0,width:LW,height:H,class:i%2?'lane-bg lane-alt':'lane-bg'}));head.append(mk('rect',{x:i*LW,y:0,width:LW,height:HH,class:i%2?'lane-bg lane-alt':'lane-bg'}));
  const g=mk('g');g.append(mk('rect',{x:i*LW+6,y:8,width:LW-12,height:HH-18,rx:6,class:'seq-box'}));g.append(icon(l.icon,i*LW+18,HH/2-12,32));if(l.icon==='i-person')g.lastChild.setAttribute('style','color:var(--code)');g.append(mk('text',{x:i*LW+58,y:HH/2+1,class:'seq-name'},l.name));head.append(g)});
 const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const labels=[];
 links.forEach(L=>{const a=byId[L.from],b=byId[L.to];const s={x:cx(a)+(L.off||0),y:cy(a)+hh(a)/2},e={x:cx(b),y:cy(b)-hh(b)/2-3};const dy=e.y-s.y,d=Math.max(12,dy*.5);
  const p1={x:s.x,y:s.y+d},p2={x:e.x,y:e.y-d};const tone=L.tone==='stop'?col.stop:L.tone==='go'?col.go:col[a.type||'ink'];
  svg.append(mk('path',{d:`M ${s.x} ${s.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${e.x} ${e.y}`,class:'seq-line lane-link'+(b.kind==='end'?' seq-ret':''),stroke:tone,'marker-end':'url(#laneHead)'}));
  const mid=cubic(s,p1,p2,e);labels.push({mid,text:L.text,tone})});
 nodes.forEach(nd=>{const x=cx(nd),y=cy(nd),h=hh(nd),g=mk('g');
  if(nd.kind==='gate'){const w=NW+8;g.append(mk('polygon',{points:`${x-w/2+16},${y-h/2} ${x+w/2-16},${y-h/2} ${x+w/2},${y} ${x+w/2-16},${y+h/2} ${x-w/2+16},${y+h/2} ${x-w/2},${y}`,class:'lane-gate',stroke:col[nd.type]}))}
  else if(nd.kind==='end')g.append(mk('rect',{x:x-NW/2,y:y-h/2,width:NW,height:h,rx:h/2,class:'lane-end'}));
  else{g.append(mk('rect',{x:x-NW/2,y:y-h/2,width:NW,height:h,rx:6,class:'lane-step',stroke:col[nd.type]}));g.append(mk('rect',{x:x-NW/2,y:y-h/2,width:5,height:h,rx:2,fill:col[nd.type]}))}
  const lines=wrap(nd.text,nd.kind==='gate'?18:20),lh=16,t=mk('text',{x:x+(nd.kind==='step'||!nd.kind?3:0),y:y-(lines.length-1)*lh/2+4,class:'lane-text','text-anchor':'middle'});
  lines.forEach((ln,i)=>{const ts=mk('tspan',{x:t.getAttribute('x'),dy:i?lh:0},ln);t.append(ts)});g.append(t);svg.append(g)});
 labels.forEach(l=>{const g=mk('g'),w=tw(l.text,14);g.append(mk('rect',{x:l.mid.x-w/2,y:l.mid.y-10,width:w,height:20,rx:4,class:'seq-bg'}));g.append(mk('text',{x:l.mid.x,y:l.mid.y+4,class:'seq-label lane-label','text-anchor':'middle',style:'fill:'+l.tone},l.text));svg.append(g)});
 const list=document.getElementById('laneList');if(list)list.replaceChildren(...nodes.map(nd=>{const li=document.createElement('li');const outs=links.filter(L=>L.from===nd.id).map(L=>`${L.text} to ${byId[L.to].text}`);li.textContent=`${lanes[laneIdx(nd.lane)].name}: ${nd.text}${outs.length?'. Next: '+outs.join('; '):''}`;return li}));
}
renderSequence();renderSwimlane();
})();
