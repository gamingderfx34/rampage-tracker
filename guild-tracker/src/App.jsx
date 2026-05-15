import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ─────────────────────────────────────────────────────────
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = "https://mbalsusqtkbtoxuawjau.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_174MDqsta2KNe3orpEN8Ww_0yzhHYaM"; // <-- replace this
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Constants ───────────────────────────────────────────────────────────────
const MOCK_LOGO = "https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png";

const DEFAULT_BOSSES = [
  { id:1, name:"Cruel Outlaw Gand",  secs:0,    minR:30, maxR:60, ch:"CH 1", color:"#f59e0b", image:null },
  { id:2, name:"Gatekeeper Amot",    secs:0,    minR:45, maxR:90, ch:"CH 2", color:"#60a5fa", image:null },
  { id:3, name:"Destroyer Hawler",   secs:0,    minR:30, maxR:60, ch:"CH 3", color:"#34d399", image:null },
  { id:4, name:"Assulter Laudd",     secs:0,    minR:30, maxR:60, ch:"CH 1", color:"#a78bfa", image:null },
];

const INIT_AUCTION_ITEMS = [
  { id:1, name:"Shadowfang Blade",   rarity:"Legendary", minBid:5000, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"⚔️", endTime: Date.now() + 3600000 },
  { id:2, name:"Frostweave Mantle",  rarity:"Epic",      minBid:2000, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🧥", endTime: Date.now() + 7200000 },
  { id:3, name:"Runebound Shield",   rarity:"Rare",      minBid:800,  currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🛡️", endTime: Date.now() + 1800000 },
  { id:4, name:"Stormbringer Staff", rarity:"Epic",      minBid:3500, currentBid:0, highBidder:null, bids:[], locked:false, winner:null, claimed:false, image:"🔱", endTime: Date.now() + 5400000 },
];

const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:"⊞" },
  { id:"members",    label:"Members",       icon:"👥" },
  { id:"bosses",     label:"Boss Timers",   icon:"⚔️" },
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

  // App state — members loaded from Supabase / fallback to localStorage
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
  const [bossImageModal, setBossImageModal] = useState(null); // boss id for image upload
  const fileRef   = useRef(null);
  const bossImgRef = useRef(null);

  // ── Persist boss timers to localStorage ──────────────────────────────────
  useEffect(()=>{ lsSet("rampageBosses", bosses); }, [bosses]);
  useEffect(()=>{ lsSet("rampageAuction", auctionItems); }, [auctionItems]);
  useEffect(()=>{ lsSet("rampageWinners", winners); }, [winners]);

  // ── Sync boss timer with real time on load ────────────────────────────────
  useEffect(()=>{
    const stored = lsGet("rampageBossTimestamp", null);
    if (stored) {
      const elapsed = Math.floor((Date.now() - stored) / 1000);
      if (elapsed > 0) {
        setBosses(prev=>prev.map(b=>({...b, secs:Math.max(0, b.secs - elapsed)})));
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("members")
          .select("*")
          .eq("email", session.user.email)
          .single();
        const role = profile?.role || "Recruit";
        const name = profile?.name || session.user.email.split("@")[0].toUpperCase();
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          role,
          name,
          points: profile?.points || 0
        });
      }
    };
    restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  },[]);
  // ── Load members from Supabase ────────────────────────────────────────────
  useEffect(()=>{
    loadMembers();
  },[]);

  const loadMembers = async()=>{
    try {
      const { data, error } = await supabase.from("members").select("*").order("points", {ascending:false});
      if (error) {
        // Fallback: load from localStorage if Supabase fails
        const local = lsGet("rampageMembers", []);
        // Ensure Valiant is always present as Leader
        if (!local.find(m=>m.name==="VALIANT")) {
          local.unshift({id:"valiant-leader",name:"VALIANT",role:"Leader",cls:"Skald",points:0,status:"Active",email:"valiant@rampage.gg"});
        }
        setMembers(local);
      } else {
        setMembers(data || []);
      }
    } catch {
      const local = lsGet("rampageMembers", []);
      if (!local.find(m=>m.name==="VALIANT")) {
        local.unshift({id:"valiant-leader",name:"VALIANT",role:"Leader",cls:"Skald",points:0,status:"Active",email:"valiant@rampage.gg"});
      }
      setMembers(local);
    }
  };

  // Sync attendance when members change
  useEffect(()=>{
    if (members.length === 0) return;
    setAttendance(prev=>{
      const existing = new Map(prev.map(a=>[a.memberId, a]));
      return members.map(m=>{
        if (existing.has(m.id)) return existing.get(m.id);
        return {
          memberId:m.id, name:m.name, role:m.role,
          logs:[{date:today, present:m.status==="Active", note:m.status==="Active"?"Present":"Absent"}]
        };
      });
    });
  },[members]);

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

  const showToast = useCallback((msg, type="success")=>{
    setToast({msg,type,id:Date.now()});
    setTimeout(()=>setToast(null),3000);
  },[]);

  // ── Auth: Supabase sign-in ────────────────────────────────────────────────
  const handleLogin = async()=>{
    setAuthLoading(true); setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }

      // Fetch member profile
      const { data: profile } = await supabase.from("members")
        .select("*").eq("email", loginForm.email).single();

      const role = profile?.role || "Recruit";
      const name = profile?.name || loginForm.email.split("@")[0].toUpperCase();
      setCurrentUser({ id: data.user.id, email: loginForm.email, role, name, points: profile?.points || 0 });
    } catch(e) {
      // Fallback local check for Valiant
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
      // 1. Register in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: regForm.email,
        password: regForm.password,
        options: { data: { display_name: regForm.name.toUpperCase(), cls: regForm.cls } }
      });
      if (error) { setAuthError(error.message); setAuthLoading(false); return; }

      // 2. Insert member profile into members table
      const newM = {
        id: data.user?.id || String(Date.now()),
        name: regForm.name.toUpperCase(),
        role: "Recruit",
        cls: regForm.cls,
        points: 0,
        status: "Active",
        email: regForm.email,
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("members").insert([newM]);
      if (insertErr) {
        // Fallback: save locally
        setMembers(prev=>[...prev, newM]);
        lsSet("rampageMembers", [...lsGet("rampageMembers",[]), newM]);
      } else {
        setMembers(prev=>[...prev, newM]);
      }

      setCurrentUser({ id:newM.id, email:regForm.email, role:"Recruit", name:newM.name, points:0 });
    } catch(e) {
      // Fallback local registration
      const newM = {
        id: String(Date.now()),
        name: regForm.name.toUpperCase(),
        role: "Recruit",
        cls: regForm.cls,
        points: 0,
        status: "Active",
        email: regForm.email,
      };
      setMembers(prev=>[...prev, newM]);
      lsSet("rampageMembers", [...lsGet("rampageMembers",[]), newM]);
      setCurrentUser({ id:newM.id, email:regForm.email, role:"Recruit", name:newM.name, points:0 });
    }
    setAuthLoading(false);
  };

  const handleLogout = async()=>{
    await supabase.auth.signOut().catch(()=>{});
    setCurrentUser(null);
    setAuthPage("login");
    setLoginForm({email:"",password:""});
  };

  // ── Admin: Wipe all non-leader registered accounts ─────────────────────────
  const handleWipeAccounts = async()=>{
    setWipeLoading(true);
    try {
      // Remove all non-Leader members from Supabase
      await supabase.from("members").delete().neq("role","Leader");
      // Locally keep only Leader
      setMembers(prev=>prev.filter(m=>m.role==="Leader"));
      lsSet("rampageMembers", members.filter(m=>m.role==="Leader"));
      showToast("🗑️ All non-leader accounts wiped","warn");
    } catch {
      setMembers(prev=>prev.filter(m=>m.role==="Leader"));
      lsSet("rampageMembers", members.filter(m=>m.role==="Leader"));
      showToast("🗑️ Accounts wiped (local)","warn");
    }
    setWipeLoading(false);
    setShowWipeConfirm(false);
    setShowPermissions(false);
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
      setBossImageModal(null);
      showToast("🖼️ Boss image updated!");
    };
    reader.readAsDataURL(file);
  };

  // ── Boss actions ───────────────────────────────────────────────────────────
  const handleMarkKilled = (id)=>{
    setKillFlash(id);
    setTimeout(()=>setKillFlash(null),700);
    setBosses(prev=>prev.map(b=>{
      if(b.id!==id) return b;
      const secs = Math.floor((b.minR+Math.random()*(b.maxR-b.minR))*60);
      return {...b,secs};
    }));
    if(discordConnected) showToast("📢 Discord notified: Boss killed!","info");
  };

  const handleResetToZero = (id)=>{
    setKillFlash(id);
    setTimeout(()=>setKillFlash(null),700);
    setBosses(prev=>prev.map(b=>b.id===id?{...b,secs:0}:b));
  };

  const handleSetManual = ()=>{
    const mins = parseFloat(manualMins);
    if(isNaN(mins)||mins<0) return;
    setBosses(prev=>prev.map(b=>b.id===bossModal?{...b,secs:Math.floor(mins*60)}:b));
    setBossModal(null); setManualMins("");
  };

  // ── Attendance ────────────────────────────────────────────────────────────
  const handleMarkAttendance = (memberId,date,present)=>{
    setAttendance(prev=>prev.map(a=>{
      if(a.memberId!==memberId) return a;
      return {...a,logs:a.logs.map(l=>l.date===date?{...l,present,note:present?"Present":"Absent"}:l)};
    }));
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const handleAddMember = async()=>{
    if(!newMember.name.trim()) return;
    const m={...newMember,id:String(Date.now()),points:0};
    try { await supabase.from("members").insert([m]); } catch {}
    setMembers(prev=>[...prev,m]);
    setAttendance(prev=>[...prev,{memberId:m.id,name:m.name,role:m.role,logs:[{date:today,present:true,note:"Joined"}]}]);
    setNewMember({name:"",role:"Member",cls:"Berserker",status:"Active",email:""});
    setShowAddMember(false);
    showToast(`✅ ${m.name} added to guild!`);
  };

  const handleEditMember = async()=>{
    if(!editMember) return;
    try { await supabase.from("members").update(editMember).eq("id",editMember.id); } catch {}
    setMembers(prev=>prev.map(m=>m.id===editMember.id?editMember:m));
    // Update currentUser points if editing self
    if (currentUser && editMember.id === currentUser.id) {
      setCurrentUser(prev=>({...prev, points:editMember.points, role:editMember.role}));
    }
    setEditMember(null);
    showToast("✅ Member updated!");
  };

  const handleRemoveMember = async(id)=>{
    try { await supabase.from("members").delete().eq("id",id); } catch {}
    setMembers(prev=>prev.filter(m=>m.id!==id));
    showToast("🗑️ Member removed","warn");
  };

  const handleChangeRole = async(memberId, newRole)=>{
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

  // ── Auction ───────────────────────────────────────────────────────────────
  const handleBid = ()=>{
    const amount = parseInt(bidAmount);
    const myMember = members.find(m=>m.name===currentUser?.name);
    const myPoints = myMember?.points || 0;

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

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered      = members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.cls?.toLowerCase().includes(search.toLowerCase()));
  const activeCount   = members.filter(m=>m.status==="Active").length;
  const presentToday  = attendance.filter(a=>a.logs.some(l=>l.date===today&&l.present)).length;
  const attendancePct = members.length?Math.round((presentToday/members.length)*100):0;
  const isLeader      = currentUser?.role==="Leader";
  const isAdmin       = currentUser && (currentUser.role==="Leader"||currentUser.role==="Elder");
  const canManage     = currentUser && CAN_MANAGE(currentUser.role);
  const myPoints      = members.find(m=>m.name===currentUser?.name)?.points || 0;
  const myBids        = auctionItems.filter(i=>i.bids.some(b=>b.bidder===currentUser?.name));
  const totalGuildPoints = members.reduce((sum,m)=>sum+(m.points||0),0);

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

        .nav-btn {
          display:flex; align-items:center; gap:13px;
          width:100%; padding:13px 16px; border-radius:12px;
          background:none; border:1px solid transparent;
          color:#3d4a63; cursor:pointer; font-size:13.5px; font-weight:600;
          font-family:'Exo 2',sans-serif; letter-spacing:0.02em;
          transition:all 0.18s cubic-bezier(0.4,0,0.2,1);
          -webkit-tap-highlight-color:transparent; position:relative;
        }
        .nav-btn:hover { background:rgba(255,255,255,0.06); color:#8899bb; transform:translateX(4px); }
        .nav-btn.active { background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(99,102,241,0.1)); color:#a5b4fc; border-color:rgba(99,102,241,0.3); box-shadow:0 0 20px rgba(99,102,241,0.1); }

        .btn {
          cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:700;
          border:none; border-radius:10px; transition:all 0.18s;
          -webkit-tap-highlight-color:transparent; letter-spacing:0.03em;
        }
        .btn:hover { filter:brightness(1.15); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
        .btn:active { transform:translateY(0) scale(0.97); filter:brightness(0.93); }

        .kill-btn {
          width:100%; padding:9px; border:none; cursor:pointer; border-radius:9px;
          font-family:'Exo 2',sans-serif; font-weight:700; font-size:12.5px;
          letter-spacing:0.03em; transition:all 0.18s;
        }
        .kill-btn:hover { filter:brightness(1.2); transform:translateY(-1px); }

        .ghost-btn {
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          color:#64748b; padding:6px 10px; border-radius:8px;
          cursor:pointer; font-size:11px; font-weight:600;
          font-family:'Exo 2',sans-serif; transition:all 0.18s;
        }
        .ghost-btn:hover { background:rgba(255,255,255,0.09); color:#94a3b8; }

        .dark-input {
          width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          border-radius:11px; padding:11px 15px; color:#e2e8f0; font-size:13px;
          font-family:'Exo 2',sans-serif; outline:none; transition:all 0.2s;
        }
        .dark-input:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.06); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .dark-input::placeholder { color:#2d3a52; }
        .dark-input:disabled { opacity:0.5; cursor:not-allowed; }

        .boss-card { transition:all 0.25s; }
        .boss-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.5); }
        .kill-flash { animation:flashKill 0.6s ease; }
        @keyframes flashKill {
          0%,100% { background:rgba(255,255,255,0.03); }
          50% { background:rgba(239,68,68,0.25); }
        }

        .auction-card { transition:all 0.25s; }
        .auction-card:hover:not(.locked) { transform:translateY(-3px); }
        .auction-card.locked { opacity:0.65; }

        .winner-card { transition:all 0.25s; }
        .winner-card:hover { transform:translateY(-2px); }

        .tr-row { transition:background 0.15s; }
        .tr-row:hover { background:rgba(255,255,255,0.025); }

        .att-btn {
          padding:5px 10px; border-radius:7px; cursor:pointer; font-weight:700;
          font-size:13px; font-family:'Exo 2',sans-serif; transition:all 0.15s; border:none;
        }
        .att-btn:hover { filter:brightness(1.3); transform:scale(1.1); }

        .bid-history { max-height:100px; overflow-y:auto; }

        .modal-box { animation:modalIn 0.22s cubic-bezier(0.4,0,0.2,1); }
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.95) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        .page { animation:fadeIn 0.25s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .logo-ring:hover .logo-ov { opacity:1!important; }
        .logo-ring { cursor:pointer; }

        .stat-card { transition:all 0.25s; }
        .stat-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.12)!important; }

        .notif-badge { animation:pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }

        .col-btn-door {
          position:absolute; right:-13px; top:50%;
          transform:translateY(-50%);
          width:26px; height:26px; border-radius:50%;
          background:#0c0f1f; border:1px solid rgba(255,255,255,0.1);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:9px; color:#3d5070; z-index:20;
          transition:all 0.2s; box-shadow:2px 0 12px rgba(0,0,0,0.5);
        }
        .col-btn-door:hover { background:#1a2035; color:#94a3b8; border-color:rgba(99,102,241,0.3); }

        .boss-img-upload { cursor:pointer; transition:all 0.2s; }
        .boss-img-upload:hover { opacity:0.8; }

        .points-ctrl { display:flex; align-items:center; gap:6px; }
        .pts-btn {
          width:24px; height:24px; border-radius:6px; border:none; cursor:pointer;
          font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center;
          transition:all 0.15s; font-family:'Exo 2',sans-serif;
        }
        .pts-btn:hover { filter:brightness(1.3); transform:scale(1.1); }
      `}</style>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:999,
          background:toast.type==="error"?"rgba(15,10,10,0.97)":toast.type==="warn"?"rgba(15,12,5,0.97)":toast.type==="info"?"rgba(5,10,20,0.97)":"rgba(5,15,10,0.97)",
          border:`1px solid ${toast.type==="error"?"rgba(239,68,68,0.35)":toast.type==="warn"?"rgba(251,191,36,0.35)":toast.type==="info"?"rgba(96,165,250,0.35)":"rgba(52,211,153,0.35)"}`,
          borderRadius:14, padding:"13px 20px", color:"#e2e8f0", fontSize:13, fontWeight:600,
          backdropFilter:"blur(12px)", maxWidth:340, boxShadow:"0 12px 40px rgba(0,0,0,0.5)",
          fontFamily:"'Exo 2',sans-serif",
        }}>{toast.msg}</div>
      )}

      {/* Outbid Notifications */}
      {notifications.length > 0 && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,display:"flex",flexDirection:"column",gap:8}}>
          {notifications.map(n=>(
            <div key={n.id} style={{background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.35)",borderRadius:12,padding:"10px 18px",color:"#f87171",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(12px)",fontFamily:"'Exo 2',sans-serif",boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}}>
              <span className="notif-badge" style={{width:8,height:8,borderRadius:"50%",background:"#f87171",flexShrink:0}} />
              <span>⚠️ Outbid on <strong style={{color:"#fca5a5"}}>{n.item}</strong>! Current: <strong>{n.amount.toLocaleString()}</strong></span>
              <button onClick={()=>setBidModal(auctionItems.find(i=>i.name===n.item))} style={{background:"rgba(248,113,113,0.25)",border:"1px solid rgba(248,113,113,0.4)",color:"#fca5a5",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Exo 2',sans-serif"}}>Bid Again</button>
              <button onClick={()=>setNotifications(prev=>prev.filter(x=>x.key!==n.key))} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",height:"100vh",background:"#06070e",fontFamily:"'Exo 2',sans-serif",color:"#e2e8f0",overflow:"hidden",position:"relative"}}>

        {/* Ambient glows */}
        <div style={{position:"fixed",top:-250,left:-150,width:700,height:700,background:"radial-gradient(circle,rgba(99,102,241,0.065),transparent 70%)",pointerEvents:"none",zIndex:0}} />
        <div style={{position:"fixed",bottom:-200,right:-100,width:600,height:600,background:"radial-gradient(circle,rgba(251,191,36,0.04),transparent 70%)",pointerEvents:"none",zIndex:0}} />

        {/* ═══ SIDEBAR ═══ */}
        <aside className={`sidebar${collapsed?" collapsed":""}`}
          style={{width:collapsed?68:270,minHeight:"100vh",background:"linear-gradient(180deg,#090b1a,#070910)",borderRight:"1px solid rgba(255,255,255,0.055)",display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:10,boxShadow:"6px 0 40px rgba(0,0,0,0.7)"}}>

          <div className="col-btn-door" onClick={()=>setCollapsed(!collapsed)}>
            {collapsed?"▶":"◀"}
          </div>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:11,padding:"22px 14px 16px",flexShrink:0}}>
            <div className="logo-ring" onClick={()=>canManage&&fileRef.current?.click()}
              style={{width:50,height:50,borderRadius:"50%",border:"2px solid rgba(251,191,36,0.5)",background:"rgba(251,191,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",flexShrink:0,boxShadow:"0 0 24px rgba(251,191,36,0.18)"}}>
              {logoErr||!logoUrl
                ? <span style={{fontSize:24}}>⚔️</span>
                : <img src={logoUrl} alt="logo" style={{width:"80%",height:"80%",objectFit:"contain",borderRadius:"50%"}} onError={()=>setLogoErr(true)} />}
              <div className="logo-ov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s",borderRadius:"50%",fontSize:18}}>
                {uploading?"⏳":"📷"}
              </div>
            </div>
            {canManage && <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload} />}

            <div className="sidebar-label" style={{flex:1,minWidth:0}}>
              <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,letterSpacing:"0.14em",background:"linear-gradient(135deg,#fbbf24,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1}}>RAMPAGE</h1>
              <p style={{color:"#2d3a52",fontSize:9.5,letterSpacing:"0.1em",marginTop:2}}>GUILD TRACKER</p>
              {uploadMsg && <p style={{color:"#34d399",fontSize:10,marginTop:3}}>{uploadMsg}</p>}
            </div>
          </div>

          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)",margin:"0 14px 12px"}} />

          {/* Nav */}
          <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3,padding:"0 9px"}}>
            {NAV.map(item=>(
              <button key={item.id} className={`nav-btn${activeNav===item.id?" active":""}`}
                onClick={()=>setActiveNav(item.id)}
                style={{justifyContent:collapsed?"center":"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0,lineHeight:1}}>{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {activeNav===item.id&&!collapsed&&
                  <div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:"#818cf8",boxShadow:"0 0 10px #818cf8",flexShrink:0}} />}
              </button>
            ))}
          </nav>

          {/* User card */}
          <div style={{margin:"12px 9px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:collapsed?"12px 0":"13px 15px",display:"flex",alignItems:"center",gap:11,position:"relative",justifyContent:collapsed?"center":"flex-start"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#fbbf24,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#1c1207",flexShrink:0}}>
              {currentUser.name?.[0]||"?"}
            </div>
            <div className="sidebar-label">
              <div style={{fontSize:13.5,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.04em"}}>{currentUser.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11,color:"#fbbf24"}}>{currentUser.role||"Member"}</span>
                <span style={{fontSize:10,color:"#3d5070"}}>·</span>
                <span style={{fontSize:10,color:"#60a5fa"}}>{myPoints.toLocaleString()} pts</span>
              </div>
            </div>
            <div style={{position:"absolute",top:10,right:11,width:8,height:8,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 10px #34d399"}} />
          </div>

          {/* Logout */}
          {!collapsed&&(
            <button className="btn" onClick={handleLogout}
              style={{margin:"0 9px 14px",background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"10px",fontSize:12,borderRadius:11,letterSpacing:"0.04em"}}>
              🚪 Log Out
            </button>
          )}
          {collapsed&&(
            <button className="btn" onClick={handleLogout} title="Log Out"
              style={{margin:"0 9px 14px",background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"10px",fontSize:16,borderRadius:11}}>
              🚪
            </button>
          )}
        </aside>

        {/* ═══ MAIN ═══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* Topbar */}
          <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 28px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(6,7,14,0.92)",backdropFilter:"blur(18px)",flexShrink:0,gap:12,flexWrap:"wrap"}}>
            <div>
              <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,letterSpacing:"0.05em",color:"#f1f5f9",lineHeight:1.1}}>
                {NAV.find(n=>n.id===activeNav)?.icon} {NAV.find(n=>n.id===activeNav)?.label}
              </h2>
              <p style={{color:"#3d5070",fontSize:11.5,marginTop:3,letterSpacing:"0.04em"}}>
                {{dashboard:"Guild overview and live activity",members:"Manage your full guild roster",bosses:"Live countdown and respawn control — persists across sessions",attendance:"Daily attendance logs",auction:"Guild auction house — bid with your earned points",winners:"Past auction winners",settings:"Configure guild & integration settings"}[activeNav]}
              </p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              {myBids.length>0&&(
                <div style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"7px 13px",display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:11}}>🏺</span>
                  <span style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>{myBids.length} active bid{myBids.length>1?"s":""}</span>
                </div>
              )}
              {/* My Points Badge */}
              <div style={{background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:10,padding:"7px 13px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11}}>💎</span>
                <span style={{fontSize:11,color:"#60a5fa",fontWeight:700}}>{myPoints.toLocaleString()} pts</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"9px 15px"}}>
                <span style={{color:"#2d3a52",fontSize:13}}>🔍</span>
                <input className="dark-input" placeholder="Search..." style={{padding:0,background:"none",border:"none",width:140,fontSize:12.5}} value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              {canManage&&(
                <button className="btn" onClick={()=>setShowAddMember(true)}
                  style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"9px 20px",fontSize:13,boxShadow:"0 4px 22px rgba(99,102,241,0.38)"}}>
                  + Add Member
                </button>
              )}
              {isAdmin&&(
                <button className="btn" onClick={()=>setShowPermissions(true)}
                  style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"9px 16px",fontSize:12}}>
                  🔐 Admin
                </button>
              )}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="page" key={activeNav} style={{flex:1,overflow:"auto",padding:"24px 28px"}}>

            {/* ── DASHBOARD ── */}
            {activeNav==="dashboard"&&<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:22}}>
                {[
                  {label:"Total Members",  value:members.length,             icon:"👥",color:"#818cf8",glow:"rgba(129,140,248,0.15)"},
                  {label:"Online Now",     value:activeCount,                icon:"🟢",color:"#34d399",glow:"rgba(52,211,153,0.15)"},
                  {label:"Attendance",     value:attendancePct+"%",          icon:"📋",color:"#fbbf24",glow:"rgba(251,191,36,0.15)"},
                  {label:"Total Guild Pts",value:totalGuildPoints.toLocaleString(),icon:"🏆",color:"#f87171",glow:"rgba(248,113,113,0.15)"},
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
              <div style={{display:"grid",gridTemplateColumns:"1fr 375px",gap:18}}>
                <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} onAddPoints={isAdmin?handleAddPoints:null} />
                <BossPanel bosses={bosses} onKill={handleMarkKilled} onReset={handleResetToZero} onManual={id=>{setBossModal(id);setManualMins("");}} onBossImage={id=>{setBossImageModal(id);bossImgRef.current?.click();}} killFlash={killFlash} canManage={canManage} />
              </div>
            </>}

            {/* ── MEMBERS ── */}
            {activeNav==="members"&&(
              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
                <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>All Guild Members</h3>
                    <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>{filtered.length} members · {isAdmin?"Points are editable by Leaders & Elders":"Points shown — ask Leader/Elder to adjust"}</p>
                  </div>
                </div>
                <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} onAddPoints={isAdmin?handleAddPoints:null} showFull />
              </div>
            )}

            {/* ── BOSS TIMERS ── */}
            {activeNav==="bosses"&&(
              <>
                <div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:12,padding:"10px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#34d399"}}>
                  <span>⏱</span>
                  <span>Boss timers <strong>persist across sessions</strong> — they continue counting down even after refresh. Set a timer when you first spot a boss, and it stays accurate.</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
                  {bosses.map(b=>{
                    const st=bossStatus(b.secs);
                    const bs=BOSS_STATUS_STYLE[st];
                    return(
                      <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
                        style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px 22px 18px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:b.color,borderRadius:"4px 0 0 4px"}} />

                        {/* Boss Image + Name */}
                        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:13}}>
                          <div className="boss-img-upload" onClick={()=>canManage&&(setBossImageModal(b.id),bossImgRef.current?.click())}
                            style={{width:78,height:78,borderRadius:14,background:b.color+"22",border:`2px solid ${b.color}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,position:"relative"}}>
                            {b.image
                              ? <img src={b.image} alt={b.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                              : <span style={{fontSize:32}}>👹</span>}
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
                          <button className="kill-btn" onClick={()=>handleMarkKilled(b.id)}
                            style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:9,letterSpacing:"0.03em"}}>
                            ☠️ Mark Killed — start respawn timer
                          </button>
                          <div style={{display:"flex",gap:9}}>
                            <button className="ghost-btn" onClick={()=>handleResetToZero(b.id)} style={{flex:1}}>🔴 Set LIVE</button>
                            <button className="ghost-btn" onClick={()=>{setBossModal(b.id);setManualMins("");}} style={{flex:1}}>⏱ Set timer</button>
                          </div>
                        </>}
                        {!canManage&&<div style={{textAlign:"center",color:"#3d5070",fontSize:11,marginTop:8}}>👀 View only · Leader/Elder can control</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── ATTENDANCE ── */}
            {activeNav==="attendance"&&(
              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
                <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>📋 Attendance Log</h3>
                    <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>{canManage?"Click ✓ / ✗ on today's column to update · Attendance affects member standing":"View only — Leaders & Elders can mark attendance"}</p>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:13,padding:"10px 20px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:28,fontWeight:700,color:"#34d399"}}>{attendancePct}%</div>
                      <div style={{fontSize:10,color:"#3d5070",marginTop:1,letterSpacing:"0.07em"}}>TODAY</div>
                    </div>
                    <div style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:13,padding:"10px 20px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:28,fontWeight:700,color:"#fbbf24"}}>{presentToday}/{members.length}</div>
                      <div style={{fontSize:10,color:"#3d5070",marginTop:1,letterSpacing:"0.07em"}}>PRESENT</div>
                    </div>
                  </div>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"rgba(255,255,255,0.02)"}}>
                        <th style={TH}>Member</th>
                        <th style={TH}>Role</th>
                        <th style={{...TH,color:"#60a5fa"}}>Points</th>
                        {attendance[0]?.logs.map(l=>(
                          <th key={l.date} style={{...TH,color:l.date===today?"#fbbf24":"#3d5070"}}>
                            {l.date}{l.date===today?" ★":""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a=>{
                        const m = members.find(x=>x.id===a.memberId);
                        const rs=ROLE_STYLE[a.role]||ROLE_STYLE.Member;
                        return(
                          <tr key={a.memberId} className="tr-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                            <td style={{padding:"13px 18px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:32,height:32,borderRadius:9,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{a.name[0]}</div>
                                <span style={{fontWeight:700,fontSize:13.5,color:"#e2e8f0",letterSpacing:"0.03em"}}>{a.name}</span>
                              </div>
                            </td>
                            <td style={{padding:"13px 18px"}}>
                              <span style={{display:"inline-flex",padding:"4px 10px",borderRadius:7,background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`,fontSize:10.5,fontWeight:700}}>{a.role}</span>
                            </td>
                            <td style={{padding:"13px 18px",fontFamily:"'Rajdhani',sans-serif",fontSize:15,fontWeight:700,color:"#60a5fa"}}>{(m?.points||0).toLocaleString()}</td>
                            {a.logs.map(l=>(
                              <td key={l.date} style={{padding:"13px 18px",textAlign:"center"}}>
                                {l.date===today&&canManage?(
                                  <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                                    <button className="att-btn" onClick={()=>handleMarkAttendance(a.memberId,l.date,true)}
                                      style={{background:l.present?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.06)",color:l.present?"#34d399":"#475569",border:l.present?"1px solid rgba(52,211,153,0.4)":"1px solid rgba(255,255,255,0.08)"}}>✓</button>
                                    <button className="att-btn" onClick={()=>handleMarkAttendance(a.memberId,l.date,false)}
                                      style={{background:!l.present?"rgba(248,113,113,0.25)":"rgba(255,255,255,0.06)",color:!l.present?"#f87171":"#475569",border:!l.present?"1px solid rgba(248,113,113,0.4)":"1px solid rgba(255,255,255,0.08)"}}>✗</button>
                                  </div>
                                ):(
                                  <span style={{fontSize:16}}>{l.present?"✅":"❌"}</span>
                                )}
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
              <div>
                {/* Points notice */}
                <div style={{background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <span style={{fontSize:18}}>💎</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#60a5fa"}}>Points-Based Bidding</div>
                    <div style={{fontSize:11.5,color:"#4a6a8a",marginTop:1}}>You can only bid if you have enough points. Your balance: <strong style={{color:"#60a5fa"}}>{myPoints.toLocaleString()} pts</strong> · Points are awarded by Leaders &amp; Elders.</div>
                  </div>
                </div>

                {myBids.length>0&&(
                  <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:14,padding:"14px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>🏺</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",letterSpacing:"0.03em"}}>Your Active Bids</div>
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
                    const canBid = myPoints >= item.minBid && !item.locked;
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
                              <div style={{fontSize:14.5,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{item.name}</div>
                              <span style={{fontSize:10,fontWeight:700,color:rs.color,background:rs.bg,border:`1px solid ${rs.color}30`,padding:"2px 8px",borderRadius:5,display:"inline-block",marginTop:3,letterSpacing:"0.06em"}}>{item.rarity.toUpperCase()}</span>
                            </div>
                          </div>
                          {timeLeft>0&&!item.locked&&(
                            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 10px",textAlign:"center"}}>
                              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,color:timeLeft<3600000?"#f87171":"#94a3b8"}}>{fmtCountdown(timeLeft)}</div>
                              <div style={{fontSize:9,color:"#3d5070",letterSpacing:"0.06em"}}>ENDS IN</div>
                            </div>
                          )}
                        </div>

                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,position:"relative",zIndex:1}}>
                          <div>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>CURRENT BID</div>
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:rs.color}}>
                              {item.currentBid>0?item.currentBid.toLocaleString():item.minBid.toLocaleString()} <span style={{fontSize:12,color:"#3d5070"}}>pts</span>
                            </div>
                            <div style={{fontSize:10,color:"#3d5070",marginTop:2}}>Min: {item.minBid.toLocaleString()}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>HIGH BIDDER</div>
                            <div style={{fontSize:13,fontWeight:700,color:amWinning?"#34d399":"#e2e8f0"}}>{item.highBidder||"—"} {amWinning&&!item.locked?"🏆":""}</div>
                          </div>
                        </div>

                        {myBid&&!item.locked&&(
                          <div style={{background:amWinning?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",border:`1px solid ${amWinning?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,borderRadius:9,padding:"7px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8,fontSize:11.5,fontWeight:600,color:amWinning?"#34d399":"#f87171",position:"relative",zIndex:1}}>
                            {amWinning?"🏆 You're winning!":"⚠️ You've been outbid!"} <span style={{marginLeft:"auto",color:amWinning?"#34d399":"#fca5a5"}}>Your bid: {myBid.amount.toLocaleString()}</span>
                          </div>
                        )}

                        {!item.locked&&(
                          <div style={{display:"flex",gap:8,position:"relative",zIndex:1}}>
                            {canBid ? (
                              <button className="btn" onClick={()=>{setBidModal(item);setBidAmount(String(Math.max(item.minBid, item.currentBid+100)));}}
                                style={{flex:1,background:`linear-gradient(135deg,${rs.color}25,${rs.color}15)`,border:`1px solid ${rs.color}40`,color:rs.color,padding:"10px",fontSize:12.5}}>
                                🏺 Place Bid
                              </button>
                            ) : (
                              <div style={{flex:1,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.2)",borderRadius:10,padding:"10px",textAlign:"center",fontSize:11.5,color:"#475569"}}>
                                {myPoints < item.minBid ? `Need ${item.minBid.toLocaleString()} pts to bid` : "Need more points"}
                              </div>
                            )}
                            {canManage&&item.highBidder&&(
                              <button className="btn" onClick={()=>handleAnnounceWinner(item)}
                                style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"10px 14px",fontSize:11}}>
                                🏆 End
                              </button>
                            )}
                          </div>
                        )}

                        {item.bids.length>0&&!item.locked&&(
                          <div style={{marginTop:12,position:"relative",zIndex:1}}>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:6}}>RECENT BIDS</div>
                            <div className="bid-history">
                              {[...item.bids].reverse().slice(0,4).map((b,i)=>(
                                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:11.5}}>
                                  <span style={{color:b.bidder===currentUser?.name?"#a5b4fc":"#64748b",fontWeight:b.bidder===currentUser?.name?700:400}}>{b.bidder}</span>
                                  <span style={{color:"#94a3b8"}}>{b.amount.toLocaleString()} pts · {b.time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WINNERS ── */}
            {activeNav==="winners"&&(
              <div>
                {winners.length===0&&(
                  <div style={{textAlign:"center",padding:"60px 20px",color:"#3d5070"}}>
                    <div style={{fontSize:48,marginBottom:12}}>🥇</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#64748b"}}>No winners yet</div>
                    <div style={{fontSize:12,marginTop:6}}>End an auction to record the first winner!</div>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
                  {winners.map(w=>{
                    const rs=RARITY_STYLE[w.rarity]||RARITY_STYLE.Common;
                    return(
                      <div key={w.id} className="winner-card"
                        style={{background:w.claimed?"rgba(30,40,60,0.4)":"linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))",border:`1px solid ${w.claimed?"rgba(100,116,139,0.15)":rs.glow.replace("0.3","0.2")}`,borderRadius:18,padding:"20px",position:"relative",overflow:"hidden",opacity:w.claimed?0.7:1,boxShadow:w.claimed?"none":`0 4px 30px ${rs.glow}`}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:w.claimed?"#374151":rs.color}} />
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <div style={{width:48,height:48,borderRadius:14,background:w.claimed?"rgba(100,116,139,0.1)":rs.bg,border:`1px solid ${w.claimed?"rgba(100,116,139,0.2)":rs.color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{w.image}</div>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:w.claimed?"#64748b":"#e2e8f0",letterSpacing:"0.02em"}}>{w.itemName}</div>
                            <span style={{fontSize:10,fontWeight:700,color:w.claimed?"#475569":rs.color,background:rs.bg,border:`1px solid ${rs.color}30`,padding:"2px 8px",borderRadius:5,display:"inline-block",marginTop:3,letterSpacing:"0.06em"}}>{w.rarity.toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                          <div>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>WINNER</div>
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:w.claimed?"#64748b":"#fbbf24"}}>{w.winner}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>WINNING BID</div>
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:w.claimed?"#64748b":rs.color}}>{w.points.toLocaleString()} pts</div>
                          </div>
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
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,maxWidth:900}}>
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

                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px",gridColumn:"1/-1"}}>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:14,letterSpacing:"0.04em"}}>🔑 Leadership</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                    {members.filter(m=>["Leader","Elder"].includes(m.role)).map(m=>{
                      const rs=ROLE_STYLE[m.role];
                      return(
                        <div key={m.id} style={{background:rs.bg,border:`1px solid ${rs.border}`,borderRadius:13,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>{m.name[0]}</div>
                          <div>
                            <div style={{fontSize:13.5,fontWeight:700,color:"#e2e8f0"}}>{m.name}</div>
                            <span style={{fontSize:10.5,color:rs.color,fontWeight:700}}>{m.role}</span>
                          </div>
                        </div>
                      );
                    })}
                    {members.filter(m=>["Leader","Elder"].includes(m.role)).length===0&&(
                      <div style={{color:"#3d5070",fontSize:12}}>No leaders/elders assigned yet. Use Admin panel to set roles.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ MODALS ═══ */}

        {/* Boss image upload input (hidden) */}
        <input ref={bossImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBossImageUpload} />

        {/* Add Member */}
        {showAddMember&&(
          <div className="modal-bg" onClick={()=>setShowAddMember(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
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
              <div style={{display:"flex",gap:11,marginTop:24}}>
                <button className="btn" onClick={()=>setShowAddMember(false)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
                <button className="btn" onClick={handleAddMember} style={{flex:2,background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"11px",boxShadow:"0 4px 22px rgba(99,102,241,0.35)"}}>Add Member</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member */}
        {editMember&&(
          <div className="modal-bg" onClick={()=>setEditMember(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:420,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",marginBottom:22,letterSpacing:"0.04em"}}>✏️ Edit Member</h3>
              {[{label:"Name",key:"name",type:"text"},{label:"Class",key:"cls",type:"text"}].map(f=>(
                <div key={f.key} style={{marginBottom:14}}>
                  <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.label}</label>
                  <input className="dark-input" value={editMember[f.key]} onChange={e=>setEditMember(p=>({...p,[f.key]:e.target.value}))} />
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
              {/* Points editing — only for admins */}
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
          <div className="modal-bg" onClick={()=>setBossModal(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:360,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:21,fontWeight:700,color:"#f1f5f9",marginBottom:6,letterSpacing:"0.04em"}}>⏱ Set Boss Timer</h3>
              <p style={{color:"#3d5070",fontSize:12.5,marginBottom:20}}>{bosses.find(b=>b.id===bossModal)?.name}</p>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Minutes remaining</label>
              <input className="dark-input" type="number" placeholder="e.g. 45" min="0" value={manualMins} onChange={e=>setManualMins(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetManual()} style={{marginBottom:9}} />
              <p style={{color:"#3d5070",fontSize:11,marginBottom:22}}>Enter 0 to mark as LIVE now.</p>
              <div style={{display:"flex",gap:11}}>
                <button className="btn" onClick={()=>setBossModal(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
                <button className="btn" onClick={handleSetManual} style={{flex:2,background:"linear-gradient(135deg,#0f766e,#14b8a6)",color:"#fff",padding:"11px",boxShadow:"0 4px 22px rgba(20,184,166,0.3)"}}>Set Timer</button>
              </div>
            </div>
          </div>
        )}

        {/* Bid Modal */}
        {bidModal&&(
          <div className="modal-bg" onClick={()=>setBidModal(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:420,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <span style={{fontSize:28}}>{bidModal.image}</span>
                <div>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:21,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>{bidModal.name}</h3>
                  <span style={{fontSize:10.5,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color,fontWeight:700,letterSpacing:"0.07em"}}>{bidModal.rarity.toUpperCase()}</span>
                </div>
              </div>

              {/* Points balance */}
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
                  <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>LEADER</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{bidModal.highBidder||"—"}</div>
                </div>
              </div>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Your Bid Amount (pts)</label>
              <input className="dark-input" type="number" placeholder={`Minimum: ${Math.max(bidModal.minBid, bidModal.currentBid+1)}`} value={bidAmount} onChange={e=>setBidAmount(e.target.value)} style={{marginBottom:8}} onKeyDown={e=>e.key==="Enter"&&handleBid()} />
              <p style={{color:"#3d5070",fontSize:11,marginBottom:22}}>Must exceed current bid · Cannot exceed your {myPoints.toLocaleString()} pts balance</p>
              <div style={{display:"flex",gap:11}}>
                <button className="btn" onClick={()=>setBidModal(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"11px"}}>Cancel</button>
                <button className="btn" onClick={handleBid} style={{flex:2,background:`linear-gradient(135deg,${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}30,${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}18)`,border:`1px solid ${(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}40`,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color,padding:"11px",fontSize:14,fontWeight:800}}>🏺 Confirm Bid</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Permissions */}
        {showPermissions&&isAdmin&&(
          <div className="modal-bg" onClick={()=>setShowPermissions(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}
              style={{background:"#0a0c18",border:"1px solid rgba(248,113,113,0.25)",borderRadius:22,padding:"30px 32px",width:560,maxHeight:"85vh",overflow:"auto",boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                <span style={{fontSize:24}}>🔐</span>
                <div>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>Admin Control Panel</h3>
                  <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>Manage roles, points &amp; guild data</p>
                </div>
              </div>

              {/* Role management */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10.5,color:"#3d5070",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Change Member Roles</div>
                {members.map(m=>{
                  const rs=ROLE_STYLE[m.role]||ROLE_STYLE.Member;
                  return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{width:30,height:30,borderRadius:8,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{m.name[0]}</div>
                      <span style={{flex:1,fontSize:13,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.03em"}}>{m.name}</span>
                      <span style={{fontSize:12,color:"#60a5fa",fontWeight:600,marginRight:6}}>{(m.points||0).toLocaleString()} pts</span>
                      {isLeader&&(
                        <select className="dark-input" value={m.role} onChange={e=>handleChangeRole(m.id,e.target.value)}
                          style={{width:130,padding:"6px 10px",fontSize:12}}>
                          {["Leader","Elder","Member","Recruit"].map(o=><option key={o} value={o} style={{background:"#0a0c18"}}>{o}</option>)}
                        </select>
                      )}
                      {!isLeader&&<span style={{fontSize:12,color:(ROLE_STYLE[m.role]||ROLE_STYLE.Member).color,fontWeight:700}}>{m.role}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Wipe accounts — Leader only */}
              {isLeader&&(
                <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:14,padding:"16px 18px",marginBottom:18}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:6}}>⚠️ Wipe All Registered Accounts</div>
                  <p style={{fontSize:11.5,color:"#64748b",lineHeight:1.6,marginBottom:12}}>This will delete all non-Leader member accounts from both Supabase and local storage. This action cannot be undone. Only Valiant (Leader) will remain.</p>
                  <button className="btn" onClick={()=>setShowWipeConfirm(true)}
                    style={{background:"rgba(248,113,113,0.18)",border:"1px solid rgba(248,113,113,0.4)",color:"#f87171",padding:"10px 22px",fontSize:13}}>
                    🗑️ Wipe All Accounts
                  </button>
                </div>
              )}

              <button className="btn" onClick={()=>setShowPermissions(false)}
                style={{width:"100%",background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"11px",fontSize:13}}>
                Close Admin Panel
              </button>
            </div>
          </div>
        )}

        {/* Wipe Confirmation */}
        {showWipeConfirm&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="modal-box" style={{background:"#0a0c18",border:"2px solid rgba(248,113,113,0.4)",borderRadius:22,padding:"32px",width:380,textAlign:"center",boxShadow:"0 32px 100px rgba(248,113,113,0.2)"}}>
              <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
              <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f87171",marginBottom:10}}>Confirm Account Wipe</h3>
              <p style={{color:"#64748b",fontSize:12.5,lineHeight:1.7,marginBottom:24}}>All non-Leader member accounts will be permanently deleted from Supabase and local storage. This cannot be undone.</p>
              <div style={{display:"flex",gap:12}}>
                <button className="btn" onClick={()=>setShowWipeConfirm(false)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",padding:"12px"}}>Cancel</button>
                <button className="btn" onClick={handleWipeAccounts} disabled={wipeLoading}
                  style={{flex:1,background:"linear-gradient(135deg,#dc2626,#ef4444)",color:"#fff",padding:"12px",fontSize:13,boxShadow:"0 4px 22px rgba(239,68,68,0.4)"}}>
                  {wipeLoading?"Wiping...":"Confirm Wipe"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── Members Table ─────────────────────────────────────────────────────────────
function MembersTable({ filtered, currentUser, canManage, onEdit, onRemove, onAddPoints, showFull }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"rgba(255,255,255,0.025)"}}>
            {["Member","Class","Role","Points","Status",...(canManage?["Actions"]:[""])].map(h=>(
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m=>{
            const rs=ROLE_STYLE[m.role]||ROLE_STYLE.Member;
            const ss=STATUS_STYLE[m.status]||STATUS_STYLE.Offline;
            return(
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
                        <button className="pts-btn" onClick={()=>onAddPoints(m.id,100)}
                          style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399"}}>+</button>
                        <button className="pts-btn" onClick={()=>onAddPoints(m.id,-100)}
                          style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171"}}>−</button>
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
        <p style={{color:"#3d5070",fontSize:10.5,marginTop:2}}>Persists across refresh · click to control</p>
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
                {/* Mini boss image */}
                <div style={{width:36,height:36,borderRadius:8,background:b.color+"22",border:`1px solid ${b.color}44`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,cursor:canManage?"pointer":"default"}}
                  onClick={()=>canManage&&onBossImage(b.id)}>
                  {b.image
                    ? <img src={b.image} alt={b.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <span style={{fontSize:16}}>👹</span>}
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
                <button className="kill-btn" onClick={()=>onKill(b.id)}
                  style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:6,fontSize:11}}>
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
        html, body, #root { height:100%; }

        .auth-bg {
          min-height:100vh; background:#06070e;
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:hidden;
          font-family:'Exo 2',sans-serif;
        }
        .auth-bg::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 30%, rgba(99,102,241,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(251,191,36,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 60% 20%, rgba(96,165,250,0.06) 0%, transparent 70%);
          animation:bgShift 8s ease-in-out infinite alternate;
        }
        @keyframes bgShift { 0%{opacity:0.7;transform:scale(1)} 100%{opacity:1;transform:scale(1.04)} }
        .auth-bg::after {
          content:''; position:absolute; inset:0;
          background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);
          background-size:50px 50px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%);
        }
        .auth-card {
          position:relative; z-index:10;
          background:rgba(10,12,24,0.88);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:26px; padding:42px 44px;
          width:100%; max-width:460px;
          backdrop-filter:blur(24px);
          box-shadow:0 40px 120px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.04) inset;
          animation:cardIn 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .auth-input {
          width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          border-radius:13px; padding:13px 17px; color:#e2e8f0; font-size:14px;
          font-family:'Exo 2',sans-serif; outline:none; transition:all 0.2s;
        }
        .auth-input:focus { border-color:rgba(99,102,241,0.6); background:rgba(99,102,241,0.07); box-shadow:0 0 0 4px rgba(99,102,241,0.1); }
        .auth-input::placeholder { color:#2d3a52; }
        .auth-btn {
          width:100%; padding:14px; border:none; border-radius:13px;
          font-family:'Exo 2',sans-serif; font-weight:800; font-size:15px;
          letter-spacing:0.04em; cursor:pointer;
          transition:all 0.22s; position:relative; overflow:hidden;
        }
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
          {/* Logo */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
            <div className="floating-icon" style={{width:72,height:72,borderRadius:"50%",border:"2px solid rgba(251,191,36,0.5)",background:"rgba(251,191,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:"0 0 40px rgba(251,191,36,0.2)"}}>
              <img src={MOCK_LOGO} alt="Rampage" style={{width:"80%",height:"80%",objectFit:"contain",borderRadius:"50%"}}
                onError={e=>{e.target.style.display="none"; e.target.nextSibling.style.display="flex";}} />
              <span style={{fontSize:32,display:"none"}}>⚔️</span>
            </div>
            <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:32,fontWeight:700,letterSpacing:"0.16em",background:"linear-gradient(135deg,#fbbf24,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>RAMPAGE</h1>
            <p style={{color:"#2d3a52",fontSize:10.5,letterSpacing:"0.12em",marginTop:4}}>GUILD TRACKER · SEASON 12</p>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:5,marginBottom:24}}>
            <button className={`tab-btn${page==="login"?" active":""}`} onClick={()=>{setPage("login");setError("");}}>Sign In</button>
            <button className={`tab-btn${page==="register"?" active":""}`} onClick={()=>{setPage("register");setError("");}}>Register</button>
          </div>

          {/* Error */}
          {error&&(
            <div className="error-shake" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:11,padding:"10px 14px",marginBottom:16,fontSize:12.5,color:"#fca5a5",display:"flex",alignItems:"center",gap:8}}>
              <span>⚠️</span>{error}
            </div>
          )}

          {/* Login Form */}
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
              {/* Welcome message — no demo accounts */}
              <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.18)",borderRadius:10,padding:"12px 16px",marginTop:4,textAlign:"center"}}>
                <div style={{fontSize:14,color:"#fbbf24",fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>⚔️ Welcome to RAMPAGE</div>
                <p style={{fontSize:11.5,color:"#64748b",lineHeight:1.6}}>Register with your guild name and sign in. New accounts start as <strong style={{color:"#a78bfa"}}>Recruit</strong>. Leader <strong style={{color:"#fbbf24"}}>Valiant</strong> will assign your rank.</p>
              </div>
            </div>
          )}

          {/* Register Form */}
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
