import {useEffect,useRef,useState} from 'react';
import {sb} from './supabase.js';

/* Auth: nur Admin-Konten. Admin = Eintrag in der Tabelle "admins". */
export function useAuth(){
 const [st,setSt]=useState({ready:false,user:null,admin:false});
 useEffect(()=>{let alive=true;
  const check=async u=>{let admin=false;if(u){const {data}=await sb.from('admins').select('user_id').eq('user_id',u.id).maybeSingle();admin=!!data}if(alive)setSt({ready:true,user:u,admin})};
  sb.auth.getSession().then(({data})=>check(data.session?.user??null));
  const {data:l}=sb.auth.onAuthStateChange((_,sess)=>{setTimeout(()=>check(sess?.user??null),0)});
  return()=>{alive=false;l.subscription.unsubscribe()}},[]);
 return st}

const T={cats:['categories','id'],products:['products','id'],ench:['enchantments','id'],orders:['orders','no'],dl:['delivery_options','key']};
const toRow={products:({desc,...r})=>({...r,descr:desc}),orders:o=>({no:o.no,name:o.name,status:o.status,delivery:o.delivery,fee:o.fee,total:o.total,items:o.items})};
const dlArr=d=>Object.entries(d).map(([key,v])=>({key,label:v.label,price:v.price,descr:v.desc}));
const view=st=>({cats:st.cats,products:st.products,ench:st.ench,orders:st.orders,dl:dlArr(st.delivery)});
const strip=({pos,...r})=>r;
const readMine=()=>{try{return JSON.parse(localStorage.getItem('sz-mine')||'[]')}catch(e){return[]}};

/* Zentraler Datenspeicher. Die UI ändert den Zustand wie gewohnt, Änderungen werden
   automatisch (leicht verzögert) in Supabase gespeichert. */
export function useStore(admin){
 const [s,setS]=useState({cats:[],products:[],ench:[],delivery:{},orders:[],mine:readMine(),sync:'saved',ready:false});
 const latest=useRef(s),base=useRef(null),timer=useRef(null),busy=useRef(false),again=useRef(false),adm=useRef(admin);adm.current=admin;

 const load=async()=>{
  if(timer.current)return;if(busy.current){again.current=true;return}busy.current=true;
  const a=adm.current;
  const [c,p,e,d,o]=await Promise.all([sb.from('categories').select('*').order('pos'),sb.from('products').select('*').order('pos'),sb.from('enchantments').select('*').order('pos'),sb.from('delivery_options').select('*').order('pos'),
   a?sb.from('orders').select('*').order('no'):sb.from('public_orders').select('*').order('no')]);
  busy.current=false;if(again.current){again.current=false;return load()}if(c.error||p.error||timer.current)return;
  const data={cats:(c.data||[]).map(strip),
   products:(p.data||[]).map(r=>{const {pos,descr,...x}=r;return{...x,desc:descr||''}}),
   ench:(e.data||[]).map(strip),
   delivery:Object.fromEntries((d.data||[]).map(r=>[r.key,{label:r.label,price:r.price,desc:r.descr||''}])),
   orders:(o.data||[]).map(({created_at,...r})=>({...r,date:(created_at||'').slice(0,10)}))};
  setS(prev=>{const n={...prev,...data,ready:true};latest.current=n;base.current=JSON.parse(JSON.stringify(view(n)));return n})};

 const flush=async()=>{
  timer.current=null;const b=base.current;if(!b)return;const cur=view(latest.current);
  setS(p=>({...p,sync:'saving'}));
  try{for(const k of ['cats','products','ench','dl',...(adm.current?['orders']:[])]){
    const [table,key]=T[k];const old=new Map(b[k].map(x=>[x[key],JSON.stringify(x)]));
    const up=cur[k].filter(x=>old.get(x[key])!==JSON.stringify(x)).map(toRow[k]||(x=>x));
    const keep=new Set(cur[k].map(x=>x[key]));const del=b[k].filter(x=>!keep.has(x[key])).map(x=>x[key]);
    if(up.length){const {error}=await sb.from(table).upsert(up);if(error)throw error}
    if(del.length){const {error}=await sb.from(table).delete().in(key,del);if(error)throw error}}
   base.current=JSON.parse(JSON.stringify(cur));setS(p=>({...p,sync:'saved'}))}
  catch(e){alert('Speichern fehlgeschlagen: '+e.message);setS(p=>({...p,sync:'error'}))}};

 const set=f=>{setS(p=>{const n=f(p);latest.current=n;return n});clearTimeout(timer.current);timer.current=setTimeout(flush,700)};
 const addMine=no=>setS(p=>{const mine=[...p.mine,no];try{localStorage.setItem('sz-mine',JSON.stringify(mine))}catch(e){}const n={...p,mine};latest.current=n;return n});

 useEffect(()=>{load()},[admin]);
 useEffect(()=>{if(admin)return;
  const ch=sb.channel('shop');['products','categories','enchantments','delivery_options'].forEach(t=>ch.on('postgres_changes',{event:'*',schema:'public',table:t},load));ch.subscribe();
  return()=>{sb.removeChannel(ch)}},[admin]);
 return [s,set,addMine,load]}
