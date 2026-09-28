
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOKqDlPrdoXAGF6UoWm8bz3L9DEmIhD5E",
  authDomain: "vantage-journal.firebaseapp.com",
  projectId: "vantage-journal",
  storageBucket: "vantage-journal.firebasestorage.app",
  messagingSenderId: "823515562113",
  appId: "1:823515562113:web:698399e453fa55e9984d80"
};

const OWNER_UID = "p9MriJysILMUdqWVl844PTF0xgo2";
const EXPEDITION_ID = "main";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const icons={Explore:"🧭",Journal:"▣",Items:"🎒",Map:"🗺️",Discoveries:"✣",Activity:"♙",Guide:"?"};
const pages=["Explore","Journal","Items","Map","Discoveries","Activity","Guide"];
let currentPage="Explore", detailLocation=null, currentMember=null;
let state={current:null,locations:{},discoveries:[]};

const authScreen=document.getElementById("authScreen");
const loginForm=document.getElementById("loginForm");
const loginError=document.getElementById("loginError");

loginForm.addEventListener("submit",async(e)=>{
  e.preventDefault(); loginError.textContent="";
  try { await signInWithEmailAndPassword(auth,loginEmail.value.trim(),loginPassword.value); }
  catch(err){ loginError.textContent="Sign-in failed. Check your email and password."; }
});
document.getElementById("signOutBtn").onclick=()=>signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(!user){ authScreen.classList.remove("hidden"); return; }
  try{
    await bootstrapOwner(user);
    currentMember=await getMember(user.uid);
    if(!currentMember) throw new Error("This account is not a member of the Vantage Expedition.");
    document.getElementById("profileName").textContent=currentMember.displayName||"Member";
    document.getElementById("profileRole").textContent=currentMember.role==="owner"?"Owner":"Member";
    document.getElementById("profileInitial").textContent=(currentMember.displayName||"M")[0].toUpperCase();
    authScreen.classList.add("hidden");
    await loadState();
    render();
  }catch(err){
    authScreen.classList.remove("hidden");
    loginError.textContent=err.message||"Unable to open the expedition.";
    await signOut(auth);
  }
});

async function bootstrapOwner(user){
  if(user.uid!==OWNER_UID) return;
  const expRef=doc(db,"expeditions",EXPEDITION_ID);
  const memberRef=doc(db,"expeditions",EXPEDITION_ID,"members",user.uid);
  const expSnap=await getDoc(expRef);
  if(!expSnap.exists()){
    await setDoc(expRef,{name:"Vantage Expedition",ownerId:OWNER_UID,createdAt:serverTimestamp()});
  }
  const memberSnap=await getDoc(memberRef);
  if(!memberSnap.exists()){
    await setDoc(memberRef,{displayName:"Pete",role:"owner",joinedAt:serverTimestamp()});
  }
}
async function getMember(uid){
  const s=await getDoc(doc(db,"expeditions",EXPEDITION_ID,"members",uid));
  return s.exists()?s.data():null;
}
async function loadState(){
  state={current:null,locations:{},discoveries:[]};
  const locs=await getDocs(collection(db,"expeditions",EXPEDITION_ID,"locations"));
  locs.forEach(s=>state.locations[s.id]={...s.data(),id:s.id});
  const discs=await getDocs(collection(db,"expeditions",EXPEDITION_ID,"discoveries"));
  discs.forEach(s=>state.discoveries.push({...s.data(),id:s.id}));
  const exp=await getDoc(doc(db,"expeditions",EXPEDITION_ID));
  state.current=exp.data()?.currentLocation||null;
}
function navHTML(mobile=false){return pages.slice(0,mobile?4:7).map(p=>`<button class="navbtn ${currentPage===p?"active":""}" data-page="${p}">${mobile?`<span>${icons[p]}</span>`:icons[p]+" &nbsp;"}${p}</button>`).join("")}
function bindNav(){document.querySelectorAll(".navbtn").forEach(b=>b.onclick=()=>{currentPage=b.dataset.page;detailLocation=null;render()})}
function typeTag(t=""){if(t.includes("Requirement"))return '<span class="tag req">Requirement</span>';if(t.includes("Item"))return '<span class="tag">Item</span>';return '<span class="tag note">Note</span>'}
function discoveryRow(d){return `<div class="row"><div class="row-icon">${(d.type||"").includes("Item")?"🎒":(d.type||"").includes("Requirement")?"🧰":"📝"}</div><div class="row-main"><strong>${d.title||d.type}</strong><small>${(d.action||"").toUpperCase()}${d.specific?" → "+d.specific:""} · ${d.notes||""}</small><small>Added by ${d.byName||"Member"}${d.dateText?" · "+d.dateText:""}</small></div>${typeTag(d.type)}</div>`}
function explore(){
 if(!state.current) return `<div class="card empty"><h2>Start your shared journal</h2><p>No current location has been recorded yet.</p><button class="primary" id="setFirstLocation">Set first location</button></div>`;
 const l=state.locations[state.current]||{name:"Unnamed location",connections:{}}, ds=state.discoveries.filter(d=>String(d.location)===String(state.current)), c=l.connections||{};
 return `<div class="grid2"><div class="card"><h3>Current Location</h3><div class="location-number">${state.current}</div><div class="location-name">${l.name||"Unnamed location"}</div>
 <div class="compass"><div class="north node">${c.N||"?"}</div><div class="west node">${c.W||"?"}</div><div class="center node current">${state.current}</div><div class="east node">${c.E||"?"}</div><div class="south node">${c.S||"?"}</div></div></div>
 <div class="card"><h3>Quick Record</h3><p>What action did you take here?</p><div class="quick">${[["👁","Look"],["🤝","Help"],["💬","Engage"],["✋","Take"],["⚔","Overpower"],["🧭","Move"]].map(x=>`<button class="action" data-action="${x[1]}"><span>${x[0]}</span>${x[1]}</button>`).join("")}</div><button class="primary wide" id="addDisc">+ Add discovery</button></div></div>
 <h2 class="section-title">What we know here</h2><div class="card knowledge">${ds.length?ds.map(discoveryRow).join(""):'<div class="empty">Nothing recorded here yet.</div>'}</div>`;
}
function journal(){
 const entries=Object.entries(state.locations);
 return `<div class="toolbar"><input class="search" id="journalSearch" placeholder="🔎 Search locations, notes, items..."></div><div class="card knowledge" id="journalList">${entries.length?entries.map(([n,l])=>journalRow(n,l)).join(""):'<div class="empty">Your journal is empty.</div>'}</div>`;
}
function journalRow(n,l){const ds=state.discoveries.filter(d=>String(d.location)===String(n));return `<div class="row journal-entry" data-location="${n}"><div class="row-main"><strong>${n} &nbsp; ${l.name||"Unnamed location"}</strong><small>${l.notes||ds.map(d=>d.title).filter(Boolean).join(" · ")||"No notes yet"}</small><small>${ds.length} discoveries</small></div>${l.return?'<span class="star">★</span>':""}</div>`}
function items(){
 const items=state.discoveries.filter(d=>(d.type||"").includes("Item")&&d.title).reduce((a,d)=>{a[d.title]=a[d.title]||[];a[d.title].push(d);return a},{});
 return `<div class="toolbar"><input class="search" placeholder="🔎 Find an item..."></div><div class="card knowledge">${Object.keys(items).length?Object.entries(items).map(([name,ds])=>`<div class="row"><div class="row-icon">🎒</div><div class="row-main"><strong>${name}</strong>${ds.map(d=>`<small>📍 Location ${d.location} · ${(d.action||"").toUpperCase()}${d.specific?" → "+d.specific:""}</small>`).join("")}</div><span class="tag">${ds.length} source${ds.length===1?"":"s"}</span></div>`).join(""):'<div class="empty">Items appear here only after your group discovers them.</div>'}</div>`;
}
function mapPage(){const ns=Object.keys(state.locations);return `<div class="card"><h2>World Map</h2><p>Only locations your expedition has recorded are shown.</p><div class="map-area">${ns.length?ns.map((n,i)=>{const p=[10+(i*23)%78,10+(i*31)%76];return `<button class="map-node ${String(n)===String(state.current)?"current":""}" data-location="${n}" style="left:${p[0]}%;top:${p[1]}%">${n}</button>`}).join(""):'<div class="empty">No mapped locations yet.</div>'}</div></div>`}
function discoveries(){return `<div class="card knowledge">${state.discoveries.length?state.discoveries.map(discoveryRow).join(""):'<div class="empty">No discoveries recorded yet.</div>'}</div>`}
function activity(){return `<div class="card knowledge">${state.discoveries.length?[...state.discoveries].reverse().map(d=>`<div class="row"><div class="avatar">${(d.byName||"M")[0]}</div><div class="row-main"><strong>${d.byName||"Member"} added ${d.title||d.type}</strong><small>Location ${d.location} · ${(d.action||"").toUpperCase()}${d.specific?" → "+d.specific:""}</small><small>${d.dateText||""}</small></div></div>`).join(""):'<div class="empty">No activity yet.</div>'}</div>`}
function guide(){return `<div class="card"><h2>Guide</h2><p>The shared journal reveals and indexes only locations, items and information your expedition records.</p><p><strong>Items can have multiple sources.</strong> Each item discovery is stored separately, so finding the same item at another location adds another known source rather than replacing the first.</p></div>`}
function locationDetail(n){const l=state.locations[n],ds=state.discoveries.filter(d=>String(d.location)===String(n));return `<button class="secondary" id="backJournal">← Journal</button><div class="card" style="margin-top:12px"><h2>${n} &nbsp; ${l.name||"Unnamed location"} ${l.return?'<span class="star">★</span>':""}</h2><p>${l.notes||"No overview notes yet."}</p><h3>Discoveries</h3><div class="knowledge">${ds.length?ds.map(discoveryRow).join(""):'<div class="empty">No discoveries recorded.</div>'}</div><button class="primary wide" id="addDisc">+ Add discovery</button></div>`}
function render(){
 document.getElementById("desktopNav").innerHTML=navHTML();document.getElementById("mobileNav").innerHTML=navHTML(true);bindNav();
 const titles={Explore:["Explore","Record discoveries as you play"],Journal:["Journal","Your expedition's persistent knowledge"],Items:["Items","Only items your group has discovered"],Map:["Map","Your spoiler-safe discovered world"],Discoveries:["Discoveries","Search what your group has learned"],Activity:["Activity","Recent shared journal changes"],Guide:["Guide","Quick reference and journal help"]};
 pageTitle.textContent=titles[currentPage][0];pageSubtitle.textContent=titles[currentPage][1];
 content.innerHTML=detailLocation&&currentPage==="Journal"?locationDetail(detailLocation):({Explore:explore,Journal:journal,Items:items,Map:mapPage,Discoveries:discoveries,Activity:activity,Guide:guide}[currentPage]());
 document.querySelectorAll(".action").forEach(b=>b.onclick=()=>openModal(b.dataset.action));
 document.querySelectorAll("#addDisc").forEach(b=>b.onclick=()=>openModal());
 document.querySelectorAll(".journal-entry,.map-node").forEach(b=>b.onclick=()=>{detailLocation=b.dataset.location;currentPage="Journal";render()});
 const back=document.getElementById("backJournal");if(back)back.onclick=()=>{detailLocation=null;render()};
 const s=document.getElementById("journalSearch");if(s)s.oninput=()=>{const q=s.value.toLowerCase();document.querySelectorAll(".journal-entry").forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?"":"none")};
 const first=document.getElementById("setFirstLocation");if(first)first.onclick=async()=>{const n=prompt("Enter your starting location number");if(!n)return;const name=prompt("Optional location name")||"Unnamed location";await setDoc(doc(db,"expeditions",EXPEDITION_ID,"locations",String(n)),{name,notes:"",connections:{},createdBy:auth.currentUser.uid,createdAt:serverTimestamp()});await setDoc(doc(db,"expeditions",EXPEDITION_ID),{currentLocation:String(n)},{merge:true});await loadState();render()};
}
function openModal(action="Look"){discLocation.value=detailLocation||state.current||"";discAction.value=action;modalBackdrop.classList.remove("hidden")}
function closeModal(){modalBackdrop.classList.add("hidden")}
closeModalBtnSetup();
function closeModalBtnSetup(){document.getElementById("closeModal").onclick=closeModal;document.getElementById("cancelModal").onclick=closeModal;}
document.getElementById("saveDiscovery").onclick=async()=>{
 const loc=String(discLocation.value).trim(); if(!loc)return;
 const d={location:loc,action:discAction.value,specific:discSpecific.value.trim(),type:discType.value,title:discTitle.value.trim(),notes:discNotes.value.trim(),byUid:auth.currentUser.uid,byName:currentMember.displayName||"Member",dateText:new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"2-digit",year:"2-digit"}),createdAt:serverTimestamp()};
 const lr=doc(db,"expeditions",EXPEDITION_ID,"locations",loc);
 if(!(await getDoc(lr)).exists()) await setDoc(lr,{name:"Unnamed location",notes:"",connections:{},createdBy:auth.currentUser.uid,createdAt:serverTimestamp()});
 await addDoc(collection(db,"expeditions",EXPEDITION_ID,"discoveries"),d);
 await addDoc(collection(db,"expeditions",EXPEDITION_ID,"activity"),{kind:"discovery",location:loc,title:d.title||d.type,byUid:d.byUid,byName:d.byName,createdAt:serverTimestamp()});
 await loadState();closeModal();discSpecific.value=discTitle.value=discNotes.value="";render();
};
