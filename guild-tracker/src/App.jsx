import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// ── Supabase client ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://mbalsusqtkbtoxuawjau.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_174MDqsta2KNe3orpEN8Ww_0yzhHYaM"; // <-- replace this
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Constants ───────────────────────────────────────────────────────────────
const MOCK_LOGO = "https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png";

const DEFAULT_BOSSES = [
  { id:1, name:"Cruel Outlaw Gand",  secs:0, minR:30, maxR:60, ch:"CH 1", color:"#f59e0b", image:null },
  { id:2, name:"Gatekeeper Amot",    secs:0, minR:45, maxR:90, ch:"CH 2", color:"#60a5fa", image:null },
  { id:3, name:"Destroyer Hawler",   secs:0, minR:30, maxR:60, ch:"CH 3", color:"#34d399", image:null },
  { id:4, name:"Assulter Laudd",     secs:0, minR:30, maxR:60, ch:"CH 1", color:"#a78bfa", image:null },
];

const INIT_AUCTION_ITEMS = [
  { id:1, name:"Shadowfang Blade",   rarity:"Legendary", minBid:5000, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"⚔️", endTime: Date.now() + 3600000 },
  { id:2, name:"Frostweave Mantle",  rarity:"Epic",      minBid:2000, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🧥", endTime: Date.now() + 7200000 },
  { id:3, name:"Runebound Shield",   rarity:"Rare",      minBid:800,  currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🛡️", endTime: Date.now() + 1800000 },
  { id:4, name:"Stormbringer Staff", rarity:"Epic",      minBid:3500, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🔱", endTime: Date.now() + 5400000 },
];

// ── Event types with default points ─────────────────────────────────────────
const EVENT_TYPES = [
  { id:"sindri",    label:"Sindri Battle",    icon:"⚔️",  defaultPoints:10, color:"#f59e0b" },
  { id:"server",    label:"Server Battle",    icon:"🌐",  defaultPoints:5,  color:"#60a5fa" },
  { id:"fieldboss", label:"Field Boss",       icon:"👹",  defaultPoints:5,  color:"#f87171" },
  { id:"sanctuary", label:"Guild Sanctuary",  icon:"🏛️",  defaultPoints:5,  color:"#34d399" },
  { id:"ymir",      label:"Ymir Cup",         icon:"🏆",  defaultPoints:5,  color:"#a78bfa" },
];

// ── Field Boss schedule (from game) ─────────────────────────────────────────
const FIELD_BOSS_SCHEDULE = [
  { name:"Twilight Overlord Rogvalt", map:"Canyon of the World Tree Depth", days:["Sunday","Wednesday","Saturday"], time:"21:00" },
  { name:"Nargrim",                   map:"Vale of Ragnarok",                days:["Monday","Saturday"],            time:"21:05" },
  { name:"Faded Oath Vargreif",       map:"Crossroads of Ragnarok",          days:["Wednesday","Friday"],           time:"21:10" },
  { name:"Twilight Disaster Nirva",   map:"(Inter-Server) Folkvang 5F",      days:["Sunday","Monday","Friday"],     time:"21:15" },
];

const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:"⊞"  },
  { id:"members",    label:"Members",       icon:"👥" },
  { id:"bosses",     label:"Boss Timers",   icon:"⚔️" },
  { id:"events",     label:"Events",        icon:"📅" },
  { id:"attendance", label:"Attendance",    icon:"📋" },
  { id:"auction",    label:"Auction House", icon:"🏺" },
  { id:"winners",    label:"Winners",       icon:"🥇" },
  { id:"settings",   label:"Settings",      icon:"⚙️" },
];

const ROLE_STYLE = {
  Leader:  { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", border:"rgba(251,191,36,0.35)"  },
  Elder:   { bg:"rgba(96,165,250,0.15)",  color:"#60a5fa", border:"rgba(96,165,250,0.35)"  },
  Member:  { bg:"rgba(148,163,184,0.1)",  color:"#94a3b8", border:"rgba(148,163,184,0.25)" },
  Recruit: { bg:"rgba(167,139,250,0.15)", color:"#a78bfa", border:"rgba(167,139,250,0.35)" },
};

const RARITY_STYLE = {
  Legendary: { color:"#f59e0b", glow:"rgba(245,158,11,0.3)",  bg:"rgba(245,158,11,0.1)"  },
  Epic:      { color:"#a78bfa", glow:"rgba(167,139,250,0.3)", bg:"rgba(167,139,250,0.1)" },
  Rare:      { color:"#60a5fa", glow:"rgba(96,165,250,0.3)",  bg:"rgba(96,165,250,0.1)"  },
  Common:    { color:"#94a3b8", glow:"rgba(148,163,184,0.2)", bg:"rgba(148,163,184,0.08)"},
};

const STATUS_STYLE = {
  Active:  { bg:"rgba(52,211,153,0.12)", color:"#34d399", dot:"#34d399" },
  Offline: { bg:"rgba(100,116,139,0.1)", color:"#64748b", dot:"#475569" },
};

const BOSS_STATUS_STYLE = {
  Alive:      { bg:"rgba(52,211,153,0.15)",  color:"#34d399", border:"rgba(52,211,153,0.35)"  },
  Respawning: { bg:"rgba(251,191,36,0.15)",  color:"#fbbf24", border:"rgba(251,191,36,0.35)"  },
  Waiting:    { bg:"rgba(96,165,250,0.15)",  color:"#60a5fa", border:"rgba(96,165,250,0.35)"  },
};

const CAN_MANAGE = (role) => ["Leader","Elder"].includes(role);
const MAX_ELDERS = 8;

function fmtSecs(s) {
  if (s <= 0) return "LIVE";
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function bossStatus(secs) {
  if (secs<=0) return "Alive";
  if (secs<=300) return "Respawning";
  return "Waiting";
}
function fmtCountdown(ms) {
  if (ms <= 0) return "ENDED";
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const today = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const getDayName = () => new Date().toLocaleDateString("en-US",{weekday:"long"});

// ── localStorage helpers ─────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const TH = {
  padding:"11px 18px", textAlign:"left", color:"#3d5070", fontSize:10,
  fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em",
  borderBottom:"1px solid rgba(255,255,255,0.05)", whiteSpace:"nowrap",
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage]       = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");
  const [loginForm, setLoginForm]     = useState({email:"",password:""});
  const [regForm, setRegForm]         = useState({name:"",email:"",password:"",confirmPassword:"",cls:"Berserker"});

  // App state
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  const [logoUrl, setLogoUrl]         = useState(MOCK_LOGO);
  const [logoErr, setLogoErr]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState("");
  const [members, setMembers]         = useState([]);
  const [bosses, setBosses]           = useState(()=>lsGet("rampageBosses", DEFAULT_BOSSES));
  const [attendance, setAttendance]   = useState([]);
  const [auctionItems, setAuctionItems] = useState(()=>lsGet("rampageAuction", INIT_AUCTION_ITEMS));
  const [winners, setWinners]         = useState(()=>lsGet("rampageWinners", []));
  const [search, setSearch]           = useState("");
  const [killFlash, setKillFlash]     = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editMember, setEditMember]   = useState(null);
  const [newMember, setNewMember]     = useState({name:"",role:"Member",cls:"Berserker",status:"Active",email:""});
  const [bossModal, setBossModal]     = useState(null);
  const [manualMins, setManualMins]   = useState("");
  const [bidModal, setBidModal]       = useState(null);
  const [bidAmount, setBidAmount]     = useState("");
  const [notifications, setNotifications] = useState([]);
  const [now, setNow]                 = useState(Date.now());
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordConnected, setDiscordConnected] = useState(false);
  const [toast, setToast]             = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [bossImageModal, setBossImageModal] = useState(null);

  // ── Events & Attendance ──────────────────────────────────────────────────
  const [events, setEvents]           = useState(()=>lsGet("rampageEvents",[]));
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm]     = useState({ type:"sindri", name:"", date:today, notes:"", server:"", points:10 });
  const [markEventId, setMarkEventId] = useState(null); // event being marked for attendance
  const [eventPoints, setEventPoints] = useState({}); // editable per-event-type points

  const fileRef    = useRef(null);
  const bossImgRef = useRef(null);

  // ── Persist to localStorage ──────────────────────────────────────────────
  useEffect(()=>{ lsSet("rampageBosses", bosses); }, [bosses]);
  useEffect(()=>{ lsSet("rampageAuction", auctionItems); }, [auctionItems]);
  useEffect(()=>{ lsSet("rampageWinners", winners); }, [winners]);
  useEffect(()=>{ lsSet("rampageEvents", events); }, [events]);

  // ── Sync boss timer with real time on load ────────────────────────────────
  useEffect(()=>{
    const stored = lsGet("rampageBossTimestamp", null);
    if (stored) {
      const elapsed = Math.floor((Date.now() - stored) / 1000);
      if (elapsed > 0) setBosses(prev=>prev.map(b=>({...b, secs:Math.max(0, b.secs - elapsed)})));
    }
    lsSet("rampageBossTimestamp", Date.now());
  },[]);

  // ── Update timestamp every second ────────────────────────────────────────
  useEffect(()=>{
    const t = setInterval(()=>{
      setBosses(prev=>prev.map(b=>({...b,secs:Math.max(0,b.secs-1)})));
      setNow(Date.now());
      lsSet("rampageBossTimestamp", Date.now());
    },1000);
    return ()=>clearInterval(t);
  },[]);

  // ── Restore session on refresh ────────────────────────────────────────────
  useEffect(()=>{
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("members").select("*").eq("email", session.user.email).single();
          const role = profile?.role || "Recruit";
          const name = profile?.name || session.user.email.split("@")[0].toUpperCase();
          setCurrentUser({ id: session.user.id, email: session.user.email, role, name, points: profile?.points || 0 });
        }
      } catch {}
    };
    restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  },[]);

  // ── Load members from Supabase ────────────────────────────────────────────
  useEffect(()=>{ loadMembers(); },[]);

  const loadMembers = async()=>{
    try {
      const { data, error } = await supabase.from("members").select("*").order("points", {ascending:false});
      if (error) {
        const local = lsGet("rampageMembers", []);
        setMembers(local);
      } else {
        setMembers(data || []);
      }
    } catch {
      setMembers(lsGet("rampageMembers", []));
    }
  };

  // Persist members locally as backup
  useEffect(()=>{ if(members.length>0) lsSet("rampageMembers",members); },[members]);

  // ── Outbid notifications ──────────────────────────────────────────────────
  useEffect(()=>{
    if (!currentUser) return;
    auctionItems.forEach(item=>{
      if (!item.locked && item.highBidder !== currentUser.name) {
        const myBid = item.bids.find(b=>b.bidder===currentUser.name);
        if(myBid && item.currentBid > myBid.amount){
          const key = `outbid_${item.id}_${item.currentBid}`;
          setNotifications(prev=>{
            if(prev.find(n=>n.key===key)) return prev;
            return [...prev, {key, type:"outbid", item:item.name, amount:item.currentBid, id:Date.now()}];
          });
        }
      }
    });
  },[auctionItems, currentUser]);

  // ── Weekly Excel auto-export check ───────────────────────────────────────
  useEffect(()=>{
    const lastExport = lsGet("rampageLastExport", null);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (!lastExport || (now - lastExport) > oneWeek) {
      if (members.length > 0 && events.length > 0) {
        lsSet("rampageLastExport", now);
        // auto export silently after 5s
        setTimeout(()=>exportToExcel(true), 5000);
      }
    }
  },[members, events]);

  const showToast = useCallback((msg, type="success")=>{
    setToast({msg,type,id:Date.now()});
    setTimeout(()=>setToast(null),3500);
  },[]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async()=>{
    setAuthLoading(true); setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }
      const { data: profile } = await supabase.from("members").select("*").eq("email", loginForm.email).single();
      const role = profile?.role || "Recruit";
      const name = profile?.name || loginForm.email.split("@")[0].toUpperCase();
      setCurrentUser({ id: data.user.id, email: loginForm.email, role, name, points: profile?.points || 0 });
    } catch(e) {
      const local = lsGet("rampageMembers",[]);
      const found = local.find(m=>m.email===loginForm.email);
      if (found && loginForm.password.length >= 6) {
        setCurrentUser({id:found.id, email:found.email, role:found.role, name:found.name, points:found.points||0});
      } else {
        setAuthError("Invalid credentials. Check your email and password.");
      }
    }
    setAuthLoading(false);
  };

  const handleRegister = async()=>{
    setAuthLoading(true); setAuthError("");
    if (!regForm.name.trim()) { setAuthError("Display name is required"); setAuthLoading(false); return; }
    if (regForm.password !== regForm.confirmPassword) { setAuthError("Passwords do not match"); setAuthLoading(false); return; }
    if (regForm.password.length < 6) { setAuthError("Password must be at least 6 characters"); setAuthLoading(false); return; }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regForm.email, password: regForm.password,
        options: { data: { display_name: regForm.name.toUpperCase(), cls: regForm.cls } }
      });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }
      const newM = {
        id: data.user?.id || String(Date.now()),
        name: regForm.name.toUpperCase(), role: "Recruit", cls: regForm.cls,
        points: 0, status: "Active", email: regForm.email,
        joined: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),
        created_at: new Date().toISOString(),
      };
      const { error: insertErr } = await supabase.from("members").insert([newM]);
      if (insertErr) {
        setMembers(prev=>[...prev, newM]);
        lsSet("rampageMembers", [...lsGet("rampageMembers",[]), newM]);
      } else {
        setMembers(prev=>[...prev, newM]);
      }
      setCurrentUser({ id:newM.id, email:regForm.email, role:"Recruit", name:newM.name, points:0 });
    } catch(e) {
      const newM = { id: String(Date.now()), name: regForm.name.toUpperCase(), role: "Recruit", cls: regForm.cls, points: 0, status: "Active", email: regForm.email };
      setMembers(prev=>[...prev, newM]);
      lsSet("rampageMembers", [...lsGet("rampageMembers",[]), newM]);
      setCurrentUser({ id:newM.id, email:regForm.email, role:"Recruit", name:newM.name, points:0 });
    }
    setAuthLoading(false);
  };

  const handleLogout = async()=>{
    await supabase.auth.signOut().catch(()=>{});
    setCurrentUser(null); setAuthPage("login"); setLoginForm({email:"",password:""});
  };

  // ── Admin: Wipe accounts ───────────────────────────────────────────────────
  const handleWipeAccounts = async()=>{
    setWipeLoading(true);
    try {
      await supabase.from("members").delete().neq("role","Leader");
      setMembers(prev=>prev.filter(m=>m.role==="Leader"));
      lsSet("rampageMembers", members.filter(m=>m.role==="Leader"));
      showToast("🗑️ All non-leader accounts wiped","warn");
    } catch {
      setMembers(prev=>prev.filter(m=>m.role==="Leader"));
      showToast("🗑️ Accounts wiped (local)","warn");
    }
    setWipeLoading(false); setShowWipeConfirm(false); setShowPermissions(false);
  };

  // ── Logo upload ────────────────────────────────────────────────────────────
  const handleLogoUpload = async(e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    setUploading(true); setUploadMsg("");
    const reader = new FileReader();
    reader.onload = ev=>setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
    setTimeout(()=>{ setUploadMsg("✅ Saved!"); setUploading(false); setTimeout(()=>setUploadMsg(""),3000); },1200);
  };

  // ── Boss image upload ──────────────────────────────────────────────────────
  const handleBossImageUpload = (e)=>{
    const file = e.target.files?.[0]; if(!file||!bossImageModal) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      setBosses(prev=>prev.map(b=>b.id===bossImageModal?{...b,image:ev.target.result}:b));
      setBossImageModal(null); showToast("🖼️ Boss image updated!");
    };
    reader.readAsDataURL(file);
  };

  // ── Boss actions ───────────────────────────────────────────────────────────
  const handleMarkKilled = (id)=>{
    setKillFlash(id); setTimeout(()=>setKillFlash(null),700);
    setBosses(prev=>prev.map(b=>{
      if(b.id!==id) return b;
      const secs = Math.floor((b.minR+Math.random()*(b.maxR-b.minR))*60);
      return {...b,secs};
    }));
    if(discordConnected) showToast("📢 Discord notified: Boss killed!","info");
  };
  const handleResetToZero = (id)=>{ setKillFlash(id); setTimeout(()=>setKillFlash(null),700); setBosses(prev=>prev.map(b=>b.id===id?{...b,secs:0}:b)); };
  const handleSetManual = ()=>{
    const mins = parseFloat(manualMins);
    if(isNaN(mins)||mins<0) return;
    setBosses(prev=>prev.map(b=>b.id===bossModal?{...b,secs:Math.floor(mins*60)}:b));
    setBossModal(null); setManualMins("");
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const handleAddMember = async()=>{
    if(!newMember.name.trim()) return;
    // Check elder limit
    if(newMember.role==="Elder" && members.filter(m=>m.role==="Elder").length >= MAX_ELDERS) {
      showToast(`❌ Maximum ${MAX_ELDERS} Elders allowed`,"error"); return;
    }
    // Check leader limit
    if(newMember.role==="Leader" && members.filter(m=>m.role==="Leader").length >= 1) {
      showToast("❌ Only 1 Leader allowed","error"); return;
    }
    const m={...newMember,id:String(Date.now()),points:0,joined:today};
    try { await supabase.from("members").insert([m]); } catch {}
    setMembers(prev=>[...prev,m]);
    setNewMember({name:"",role:"Member",cls:"Berserker",status:"Active",email:""});
    setShowAddMember(false);
    showToast(`✅ ${m.name} added to guild!`);
  };

  const handleEditMember = async()=>{
    if(!editMember) return;
    // Check elder limit if upgrading to elder
    const old = members.find(m=>m.id===editMember.id);
    if(editMember.role==="Elder" && old?.role!=="Elder" && members.filter(m=>m.role==="Elder").length >= MAX_ELDERS) {
      showToast(`❌ Maximum ${MAX_ELDERS} Elders allowed`,"error"); return;
    }
    try { await supabase.from("members").update(editMember).eq("id",editMember.id); } catch {}
    setMembers(prev=>prev.map(m=>m.id===editMember.id?editMember:m));
    if (currentUser && editMember.id === currentUser.id) {
      setCurrentUser(prev=>({...prev, points:editMember.points, role:editMember.role}));
    }
    setEditMember(null); showToast("✅ Member updated!");
  };

  const handleRemoveMember = async(id)=>{
    try { await supabase.from("members").delete().eq("id",id); } catch {}
    setMembers(prev=>prev.filter(m=>m.id!==id));
    showToast("🗑️ Member removed","warn");
  };

  const handleChangeRole = async(memberId, newRole)=>{
    if(newRole==="Elder" && members.filter(m=>m.role==="Elder").length >= MAX_ELDERS) {
      showToast(`❌ Maximum ${MAX_ELDERS} Elders allowed`,"error"); return;
    }
    try { await supabase.from("members").update({role:newRole}).eq("id",memberId); } catch {}
    setMembers(prev=>prev.map(m=>m.id===memberId?{...m,role:newRole}:m));
    showToast("✅ Role updated!");
  };

  // ── Points management ─────────────────────────────────────────────────────
  const handleAddPoints = async(memberId, delta)=>{
    const updated = members.map(m=>m.id===memberId?{...m,points:Math.max(0,(m.points||0)+delta)}:m);
    setMembers(updated);
    const m = updated.find(x=>x.id===memberId);
    if(m) { try { await supabase.from("members").update({points:m.points}).eq("id",memberId); } catch {} }
  };

  // ── Events ────────────────────────────────────────────────────────────────
  const handleCreateEvent = ()=>{
    if(!eventForm.name.trim()) { showToast("❌ Event name required","error"); return; }
    const evType = EVENT_TYPES.find(e=>e.id===eventForm.type);
    const ev = {
      id: String(Date.now()),
      type: eventForm.type,
      typeLabel: evType?.label || eventForm.type,
      icon: evType?.icon || "📅",
      name: eventForm.name,
      date: eventForm.date,
      notes: eventForm.notes,
      server: eventForm.server,
      points: parseInt(eventForm.points) || evType?.defaultPoints || 5,
      attendance: {}, // memberId -> true/false
      createdBy: currentUser?.name,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev=>[ev,...prev]);
    setShowCreateEvent(false);
    setEventForm({ type:"sindri", name:"", date:today, notes:"", server:"", points:10 });
    showToast(`✅ Event "${ev.name}" created!`);
  };

  const handleMarkEventAttendance = async(eventId, memberId, present)=>{
    setEvents(prev=>prev.map(ev=>{
      if(ev.id!==eventId) return ev;
      return {...ev, attendance:{...ev.attendance, [memberId]:present}};
    }));
    // Give/remove points
    const ev = events.find(e=>e.id===eventId);
    if(!ev) return;
    const wasPresent = ev.attendance[memberId];
    if(present && !wasPresent) {
      await handleAddPoints(memberId, ev.points);
      showToast(`+${ev.points} pts awarded!`);
    } else if(!present && wasPresent) {
      await handleAddPoints(memberId, -ev.points);
      showToast(`-${ev.points} pts removed`,"warn");
    }
  };

  const handleMarkAllPresent = (eventId)=>{
    members.forEach(m=>handleMarkEventAttendance(eventId, m.id, true));
    showToast("✅ All members marked present!");
  };

  const handleDeleteEvent = (eventId)=>{
    setEvents(prev=>prev.filter(e=>e.id!==eventId));
    showToast("🗑️ Event deleted","warn");
  };

  // ── Auction ───────────────────────────────────────────────────────────────
  const handleBid = ()=>{
    const amount = parseInt(bidAmount);
    const myMember = members.find(m=>m.name===currentUser?.name);
    const myPoints = myMember?.points || 0;
    // Recruits cannot bid
    if(currentUser?.role==="Recruit") { showToast("❌ Recruits cannot bid — wait for promotion","error"); return; }
    if(!bidModal||isNaN(amount)) { showToast("❌ Enter a valid amount","error"); return; }
    if(amount <= bidModal.currentBid && bidModal.currentBid > 0) { showToast(`❌ Bid must exceed ${bidModal.currentBid.toLocaleString()} pts`,"error"); return; }
    if(amount < bidModal.minBid) { showToast(`❌ Minimum bid is ${bidModal.minBid.toLocaleString()} pts`,"error"); return; }
    if(amount > myPoints) { showToast(`❌ Not enough points! You have ${myPoints.toLocaleString()} pts`,"error"); return; }
    const myName = currentUser?.name||"Guest";
    setAuctionItems(prev=>prev.map(item=>{
      if(item.id!==bidModal.id) return item;
      return {...item, currentBid:amount, highBidder:myName, bids:[...item.bids,{bidder:myName,amount,time:new Date().toLocaleTimeString()}]};
    }));
    setBidModal(null); setBidAmount("");
    showToast(`🏺 Bid of ${amount.toLocaleString()} pts placed on ${bidModal.name}!`);
  };

  const handleAnnounceWinner = (item)=>{
    const w = {id:Date.now(),itemName:item.name,winner:item.highBidder,points:item.currentBid,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),claimed:false,rarity:item.rarity,image:item.image};
    setWinners(prev=>[...prev,w]);
    setAuctionItems(prev=>prev.map(i=>i.id===item.id?{...i,locked:true,winner:item.highBidder}:i));
    if(discordConnected) showToast("📢 Discord notified: Winner announced!","info");
    showToast(`🏆 ${item.highBidder} won ${item.name}!`);
  };

  const handleClaimWinner = (id)=>{ setWinners(prev=>prev.map(w=>w.id===id?{...w,claimed:true}:w)); showToast("✅ Item marked as claimed!"); };
  const handleRemoveWinner = (id)=>{ setWinners(prev=>prev.filter(w=>w.id!==id)); showToast("🗑️ Removed","warn"); };

  // ── Excel Export ──────────────────────────────────────────────────────────
  const exportToExcel = (silent=false)=>{
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Members
      const memberRows = members.map(m=>({
        Name: m.name, Role: m.role, Class: m.cls||"—",
        Points: m.points||0, Status: m.status||"—", Email: m.email||"—", Joined: m.joined||"—"
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberRows), "Members");

      // Sheet 2: Events & Attendance
      const eventRows = [];
      events.forEach(ev=>{
        const presentCount = Object.values(ev.attendance).filter(Boolean).length;
        eventRows.push({
          "Event Name": ev.name, "Type": ev.typeLabel, "Date": ev.date,
          "Points Awarded": ev.points, "Present": presentCount,
          "Total Members": members.length, "Notes": ev.notes||"—", "Server": ev.server||"—"
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventRows.length ? eventRows : [{Note:"No events yet"}]), "Events");

      // Sheet 3: Attendance Detail
      const attRows = [];
      events.forEach(ev=>{
        members.forEach(m=>{
          attRows.push({
            Member: m.name, Role: m.role, Event: ev.name,
            Type: ev.typeLabel, Date: ev.date,
            Present: ev.attendance[m.id] ? "YES" : "NO",
            "Points Earned": ev.attendance[m.id] ? ev.points : 0
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows.length ? attRows : [{Note:"No attendance yet"}]), "Attendance Detail");

      // Sheet 4: Winners
      const winRows = winners.map(w=>({ Item: w.itemName, Winner: w.winner, Points: w.points, Date: w.date, Claimed: w.claimed?"YES":"NO", Rarity: w.rarity }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(winRows.length ? winRows : [{Note:"No winners yet"}]), "Auction Winners");

      const dateStr = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).replace(/,/g,"").replace(/ /g,"-");
      XLSX.writeFile(wb, `RAMPAGE-Guild-Report-${dateStr}.xlsx`);
      if(!silent) showToast("📊 Excel exported successfully!");
    } catch(e) {
      if(!silent) showToast("❌ Export failed","error");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered       = members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.cls?.toLowerCase().includes(search.toLowerCase()));
  const activeCount    = members.filter(m=>m.status==="Active").length;
  const leaderCount    = members.filter(m=>m.role==="Leader").length;
  const elderCount     = members.filter(m=>m.role==="Elder").length;
  const isLeader       = currentUser?.role==="Leader";
  const isAdmin        = currentUser && (currentUser.role==="Leader"||currentUser.role==="Elder");
  const canManage      = currentUser && CAN_MANAGE(currentUser.role);
  const myPoints       = members.find(m=>m.name===currentUser?.name)?.points || 0;
  const myBids         = auctionItems.filter(i=>i.bids.some(b=>b.bidder===currentUser?.name));
  const totalGuildPoints = members.reduce((sum,m)=>sum+(m.points||0),0);
  const todayBosses    = FIELD_BOSS_SCHEDULE.filter(b=>b.days.includes(getDayName()));
  const totalEvents    = events.length;
  const recentEvents   = events.slice(0,5);

  // ── Auth screen ────────────────────────────────────────────────────────────
  if(!currentUser) {
    return <AuthScreen
      page={authPage} setPage={setAuthPage}
      loginForm={loginForm} setLoginForm={setLoginForm}
      regForm={regForm} setRegForm={setRegForm}
      onLogin={handleLogin} onRegister={handleRegister}
      loading={authLoading} error={authError} setError={setAuthError}
    />;
  }

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; background:#06070e; overflow:hidden; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1a2035; border-radius:4px; }
        .sidebar { transition: width 0.45s cubic-bezier(0.77,0,0.18,1); transform-origin: left center; }
        .sidebar-label { transition:opacity 0.22s, transform 0.22s; white-space:nowrap; overflow:hidden; }
        .collapsed .sidebar-label { opacity:0; transform:translateX(-8px); pointer-events:none; }
        .nav-btn { display:flex; align-items:center; gap:13px; width:100%; padding:13px 16px; border-radius:12px; background:none; border:1px solid transparent; color:#3d4a63; cursor:pointer; font-size:13.5px; font-weight:600; font-family:'Exo 2',sans-serif; letter-spacing:0.02em; transition:all 0.18s cubic-bezier(0.4,0,0.2,1); -webkit-tap-highlight-color:transparent; position:relative; }
        .nav-btn:hover { background:rgba(255,255,255,0.06); color:#8899bb; transform:translateX(4px); }
        .nav-btn.active { background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(99,102,241,0.1)); color:#a5b4fc; border-color:rgba(99,102,241,0.3); box-shadow:0 0 20px rgba(99,102,241,0.1); }
        .btn { cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:700; border:none; border-radius:10px; transition:all 0.18s; -webkit-tap-highlight-color:transparent; letter-spacing:0.03em; }
        .btn:hover { filter:brightness(1.15); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
        .btn:active { transform:translateY(0) scale(0.97); filter:brightness(0.93); }
        .kill-btn { width:100%; padding:9px; border:none; cursor:pointer; border-radius:9px; font-family:'Exo 2',sans-serif; font-weight:700; font-size:12.5px; letter-spacing:0.03em; transition:all 0.18s; }
        .kill-btn:hover { filter:brightness(1.2); transform:translateY(-1px); }
        .ghost-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#64748b; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:600; font-family:'Exo 2',sans-serif; transition:all 0.18s; }
        .ghost-btn:hover { background:rgba(255,255,255,0.09); color:#94a3b8; }
        .dark-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:11px; padding:11px 15px; color:#e2e8f0; font-size:13px; font-family:'Exo 2',sans-serif; outline:none; transition:all 0.2s; }
        .dark-input:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.06); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .dark-input::placeholder { color:#2d3a52; }
        .dark-input:disabled { opacity:0.5; cursor:not-allowed; }
        .boss-card { transition:all 0.25s; }
        .boss-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.5); }
        .kill-flash { animation:flashKill 0.6s ease; }
        @keyframes flashKill { 0%,100%{background:rgba(255,255,255,0.03)} 50%{background:rgba(239,68,68,0.25)} }
        .auction-card { transition:all 0.25s; }
        .auction-card:hover:not(.locked) { transform:translateY(-3px); }
        .auction-card.locked { opacity:0.65; }
        .winner-card { transition:all 0.25s; }
        .winner-card:hover { transform:translateY(-2px); }
        .tr-row { transition:background 0.15s; }
        .tr-row:hover { background:rgba(255,255,255,0.025); }
        .att-btn { padding:5px 10px; border-radius:7px; cursor:pointer; font-weight:700; font-size:13px; font-family:'Exo 2',sans-serif; transition:all 0.15s; border:none; }
        .att-btn:hover { filter:brightness(1.3); transform:scale(1.1); }
        .modal-box { animation:modalIn 0.22s cubic-bezier(0.4,0,0.2,1); }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .page { animation:fadeIn 0.25s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .logo-ring:hover .logo-ov { opacity:1!important; }
        .logo-ring { cursor:pointer; }
        .stat-card { transition:all 0.25s; }
        .stat-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.12)!important; }
        .notif-badge { animation:pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .col-btn-door { position:absolute; right:-13px; top:50%; transform:translateY(-50%); width:26px; height:26px; border-radius:50%; background:#0c0f1f; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:9px; color:#3d5070; z-index:20; }
        .col-btn-door:hover { background:#111525; color:#64748b; border-color:rgba(255,255,255,0.18); }
        .boss-img-upload:hover .boss-img-ov { opacity:1!important; }
        .points-ctrl { display:flex; gap:4px; opacity:0; transition:opacity 0.15s; }
        tr:hover .points-ctrl { opacity:1; }
        .pts-btn { width:22px; height:22px; border-radius:5px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Exo 2',sans-serif; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .pts-btn:hover { filter:brightness(1.3); transform:scale(1.15); }
        .event-card { transition:all 0.22s; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:18px 20px; background:rgba(255,255,255,0.03); }
        .event-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .check-btn { width:28px; height:28px; border-radius:7px; cursor:pointer; border:none; font-size:14px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-family:'Exo 2',sans-serif; }
        .check-btn:hover { transform:scale(1.15); filter:brightness(1.2); }
      `}</style>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{background:toast.type==="error"?"rgba(239,68,68,0.15)":toast.type==="warn"?"rgba(251,191,36,0.12)":toast.type==="info"?"rgba(96,165,250,0.12)":"rgba(52,211,153,0.12)",border:`1px solid ${toast.type==="error"?"rgba(239,68,68,0.4)":toast.type==="warn"?"rgba(251,191,36,0.35)":toast.type==="info"?"rgba(96,165,250,0.35)":"rgba(52,211,153,0.35)"}`,borderRadius:12,padding:"11px 20px",color:toast.type==="error"?"#fca5a5":toast.type==="warn"?"#fbbf24":toast.type==="info"?"#93c5fd":"#6ee7b7",fontSize:13.5,fontWeight:600,fontFamily:"'Exo 2',sans-serif",whiteSpace:"nowrap",backdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            {toast.msg}
          </div>
        </div>
      )}

      <div style={{display:"flex",height:"100vh",background:"#06070e",fontFamily:"'Exo 2',sans-serif",color:"#e2e8f0",overflow:"hidden",position:"relative"}}>
        {/* Glow bg */}
        <div style={{position:"fixed",top:-250,left:-150,width:700,height:700,background:"radial-gradient(circle,rgba(99,102,241,0.065),transparent 70%)",pointerEvents:"none",zIndex:0}} />
        <div style={{position:"fixed",bottom:-200,right:-100,width:600,height:600,background:"radial-gradient(circle,rgba(251,191,36,0.04),transparent 70%)",pointerEvents:"none",zIndex:0}} />

        {/* Sidebar */}
        <div className={`sidebar${collapsed?" collapsed":""}`}
          style={{width:collapsed?68:270,minHeight:"100vh",background:"linear-gradient(180deg,#090b1a,#070910)",borderRight:"1px solid rgba(255,255,255,0.055)",display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:10,boxShadow:"6px 0 40px rgba(0,0,0,0.7)"}}>

          {/* Logo */}
          <div style={{padding:collapsed?"18px 0":"22px 20px 16px",display:"flex",alignItems:"center",gap:12,justifyContent:collapsed?"center":"flex-start",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div className="logo-ring" onClick={()=>fileRef.current?.click()}
              style={{width:50,height:50,borderRadius:"50%",border:"2px solid rgba(251,191,36,0.5)",background:"rgba(251,191,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",flexShrink:0,boxShadow:"0 0 24px rgba(251,191,36,0.18)"}}>
              <img src={logoUrl} alt="Logo" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={()=>setLogoErr(true)} />
              <div className="logo-ov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s",borderRadius:"50%",fontSize:18}}>📷</div>
            </div>
            {!collapsed&&<div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,letterSpacing:"0.12em",background:"linear-gradient(135deg,#fbbf24,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>RAMPAGE</div>
              <div style={{fontSize:9.5,color:"#3d5070",letterSpacing:"0.1em"}}>GUILD TRACKER</div>
            </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload} />

          {/* Current user */}
          <div style={{margin:"12px 9px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:collapsed?"12px 0":"13px 15px",display:"flex",alignItems:"center",gap:11,position:"relative",justifyContent:collapsed?"center":"flex-start"}}>
            {!collapsed&&<>
              <div style={{width:34,height:34,borderRadius:10,background:ROLE_STYLE[currentUser.role]?.bg||"rgba(99,102,241,0.15)",border:`1px solid ${ROLE_STYLE[currentUser.role]?.border||"rgba(99,102,241,0.3)"}`,color:ROLE_STYLE[currentUser.role]?.color||"#a5b4fc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}}>
                {currentUser.name?.[0]||"?"}
              </div>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:13.5,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.04em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
                <span style={{fontSize:11,color:ROLE_STYLE[currentUser.role]?.color||"#a5b4fc"}}>{currentUser.role||"Member"}</span>
              </div>
            </>}
            <div style={{position:"absolute",top:10,right:11,width:8,height:8,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 10px #34d399"}} />
          </div>

          {/* Nav */}
          <nav style={{padding:"6px 9px",flex:1,display:"flex",flexDirection:"column",gap:3}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-btn${activeNav===n.id?" active":""}`} onClick={()=>setActiveNav(n.id)}>
                <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
                <span className="sidebar-label">{n.label}</span>
                {n.id==="events"&&events.length>0&&!collapsed&&<span style={{marginLeft:"auto",background:"rgba(99,102,241,0.25)",color:"#a5b4fc",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5}}>{events.length}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom: Admin + Logout */}
          <div style={{padding:"10px 9px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",gap:6}}>
            {isAdmin&&(
              <button className="nav-btn" onClick={()=>setShowPermissions(true)} style={{color:"#fbbf24",fontSize:12}}>
                <span style={{fontSize:15}}>🔐</span>
                <span className="sidebar-label">Admin</span>
              </button>
            )}
            {isAdmin&&(
              <button className="btn" onClick={()=>exportToExcel(false)}
                style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",padding:"9px 12px",fontSize:12,display:"flex",alignItems:"center",gap:8,justifyContent:collapsed?"center":"flex-start"}}>
                <span>📊</span>
                <span className="sidebar-label">Export Excel</span>
              </button>
            )}
            <button className="nav-btn" onClick={handleLogout} style={{color:"#f87171",fontSize:12}}>
              <span style={{fontSize:15}}>🚪</span>
              <span className="sidebar-label">Sign Out</span>
            </button>
          </div>

          {/* Collapse toggle */}
          <button className="col-btn-door" onClick={()=>setCollapsed(p=>!p)}>
            {collapsed?"›":"‹"}
          </button>
        </div>

        {/* Main content */}
        <div style={{flex:1,overflow:"auto",padding:"28px 30px",position:"relative",zIndex:1}}>
          {/* Header */}
          <div style={{marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.06em"}}>
                {NAV.find(n=>n.id===activeNav)?.icon} {NAV.find(n=>n.id===activeNav)?.label}
              </h2>
              <p style={{color:"#3d5070",fontSize:12,marginTop:3}}>
                {{
                  dashboard:"Guild overview and live activity",
                  members:"Manage your full guild roster",
                  bosses:"Live countdown and respawn control",
                  events:"Track events and mark attendance",
                  attendance:"Member attendance history",
                  auction:"Guild auction house — bid with your earned points",
                  winners:"Past auction winners",
                  settings:"Configure guild & integration settings"
                }[activeNav]}
              </p>
            </div>
            {/* Points badge */}
            <div style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:13,padding:"10px 18px",textAlign:"center",flexShrink:0}}>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#fbbf24"}}>{myPoints.toLocaleString()}</div>
              <div style={{fontSize:9.5,color:"#3d5070",letterSpacing:"0.08em"}}>MY POINTS</div>
            </div>
          </div>

          {/* ── DASHBOARD ── */}
          {activeNav==="dashboard"&&<div className="page">
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:22}}>
              {[
                {label:"Total Members", value:members.length,              icon:"👥", color:"#818cf8", glow:"rgba(129,140,248,0.15)"},
                {label:"Online Now",    value:activeCount,                  icon:"🟢", color:"#34d399", glow:"rgba(52,211,153,0.15)"},
                {label:"Total Events",  value:totalEvents,                  icon:"📅", color:"#fbbf24", glow:"rgba(251,191,36,0.15)"},
                {label:"Guild Points",  value:totalGuildPoints.toLocaleString(), icon:"🏆", color:"#f87171", glow:"rgba(248,113,113,0.15)"},
              ].map(s=>(
                <div key={s.label} className="stat-card"
                  style={{background:"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"20px 22px",display:"flex",alignItems:"center",gap:15,position:"relative",overflow:"hidden"}}>
                  <div style={{width:48,height:48,borderRadius:14,background:s.glow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{s.icon}</div>
                  <div>
                    <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:32,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</div>
                    <div style={{color:"#3d5070",fontSize:10.5,marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div>
                  </div>
                  <div style={{position:"absolute",bottom:-18,right:-18,width:80,height:80,borderRadius:"50%",background:s.glow,filter:"blur(20px)",pointerEvents:"none"}} />
                  <div style={{position:"absolute",top:11,right:13,fontSize:8,fontWeight:700,letterSpacing:"0.1em",color:"#34d399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",padding:"2px 7px",borderRadius:4}}>LIVE</div>
                </div>
              ))}
            </div>

            {/* Role summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22}}>
              {[
                {role:"Leader", count:leaderCount, max:1,           ...ROLE_STYLE.Leader},
                {role:"Elder",  count:elderCount,  max:MAX_ELDERS,  ...ROLE_STYLE.Elder},
                {role:"Member", count:members.filter(m=>m.role==="Member").length,  max:null, ...ROLE_STYLE.Member},
                {role:"Recruit",count:members.filter(m=>m.role==="Recruit").length, max:null, ...ROLE_STYLE.Recruit},
              ].map(r=>(
                <div key={r.role} style={{background:r.bg,border:`1px solid ${r.border}`,borderRadius:12,padding:"12px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:r.color}}>{r.count}{r.max?<span style={{fontSize:14,opacity:0.5}}>/{r.max}</span>:""}</div>
                  <div style={{fontSize:10,color:r.color,opacity:0.8,letterSpacing:"0.08em"}}>{r.role.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18}}>
              <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} onAddPoints={isAdmin?handleAddPoints:null} />
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <BossPanel bosses={bosses} onKill={handleMarkKilled} onReset={handleResetToZero} onManual={id=>{setBossModal(id);setManualMins("");}} onBossImage={id=>{setBossImageModal(id);bossImgRef.current?.click();}} killFlash={killFlash} canManage={canManage} />
                {/* Today's field bosses */}
                {todayBosses.length>0&&(
                  <div style={{background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:14,padding:"14px 16px"}}>
                    <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,fontWeight:700,color:"#f87171",marginBottom:10,letterSpacing:"0.04em"}}>👹 Field Bosses Today</div>
                    {todayBosses.map((b,i)=>(
                      <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<todayBosses.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                        <div style={{fontSize:12.5,fontWeight:700,color:"#e2e8f0"}}>{b.name}</div>
                        <div style={{fontSize:10.5,color:"#3d5070",marginTop:2}}>{b.map} · {b.time} UTC+8</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>}

          {/* ── MEMBERS ── */}
          {activeNav==="members"&&(
            <div className="page" style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
              <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>All Guild Members</h3>
                  <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>{filtered.length} members · Elders: {elderCount}/{MAX_ELDERS}</p>
                </div>
                {canManage&&(
                  <button className="btn" onClick={()=>setShowAddMember(true)}
                    style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"10px 18px",fontSize:13,boxShadow:"0 4px 20px rgba(99,102,241,0.3)"}}>
                    ➕ Add Member
                  </button>
                )}
              </div>
              <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} onAddPoints={isAdmin?handleAddPoints:null} showFull />
            </div>
          )}

          {/* ── BOSS TIMERS ── */}
          {activeNav==="bosses"&&(
            <div className="page">
              <div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:12,padding:"10px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#34d399"}}>
                <span>⏱</span>
                <span>Boss timers <strong>persist across sessions</strong> — they continue counting down even after refresh.</span>
              </div>

              {/* Field Boss Schedule */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"18px 20px",marginBottom:18}}>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,color:"#f87171",marginBottom:12,letterSpacing:"0.04em"}}>👹 Field Boss Schedule (UTC+8)</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                  {FIELD_BOSS_SCHEDULE.map((b,i)=>{
                    const isToday = b.days.includes(getDayName());
                    return(
                      <div key={i} style={{background:isToday?"rgba(248,113,113,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${isToday?"rgba(248,113,113,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:11,padding:"12px 14px"}}>
                        <div style={{fontSize:12.5,fontWeight:700,color:isToday?"#f87171":"#e2e8f0"}}>{b.name}{isToday&&<span style={{marginLeft:8,fontSize:10,background:"rgba(248,113,113,0.2)",color:"#f87171",padding:"1px 6px",borderRadius:4}}>TODAY</span>}</div>
                        <div style={{fontSize:10.5,color:"#3d5070",marginTop:3}}>{b.map}</div>
                        <div style={{fontSize:11,color:"#60a5fa",marginTop:4}}>{b.days.join(", ")} · {b.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
                {bosses.map(b=>{
                  const st=bossStatus(b.secs);
                  const bs=BOSS_STATUS_STYLE[st];
                  return(
                    <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
                      style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px 22px 18px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:b.color,borderRadius:"4px 0 0 4px"}} />
                      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:13}}>
                        <div className="boss-img-upload" onClick={()=>canManage&&(setBossImageModal(b.id),bossImgRef.current?.click())}
                          style={{width:78,height:78,borderRadius:14,background:b.color+"22",border:`2px solid ${b.color}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,position:"relative",cursor:canManage?"pointer":"default"}}>
                          {b.image ? <img src={b.image} alt={b.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:32}}>👹</span>}
                          {canManage&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}} className="boss-img-ov"><span style={{fontSize:18}}>📷</span></div>}
                        </div>
                        <div>
                          <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{b.name}</div>
                          <div style={{fontSize:11.5,color:"#3d5070",marginTop:3}}>{b.ch} · Respawn {b.minR}–{b.maxR} min</div>
                          <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:7,background:bs.bg,color:bs.color,border:`1px solid ${bs.border}`,fontSize:11,fontWeight:700,marginTop:5}}>{st}</span>
                        </div>
                      </div>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:52,fontWeight:700,color:b.color,letterSpacing:"0.06em",lineHeight:1,marginBottom:18,textAlign:"center"}}>
                        {fmtSecs(b.secs)}
                      </div>
                      {canManage&&<>
                        <button className="kill-btn" onClick={()=>handleMarkKilled(b.id)} style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:9}}>
                          ☠️ Mark Killed — start respawn timer
                        </button>
                        <div style={{display:"flex",gap:9}}>
                          <button className="ghost-btn" onClick={()=>handleResetToZero(b.id)} style={{flex:1}}>🔴 Set LIVE</button>
                          <button className="ghost-btn" onClick={()=>{setBossModal(b.id);setManualMins("");}} style={{flex:1}}>⏱ Set timer</button>
                        </div>
                      </>}
                      {!canManage&&<div style={{textAlign:"center",color:"#3d5070",fontSize:11,marginTop:8}}>👀 View only</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeNav==="events"&&(
            <div className="page">
              {/* Header row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {EVENT_TYPES.map(et=>(
                    <div key={et.id} style={{background:`rgba(0,0,0,0.3)`,border:`1px solid ${et.color}40`,borderRadius:10,padding:"7px 14px",fontSize:12,color:et.color,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      {et.icon} {et.label} <span style={{opacity:0.6,fontWeight:400}}>+{et.defaultPoints}pts</span>
                    </div>
                  ))}
                </div>
                {canManage&&(
                  <button className="btn" onClick={()=>setShowCreateEvent(true)}
                    style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"11px 20px",fontSize:13,boxShadow:"0 4px 20px rgba(99,102,241,0.3)"}}>
                    ➕ Create Event
                  </button>
                )}
              </div>

              {events.length===0&&(
                <div style={{textAlign:"center",padding:"60px 0",color:"#3d5070"}}>
                  <div style={{fontSize:40,marginBottom:12}}>📅</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>No events yet</div>
                  <div style={{fontSize:12}}>{canManage?"Click Create Event to add your first event":"Ask a Leader or Elder to create an event"}</div>
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {events.map(ev=>{
                  const evType = EVENT_TYPES.find(e=>e.id===ev.type);
                  const presentCount = Object.values(ev.attendance||{}).filter(Boolean).length;
                  const isMarking = markEventId===ev.id;
                  return(
                    <div key={ev.id} className="event-card">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:44,height:44,borderRadius:12,background:`${evType?.color||"#64748b"}18`,border:`1px solid ${evType?.color||"#64748b"}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                            {ev.icon}
                          </div>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{ev.name}</div>
                            <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                              <span style={{fontSize:10.5,color:evType?.color||"#64748b",fontWeight:700,background:`${evType?.color||"#64748b"}18`,padding:"2px 8px",borderRadius:5}}>{ev.typeLabel}</span>
                              <span style={{fontSize:10.5,color:"#3d5070"}}>{ev.date}</span>
                              {ev.server&&<span style={{fontSize:10.5,color:"#60a5fa"}}>🌐 {ev.server}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#34d399"}}>{presentCount}/{members.length}</div>
                            <div style={{fontSize:9.5,color:"#3d5070",letterSpacing:"0.07em"}}>PRESENT</div>
                          </div>
                          <div style={{textAlign:"center",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:10,padding:"6px 12px"}}>
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#fbbf24"}}>+{ev.points}</div>
                            <div style={{fontSize:9.5,color:"#3d5070",letterSpacing:"0.07em"}}>PTS</div>
                          </div>
                          {canManage&&(
                            <div style={{display:"flex",gap:6}}>
                              <button className="btn" onClick={()=>setMarkEventId(isMarking?null:ev.id)}
                                style={{background:isMarking?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.06)",border:`1px solid ${isMarking?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.1)"}`,color:isMarking?"#a5b4fc":"#64748b",padding:"8px 14px",fontSize:12}}>
                                {isMarking?"✅ Done":"📋 Mark"}
                              </button>
                              <button className="btn" onClick={()=>handleDeleteEvent(ev.id)}
                                style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"8px 10px",fontSize:12}}>
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {ev.notes&&<div style={{fontSize:11.5,color:"#3d5070",marginBottom:10,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>📝 {ev.notes}</div>}

                      {/* Attendance marking */}
                      {isMarking&&(
                        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14,marginTop:4}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                            <div style={{fontSize:11,color:"#3d5070",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Mark Attendance</div>
                            <button className="btn" onClick={()=>handleMarkAllPresent(ev.id)}
                              style={{background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"6px 14px",fontSize:11}}>
                              ✅ All Present
                            </button>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
                            {members.map(m=>{
                              const present = ev.attendance?.[m.id];
                              const rs = ROLE_STYLE[m.role]||ROLE_STYLE.Member;
                              return(
                                <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:present?"rgba(52,211,153,0.07)":"rgba(255,255,255,0.02)",border:`1px solid ${present?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:9,padding:"8px 12px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <div style={{width:26,height:26,borderRadius:7,background:rs.bg,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{m.name[0]}</div>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{m.name}</div>
                                      <div style={{fontSize:9.5,color:rs.color}}>{m.role}</div>
                                    </div>
                                  </div>
                                  <div style={{display:"flex",gap:5}}>
                                    <button className="check-btn" onClick={()=>handleMarkEventAttendance(ev.id,m.id,true)}
                                      style={{background:present?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.05)",color:present?"#34d399":"#475569",border:present?"1px solid rgba(52,211,153,0.5)":"1px solid rgba(255,255,255,0.1)"}}>✓</button>
                                    <button className="check-btn" onClick={()=>handleMarkEventAttendance(ev.id,m.id,false)}
                                      style={{background:present===false?"rgba(248,113,113,0.3)":"rgba(255,255,255,0.05)",color:present===false?"#f87171":"#475569",border:present===false?"1px solid rgba(248,113,113,0.5)":"1px solid rgba(255,255,255,0.1)"}}>✗</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary row when not marking */}
                      {!isMarking&&Object.keys(ev.attendance||{}).length>0&&(
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                          {members.filter(m=>ev.attendance[m.id]===true).map(m=>(
                            <span key={m.id} style={{fontSize:10.5,background:"rgba(52,211,153,0.1)",color:"#34d399",border:"1px solid rgba(52,211,153,0.2)",padding:"2px 8px",borderRadius:5}}>{m.name}</span>
                          ))}
                          {members.filter(m=>ev.attendance[m.id]===false).map(m=>(
                            <span key={m.id} style={{fontSize:10.5,background:"rgba(248,113,113,0.08)",color:"#f87171",border:"1px solid rgba(248,113,113,0.18)",padding:"2px 8px",borderRadius:5}}>{m.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeNav==="attendance"&&(
            <div className="page" style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
              <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>📋 Attendance Summary</h3>
                <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>Points earned per member across all events</p>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"rgba(255,255,255,0.02)"}}>
                      <th style={TH}>Member</th>
                      <th style={TH}>Role</th>
                      <th style={{...TH,color:"#60a5fa"}}>Total Points</th>
                      {EVENT_TYPES.map(et=>(
                        <th key={et.id} style={{...TH,color:et.color}}>{et.icon} {et.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m=>{
                      const rs=ROLE_STYLE[m.role]||ROLE_STYLE.Member;
                      const eventCounts = EVENT_TYPES.map(et=>{
                        const eventsOfType = events.filter(e=>e.type===et.id);
                        return eventsOfType.filter(e=>e.attendance?.[m.id]===true).length;
                      });
                      return(
                        <tr key={m.id} className="tr-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                          <td style={{padding:"13px 18px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:32,height:32,borderRadius:9,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{m.name[0]}</div>
                              <span style={{fontWeight:700,fontSize:13.5,color:"#e2e8f0"}}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{padding:"13px 18px"}}><span style={{display:"inline-flex",padding:"4px 10px",borderRadius:7,background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`,fontSize:10.5,fontWeight:700}}>{m.role}</span></td>
                          <td style={{padding:"13px 18px",fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,color:"#60a5fa"}}>{(m.points||0).toLocaleString()}</td>
                          {eventCounts.map((count,i)=>(
                            <td key={i} style={{padding:"13px 18px",textAlign:"center"}}>
                              {count>0?<span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,fontWeight:700,color:EVENT_TYPES[i].color}}>{count}</span>:<span style={{color:"#3d5070",fontSize:12}}>—</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AUCTION HOUSE ── */}
          {activeNav==="auction"&&(
            <div className="page">
              <div style={{background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:18}}>💎</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>Points-Based Bidding</div>
                  <div style={{fontSize:11.5,color:"#4a6a8a",marginTop:1}}>
                    Balance: <strong style={{color:"#60a5fa"}}>{myPoints.toLocaleString()} pts</strong>
                    {currentUser?.role==="Recruit"&&<span style={{color:"#f87171",marginLeft:10}}>⚠️ Recruits cannot bid — get promoted first</span>}
                  </div>
                </div>
              </div>
              {myBids.length>0&&(
                <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:14,padding:"14px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:18}}>🏺</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>Your Active Bids</div>
                    <div style={{fontSize:11.5,color:"#92754a",marginTop:2}}>{myBids.map(i=>i.name).join(", ")}</div>
                  </div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
                {auctionItems.map(item=>{
                  const rs=RARITY_STYLE[item.rarity]||RARITY_STYLE.Common;
                  const myBid=item.bids.find(b=>b.bidder===currentUser?.name);
                  const amWinning=item.highBidder===currentUser?.name;
                  const timeLeft=item.endTime-now;
                  const canBid = myPoints >= item.minBid && !item.locked && currentUser?.role!=="Recruit";
                  return(
                    <div key={item.id} className={`auction-card${item.locked?" locked":""}`}
                      style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:`1px solid ${item.locked?"rgba(100,116,139,0.2)":rs.glow.replace("0.3","0.25")}`,borderRadius:18,padding:"20px",position:"relative",overflow:"hidden",boxShadow:item.locked?"none":`0 4px 30px ${rs.glow}`}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:item.locked?"#374151":rs.color,opacity:0.8}} />
                      {item.locked&&(
                        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(1px)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>
                          <div style={{background:"rgba(15,20,35,0.95)",border:"1px solid rgba(100,116,139,0.3)",borderRadius:12,padding:"10px 22px",textAlign:"center"}}>
                            <div style={{fontSize:20}}>🔒</div>
                            <div style={{color:"#64748b",fontSize:12,fontWeight:700,marginTop:4}}>AUCTION ENDED</div>
                            <div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>Won by {item.winner}</div>
                          </div>
                        </div>
                      )}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,position:"relative",zIndex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:11}}>
                          <div style={{width:52,height:52,borderRadius:12,background:rs.bg,border:`1px solid ${rs.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{item.image}</div>
                          <div>
                            <div style={{fontSize:14.5,fontWeight:700,color:"#e2e8f0"}}>{item.name}</div>
                            <span style={{fontSize:10.5,color:rs.color,fontWeight:700,letterSpacing:"0.06em"}}>{item.rarity.toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.06em"}}>TIME LEFT</div>
                          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,color:timeLeft<300000?"#f87171":"#e2e8f0"}}>{fmtCountdown(timeLeft)}</div>
                        </div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",position:"relative",zIndex:1}}>
                        <div>
                          <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.06em",marginBottom:3}}>CURRENT BID</div>
                          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:rs.color}}>{Math.max(item.currentBid,item.minBid).toLocaleString()}</div>
                        </div>
                        {item.highBidder&&<div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.06em",marginBottom:3}}>LEADING</div>
                          <div style={{fontSize:13,fontWeight:700,color:amWinning?"#34d399":"#e2e8f0"}}>{item.highBidder}</div>
                        </div>}
                      </div>
                      {myBid&&!amWinning&&<div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:9,padding:"8px 12px",marginBottom:10,fontSize:11.5,color:"#f87171",position:"relative",zIndex:1}}>⚠️ You've been outbid! Your bid: {myBid.amount.toLocaleString()} pts</div>}
                      {amWinning&&<div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:9,padding:"8px 12px",marginBottom:10,fontSize:11.5,color:"#34d399",position:"relative",zIndex:1}}>✅ You're winning!</div>}
                      <div style={{display:"flex",gap:9,position:"relative",zIndex:1}}>
                        {!item.locked&&<button className="btn" onClick={()=>{setBidModal(item);setBidAmount("");}} disabled={!canBid}
                          style={{flex:1,background:canBid?`linear-gradient(135deg,${rs.color}30,${rs.color}15)`:"rgba(255,255,255,0.04)",border:`1px solid ${canBid?rs.color+"50":"rgba(255,255,255,0.1)"}`,color:canBid?rs.color:"#3d5070",padding:"10px",fontSize:13,opacity:canBid?1:0.7}}>
                          {currentUser?.role==="Recruit"?"🔒 Recruits Can't Bid":"🏺 Place Bid"}
                        </button>}
                        {isAdmin&&!item.locked&&item.highBidder&&(
                          <button className="btn" onClick={()=>handleAnnounceWinner(item)}
                            style={{background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",padding:"10px 14px",fontSize:12}}>🏆 End</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── WINNERS ── */}
          {activeNav==="winners"&&(
            <div className="page">
              {winners.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#3d5070"}}><div style={{fontSize:40,marginBottom:12}}>🏆</div><div style={{fontSize:16,fontWeight:700}}>No winners yet</div></div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
                {winners.map(w=>{
                  const rs=RARITY_STYLE[w.rarity]||RARITY_STYLE.Common;
                  return(
                    <div key={w.id} className="winner-card" style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:`1px solid ${rs.glow.replace("0.3","0.2")}`,borderRadius:18,padding:"20px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:rs.color}} />
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:11}}>
                          <div style={{width:48,height:48,borderRadius:12,background:rs.bg,border:`1px solid ${rs.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{w.image}</div>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{w.itemName}</div>
                            <span style={{fontSize:10.5,color:rs.color,fontWeight:700}}>{w.rarity}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>WINNING BID</div>
                          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:w.claimed?"#64748b":rs.color}}>{w.points.toLocaleString()} pts</div>
                        </div>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                        <div style={{fontSize:11,color:"#3d5070",marginBottom:3}}>WINNER</div>
                        <div style={{fontSize:15,fontWeight:700,color:"#fbbf24"}}>🏆 {w.winner}</div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <span style={{fontSize:11,color:"#3d5070"}}>{w.date}</span>
                        <span style={{padding:"4px 12px",borderRadius:7,fontSize:11,fontWeight:700,background:w.claimed?"rgba(52,211,153,0.1)":"rgba(251,191,36,0.1)",color:w.claimed?"#34d399":"#fbbf24",border:`1px solid ${w.claimed?"rgba(52,211,153,0.25)":"rgba(251,191,36,0.25)"}`}}>
                          {w.claimed?"✅ Claimed":"⏳ Unclaimed"}
                        </span>
                      </div>
                      {canManage&&(
                        <div style={{display:"flex",gap:8}}>
                          {!w.claimed&&<button className="btn" onClick={()=>handleClaimWinner(w.id)} style={{flex:1,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",padding:"9px",fontSize:12}}>✅ Mark Claimed</button>}
                          {w.claimed&&<button className="btn" onClick={()=>handleRemoveWinner(w.id)} style={{flex:1,background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"9px",fontSize:12}}>🗑️ Remove</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeNav==="settings"&&(
            <div className="page" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,maxWidth:900}}>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:16,letterSpacing:"0.04em"}}>🏰 Guild Settings</h3>
                <div style={{marginBottom:13}}>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Guild Name</label>
                  <input className="dark-input" defaultValue="RAMPAGE" disabled={!isLeader} />
                </div>
                <div style={{marginBottom:13}}>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Season</label>
                  <input className="dark-input" defaultValue="Season 12" disabled={!isLeader} />
                </div>
                {isLeader&&<button className="btn" style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"10px 22px",fontSize:13,marginTop:4}}>Save Changes</button>}
              </div>

              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:6,letterSpacing:"0.04em"}}>🎮 Discord Integration</h3>
                <p style={{color:"#3d5070",fontSize:11.5,marginBottom:16,lineHeight:1.6}}>Connect a Discord webhook for auto-notifications on boss kills, auction events, and winner announcements.</p>
                <div style={{marginBottom:13}}>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Webhook URL</label>
                  <input className="dark-input" placeholder="https://discord.com/api/webhooks/..." value={discordWebhook} onChange={e=>setDiscordWebhook(e.target.value)} disabled={!isAdmin} />
                </div>
                {isAdmin&&<button className="btn" onClick={()=>{setDiscordConnected(true);showToast("🎮 Discord connected!");}}
                  style={{background:discordConnected?"rgba(52,211,153,0.15)":"linear-gradient(135deg,#5865f2,#7289da)",border:discordConnected?"1px solid rgba(52,211,153,0.3)":"none",color:discordConnected?"#34d399":"#fff",padding:"10px 22px",fontSize:13}}>
                  {discordConnected?"✅ Connected":"Connect Discord"}
                </button>}
              </div>

              {/* Event Points Config */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:16,letterSpacing:"0.04em"}}>🏆 Event Points Config</h3>
                <p style={{color:"#3d5070",fontSize:11.5,marginBottom:14}}>Default points awarded per event type (editable per event when creating).</p>
                {EVENT_TYPES.map(et=>(
                  <div key={et.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
                    <span style={{fontSize:16,width:24}}>{et.icon}</span>
                    <span style={{flex:1,fontSize:12.5,color:"#94a3b8",fontWeight:600}}>{et.label}</span>
                    <div style={{background:`${et.color}18`,border:`1px solid ${et.color}40`,borderRadius:8,padding:"5px 14px",fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,color:et.color,minWidth:60,textAlign:"center"}}>
                      +{et.defaultPoints}
                    </div>
                  </div>
                ))}
                <p style={{color:"#3d5070",fontSize:11,marginTop:8}}>💡 To change default points, update EVENT_TYPES in the code, or override per event.</p>
              </div>

              {/* Excel Export */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:6,letterSpacing:"0.04em"}}>📊 Data Export</h3>
                <p style={{color:"#3d5070",fontSize:11.5,marginBottom:16,lineHeight:1.6}}>Export all guild data to Excel — members, events, attendance, auction winners. Auto-exports weekly.</p>
                <button className="btn" onClick={()=>exportToExcel(false)}
                  style={{width:"100%",background:"linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.1))",border:"1px solid rgba(52,211,153,0.35)",color:"#34d399",padding:"12px",fontSize:13}}>
                  📥 Download Excel Report
                </button>
                <p style={{color:"#3d5070",fontSize:10.5,marginTop:10}}>Includes: Members · Events · Attendance Detail · Auction Winners</p>
              </div>

              {/* Leadership */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px",gridColumn:"1/-1"}}>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:14,letterSpacing:"0.04em"}}>🔑 Leadership · Elders: {elderCount}/{MAX_ELDERS}</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                  {members.filter(m=>["Leader","Elder"].includes(m.role)).map(m=>{
                    const rs=ROLE_STYLE[m.role];
                    return(
                      <div key={m.id} style={{background:rs.bg,border:`1px solid ${rs.border}`,borderRadius:13,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800}}>{m.name[0]}</div>
                        <div>
                          <div style={{fontSize:13.5,fontWeight:700,color:"#e2e8f0"}}>{m.name}</div>
                          <span style={{fontSize:10.5,color:rs.color,fontWeight:700}}>{m.role}</span>
                        </div>
                      </div>
                    );
                  })}
                  {members.filter(m=>["Leader","Elder"].includes(m.role)).length===0&&(
                    <div style={{color:"#3d5070",fontSize:12}}>No leaders/elders assigned yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <input ref={bossImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBossImageUpload} />

      {/* Create Event Modal */}
      {showCreateEvent&&(
        <div onClick={()=>setShowCreateEvent(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:460,boxShadow:"0 32px 100px rgba(0,0,0,0.9)",maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",marginBottom:22,letterSpacing:"0.04em"}}>📅 Create Event</h3>

            <div style={{marginBottom:14}}>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Event Type</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {EVENT_TYPES.map(et=>(
                  <button key={et.id} onClick={()=>setEventForm(p=>({...p,type:et.id,points:et.defaultPoints,name:et.label}))}
                    style={{background:eventForm.type===et.id?`${et.color}20`:"rgba(255,255,255,0.04)",border:`1px solid ${eventForm.type===et.id?et.color+"60":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:eventForm.type===et.id?et.color:"#64748b",fontSize:12,fontWeight:700,fontFamily:"'Exo 2',sans-serif",transition:"all 0.15s"}}>
                    <span style={{fontSize:16}}>{et.icon}</span>{et.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Event Name</label>
              <input className="dark-input" placeholder="e.g. Sindri Battle — Island A" value={eventForm.name} onChange={e=>setEventForm(p=>({...p,name:e.target.value}))} />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Date</label>
                <input className="dark-input" value={eventForm.date} onChange={e=>setEventForm(p=>({...p,date:e.target.value}))} />
              </div>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Points Awarded</label>
                <input className="dark-input" type="number" value={eventForm.points} onChange={e=>setEventForm(p=>({...p,points:e.target.value}))} />
              </div>
            </div>

            {(eventForm.type==="server"||eventForm.type==="sindri")&&(
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Server / Location</label>
                <input className="dark-input" placeholder="e.g. HERO vs PROSGARD" value={eventForm.server} onChange={e=>setEventForm(p=>({...p,server:e.target.value}))} />
              </div>
            )}

            <div style={{marginBottom:20}}>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Notes (optional)</label>
              <input className="dark-input" placeholder="Any additional info..." value={eventForm.notes} onChange={e=>setEventForm(p=>({...p,notes:e.target.value}))} />
            </div>

            <div style={{display:"flex",gap:11}}>
              <button className="btn" onClick={()=>setShowCreateEvent(false)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
              <button className="btn" onClick={handleCreateEvent} style={{flex:2,background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"11px",boxShadow:"0 4px 22px rgba(99,102,241,0.35)"}}>Create Event</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember&&(
        <div onClick={()=>setShowAddMember(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:400,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",marginBottom:22,letterSpacing:"0.04em"}}>➕ Add New Member</h3>
            {[{label:"Name",key:"name",type:"text",placeholder:"Enter name"},{label:"Email",key:"email",type:"email",placeholder:"email@guild.gg"}].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.label}</label>
                <input className="dark-input" type={f.type} placeholder={f.placeholder} value={newMember[f.key]} onChange={e=>setNewMember(p=>({...p,[f.key]:e.target.value}))} />
              </div>
            ))}
            {[
              {label:"Role",key:"role",opts:["Leader","Elder","Member","Recruit"]},
              {label:"Class",key:"cls",opts:["Berserker","Skald","Warlord","Volva","Archer","RuneFighter"]},
              {label:"Status",key:"status",opts:["Active","Offline"]},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.label}</label>
                <select className="dark-input" value={newMember[f.key]} onChange={e=>setNewMember(p=>({...p,[f.key]:e.target.value}))}>
                  {f.opts.map(o=><option key={o} value={o} style={{background:"#0a0c18"}}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{fontSize:11,color:"#3d5070",marginBottom:16}}>
              ⚠️ Elders: {elderCount}/{MAX_ELDERS} · Only 1 Leader allowed
            </div>
            <div style={{display:"flex",gap:11}}>
              <button className="btn" onClick={()=>setShowAddMember(false)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
              <button className="btn" onClick={handleAddMember} style={{flex:2,background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"11px",boxShadow:"0 4px 22px rgba(99,102,241,0.35)"}}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember&&(
        <div onClick={()=>setEditMember(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:420,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",marginBottom:22,letterSpacing:"0.04em"}}>✏️ Edit Member</h3>
            {[{label:"Name",key:"name",type:"text"},{label:"Class",key:"cls",type:"text"}].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.label}</label>
                <input className="dark-input" value={editMember[f.key]||""} onChange={e=>setEditMember(p=>({...p,[f.key]:e.target.value}))} />
              </div>
            ))}
            {[
              {label:"Role",key:"role",opts:["Leader","Elder","Member","Recruit"]},
              {label:"Status",key:"status",opts:["Active","Offline"]},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.label}</label>
                <select className="dark-input" value={editMember[f.key]} onChange={e=>setEditMember(p=>({...p,[f.key]:e.target.value}))}>
                  {f.opts.map(o=><option key={o} value={o} style={{background:"#0a0c18"}}>{o}</option>)}
                </select>
              </div>
            ))}
            {isAdmin&&(
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Points</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="dark-input" type="number" value={editMember.points||0} onChange={e=>setEditMember(p=>({...p,points:parseInt(e.target.value)||0}))} style={{flex:1}} />
                  <button className="btn" onClick={()=>setEditMember(p=>({...p,points:Math.max(0,(p.points||0)+100)}))} style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"10px 14px",fontSize:13}}>+100</button>
                  <button className="btn" onClick={()=>setEditMember(p=>({...p,points:Math.max(0,(p.points||0)-100)}))} style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"10px 14px",fontSize:13}}>-100</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:11,marginTop:24}}>
              <button className="btn" onClick={()=>setEditMember(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
              <button className="btn" onClick={handleEditMember} style={{flex:2,background:"linear-gradient(135deg,#0f766e,#14b8a6)",color:"#fff",padding:"11px",boxShadow:"0 4px 22px rgba(20,184,166,0.3)"}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Boss Timer Modal */}
      {bossModal&&(
        <div onClick={()=>setBossModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:360,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:21,fontWeight:700,color:"#f1f5f9",marginBottom:6,letterSpacing:"0.04em"}}>⏱ Set Boss Timer</h3>
            <p style={{color:"#3d5070",fontSize:12.5,marginBottom:20}}>{bosses.find(b=>b.id===bossModal)?.name}</p>
            <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Minutes remaining</label>
            <input className="dark-input" type="number" placeholder="e.g. 45" min="0" value={manualMins} onChange={e=>setManualMins(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetManual()} style={{marginBottom:9}} />
            <p style={{color:"#3d5070",fontSize:11,marginBottom:22}}>Enter 0 to mark as LIVE now.</p>
            <div style={{display:"flex",gap:11}}>
              <button className="btn" onClick={()=>setBossModal(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
              <button className="btn" onClick={handleSetManual} style={{flex:2,background:"linear-gradient(135deg,#0f766e,#14b8a6)",color:"#fff",padding:"11px"}}>Set Timer</button>
            </div>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {bidModal&&(
        <div onClick={()=>setBidModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:420,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <span style={{fontSize:28}}>{bidModal.image}</span>
              <div>
                <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:21,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>{bidModal.name}</h3>
                <span style={{fontSize:10.5,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color,fontWeight:700,letterSpacing:"0.07em"}}>{bidModal.rarity.toUpperCase()}</span>
              </div>
            </div>
            <div style={{background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#60a5fa",fontWeight:600}}>💎 Your balance</span>
              <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:18,fontWeight:700,color:"#60a5fa"}}>{myPoints.toLocaleString()} pts</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>CURRENT BID</div>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:24,fontWeight:700,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}}>{Math.max(bidModal.currentBid,bidModal.minBid).toLocaleString()}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>MIN BID</div>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:18,fontWeight:700,color:"#64748b"}}>{bidModal.minBid.toLocaleString()}</div>
              </div>
            </div>
            <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Your Bid Amount</label>
            <input className="dark-input" type="number" placeholder={`Min ${bidModal.minBid.toLocaleString()} pts`} value={bidAmount} onChange={e=>setBidAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleBid()} style={{marginBottom:20}} />
            <div style={{display:"flex",gap:11}}>
              <button className="btn" onClick={()=>setBidModal(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
              <button className="btn" onClick={handleBid} style={{flex:2,background:`linear-gradient(135deg,${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}40,${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}20)`,border:`1px solid ${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}60`,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color,padding:"11px",fontSize:14}}>
                🏺 Place Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showPermissions&&isAdmin&&(
        <div onClick={()=>setShowPermissions(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}
            style={{background:"#080a16",border:"1px solid rgba(251,191,36,0.2)",borderRadius:24,padding:"32px",width:500,boxShadow:"0 32px 100px rgba(0,0,0,0.95)"}}>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em",marginBottom:6}}>🔐 Admin Control Panel</h3>
            <p style={{color:"#3d5070",fontSize:12,marginBottom:24}}>Leader & Elder access only</p>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px 18px"}}>
                <div style={{fontSize:13.5,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>📊 Guild Stats</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                  {[
                    {label:"Total Members",value:members.length},
                    {label:"Leaders",value:`${leaderCount}/1`},
                    {label:"Elders",value:`${elderCount}/${MAX_ELDERS}`},
                    {label:"Total Events",value:events.length},
                    {label:"Total Points",value:totalGuildPoints.toLocaleString()},
                    {label:"Auction Items",value:auctionItems.length},
                  ].map(s=>(
                    <div key={s.label} style={{background:"rgba(255,255,255,0.03)",borderRadius:9,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#3d5070"}}>{s.label}</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0",fontFamily:"'Rajdhani',sans-serif"}}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn" onClick={()=>exportToExcel(false)}
                style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"13px",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                📊 Export Full Excel Report
              </button>

              {isLeader&&(
                <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"16px 18px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:8}}>⚠️ Danger Zone</div>
                  {!showWipeConfirm?(
                    <button className="btn" onClick={()=>setShowWipeConfirm(true)}
                      style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",padding:"10px 18px",fontSize:12,width:"100%"}}>
                      🗑️ Wipe All Non-Leader Accounts
                    </button>
                  ):(
                    <div>
                      <p style={{color:"#f87171",fontSize:12,marginBottom:12}}>Are you sure? This will delete ALL member and recruit accounts.</p>
                      <div style={{display:"flex",gap:10}}>
                        <button className="btn" onClick={()=>setShowWipeConfirm(false)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"10px"}}>Cancel</button>
                        <button className="btn" onClick={handleWipeAccounts} disabled={wipeLoading}
                          style={{flex:1,background:"rgba(239,68,68,0.2)",border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",padding:"10px"}}>
                          {wipeLoading?"Wiping...":"Confirm Wipe"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="btn" onClick={()=>setShowPermissions(false)}
              style={{width:"100%",marginTop:20,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"12px",fontSize:13}}>
              Close Admin Panel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Members Table ─────────────────────────────────────────────────────────────
function MembersTable({ filtered, currentUser, canManage, onEdit, onRemove, onAddPoints, showFull }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"rgba(255,255,255,0.02)"}}>
            <th style={TH}>Member</th>
            <th style={TH}>Class</th>
            <th style={TH}>Role</th>
            <th style={{...TH,color:"#fbbf24"}}>Points</th>
            <th style={TH}>Status</th>
            {canManage&&<th style={TH}>Actions</th>}
            {!canManage&&<th style={TH} />}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m=>{
            const rs=ROLE_STYLE[m.role]||ROLE_STYLE.Member;
            const ss=STATUS_STYLE[m.status]||STATUS_STYLE.Offline;
            return (
              <tr key={m.id} className="tr-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                <td style={{padding:"13px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:10,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}}>{m.name[0]}</div>
                    <span style={{fontWeight:700,color:"#e2e8f0",fontSize:13.5,letterSpacing:"0.03em"}}>{m.name}</span>
                  </div>
                </td>
                <td style={{padding:"13px 18px",color:"#64748b",fontSize:12.5}}>{m.cls||"—"}</td>
                <td style={{padding:"13px 18px"}}>
                  <span style={{display:"inline-flex",padding:"4px 11px",borderRadius:7,background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`,fontSize:10.5,fontWeight:700,letterSpacing:"0.04em"}}>{m.role}</span>
                </td>
                <td style={{padding:"13px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#fbbf24",fontWeight:700,fontSize:15,fontFamily:"'Rajdhani',sans-serif"}}>{(m.points||0).toLocaleString()}</span>
                    {onAddPoints&&(
                      <div className="points-ctrl">
                        <button className="pts-btn" onClick={()=>onAddPoints(m.id,100)} style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399"}}>+</button>
                        <button className="pts-btn" onClick={()=>onAddPoints(m.id,-100)} style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171"}}>−</button>
                      </div>
                    )}
                  </div>
                </td>
                <td style={{padding:"13px 18px"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:7,background:ss.bg,color:ss.color,fontSize:10.5,fontWeight:700}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:ss.dot,flexShrink:0}} />{m.status}
                  </span>
                </td>
                {canManage&&(
                  <td style={{padding:"13px 18px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button className="ghost-btn" onClick={()=>onEdit(m)}>✏️</button>
                      {m.role!=="Leader"&&<button className="ghost-btn" onClick={()=>onRemove(m.id)} style={{color:"#f87171"}}>🗑️</button>}
                    </div>
                  </td>
                )}
                {!canManage&&<td style={{padding:"13px 18px"}} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Boss Panel (Dashboard sidebar) ───────────────────────────────────────────
function BossPanel({ bosses, onKill, onReset, onManual, onBossImage, killFlash, canManage }) {
  return(
    <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>⚔️ Boss Timers</h3>
        <p style={{color:"#3d5070",fontSize:10.5,marginTop:2}}>Persists across refresh</p>
      </div>
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:9,padding:"13px 15px"}}>
        {bosses.map(b=>{
          const st=bossStatus(b.secs);
          const bs=BOSS_STATUS_STYLE[st];
          return(
            <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
              style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.065)",borderRadius:14,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:b.color}} />
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                <div style={{width:36,height:36,borderRadius:8,background:b.color+"22",border:`1px solid ${b.color}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:canManage?"pointer":"default"}}
                  onClick={()=>canManage&&onBossImage(b.id)}>
                  {b.image ? <img src={b.image} alt={b.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:16}}>👹</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{b.name}</div>
                  <div style={{fontSize:10,color:"#3d5070",marginTop:1}}>{b.ch}</div>
                </div>
                <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:6,background:bs.bg,color:bs.color,border:`1px solid ${bs.border}`,fontSize:9.5,fontWeight:700,flexShrink:0}}>{st}</span>
              </div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:b.color,letterSpacing:"0.06em",lineHeight:1,marginBottom:9}}>
                {fmtSecs(b.secs)}
              </div>
              {canManage&&<>
                <button className="kill-btn" onClick={()=>onKill(b.id)} style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:6,fontSize:11}}>
                  ☠️ Mark Killed
                </button>
                <div style={{display:"flex",gap:6}}>
                  <button className="ghost-btn" onClick={()=>onReset(b.id)} style={{flex:1,fontSize:10,padding:"5px 6px"}}>🔴 LIVE</button>
                  <button className="ghost-btn" onClick={()=>onManual(b.id)} style={{flex:1,fontSize:10,padding:"5px 6px"}}>⏱ Set</button>
                </div>
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function AuthScreen({ page, setPage, loginForm, setLoginForm, regForm, setRegForm, onLogin, onRegister, loading, error, setError }) {
  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; background:#06070e; }
        .auth-bg { min-height:100vh; display:flex; align-items:center; justify-content:center; background:radial-gradient(ellipse at 20% 50%,rgba(99,102,241,0.08),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(251,191,36,0.05),transparent 50%),#06070e; font-family:'Exo 2',sans-serif; padding:20px; }
        @keyframes bgShift { from{transform:scale(1) translate(0,0)} to{transform:scale(1.15) translate(10px,-10px)} }
        .auth-card { background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:36px 34px; width:100%; max-width:420px; box-shadow:0 40px 120px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.06); position:relative; z-index:1; animation:cardIn 0.5s cubic-bezier(0.4,0,0.2,1); }
        @keyframes cardIn { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .auth-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:13px; padding:13px 17px; color:#e2e8f0; font-size:14px; font-family:'Exo 2',sans-serif; outline:none; transition:all 0.2s; }
        .auth-input:focus { border-color:rgba(99,102,241,0.6); background:rgba(99,102,241,0.07); box-shadow:0 0 0 4px rgba(99,102,241,0.1); }
        .auth-input::placeholder { color:#2d3a52; }
        .auth-btn { width:100%; padding:14px; border:none; border-radius:13px; font-family:'Exo 2',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.04em; cursor:pointer; transition:all 0.22s; position:relative; overflow:hidden; }
        .auth-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.12),transparent); opacity:0; transition:opacity 0.22s; }
        .auth-btn:hover::before { opacity:1; }
        .auth-btn:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(99,102,241,0.4); }
        .auth-btn:active { transform:translateY(0) scale(0.98); }
        .tab-btn { flex:1; padding:11px; background:none; border:none; cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:700; font-size:13.5px; letter-spacing:0.04em; transition:all 0.2s; border-radius:10px; }
        .tab-btn.active { background:rgba(99,102,241,0.18); color:#a5b4fc; }
        .tab-btn:not(.active) { color:#3d5070; }
        .tab-btn:not(.active):hover { color:#64748b; }
        .error-shake { animation:shake 0.4s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px)} 75%{transform:translateX(7px)} }
        .floating-icon { animation:floatIcon 4s ease-in-out infinite; }
        @keyframes floatIcon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      <div className="auth-bg">
        <div style={{position:"absolute",top:"15%",left:"8%",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)",pointerEvents:"none",animation:"bgShift 6s ease-in-out infinite alternate-reverse"}} />
        <div style={{position:"absolute",bottom:"18%",right:"10%",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(251,191,36,0.08),transparent 70%)",pointerEvents:"none",animation:"bgShift 7s ease-in-out infinite alternate"}} />

        <div className="auth-card">
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
            <div className="floating-icon" style={{width:72,height:72,borderRadius:"50%",border:"2px solid rgba(251,191,36,0.5)",background:"rgba(251,191,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 0 40px rgba(251,191,36,0.2)"}}>
              <img src={MOCK_LOGO} alt="Rampage" style={{width:"80%",height:"80%",objectFit:"contain",borderRadius:"50%"}} onError={e=>{e.target.style.display="none";}} />
            </div>
            <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:32,fontWeight:700,letterSpacing:"0.16em",background:"linear-gradient(135deg,#fbbf24,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>RAMPAGE</h1>
            <p style={{color:"#2d3a52",fontSize:10.5,letterSpacing:"0.12em",marginTop:4}}>GUILD TRACKER · SEASON 12</p>
          </div>

          <div style={{display:"flex",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:5,marginBottom:24}}>
            <button className={`tab-btn${page==="login"?" active":""}`} onClick={()=>{setPage("login");setError("");}}>Sign In</button>
            <button className={`tab-btn${page==="register"?" active":""}`} onClick={()=>{setPage("register");setError("");}}>Register</button>
          </div>

          {error&&(
            <div className="error-shake" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:11,padding:"10px 14px",marginBottom:16,fontSize:12.5,color:"#fca5a5",display:"flex",alignItems:"center",gap:8}}>
              <span>⚠️</span>{error}
            </div>
          )}

          {page==="login"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Email</label>
                <input className="auth-input" type="email" placeholder="your@email.com" value={loginForm.email} onChange={e=>setLoginForm(p=>({...p,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onLogin()} />
              </div>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Password</label>
                <input className="auth-input" type="password" placeholder="••••••••" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onLogin()} />
              </div>
              <button className="auth-btn" onClick={onLogin} disabled={loading}
                style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",marginTop:6,boxShadow:"0 6px 30px rgba(99,102,241,0.35)"}}>
                {loading?"Signing in...":"Sign In →"}
              </button>
              <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.18)",borderRadius:10,padding:"12px 16px",marginTop:4,textAlign:"center"}}>
                <div style={{fontSize:14,color:"#fbbf24",fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>⚔️ Welcome to RAMPAGE</div>
                <p style={{fontSize:11.5,color:"#64748b",lineHeight:1.6}}>Register with your guild name and sign in. New accounts start as <strong style={{color:"#a78bfa"}}>Recruit</strong>. Leader <strong style={{color:"#fbbf24"}}>Valiant</strong> will assign your rank.</p>
              </div>
            </div>
          )}

          {page==="register"&&(
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Display Name</label>
                <input className="auth-input" type="text" placeholder="Your guild name" value={regForm.name} onChange={e=>setRegForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Email</label>
                <input className="auth-input" type="email" placeholder="your@email.com" value={regForm.email} onChange={e=>setRegForm(p=>({...p,email:e.target.value}))} />
              </div>
              <div>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Class</label>
                <select className="auth-input" value={regForm.cls} onChange={e=>setRegForm(p=>({...p,cls:e.target.value}))} style={{cursor:"pointer"}}>
                  {["Berserker","Skald","Warlord","Volva","Archer","RuneFighter"].map(o=><option key={o} value={o} style={{background:"#0a0c18"}}>{o}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Password</label>
                  <input className="auth-input" type="password" placeholder="Min 6 chars" value={regForm.password} onChange={e=>setRegForm(p=>({...p,password:e.target.value}))} />
                </div>
                <div>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.09em"}}>Confirm</label>
                  <input className="auth-input" type="password" placeholder="Repeat" value={regForm.confirmPassword} onChange={e=>setRegForm(p=>({...p,confirmPassword:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&onRegister()} />
                </div>
              </div>
              <button className="auth-btn" onClick={onRegister} disabled={loading}
                style={{background:"linear-gradient(135deg,#0f766e,#14b8a6)",color:"#fff",marginTop:4,boxShadow:"0 6px 30px rgba(20,184,166,0.3)"}}>
                {loading?"Creating account...":"Create Account →"}
              </button>
              <p style={{textAlign:"center",color:"#3d5070",fontSize:11.5}}>New members join as <strong style={{color:"#a78bfa"}}>Recruit</strong> — Valiant will promote you.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
