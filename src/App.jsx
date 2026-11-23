import {useState,useRef,useEffect} from 'react';
import {sb} from './supabase.js';
import {useAuth,useStore} from './store.js';
const CFG={STAT:{queue:'Warteschlange',work:'In Bearbeitung',ready:'Fertig zur Abholung',done:'Abgeschlossen'}};
const SCOL={queue:'text-zinc-400 border-zinc-600',work:'text-gold border-gold/60',ready:'text-emerald-300 border-emerald-500/60',done:'text-zinc-500 border-line'};
const onSale=p=>p.sale!=null&&p.sale!==''&&p.sale>=0;
const eff=(p,v)=>v?v.price:onSale(p)?p.sale:p.price;
const pct=o=>{if(o.status==='done')return 100;const q=o.items.reduce((a,i)=>a+i.qty,0),d=o.items.reduce((a,i)=>a+Math.min(i.done,i.qty),0);return q?Math.round(100*d/q):0};

/* ===== Demo-Daten (alles per Admin änderbar) ===== */
const TYPES={helm:'Helm',chest:'Brustplatte',legs:'Hose (Beinschienen)',boots:'Schuhe (Stiefel)',turtle:'Schildkrötenpanzer',sword:'Schwert',axe:'Axt',spear:'Speer',mace:'Streitkolben',trident:'Dreizack',bow:'Bogen',crossbow:'Armbrust',pick:'Spitzhacke',shovel:'Schaufel',hoe:'Hacke',shears:'Schere',rod:'Angel',brush:'Pinsel',flint:'Feuerzeug',carrot:'Karottenangel',fungus:'Pilzangel',shield:'Schild',elytra:'Elytren'};
const GROUPS=[['Rüstung',['helm','chest','legs','boots','turtle']],['Nahkampf',['sword','axe','spear','mace','trident']],['Fernkampf',['bow','crossbow']],['Werkzeuge',['pick','shovel','hoe','shears','rod','brush','flint','carrot','fungus']],['Sonstiges',['shield','elytra']]];
const ALL=Object.keys(TYPES);
/* ===== Bausteine ===== */
const Tex=({k,s=96})=>k?<img src={k} alt="" style={{width:s,height:s,objectFit:'contain'}}/>:<span className="font-display text-zinc-700" style={{fontSize:s*.55}}>◆</span>;
const Price=({p,v,extra=0})=>{const d0=eff(p,v);const d=d0==null?null:d0+extra;if(d==null)return <span className="text-zinc-400">Preis auf Anfrage</span>;return <span><span className="text-gold font-semibold">💎 {d}</span>{onSale(p)&&!v&&<s className="ml-2 text-zinc-500">{p.price+extra}</s>}</span>};
const Bar=({v,h='h-1.5'})=><div className={`w-full ${h} bg-line rounded-full overflow-hidden`}><div className="h-full bg-gold transition-all duration-500" style={{width:v+'%'}}/></div>;
const Badge=({s})=><span className={`text-xs border rounded-full px-2.5 py-0.5 whitespace-nowrap ${SCOL[s]}`}>{CFG.STAT[s]}</span>;
const L=({t,children})=><label className="block text-xs text-zinc-500 mb-1">{t}{children}</label>;

function Card({p,onOpen,grid}){
 return <div onClick={()=>onOpen(p)} className={`group snap-start cursor-pointer bg-panel border border-line rounded-xl overflow-hidden hover:border-gold/60 transition ${grid?'':'shrink-0 w-52 sm:w-56'} ${p.struck?'opacity-60':''}`}>
  <div className="h-40 flex items-center justify-center bg-gradient-to-b from-[#1b1b20] to-panel relative"><div className="group-hover:scale-110 transition duration-300"><Tex k={p.tex} s={88}/></div>
   {p.demo&&<span className="absolute top-2 left-2 text-[10px] tracking-widest text-zinc-400 border border-line px-1.5 rounded">DEMO</span>}
   {p.struck?<span className="absolute top-2 right-2 text-[10px] tracking-widest text-zinc-300 bg-black/70 border border-line px-1.5 rounded">NICHT VERKÄUFLICH</span>:onSale(p)&&<span className="absolute top-2 right-2 text-[10px] tracking-widest text-ink bg-gold px-1.5 rounded">ANGEBOT</span>}</div>
  <div className="p-4"><div className={`font-medium ${p.struck?'line-through text-zinc-500':''}`}>{p.name}</div><div className="mt-2 text-sm">{p.struck?<span className="text-zinc-500">Aktuell nicht verfügbar</span>:<>{p.variants.length>1&&<span className="text-xs text-zinc-500">ab </span>}<Price p={p} v={p.variants.length?[...p.variants].sort((a,b)=>a.price-b.price)[0]:undefined}/></>}</div></div></div>}

function Shelf({title,items,onOpen}){
 const r=useRef();const go=d=>r.current.scrollBy({left:d*r.current.clientWidth*.8,behavior:'smooth'});if(!items.length)return null;
 return <section className="max-w-7xl mx-auto px-5 mt-14"><div className="flex items-baseline justify-between mb-5"><h2 className="font-display text-3xl">{title}</h2><div className="flex gap-2"><button className="arrow" onClick={()=>go(-1)}>‹</button><button className="arrow" onClick={()=>go(1)}>›</button></div></div>
  <div ref={r} className="flex gap-5 overflow-x-auto snap-x hide-sb pb-2 scroll-smooth">{items.map(p=><Card key={p.id} p={p} onOpen={onOpen}/>)}</div></section>}

/* ===== Seiten ===== */
function Product({p,s,go,addCart}){
 const [vi,setVi]=useState(0),[q,setQ]=useState(1),[en,setEn]=useState([]),[eo,setEo]=useState(false);const cat=s.cats.find(c=>c.id===p.cat),service=cat.kind==='s',v=p.variants[vi];
 const ens=p.cat==='waffen'?s.ench.filter(e=>e.types.includes(p.type)):[];const extra=ens.filter(e=>en.includes(e.id)).reduce((a,e)=>a+e.price,0);
 return <div className="max-w-7xl mx-auto px-5 py-12"><button className="text-sm text-zinc-500 hover:text-gold mb-6" onClick={()=>go({v:'home'})}>‹ Zurück</button>
  <div className="grid md:grid-cols-2 gap-12"><div className="card h-96 flex items-center justify-center"><Tex k={p.tex} s={220}/></div>
  <div><p className="text-xs tracking-[.3em] text-gold mb-3">{cat.name.toUpperCase()}{p.demo&&' · DEMO'}</p>
   <h1 className={`font-display text-5xl ${p.struck?'line-through text-zinc-500':''}`}>{p.name}</h1><p className="mt-5 text-zinc-400">{p.desc}</p>
   {p.attrs.length>0&&<ul className="mt-5 text-sm space-y-1">{p.attrs.map(a=><li key={a}>· {a}</li>)}</ul>}
   {p.struck?<p className="mt-8 border border-line rounded-lg p-4 text-zinc-400 text-sm">Dieses Produkt können wir aktuell nach Rücksprache nicht verkaufen.</p>:<>
   <div className="mt-8 text-2xl"><Price p={p} v={v} extra={extra}/>{en.length>0&&<div className="text-xs text-zinc-500 mt-1">Basis 💎 {eff(p,v)} + Verzauberungen 💎 {extra}</div>}</div>
   {p.variants.length>0&&<select className="inp mt-6" value={vi} onChange={e=>setVi(+e.target.value)}>{p.variants.map((x,i)=><option key={i} value={i}>{x.name} – 💎 {x.price}</option>)}</select>}
   {ens.length>0&&<div className="mt-6"><button type="button" className="inp text-left flex justify-between" onClick={()=>setEo(!eo)}><span>{en.length?`${en.length} ${en.length>1?'Verzauberungen':'Verzauberung'} gewählt (+💎 ${extra})`:'Verzauberungen wählen'}</span><span>{eo?'▴':'▾'}</span></button>{eo&&<div className="mt-1 border border-line rounded-lg bg-panel divide-y divide-line">{ens.map(e=><label key={e.id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-white/5"><input type="checkbox" checked={en.includes(e.id)} onChange={()=>setEn(en.includes(e.id)?en.filter(x=>x!==e.id):[...en,e.id])}/><span className="flex-1">{e.name}</span><span className="text-gold">+💎 {e.price}</span></label>)}</div>}</div>}
   {service?<button className="gold mt-8" onClick={()=>go({v:'request',id:p.id})}>Anfrage stellen</button>:
   <div className="mt-8 flex items-center gap-4"><div className="inline-flex items-center border border-line rounded-lg"><button className="w-10 h-10" onClick={()=>setQ(Math.max(1,q-1))}>−</button><span className="w-10 text-center">{q}</span><button className="w-10 h-10" onClick={()=>setQ(q+1)}>+</button></div>
    <button className="gold" onClick={()=>addCart(p,v,q,ens.filter(e=>en.includes(e.id)))}>In den Warenkorb</button></div>}</>}</div></div></div>}

function Request({p,place,go}){
 const [f,setF]=useState({name:'',desc:'',dims:''});const ok=f.name.trim()&&f.desc.length>9;
 return <div className="max-w-2xl mx-auto px-5 py-12"><h1 className="font-display text-4xl mb-2">Anfrage: {p.name}</h1><p className="text-zinc-500 mb-8">Beschreibe dein Vorhaben. Wir prüfen es und erstellen ein individuelles Angebot.</p>
  <div className="space-y-4"><input className="inp" placeholder="Ingame-Name *" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
   <textarea rows={5} className="inp" placeholder="Beschreibung *" value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}/>
   <input className="inp" placeholder="Ungefähre Maße (z. B. 120 × 80 × 20)" value={f.dims} onChange={e=>setF({...f,dims:e.target.value})}/>
   
   <button disabled={!ok} className="gold" onClick={()=>place({name:f.name,items:[{name:p.name,qty:100,done:0,unit:'%',note:f.desc,dims:f.dims}],delivery:'standard',fee:0})}>Anfrage senden</button></div></div>}

const GUIDE={
 plain:{title:'So funktioniert Streamazon',sh:'Was bedeuten die Status?',fh:'Häufige Fragen',cta:'Zum Shop',
  intro:'Hier erklären wir dir in wenigen Schritten, wie du bei uns bestellst. Du brauchst dafür kein Konto.',
  steps:[['Im Shop stöbern','Wähle oben eine Kategorie (Erze, Blöcke & Blockpaletten, Waffen & Rüstung, Bau- & Farmservice, Terraforming oder Item-Wunsch) oder nutze die Suche. Auf der Startseite kannst du die Produktreihen mit den Pfeilen nach links und rechts durchblättern.'],
  ['Produkt auswählen','Klicke auf ein Produkt. Dort wählst du die Variante (zum Beispiel Roherz oder Barren, oder die Holzart) und die Menge in Stacks. Ein Stack hat 64 Items. Bei Waffen und Rüstung öffnest du das Menü „Verzauberungen wählen“ und setzt ein Häkchen bei jeder Verzauberung, die du möchtest. Der Preis ändert sich dabei sofort. Ist ein Produkt durchgestrichen, können wir es gerade nicht verkaufen.'],
  ['Anfragen statt kaufen','Bei Bau- & Farmservice, Terraforming und Item-Wunsch gibt es keinen festen Preis. Du füllst ein kurzes Formular aus, wir prüfen deine Anfrage und machen dir ein Angebot. Wenn du ein Item im Shop nicht findest, nutze den Item-Wunsch: Schreibe deinen Namen, das Item, die Stacks und alles, was wir sonst wissen sollen.'],
  ['Warenkorb und Bestellen','Im Warenkorb kannst du Mengen ändern oder Produkte entfernen. Trage deinen Ingame-Namen ein, ohne ihn kannst du nicht bestellen. Wähle dann die Lieferung: Standard, Wunschtermin oder Express. Wunschtermin und Express kosten extra Diamanten, den Aufpreis siehst du im Warenkorb. Alle Preise sind in Diamanten.'],
  ['Bestellnummer merken','Nach dem Bestellen bekommst du eine Bestellnummer. Merke sie dir, damit du deine Bestellung später wiederfindest.'],
  ['Fortschritt verfolgen','Im Tab „Bestellungen“ siehst du alle aktuellen Aufträge. Dein Name wird dort nicht angezeigt, deine Bestellung ist aber für dich hervorgehoben. Der Balken zeigt in Prozent, wie weit wir sind. Klicke auf eine Bestellung, dann siehst du bei jedem Produkt, wie viel schon fertig ist.']],
  st:{queue:'Wir haben gerade viel zu tun. Deine Bestellung wartet und wird bald bearbeitet.',work:'Wir farmen und bauen gerade für dich.',ready:'Das Wichtigste ist geschafft. Wir müssen nur noch zustellen.',done:'Alles erledigt, auch die Übergabe.'},
  faq:[['Brauche ich ein Konto?','Nein. Du brauchst nur deinen Ingame-Namen.'],['Ein Produkt ist durchgestrichen. Was heißt das?','Wir können es im Moment nach Rücksprache nicht verkaufen. Schau später noch einmal vorbei.'],['Ich finde mein Item nicht.','Nutze den Item-Wunsch. Dort kannst du jedes Item anfragen, auch wenn es nicht im Shop ist.']]},
 medieval:{title:'Kundmachung für wackere Käufer',sh:'Von den Zuständen Eures Auftrags',fh:'Gar häufige Fragen',cta:'Zurück auf den Markt',
  intro:'Seid gegrüßt, edler Reisender! Auf dass Euch der Handel im Hause Streamazon leicht von der Hand gehe, sei Euch hier kundgetan, wie Ihr Eure Waren erstehet. Ein Konto bedarf es dazu nicht.',
  steps:[['Durchstreift den Markt','Wählet oben eine der Hallen – Erze, Blöcke und Blockpaletten, Waffen und Rüstung, Bau- und Farmdienste, Geländegestaltung oder Item-Wunsch – oder befraget die Suche nach dem Gewünschten. Auf der Startseite könnt Ihr die Warenreihen mit den Pfeilen nach links und rechts durchblättern.'],
  ['Erwählet Eure Ware','Tippet auf eine Karte, so öffnet sich die Ware. Wählet die Beschaffenheit (etwa Roherz oder geschmolzenen Barren, die Holzart und dergleichen) sowie die Menge in Stacks – ein Stack umfasst vierundsechzig Stück. Bei Waffen und Rüstung öffnet das Menü „Verzauberungen wählen“ und setzet ein Häkchen bei jeder gewünschten; der Preis steigt und sinkt alsogleich. Ist eine Ware durchgestrichen, so können wir sie derzeit nicht feilbieten.'],
  ['Ruft uns zum Werk','Für Bauwerk, Farmen, Geländegestaltung und Sonderwünsche gibt es keinen festen Preis. Füllet das kurze Schreiben aus; wir prüfen Euer Begehr und unterbreiten Euch ein Angebot. Findet Ihr eine Ware nicht im Sortiment, so nutzet den Item-Wunsch: Nennet Euren Namen, das Item, die Stacks und was Ihr sonst zu sagen habt.'],
  ['Der Warenkorb','Im Warenkorb könnt Ihr Mengen ändern oder Waren entfernen. Traget Euren Ingame-Namen ein – ohne ihn kann die Bestellung nicht ergehen – und wählet die Lieferung: Standard, Wunschtermin oder Express. Wunschtermin und Express kosten einen Aufschlag in Diamanten, den Ihr dort ausgewiesen seht. Alle Preise sind in Diamanten bemessen.'],
  ['Merket Euch die Nummer','Nach der Bestellung erhaltet Ihr eine Bestellnummer. Behaltet sie wohl im Gedächtnis, damit Ihr Euer Gesuch wiederfindet.'],
  ['Verfolgt Euer Werk','Im Reiter „Bestellungen“ seht Ihr alle laufenden Aufträge. Euer Name wird dort niemandem offenbart, Eure Bestellung aber ist für Euch hervorgehoben. Ein Balken zeigt in Prozent, wie weit das Werk gediehen ist; tippet darauf, so seht Ihr bei jeder Ware, wie viel schon vollbracht ist.']],
  st:{queue:'Das Gesuch harrt in der Reihe, bis ein Handwerker Zeit findet.',work:'Unsere Leute schuften bereits an Eurem Auftrag.',ready:'Das Gröbste ist vollbracht; es fehlt nur noch die Zustellung.',done:'Das Werk ist vollendet und übergeben.'},
  faq:[['Bedarf es eines Kontos?','Mitnichten. Nur Euren Ingame-Namen benötigen wir.'],['Eine Ware ist durchgestrichen. Was hat das zu bedeuten?','Nach Rücksprache können wir sie dieser Tage nicht feilbieten. Schauet später wieder vorbei.'],['Ich finde meine Ware nicht.','Nutzet den Item-Wunsch. Dort dürft Ihr jedes Item begehren, auch wenn es nicht im Sortiment ist.']]}};
function Help({go}){
 const [m,setM]=useState('plain');const g=GUIDE[m];
 return <div className="max-w-3xl mx-auto px-5 py-12">
  <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><h1 className="font-display text-5xl">{g.title}</h1>
   <div className="inline-flex border border-line rounded-full p-1 text-sm">{[['plain','Einfaches Deutsch'],['medieval','Unc-Version']].map(([k,l])=><button key={k} onClick={()=>setM(k)} className={`px-4 py-1.5 rounded-full transition ${m===k?'bg-gold text-ink font-medium':'text-zinc-400 hover:text-white'}`}>{l}</button>)}</div></div>
  <p className="text-zinc-400 mb-8">{g.intro}</p>
  <div className="space-y-4">{g.steps.map(([h,t],i)=><div key={i} className="card flex gap-5"><div className="font-display text-4xl text-gold leading-none w-8 shrink-0">{i+1}</div><div><h2 className="font-medium text-lg mb-1">{h}</h2><p className="text-zinc-400 text-sm leading-relaxed">{t}</p></div></div>)}</div>
  <h2 className="font-display text-3xl mt-12 mb-4">{g.sh}</h2>
  <div className="card divide-y divide-line">{Object.keys(CFG.STAT).map(k=><div key={k} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="w-44"><Badge s={k}/></div><span className="text-sm text-zinc-400 flex-1 min-w-[200px]">{g.st[k]}</span></div>)}</div>
  <h2 className="font-display text-3xl mt-12 mb-4">{g.fh}</h2>
  <div className="space-y-3">{g.faq.map(([q,a])=><div key={q} className="card"><div className="font-medium">{q}</div><p className="text-sm text-zinc-400 mt-1">{a}</p></div>)}</div>
  <div className="mt-10"><button className="gold" onClick={()=>go({v:'home'})}>{g.cta}</button></div></div>}

function ItemRequest({p,place}){
 const [f,setF]=useState({name:'',item:'',stacks:1,note:''});const ok=f.name.trim()&&f.item.trim()&&f.stacks>=1;
 return <div className="max-w-2xl mx-auto px-5 py-12"><h1 className="font-display text-4xl mb-2">Individuelles Item anfragen</h1><p className="text-zinc-500 mb-8">Dein Item ist nicht im Shop? Sag uns, was du brauchst. Wir prüfen die Anfrage und erstellen dir ein individuelles Angebot.</p>
  <div className="space-y-4"><L t="Ingame-Name *"><input className="inp mt-1" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></L>
   <L t="Item *"><input className="inp mt-1" placeholder="z. B. Bienenstock, Beacon, Netherrack" value={f.item} onChange={e=>setF({...f,item:e.target.value})}/></L>
   <L t="Anzahl Stacks *"><input type="number" min="1" className="inp mt-1" value={f.stacks} onChange={e=>setF({...f,stacks:Math.max(1,Math.round(+e.target.value||1))})}/></L>
   <L t="Zusätzliche Infos (optional)"><textarea rows={4} className="inp mt-1" placeholder="Verzauberungen, Farbe, Zeitraum, sonstige Wünsche …" value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></L>
   <button disabled={!ok} className="gold" onClick={()=>place({name:f.name.trim(),delivery:'standard',fee:0,items:[{name:'Individuell: '+f.item.trim(),qty:f.stacks,done:0,note:f.note}]})}>Anfrage senden</button></div></div>}

function Cart({cart,setCart,place,dl}){
 const [f,setF]=useState({name:'',delivery:'standard'}),sub=cart.reduce((a,i)=>a+i.unit*i.qty,0),fee=dl[f.delivery].price,total=sub+fee;
 const upd=(k,q)=>setCart(cart.map(i=>i.key===k?{...i,qty:Math.max(1,q)}:i));
 return <div className="max-w-5xl mx-auto px-5 py-12"><h1 className="font-display text-5xl mb-8">Warenkorb</h1>
  {!cart.length?<p className="text-zinc-500">Dein Warenkorb ist leer.</p>:<div className="grid md:grid-cols-[1fr_340px] gap-8"><div className="card divide-y divide-line">{cart.map(i=><div key={i.key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className="flex-1"><div>{i.name}</div><div className="text-xs text-zinc-500">{i.variant}</div></div>
   <div className="inline-flex items-center border border-line rounded-lg"><button className="w-8 h-8" onClick={()=>upd(i.key,i.qty-1)}>−</button><span className="w-8 text-center">{i.qty}</span><button className="w-8 h-8" onClick={()=>upd(i.key,i.qty+1)}>+</button></div>
   <span className="w-16 text-right text-gold">💎 {i.unit*i.qty}</span><button className="text-zinc-500 hover:text-white" onClick={()=>setCart(cart.filter(x=>x.key!==i.key))}>✕</button></div>)}</div>
   <div className="card space-y-3 h-fit"><L t="Ingame-Name (Pflichtfeld) *"><input className={`inp mt-1 ${f.name.trim()?'':'!border-gold/50'}`} placeholder="Dein Minecraft-Name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></L>
    
    <select className="inp" value={f.delivery} onChange={e=>setF({...f,delivery:e.target.value})}>{Object.entries(dl).map(([k,d])=><option key={k} value={k}>{d.label}{d.price>0?` (+💎 ${d.price})`:' (kostenlos)'}</option>)}</select><p className="text-xs text-zinc-500">{dl[f.delivery].desc}</p>
    <div className="text-sm text-zinc-400 space-y-1 pt-3 border-t border-line"><div className="flex justify-between"><span>Artikel</span><span>💎 {sub}</span></div><div className="flex justify-between"><span>{dl[f.delivery].label}</span><span>{fee>0?`+💎 ${fee}`:'kostenlos'}</span></div></div><div className="flex justify-between pt-3 border-t border-line"><span>Gesamt</span><span className="text-gold text-xl">💎 {total}</span></div>
    <button disabled={!f.name.trim()} className="gold w-full" onClick={()=>place({name:f.name.trim(),delivery:f.delivery,fee,total,items:cart.map(i=>({name:i.name,variant:i.variant,qty:i.qty,done:0,piece:i.piece}))})}>Bestellen</button>
    {!f.name.trim()&&<p className="text-xs text-zinc-500">Bitte gib deinen Ingame-Namen an, damit wir dir die Bestellung zustellen können.</p>}</div></div>}</div>}

function OrdersPublic({s,flash,reload}){
 const [open,setOpen]=useState(flash),[all,setAll]=useState(false);
 useEffect(()=>{reload();const t=setInterval(reload,20000);return()=>clearInterval(t)},[]);
 const list=s.orders.filter(o=>all||o.status!=='done').sort((a,b)=>b.no-a.no);
 const queue=s.orders.filter(o=>o.status==='queue').sort((a,b)=>a.no-b.no).map(o=>o.no);
 return <div className="max-w-4xl mx-auto px-5 py-12"><h1 className="font-display text-5xl mb-2">Bestellungen</h1><p className="text-zinc-500 mb-6">Alle aktuellen Aufträge mit Fortschritt. Namen sind nicht öffentlich sichtbar. Klicke auf eine Bestellung für Details.</p>
  {flash&&<div className="card !border-gold/60 mb-6">Danke! Deine Bestellung hat die Nummer <b className="text-gold">#{flash}</b>. Merke sie dir, um den Fortschritt hier zu verfolgen.</div>}
  <label className="text-sm text-zinc-400 flex items-center gap-2 mb-5"><input type="checkbox" checked={all} onChange={e=>setAll(e.target.checked)}/> Abgeschlossene anzeigen</label>
  {!list.length&&<p className="text-zinc-500">Keine aktuellen Bestellungen.</p>}
  {list.map(o=>{const p=pct(o),op=open===o.no,mine=s.mine.includes(o.no);return <div key={o.no} className={`card mb-3 !p-0 ${mine?'!border-gold/60':''}`}>
   <button className="w-full text-left p-5" onClick={()=>setOpen(op?null:o.no)}>
    <div className="flex flex-wrap items-center gap-3 justify-between"><span className="font-medium">#{o.no}{mine&&<span className="ml-2 text-xs text-gold">Deine Bestellung</span>}</span>
     <span className="flex items-center gap-3"><span className="text-xs text-zinc-500">{o.items.length} {o.items.length===1?'Position':'Positionen'}</span>{o.status==='queue'&&<span className="text-xs text-zinc-500">Platz {queue.indexOf(o.no)+1} in der Warteschlange</span>}<Badge s={o.status}/></span></div>
    <div className="flex items-center gap-3 mt-4"><Bar v={p}/><span className="text-sm w-10 text-right">{p}%</span></div></button>
   {op&&<div className="border-t border-line p-5 space-y-4">{o.items.map((i,k)=>{const r=Math.round(100*Math.min(i.done,i.qty)/i.qty);return <div key={k}>
    <div className="flex justify-between text-sm mb-1.5"><span>{i.name}{i.variant&&` (${i.variant})`}</span><span className="text-zinc-400">{i.unit==='%'?`${r}% erledigt`:`${i.done} / ${i.qty} ${i.piece?'Stück':'Stacks'}`}</span></div><Bar v={o.status==='done'?100:r}/></div>})}</div>}</div>})}</div>}

/* ===== Admin ===== */
function AdminLogin(){
 const [e,setE]=useState(''),[p,setP]=useState(''),[err,setErr]=useState('');
 const go=async()=>{const {error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)setErr('Anmeldung fehlgeschlagen.')};
 return <div className="max-w-sm mx-auto px-5 py-24"><h1 className="font-display text-4xl mb-6">Admin-Login</h1><div className="space-y-3">
  <input type="email" className="inp" placeholder="E-Mail" value={e} onChange={x=>setE(x.target.value)}/>
  <input type="password" className="inp" placeholder="Passwort" value={p} onChange={x=>setP(x.target.value)} onKeyDown={x=>x.key==='Enter'&&go()}/>
  <button className="gold w-full" onClick={go}>Anmelden</button>{err&&<p className="text-sm text-gold">{err}</p>}</div></div>}

function AdminOrders({s,set}){
 const upd=(no,f)=>set(p=>({...p,orders:p.orders.map(o=>o.no===no?f(o):o)}));
 return <div className="space-y-4">{[...s.orders].sort((a,b)=>b.no-a.no).map(o=>{const p=pct(o);return <div key={o.no} className="card">
  <div className="flex flex-wrap items-center gap-3 justify-between"><div><b>#{o.no}</b> · <span className="text-gold">{o.name}</span> <span className="text-xs text-zinc-500">· {o.date} · {s.delivery[o.delivery]?.label||o.delivery}{o.fee>0&&` (+💎 ${o.fee})`}{o.total!=null&&` · Summe 💎 ${o.total}`}</span></div>
   <div className="flex gap-2"><select className="inp !w-auto" value={o.status} onChange={e=>upd(o.no,x=>({...x,status:e.target.value}))}>{Object.entries(CFG.STAT).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
   <button className="btn" onClick={()=>confirm('Bestellung #'+o.no+' löschen?')&&set(p=>({...p,orders:p.orders.filter(x=>x.no!==o.no)}))}>Löschen</button></div></div>
  <div className="flex items-center gap-3 mt-4"><Bar v={p}/><span className="text-sm w-10 text-right">{p}%</span></div>
  <div className="mt-4 space-y-3">{o.items.map((i,k)=><div key={k} className="flex flex-wrap items-center gap-3 text-sm"><span className="flex-1 min-w-[160px]">{i.name}{i.variant&&` (${i.variant})`}{i.note&&<span className="block text-xs text-zinc-500">{i.note}{i.dims&&` · ${i.dims}`}</span>}</span>
   <div className="inline-flex items-center border border-line rounded-lg"><button className="w-8 h-8" onClick={()=>upd(o.no,x=>({...x,items:x.items.map((y,j)=>j===k?{...y,done:Math.max(0,y.done-1)}:y)}))}>−</button>
    <input type="number" className="w-14 bg-transparent text-center outline-none" value={i.done} onChange={e=>upd(o.no,x=>({...x,items:x.items.map((y,j)=>j===k?{...y,done:Math.min(y.qty,Math.max(0,+e.target.value||0))}:y)}))}/>
    <button className="w-8 h-8" onClick={()=>upd(o.no,x=>({...x,items:x.items.map((y,j)=>j===k?{...y,done:Math.min(y.qty,y.done+1)}:y)}))}>+</button></div>
   <span className="text-zinc-500 w-24">von {i.qty} {i.unit==='%'?'%':i.piece?'Stück':'Stacks'}</span><button className="btn !py-1" onClick={()=>upd(o.no,x=>({...x,items:x.items.map((y,j)=>j===k?{...y,done:y.qty}:y)}))}>Fertig</button></div>)}</div></div>})}</div>}

function AdminProducts({s,set}){
 const [ed,setEd]=useState(null);const upd=(id,k,v)=>set(p=>({...p,products:p.products.map(x=>x.id===id?{...x,[k]:v}:x)}));
 const save=()=>{const row={...ed,price:ed.price===''||ed.price==null?null:+ed.price,sale:ed.sale===''||ed.sale==null?null:+ed.sale,demo:false,type:ed.cat==='waffen'?(ed.type||'sword'):ed.type,variants:ed.vtxt.split('\n').filter(l=>l.trim()).map(l=>{const [a,b]=l.split(':');return{name:a.trim(),price:+b}}),attrs:ed.atxt.split('\n').map(x=>x.trim()).filter(Boolean)};delete row.vtxt;delete row.atxt;delete row.isNew;
  set(p=>({...p,products:p.products.some(x=>x.id===row.id)?p.products.map(x=>x.id===row.id?row:x):[...p.products,row]}));setEd(null)};
 const f=k=>e=>setEd({...ed,[k]:e.target.value});
 const up=async e=>{const file=e.target.files[0];if(!file)return;const path='products/'+Date.now()+'-'+file.name.replace(/[^\w.]/g,'_');const {error}=await sb.storage.from('media').upload(path,file);if(error)return alert(error.message);setEd(x=>({...x,tex:sb.storage.from('media').getPublicUrl(path).data.publicUrl}))};
 if(ed)return <div className="card max-w-2xl space-y-4"><h2 className="font-display text-2xl">{ed.isNew?'Neues Produkt':'Produkt bearbeiten'}</h2><div className="grid sm:grid-cols-2 gap-4">
  <L t="Name"><input className="inp" value={ed.name} onChange={f('name')}/></L><L t="Kategorie"><select className="inp" value={ed.cat} onChange={f('cat')}>{s.cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
  <L t="Preis in Diamanten (leer = Anfrage)"><input type="number" className="inp" value={ed.price??''} onChange={f('price')}/></L><L t="Angebotspreis (optional)"><input type="number" className="inp" value={ed.sale??''} onChange={f('sale')}/></L></div>
  {ed.cat==='waffen'&&<L t="Typ (bestimmt, welche Verzauberungen wählbar sind)"><select className="inp" value={ed.type||'sword'} onChange={f('type')}>{Object.entries(TYPES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></L>}<L t="Beschreibung"><textarea rows={3} className="inp" value={ed.desc} onChange={f('desc')}/></L><L t="Varianten (Name: Preis, eine pro Zeile)"><textarea rows={3} className="inp" value={ed.vtxt} onChange={f('vtxt')}/></L>
  <L t="Eigenschaften / Verzauberungen (eine pro Zeile)"><textarea rows={3} className="inp" value={ed.atxt} onChange={f('atxt')}/></L><L t="Bild-URL (optional, sonst erscheint ein Platzhalter)"><input className="inp" placeholder="https://…" value={ed.tex||''} onChange={f('tex')}/></L><L t="Oder Bild hochladen"><input type="file" accept="image/*" onChange={up} className="text-sm mt-1"/></L>
  <div className="flex gap-3"><button className="gold" onClick={save}>Speichern</button><button className="btn" onClick={()=>setEd(null)}>Abbrechen</button></div></div>;
 return <div><button className="gold mb-5" onClick={()=>setEd({id:'n'+Date.now(),isNew:true,cat:s.cats[0].id,name:'',desc:'',price:'',sale:'',tex:'',variants:[],vtxt:'',atxt:'',attrs:[],featured:false,struck:false,active:true})}>+ Neues Produkt</button>
  <div className="card !p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-zinc-500"><tr><th className="p-3">Produkt</th><th>Preis</th><th title="Aktuell nicht verkäuflich">Durchgestrichen</th><th>Sichtbar</th><th>Hervorgehoben</th><th></th></tr></thead><tbody>
  {s.products.map(p=><tr key={p.id} className="border-t border-line"><td className={`p-3 ${p.struck?'line-through text-zinc-500':''}`}>{p.name}{p.demo&&<span className="ml-2 text-[10px] text-zinc-500 border border-line px-1 rounded">DEMO</span>}</td><td>{p.price??'Anfrage'}</td>
   <td><input type="checkbox" checked={p.struck} onChange={e=>upd(p.id,'struck',e.target.checked)}/></td><td><input type="checkbox" checked={p.active} onChange={e=>upd(p.id,'active',e.target.checked)}/></td><td><input type="checkbox" checked={p.featured} onChange={e=>upd(p.id,'featured',e.target.checked)}/></td>
   <td className="p-3 text-right"><button className="btn" onClick={()=>setEd({...p,vtxt:p.variants.map(v=>v.name+': '+v.price).join('\n'),atxt:p.attrs.join('\n')})}>Bearbeiten</button></td></tr>)}</tbody></table></div></div>}

function AdminEnch({s,set}){
 const upd=(id,f)=>set(p=>({...p,ench:p.ench.map(e=>e.id===id?f(e):e)}));
 return <div><p className="text-sm text-zinc-500 mb-5">Jede Verzauberung hat einen Aufpreis in ganzen Diamanten. Im Shop wird er beim Ankreuzen automatisch zum Preis addiert, beim Abwählen wieder abgezogen. Unter „Gilt für“ legst du fest, bei welchen Gegenständen sie wählbar ist (Rüstung, Nahkampf, Fernkampf, Werkzeuge, Sonstiges).</p>
  <div className="card !p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-zinc-500"><tr><th className="p-3">Verzauberung</th><th>Aufpreis 💎</th><th>Gilt für</th><th></th></tr></thead><tbody>
  {s.ench.map(e=><tr key={e.id} className="border-t border-line align-top"><td className="p-3"><input className="inp !w-48" value={e.name} onChange={x=>upd(e.id,y=>({...y,name:x.target.value}))}/></td>
   <td className="p-3"><input type="number" min="0" className="inp !w-24" value={e.price} onChange={x=>upd(e.id,y=>({...y,price:Math.max(0,Math.round(+x.target.value||0))}))}/></td>
   <td className="p-3 min-w-[340px]">{GROUPS.map(([g,ks])=>{const all=ks.every(k=>e.types.includes(k));return <div key={g} className="mb-2"><div className="flex items-center gap-2 mb-1"><span className="text-[11px] uppercase tracking-widest text-zinc-500">{g}</span><button className="text-[11px] text-gold" onClick={()=>upd(e.id,y=>({...y,types:all?y.types.filter(t=>!ks.includes(t)):[...new Set([...y.types,...ks])]}))}>{all?'keine':'alle'}</button></div><div className="flex flex-wrap gap-1.5">{ks.map(k=><button key={k} onClick={()=>upd(e.id,y=>({...y,types:y.types.includes(k)?y.types.filter(t=>t!==k):[...y.types,k]}))} className={`text-xs border rounded-full px-2.5 py-1 ${e.types.includes(k)?'border-gold text-gold':'border-line text-zinc-500'}`}>{TYPES[k]}</button>)}</div></div>})}</td>
   <td className="p-3 text-right"><button className="btn" onClick={()=>set(p=>({...p,ench:p.ench.filter(x=>x.id!==e.id)}))}>Löschen</button></td></tr>)}</tbody></table></div>
  <button className="gold mt-5" onClick={()=>set(p=>({...p,ench:[...p.ench,{id:'x'+Date.now(),name:'Neue Verzauberung',price:10,types:['sword']}]}))}>+ Verzauberung</button></div>}

function AdminOres({s,set}){
 const ores=s.products.filter(p=>p.cat==='erze');const n=x=>Math.max(0,Math.round(+x||0));
 const upd=(id,f)=>set(p=>({...p,products:p.products.map(x=>x.id===id?f(x):x)}));
 return <div><p className="text-sm text-zinc-500 mb-5">Preise pro Stack (64) in ganzen Diamanten. Erze mit Roherz und Barren zeigen dem Kunden ein Dropdown. Bei Erzen ohne Roh-Variante (zum Beispiel Diamant oder Redstone) gibt es nur einen Preis, die Auswahl lässt sich aber aktivieren.</p>
  <div className="card !p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-zinc-500"><tr><th className="p-3">Erz</th><th>Roherz 💎</th><th>Geschmolzener Barren 💎</th><th>Einzelpreis 💎</th><th></th></tr></thead><tbody>
  {ores.map(p=>{const two=p.variants.length>0;return <tr key={p.id} className="border-t border-line"><td className="p-3">{p.name}</td>
   {[0,1].map(i=><td key={i} className="p-3">{p.variants[i]?<input type="number" min="0" className="inp !w-24" value={p.variants[i].price} onChange={e=>upd(p.id,x=>({...x,variants:x.variants.map((y,j)=>j===i?{...y,price:n(e.target.value)}:y)}))}/>:<span className="text-zinc-600">–</span>}</td>)}
   <td className="p-3">{!two?<input type="number" min="0" className="inp !w-24" value={p.price??''} onChange={e=>upd(p.id,x=>({...x,price:n(e.target.value)}))}/>:<span className="text-zinc-600">–</span>}</td>
   <td className="p-3 text-right">{two?<button className="btn" onClick={()=>upd(p.id,x=>({...x,price:x.variants[0].price,variants:[]}))}>Auswahl entfernen</button>:<button className="btn" onClick={()=>upd(p.id,x=>({...x,variants:[{name:'Roherz',price:x.price||0},{name:'Geschmolzener Barren',price:(x.price||0)+4}]}))}>Roh/Barren aktivieren</button>}</td></tr>})}</tbody></table></div></div>}

function AdminDelivery({s,set}){
 const upd=(k,f)=>set(p=>({...p,delivery:{...p.delivery,[k]:f(p.delivery[k])}}));
 return <div><p className="text-sm text-zinc-500 mb-5">Aufpreis in ganzen Diamanten. Er wird im Warenkorb zum Gesamtpreis addiert, 0 bedeutet kostenlos. Gilt für neue Bestellungen.</p>
  <div className="card !p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-zinc-500"><tr><th className="p-3">Lieferoption</th><th>Aufpreis 💎</th><th>Beschreibung</th></tr></thead><tbody>
  {Object.entries(s.delivery).map(([k,d])=><tr key={k} className="border-t border-line"><td className="p-3"><input className="inp !w-44" value={d.label} onChange={e=>upd(k,x=>({...x,label:e.target.value}))}/></td>
   <td className="p-3"><input type="number" min="0" className="inp !w-24" value={d.price} onChange={e=>upd(k,x=>({...x,price:Math.max(0,Math.round(+e.target.value||0))}))}/></td>
   <td className="p-3"><input className="inp" value={d.desc} onChange={e=>upd(k,x=>({...x,desc:e.target.value}))}/></td></tr>)}</tbody></table></div></div>}

function AdminCats({s,set}){
 const upd=(id,f)=>set(p=>({...p,cats:p.cats.map(c=>c.id===id?f(c):c)}));
 return <div><p className="text-sm text-zinc-500 mb-5">Kategorien erscheinen im Shop als Regale und in der Navigation. „Dienstleistung“ bedeutet: Anfrage statt Kauf. Die Kategorien Erze, Waffen & Rüstung und Item-Wunsch haben feste Funktionen und sollten nicht umbenannt werden.</p>
  <div className="card divide-y divide-line">{s.cats.map(c=><div key={c.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"><input className="inp !w-64" value={c.name} onChange={e=>upd(c.id,x=>({...x,name:e.target.value}))}/>
   <select className="inp !w-auto" value={c.kind} onChange={e=>upd(c.id,x=>({...x,kind:e.target.value}))}><option value="p">Produkte (Kauf)</option><option value="s">Dienstleistung (Anfrage)</option></select></div>)}</div>
  <button className="gold mt-5" onClick={()=>set(p=>({...p,cats:[...p.cats,{id:'k'+Date.now(),name:'Neue Kategorie',kind:'p'}]}))}>+ Kategorie</button></div>}

function Admin({s,set,auth}){
 const [tab,setTab]=useState('o');
 if(!auth.ready)return <p className="p-16 text-center text-zinc-500">Lädt …</p>;
 if(!auth.user)return <AdminLogin/>;
 if(!auth.admin)return <div className="max-w-sm mx-auto px-5 py-24"><p className="text-zinc-400">Dieses Konto ist nicht als Admin freigeschaltet.</p><button className="btn mt-4" onClick={()=>sb.auth.signOut()}>Abmelden</button></div>;
 return <div className="max-w-7xl mx-auto px-5 py-10"><div className="flex justify-between items-center mb-6"><h1 className="font-display text-4xl">Admin</h1>
  <div className="flex items-center gap-4"><span className="text-xs text-zinc-500">{s.sync==='saving'?'Speichert …':s.sync==='error'?'Fehler beim Speichern':'Alle Änderungen gespeichert'}</span><button className="btn" onClick={()=>sb.auth.signOut()}>Abmelden</button></div></div>
  <div className="flex flex-wrap gap-2 mb-8">{[['o','Bestellungen verwalten'],['p','Produkte'],['r','Erze & Preise'],['e','Verzauberungen & Preise'],['l','Lieferoptionen'],['k','Kategorien']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`btn ${tab===k?'!border-gold text-gold':''}`}>{l}</button>)}</div>
  {tab==='o'?<AdminOrders s={s} set={set}/>:tab==='e'?<AdminEnch s={s} set={set}/>:tab==='r'?<AdminOres s={s} set={set}/>:tab==='l'?<AdminDelivery s={s} set={set}/>:tab==='k'?<AdminCats s={s} set={set}/>:<AdminProducts s={s} set={set}/>}</div>}

/* ===== App ===== */
function App(){
 const auth=useAuth(),[s,set,addMine,reload]=useStore(auth.admin),[view,go0]=useState({v:'home'}),[cart,setCart]=useState([]),[q,setQ]=useState(''),[flash,setFlash]=useState(null);
 const go=v=>{go0(v);window.scrollTo({top:0,behavior:'smooth'})};
 const vis=s.products.filter(p=>p.active);
 const addCart=(p,v,qty,en=[])=>{const key=p.id+(v?.name||'')+en.map(e=>e.id).join(',');const vt=[v?.name,...en.map(e=>e.name)].filter(Boolean).join(', ')||null;const unit=eff(p,v)+en.reduce((a,e)=>a+e.price,0);setCart(c=>c.find(i=>i.key===key)?c.map(i=>i.key===key?{...i,qty:i.qty+qty}:i):[...c,{key,name:p.name,variant:vt,qty,unit,piece:p.cat==='waffen'}]);go({v:'cart'})};
 const place=async o=>{const {data,error}=await sb.rpc('place_order',{p_name:o.name,p_delivery:o.delivery,p_fee:o.fee||0,p_total:o.total??null,p_items:o.items});
  if(error)return alert('Bestellung fehlgeschlagen: '+error.message);setCart([]);addMine(data);setFlash(data);go({v:'orders'})};
 const open=p=>go({v:'product',id:p.id});
 let body;
 if(q.trim()){const r=vis.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));body=<div className="max-w-7xl mx-auto px-5 py-12"><h1 className="font-display text-4xl mb-8">Suche: „{q}“</h1><div className="grid grid-cols-2 md:grid-cols-4 gap-5">{r.map(p=><Card key={p.id} p={p} onOpen={p=>{setQ('');open(p)}} grid/>)}</div></div>}
 else if(view.v==='product')body=<Product key={view.id} p={s.products.find(p=>p.id===view.id)} s={s} go={go} addCart={addCart}/>;
 else if(view.v==='request'){const rp=s.products.find(p=>p.id===view.id);body=rp.cat==='custom'?<ItemRequest p={rp} place={place}/>:<Request p={rp} place={place} go={go}/>}
 else if(view.v==='cat'){const c=s.cats.find(c=>c.id===view.id);body=<div className="max-w-7xl mx-auto px-5 py-12"><h1 className="font-display text-5xl mb-10">{c.name}</h1><div className="grid grid-cols-2 md:grid-cols-4 gap-5">{vis.filter(p=>p.cat===c.id).map(p=><Card key={p.id} p={p} onOpen={open} grid/>)}</div></div>}
 else if(view.v==='cart')body=<Cart cart={cart} setCart={setCart} place={place} dl={s.delivery}/>;
 else if(view.v==='help')body=<Help go={go}/>;
 else if(view.v==='orders')body=<OrdersPublic s={s} flash={flash} reload={reload}/>;
 else if(view.v==='admin')body=<Admin s={s} set={set} auth={auth}/>;
 else body=<div className="pb-20"><section className="border-b border-line" style={{background:'radial-gradient(ellipse at top,#1d1b16,transparent 70%)'}}><div className="max-w-7xl mx-auto px-5 py-24 sm:py-32">
   <p className="text-xs tracking-[.4em] text-gold mb-5">EXKLUSIVER MINECRAFT-SHOP</p><h1 className="font-display text-5xl sm:text-7xl leading-[1.05] max-w-3xl">Your World.<br/>Our Craft.</h1>
   <p className="mt-6 text-zinc-400 max-w-xl">Erze, Baumaterial, Ausrüstung und Dienstleistungen für euer Projekt. Bestellen ohne Konto, Fortschritt live verfolgen.</p>
   <div className="mt-8 flex gap-3"><button className="gold" onClick={()=>go({v:'cat',id:'erze'})}>Shop entdecken</button><button className="btn" onClick={()=>go({v:'orders'})}>Bestellungen ansehen</button></div></div></section>
  <Shelf title="Hervorgehobene Angebote" items={vis.filter(p=>p.featured||onSale(p))} onOpen={open}/>{s.cats.filter(c=>c.id!=='custom').map(c=><Shelf key={c.id} title={c.name} items={vis.filter(p=>p.cat===c.id)} onOpen={open}/>)}
  {vis.find(p=>p.cat==='custom')&&<section className="max-w-7xl mx-auto px-5 mt-14"><div className="card flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-3xl">Item nicht gefunden?</h2><p className="text-zinc-400 mt-1">Frag dein Wunsch-Item individuell an. Wir prüfen es und machen dir ein Angebot.</p></div><button className="gold" onClick={()=>go({v:'request',id:vis.find(p=>p.cat==='custom').id})}>Item anfragen</button></div></section>}</div>;
 const link="hover:text-gold";
 return <div className="min-h-screen flex flex-col"><header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-line">
  <div className="max-w-7xl mx-auto px-5 h-16 flex items-center gap-6"><button onClick={()=>{setQ('');go({v:'home'})}} className="font-display text-2xl tracking-[.3em] text-gold">STREAMAZON</button>
   <input className="inp !max-w-md hidden md:block" placeholder="Produkte suchen …" value={q} onChange={e=>setQ(e.target.value)}/>
   <nav className="ml-auto flex items-center gap-5 text-sm"><button className={link} onClick={()=>{setQ('');go({v:'help'})}}>So geht’s</button><button className={link} onClick={()=>{setQ('');go({v:'orders'})}}>Bestellungen</button><button className={link} onClick={()=>{setQ('');go({v:'cart'})}}>Warenkorb ({cart.reduce((a,i)=>a+i.qty,0)})</button></nav></div>
  <div className="border-t border-line"><div className="max-w-7xl mx-auto px-5 flex gap-6 overflow-x-auto hide-sb text-sm py-2 text-zinc-400">{s.cats.map(c=><button key={c.id} className={`whitespace-nowrap ${link}`} onClick={()=>{setQ('');go({v:'cat',id:c.id})}}>{c.name}</button>)}</div></div></header>
  <main className="flex-1">{body}</main>
  <footer className="border-t border-line py-10 text-center text-xs text-zinc-500"><span className="tracking-widest">© STREAMAZON</span> · <button className="hover:text-gold" onClick={()=>go({v:'admin'})}>Admin</button></footer></div>}
export default App;
