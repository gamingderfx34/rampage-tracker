import { useState, useRef, useEffect, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const MOCK_LOGO = "https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png";

const INIT_MEMBERS = [
  { id:1, name:"VALIANT",  role:"Leader",  cls:"Berserker",   points:3200, status:"Active",  email:"valiant@rampage.gg"  },
  { id:2, name:"xJINN",    role:"Elder",   cls:"Archer",      points:2400, status:"Active",  email:"xjinn@rampage.gg"    },
  { id:3, name:"CHMB",     role:"Elder",   cls:"Volva",       points:2100, status:"Offline", email:"chmb@rampage.gg"     },
  { id:4, name:"YUJIRO",   role:"Member",  cls:"Warlord",     points:1800, status:"Active",  email:"yujiro@rampage.gg"   },
  { id:5, name:"SKADI",    role:"Member",  cls:"Skald",       points:1600, status:"Active",  email:"skadi@rampage.gg"    },
  { id:6, name:"ZEROTH",   role:"Recruit", cls:"RuneFighter", points:900,  status:"Offline", email:"zeroth@rampage.gg"   },
];

const INIT_BOSSES = [
  { id:1, name:"Cruel Outlaw Gand",  secs:1274, minR:30, maxR:60, ch:"CH 1", color:"#f59e0b" },
  { id:2, name:"Gatekeeper Amot",    secs:2973, minR:45, maxR:90, ch:"CH 2", color:"#60a5fa" },
  { id:3, name:"Destroyer Hawler",   secs:0,    minR:30, maxR:60, ch:"CH 3", color:"#34d399" },
  { id:4, name:"Assulter Laudd",     secs:4325, minR:30, maxR:60, ch:"CH 1", color:"#a78bfa" },
];

const INIT_AUCTION_ITEMS = [
  { id:1, name:"Shadowfang Blade",    rarity:"Legendary", minBid:5000,  currentBid:6800, highBidder:"VALIANT",  bids:[], locked:false, winner:null, claimed:false, image:"⚔️",  endTime: Date.now() + 3600000 },
  { id:2, name:"Frostweave Mantle",   rarity:"Epic",      minBid:2000,  currentBid:2400, highBidder:"xJINN",    bids:[], locked:false, winner:null, claimed:false, image:"🧥",  endTime: Date.now() + 7200000 },
  { id:3, name:"Runebound Shield",    rarity:"Rare",      minBid:800,   currentBid:1100, highBidder:"SKADI",    bids:[], locked:false, winner:null, claimed:false, image:"🛡️",  endTime: Date.now() + 1800000 },
  { id:4, name:"Voidheart Amulet",    rarity:"Legendary", minBid:8000,  currentBid:9200, highBidder:"YUJIRO",   bids:[], locked:true,  winner:"YUJIRO",  claimed:false, image:"💎", endTime: Date.now() - 1000 },
  { id:5, name:"Stormbringer Staff",  rarity:"Epic",      minBid:3500,  currentBid:3500, highBidder:null,       bids:[], locked:false, winner:null, claimed:false, image:"🔱",  endTime: Date.now() + 5400000 },
];

const INIT_WINNERS = [
  { id:1, itemName:"Voidheart Amulet", winner:"YUJIRO", points:9200, date:"May 14, 2025", claimed:false, rarity:"Legendary", image:"💎" },
  { id:2, itemName:"Darkmoor Helm",    winner:"CHMB",   points:4100, date:"May 10, 2025", claimed:true,  rarity:"Epic",      image:"⛑️" },
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
  Creator: { bg:"rgba(248,113,113,0.15)", color:"#f87171", border:"rgba(248,113,113,0.35)" },
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

const CAN_MANAGE = (role) => ["Leader","Elder","Creator"].includes(role);

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

const INIT_ATTENDANCE = INIT_MEMBERS.map(m=>({
  memberId:m.id, name:m.name, role:m.role,
  logs:[
    {date:"Mon, May 12",present:true,note:"On time"},
    {date:"Tue, May 13",present:true,note:"On time"},
    {date:"Wed, May 14",present:m.status==="Active",note:m.status==="Active"?"On time":"Absent"},
    {date:today,present:m.status==="Active",note:m.status==="Active"?"Present":"Absent"},
  ]
}));

const TH = {
  padding:"11px 18px", textAlign:"left", color:"#3d5070", fontSize:10,
  fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em",
  borderBottom:"1px solid rgba(255,255,255,0.05)", whiteSpace:"nowrap",
};

// ── Supabase stub (replace with real import) ───────────────────────────────
const supabaseStub = {
  auth: {
    signUp: async({email,password})=>{
      await new Promise(r=>setTimeout(r,900));
      if(!email.includes("@")) return {error:{message:"Invalid email"}};
      return {data:{user:{id:"u_"+Date.now(),email,role:"Member"}}, error:null};
    },
    signInWithPassword: async({email,password})=>{
      await new Promise(r=>setTimeout(r,800));
      const found = INIT_MEMBERS.find(m=>m.email===email);
      if(!found || password!=="rampage123") return {error:{message:"Invalid credentials"}};
      return {data:{user:{id:found.id,email,role:found.role,name:found.name}}, error:null};
    },
    signOut: async()=>({error:null}),
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null); // null = logged out
  const [authPage, setAuthPage]       = useState("login"); // "login" | "register"
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
  const [members, setMembers]         = useState(INIT_MEMBERS);
  const [bosses, setBosses]           = useState(INIT_BOSSES);
  const [attendance, setAttendance]   = useState(INIT_ATTENDANCE);
  const [auctionItems, setAuctionItems] = useState(INIT_AUCTION_ITEMS);
  const [winners, setWinners]         = useState(INIT_WINNERS);
  const [search, setSearch]           = useState("");
  const [killFlash, setKillFlash]     = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editMember, setEditMember]   = useState(null);
  const [newMember, setNewMember]     = useState({name:"",role:"Member",cls:"Berserker",status:"Active",email:""});
  const [bossModal, setBossModal]     = useState(null);
  const [manualMins, setManualMins]   = useState("");
  const [bidModal, setBidModal]       = useState(null); // auction item
  const [bidAmount, setBidAmount]     = useState("");
  const [notifications, setNotifications] = useState([]);
  const [now, setNow]                 = useState(Date.now());
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordConnected, setDiscordConnected] = useState(false);
  const [guildPoints, setGuildPoints] = useState(14200);
  const [toast, setToast]             = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const fileRef = useRef(null);

  // Live timers
  useEffect(()=>{
    const t = setInterval(()=>{
      setBosses(prev=>prev.map(b=>({...b,secs:Math.max(0,b.secs-1)})));
      setNow(Date.now());
    },1000);
    return ()=>clearInterval(t);
  },[]);

  // Check for outbid notifications
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

  const dismissNotification = (key)=>{
    setNotifications(prev=>prev.filter(n=>n.key!==key));
  };

  // Auth handlers
  const handleLogin = async()=>{
    setAuthLoading(true); setAuthError("");
    const {data,error} = await supabaseStub.auth.signInWithPassword(loginForm);
    if(error){ setAuthError(error.message); setAuthLoading(false); return; }
    setCurrentUser({...data.user, name: data.user.name || loginForm.email.split("@")[0].toUpperCase()});
    setAuthLoading(false);
  };

  const handleRegister = async()=>{
    setAuthLoading(true); setAuthError("");
    if(regForm.password !== regForm.confirmPassword){ setAuthError("Passwords do not match"); setAuthLoading(false); return; }
    if(regForm.password.length < 6){ setAuthError("Password must be at least 6 characters"); setAuthLoading(false); return; }
    const {data,error} = await supabaseStub.auth.signUp({email:regForm.email,password:regForm.password});
    if(error){ setAuthError(error.message); setAuthLoading(false); return; }
    const newM = {id:Date.now(),name:regForm.name.toUpperCase()||regForm.email.split("@")[0].toUpperCase(),role:"Recruit",cls:regForm.cls,points:0,status:"Active",email:regForm.email};
    setMembers(prev=>[...prev,newM]);
    setCurrentUser({id:newM.id,email:regForm.email,role:"Recruit",name:newM.name});
    setAuthLoading(false);
  };

  const handleLogout = async()=>{
    await supabaseStub.auth.signOut();
    setCurrentUser(null);
    setAuthPage("login");
    setLoginForm({email:"",password:""});
  };

  // Logo upload
  const handleLogoUpload = async(e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    setUploading(true); setUploadMsg("");
    const reader = new FileReader();
    reader.onload = ev=>setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
    setTimeout(()=>{ setUploadMsg("✅ Saved!"); setUploading(false); setTimeout(()=>setUploadMsg(""),3000); },1200);
  };

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

  const handleMarkAttendance = (memberId,date,present)=>{
    setAttendance(prev=>prev.map(a=>{
      if(a.memberId!==memberId) return a;
      return {...a,logs:a.logs.map(l=>l.date===date?{...l,present,note:present?"Present":"Absent"}:l)};
    }));
  };

  const handleAddMember = ()=>{
    if(!newMember.name.trim()) return;
    const m={...newMember,id:Date.now(),points:0};
    setMembers(prev=>[...prev,m]);
    setAttendance(prev=>[...prev,{memberId:m.id,name:m.name,role:m.role,logs:[{date:today,present:true,note:"Joined"}]}]);
    setNewMember({name:"",role:"Member",cls:"Berserker",status:"Active",email:""});
    setShowAddMember(false);
    showToast(`✅ ${m.name} added to guild!`);
  };

  const handleEditMember = ()=>{
    if(!editMember) return;
    setMembers(prev=>prev.map(m=>m.id===editMember.id?editMember:m));
    setEditMember(null);
    showToast("✅ Member updated!");
  };

  const handleRemoveMember = (id)=>{
    setMembers(prev=>prev.filter(m=>m.id!==id));
    showToast("🗑️ Member removed","warn");
  };

  // Auction
  const handleBid = ()=>{
    const amount = parseInt(bidAmount);
    if(!bidModal||isNaN(amount)||amount<=bidModal.currentBid){ showToast("❌ Bid must exceed current bid","error"); return; }
    const myName = currentUser?.name||"Guest";
    setAuctionItems(prev=>prev.map(item=>{
      if(item.id!==bidModal.id) return item;
      return {...item, currentBid:amount, highBidder:myName, bids:[...item.bids,{bidder:myName,amount,time:new Date().toLocaleTimeString()}]};
    }));
    setBidModal(null); setBidAmount("");
    showToast(`🏺 Bid of ${amount.toLocaleString()} placed on ${bidModal.name}!`);
  };

  const handleAnnounceWinner = (item)=>{
    const w = {id:Date.now(),itemName:item.name,winner:item.highBidder,points:item.currentBid,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),claimed:false,rarity:item.rarity,image:item.image};
    setWinners(prev=>[...prev,w]);
    setAuctionItems(prev=>prev.map(i=>i.id===item.id?{...i,locked:true,winner:item.highBidder}:i));
    if(discordConnected) showToast("📢 Discord notified: Winner announced!","info");
    showToast(`🏆 ${item.highBidder} won ${item.name}!`);
  };

  const handleClaimWinner = (id)=>{
    setWinners(prev=>prev.map(w=>w.id===id?{...w,claimed:true}:w));
    showToast("✅ Item marked as claimed!");
  };

  const handleRemoveWinner = (id)=>{
    setWinners(prev=>prev.filter(w=>w.id!==id));
    showToast("🗑️ Winner entry removed","warn");
  };

  const handleChangeRole = (memberId, newRole)=>{
    setMembers(prev=>prev.map(m=>m.id===memberId?{...m,role:newRole}:m));
    showToast("✅ Role updated!");
  };

  const filtered = members.filter(m=>
    m.name.toLowerCase().includes(search.toLowerCase())||
    m.cls.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = members.filter(m=>m.status==="Active").length;
  const presentToday  = attendance.filter(a=>a.logs.some(l=>l.date===today&&l.present)).length;
  const attendancePct = members.length?Math.round((presentToday/members.length)*100):0;
  const isAdmin       = currentUser && (currentUser.role==="Leader"||currentUser.role==="Creator");
  const canManage     = currentUser && CAN_MANAGE(currentUser.role);
  const myBids        = auctionItems.filter(i=>i.bids.some(b=>b.bidder===currentUser?.name));

  // ── If not logged in → Auth screen ────────────────────────────────────
  if(!currentUser) {
    return <AuthScreen
      page={authPage} setPage={setAuthPage}
      loginForm={loginForm} setLoginForm={setLoginForm}
      regForm={regForm} setRegForm={setRegForm}
      onLogin={handleLogin} onRegister={handleRegister}
      loading={authLoading} error={authError} setError={setAuthError}
    />;
  }

  // ── Main app ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; background:#06070e; overflow:hidden; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1a2035; border-radius:4px; }

        /* Sidebar door animation */
        .sidebar {
          transition: width 0.45s cubic-bezier(0.77,0,0.18,1);
          transform-origin: left center;
        }
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
        .nav-btn:active { transform:translateX(2px) scale(0.98); }
        .nav-btn.active { background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(99,102,241,0.1)); color:#a5b4fc; border-color:rgba(99,102,241,0.3); box-shadow:0 0 20px rgba(99,102,241,0.1); }

        .btn {
          cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:700;
          border:none; border-radius:10px; transition:all 0.18s;
          -webkit-tap-highlight-color:transparent; letter-spacing:0.03em;
        }
        .btn:hover { filter:brightness(1.15); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
        .btn:active { transform:translateY(0) scale(0.97); filter:brightness(0.93); }

        .kill-btn {
          cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:700;
          border-radius:10px; padding:10px 0; font-size:12px; width:100%;
          transition:all 0.18s; -webkit-tap-highlight-color:transparent;
        }
        .kill-btn:hover { filter:brightness(1.25); transform:scale(1.025); }
        .kill-btn:active { transform:scale(0.97); }

        .ghost-btn {
          cursor:pointer; font-family:'Exo 2',sans-serif; font-weight:600;
          border-radius:9px; padding:7px 10px; font-size:11px;
          transition:all 0.18s; -webkit-tap-highlight-color:transparent;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); color:#64748b;
        }
        .ghost-btn:hover { background:rgba(255,255,255,0.1); color:#94a3b8; transform:translateY(-1px); }
        .ghost-btn:active { transform:scale(0.95); }

        .stat-card { transition:transform 0.22s, box-shadow 0.22s; cursor:default; }
        .stat-card:hover { transform:translateY(-5px); box-shadow:0 24px 60px rgba(0,0,0,0.55) !important; }

        .boss-card { transition:all 0.18s; }
        .boss-card:hover { background:rgba(255,255,255,0.055) !important; transform:translateY(-3px); }

        .kill-flash { animation:kflash 0.65s ease; }
        @keyframes kflash { 0%{opacity:1} 25%{opacity:0.15;filter:brightness(3)} 100%{opacity:1} }

        .tr-row { transition:background 0.12s; }
        .tr-row:hover { background:rgba(255,255,255,0.04) !important; }

        .page { animation:pgIn 0.25s cubic-bezier(0.4,0,0.2,1); }
        @keyframes pgIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .modal-bg { animation:mfade 0.18s; }
        @keyframes mfade { from{opacity:0} to{opacity:1} }
        .modal-box { animation:mslide 0.22s cubic-bezier(0.4,0,0.2,1); }
        @keyframes mslide { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }

        .logo-ring { transition:box-shadow 0.22s, border-color 0.22s; cursor:pointer; }
        .logo-ring:hover { box-shadow:0 0 36px rgba(251,191,36,0.5) !important; border-color:rgba(251,191,36,0.9) !important; }
        .logo-ring:hover .logo-ov { opacity:1 !important; }

        .att-btn { cursor:pointer; padding:5px 12px; border-radius:7px; border:none; font-size:13px; font-weight:700; transition:all 0.15s; }
        .att-btn:hover { filter:brightness(1.25); transform:scale(1.08); }
        .att-btn:active { transform:scale(0.93); }

        .dark-input {
          width:100%; background:rgba(255,255,255,0.055); border:1px solid rgba(255,255,255,0.1);
          border-radius:11px; padding:11px 15px; color:#e2e8f0; font-size:13.5px;
          font-family:'Exo 2',sans-serif; outline:none; transition:all 0.18s;
        }
        .dark-input:focus { border-color:rgba(99,102,241,0.55); background:rgba(99,102,241,0.06); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
        .dark-input::placeholder { color:#2d3a52; }

        .col-btn { cursor:pointer; transition:all 0.22s; -webkit-tap-highlight-color:transparent; }
        .col-btn:hover { background:rgba(255,255,255,0.14) !important; color:#a5b4fc !important; transform:scale(1.05); }
        .col-btn:active { transform:scale(0.92); }

        .auction-card { transition:all 0.22s; }
        .auction-card:hover { transform:translateY(-4px); box-shadow:0 20px 50px rgba(0,0,0,0.45) !important; }
        .auction-card.locked { opacity:0.6; filter:grayscale(0.6); }

        .notif-badge { animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.5)} 50%{box-shadow:0 0 0 6px rgba(248,113,113,0)} }

        .toast { animation:toastIn 0.3s cubic-bezier(0.4,0,0.2,1); }
        @keyframes toastIn { from{opacity:0;transform:translateX(80px)} to{opacity:1;transform:translateX(0)} }

        .col-btn-door {
          cursor:pointer;
          width:26px; height:48px;
          background:rgba(99,102,241,0.12);
          border:1px solid rgba(99,102,241,0.25);
          border-radius:0 10px 10px 0;
          display:flex; align-items:center; justify-content:center;
          color:#6366f1; font-size:13px;
          transition:all 0.22s;
          position:absolute; right:-27px; top:50%; transform:translateY(-50%);
          z-index:20;
        }
        .col-btn-door:hover { background:rgba(99,102,241,0.25); color:#a5b4fc; }

        .winner-card { transition:all 0.2s; }
        .winner-card:hover { transform:translateY(-3px); }

        .bid-history { max-height:140px; overflow-y:auto; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position:"fixed", top:20, right:20, zIndex:1000,
          background: toast.type==="error"?"rgba(239,68,68,0.15)":toast.type==="warn"?"rgba(251,191,36,0.15)":toast.type==="info"?"rgba(96,165,250,0.15)":"rgba(52,211,153,0.15)",
          border:`1px solid ${toast.type==="error"?"rgba(239,68,68,0.35)":toast.type==="warn"?"rgba(251,191,36,0.35)":toast.type==="info"?"rgba(96,165,250,0.35)":"rgba(52,211,153,0.35)"}`,
          borderRadius:14, padding:"13px 20px", color:"#e2e8f0", fontSize:13, fontWeight:600,
          backdropFilter:"blur(12px)", maxWidth:340, boxShadow:"0 12px 40px rgba(0,0,0,0.5)",
          fontFamily:"'Exo 2',sans-serif",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Outbid Notifications */}
      {notifications.length > 0 && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:999,display:"flex",flexDirection:"column",gap:8}}>
          {notifications.map(n=>(
            <div key={n.id} style={{background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.35)",borderRadius:12,padding:"10px 18px",color:"#f87171",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:12,backdropFilter:"blur(12px)",fontFamily:"'Exo 2',sans-serif",boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}}>
              <span className="notif-badge" style={{width:8,height:8,borderRadius:"50%",background:"#f87171",flexShrink:0}} />
              <span>⚠️ You've been outbid on <strong style={{color:"#fca5a5"}}>{n.item}</strong>! Current bid: <strong>{n.amount.toLocaleString()}</strong></span>
              <button onClick={()=>setBidModal(auctionItems.find(i=>i.name===n.item))} style={{background:"rgba(248,113,113,0.25)",border:"1px solid rgba(248,113,113,0.4)",color:"#fca5a5",padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Exo 2',sans-serif"}}>Bid Again</button>
              <button onClick={()=>dismissNotification(n.key)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",height:"100vh",background:"#06070e",fontFamily:"'Exo 2',sans-serif",color:"#e2e8f0",overflow:"hidden",position:"relative"}}>

        {/* Ambient glows */}
        <div style={{position:"fixed",top:-250,left:-150,width:700,height:700,background:"radial-gradient(circle,rgba(99,102,241,0.065),transparent 70%)",pointerEvents:"none",zIndex:0}} />
        <div style={{position:"fixed",bottom:-200,right:-100,width:600,height:600,background:"radial-gradient(circle,rgba(251,191,36,0.04),transparent 70%)",pointerEvents:"none",zIndex:0}} />
        <div style={{position:"fixed",top:"40%",left:"50%",width:400,height:400,background:"radial-gradient(circle,rgba(96,165,250,0.025),transparent 70%)",pointerEvents:"none",zIndex:0}} />

        {/* ═══ SIDEBAR ═══ */}
        <aside className={`sidebar${collapsed?" collapsed":""}`}
          style={{width:collapsed?68:270,minHeight:"100vh",background:"linear-gradient(180deg,#090b1a,#070910)",borderRight:"1px solid rgba(255,255,255,0.055)",display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:10,boxShadow:"6px 0 40px rgba(0,0,0,0.7)"}}>

          {/* Door toggle */}
          <div className="col-btn-door" onClick={()=>setCollapsed(!collapsed)}>
            {collapsed?"▶":"◀"}
          </div>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:11,padding:"22px 14px 16px",flexShrink:0}}>
            <div className="logo-ring" onClick={()=>canManage&&fileRef.current?.click()}
              style={{width:50,height:50,borderRadius:"50%",border:"2px solid rgba(251,191,36,0.5)",background:"rgba(251,191,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",flexShrink:0,boxShadow:"0 0 24px rgba(251,191,36,0.18)"}}>
              {logoErr||!logoUrl
                ? <span style={{fontSize:24}}>⚔️</span>
                : <img src={logoUrl} alt="logo"
                    style={{width:"80%",height:"80%",objectFit:"contain",borderRadius:"50%"}}
                    onError={()=>setLogoErr(true)} />}
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
              <div style={{fontSize:11,color:"#fbbf24",marginTop:1}}>{currentUser.role||"Member"}</div>
            </div>
            <div style={{position:"absolute",top:10,right:11,width:8,height:8,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 10px #34d399"}} />
          </div>

          {/* Logout */}
          {!collapsed && (
            <button className="btn" onClick={handleLogout}
              style={{margin:"0 9px 14px",background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"10px",fontSize:12,borderRadius:11,letterSpacing:"0.04em"}}>
              🚪 Log Out
            </button>
          )}
          {collapsed && (
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
                {{dashboard:"Guild overview and live activity",members:"Manage your full guild roster",bosses:"Live countdown and respawn control",attendance:"Daily attendance logs",auction:"Guild auction house — bid on exclusive items",winners:"Past auction winners",settings:"Configure guild & integration settings"}[activeNav]}
              </p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              {/* My Bids indicator */}
              {myBids.length>0&&(
                <div style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"7px 13px",display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:11}}>🏺</span>
                  <span style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>{myBids.length} active bid{myBids.length>1?"s":""}</span>
                </div>
              )}
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
                  {label:"Total Members",value:members.length,icon:"👥",color:"#818cf8",glow:"rgba(129,140,248,0.15)"},
                  {label:"Online Now",value:activeCount,icon:"🟢",color:"#34d399",glow:"rgba(52,211,153,0.15)"},
                  {label:"Attendance",value:attendancePct+"%",icon:"📋",color:"#fbbf24",glow:"rgba(251,191,36,0.15)"},
                  {label:"Guild Points",value:guildPoints.toLocaleString(),icon:"🏆",color:"#f87171",glow:"rgba(248,113,113,0.15)"},
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
                <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} />
                <BossPanel bosses={bosses} onKill={handleMarkKilled} onReset={handleResetToZero} onManual={id=>{setBossModal(id);setManualMins("");}} killFlash={killFlash} canManage={canManage} />
              </div>
            </>}

            {/* ── MEMBERS ── */}
            {activeNav==="members"&&(
              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
                <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>All Guild Members</h3>
                    <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>{filtered.length} members found</p>
                  </div>
                </div>
                <MembersTable filtered={filtered} currentUser={currentUser} canManage={canManage} onEdit={setEditMember} onRemove={handleRemoveMember} showFull />
              </div>
            )}

            {/* ── BOSS TIMERS ── */}
            {activeNav==="bosses"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
                {bosses.map(b=>{
                  const st=bossStatus(b.secs);
                  const bs=BOSS_STATUS_STYLE[st];
                  return(
                    <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
                      style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px 22px 18px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:b.color,borderRadius:"4px 0 0 4px"}} />
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13}}>
                        <div>
                          <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{b.name}</div>
                          <div style={{fontSize:11.5,color:"#3d5070",marginTop:3}}>{b.ch} · Respawn {b.minR}–{b.maxR} min</div>
                        </div>
                        <span style={{display:"inline-flex",alignItems:"center",padding:"4px 12px",borderRadius:8,background:bs.bg,color:bs.color,border:`1px solid ${bs.border}`,fontSize:11,fontWeight:700}}>{st}</span>
                      </div>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:48,fontWeight:700,color:b.color,letterSpacing:"0.06em",lineHeight:1,marginBottom:18}}>
                        {fmtSecs(b.secs)}
                      </div>
                      {canManage&&<>
                        <button className="kill-btn" onClick={()=>handleMarkKilled(b.id)}
                          style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:9,letterSpacing:"0.03em"}}>
                          ☠️ Mark Killed — start respawn timer
                        </button>
                        <div style={{display:"flex",gap:9}}>
                          <button className="ghost-btn" onClick={()=>handleResetToZero(b.id)} style={{flex:1}}>🔴 Set to LIVE</button>
                          <button className="ghost-btn" onClick={()=>{setBossModal(b.id);setManualMins("");}} style={{flex:1}}>⏱ Set timer</button>
                        </div>
                      </>}
                      {!canManage&&<div style={{textAlign:"center",color:"#3d5070",fontSize:11,marginTop:8}}>👀 View only · Leader/Elder can control</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {activeNav==="attendance"&&(
              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,overflow:"hidden"}}>
                <div style={{padding:"20px 22px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>📋 Attendance Log</h3>
                    <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>{canManage?"Click ✓ / ✗ on today's column to update":"View only — Leaders & Elders can mark attendance"}</p>
                  </div>
                  <div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:13,padding:"10px 20px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:28,fontWeight:700,color:"#34d399"}}>{attendancePct}%</div>
                    <div style={{fontSize:10,color:"#3d5070",marginTop:1,letterSpacing:"0.07em"}}>TODAY</div>
                  </div>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"rgba(255,255,255,0.02)"}}>
                        <th style={TH}>Member</th>
                        <th style={TH}>Role</th>
                        {attendance[0]?.logs.map(l=>(
                          <th key={l.date} style={{...TH,color:l.date===today?"#fbbf24":"#3d5070"}}>
                            {l.date}{l.date===today?" ★":""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a=>{
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
                {/* My Bids Summary */}
                {myBids.length>0&&(
                  <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:14,padding:"14px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>🏺</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",letterSpacing:"0.03em"}}>Your Active Bids</div>
                      <div style={{fontSize:11.5,color:"#92754a",marginTop:2}}>You're currently bidding on: {myBids.map(i=>i.name).join(", ")}</div>
                    </div>
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
                  {auctionItems.map(item=>{
                    const rs=RARITY_STYLE[item.rarity]||RARITY_STYLE.Common;
                    const myBid=item.bids.find(b=>b.bidder===currentUser?.name);
                    const amWinning=item.highBidder===currentUser?.name;
                    const timeLeft=item.endTime-now;
                    return(
                      <div key={item.id} className={`auction-card${item.locked?" locked":""}`}
                        style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:`1px solid ${item.locked?"rgba(100,116,139,0.2)":rs.glow.replace("0.3","0.25")}`,borderRadius:18,padding:"20px",position:"relative",overflow:"hidden",boxShadow:item.locked?"none":`0 4px 30px ${rs.glow}`}}>
                        {/* Rarity bar */}
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
                            <div style={{width:44,height:44,borderRadius:12,background:rs.bg,border:`1px solid ${rs.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{item.image}</div>
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
                            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:26,fontWeight:700,color:rs.color}}>{item.currentBid.toLocaleString()} <span style={{fontSize:12,color:"#3d5070"}}>pts</span></div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>HIGH BIDDER</div>
                            <div style={{fontSize:13,fontWeight:700,color:amWinning?"#34d399":"#e2e8f0"}}>{item.highBidder||"—"} {amWinning&&!item.locked?"🏆":""}</div>
                          </div>
                        </div>

                        {myBid&&!item.locked&&(
                          <div style={{background:amWinning?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",border:`1px solid ${amWinning?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,borderRadius:9,padding:"7px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8,fontSize:11.5,fontWeight:600,color:amWinning?"#34d399":"#f87171"}}>
                            {amWinning?"🏆 You're winning! Highest bid":"⚠️ You've been outbid!"} <span style={{marginLeft:"auto",color:amWinning?"#34d399":"#fca5a5"}}>Your bid: {myBid.amount.toLocaleString()}</span>
                          </div>
                        )}

                        {!item.locked&&(
                          <div style={{display:"flex",gap:8,position:"relative",zIndex:1}}>
                            <button className="btn" onClick={()=>{setBidModal(item);setBidAmount(String(item.currentBid+100));}}
                              style={{flex:1,background:`linear-gradient(135deg,${rs.color}25,${rs.color}15)`,border:`1px solid ${rs.color}40`,color:rs.color,padding:"10px",fontSize:12.5}}>
                              🏺 Place Bid
                            </button>
                            {canManage&&item.highBidder&&(
                              <button className="btn" onClick={()=>handleAnnounceWinner(item)}
                                style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"10px 14px",fontSize:11}}>
                                🏆 End
                              </button>
                            )}
                          </div>
                        )}

                        {/* Bid history */}
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
                            {!w.claimed&&(
                              <button className="btn" onClick={()=>handleClaimWinner(w.id)}
                                style={{flex:1,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",padding:"9px",fontSize:12}}>
                                ✅ Mark Claimed
                              </button>
                            )}
                            {w.claimed&&(
                              <button className="btn" onClick={()=>handleRemoveWinner(w.id)}
                                style={{flex:1,background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"9px",fontSize:12}}>
                                🗑️ Remove Entry
                              </button>
                            )}
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
                {/* Guild Info */}
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:16,letterSpacing:"0.04em"}}>🏰 Guild Settings</h3>
                  <div style={{marginBottom:13}}>
                    <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Guild Name</label>
                    <input className="dark-input" defaultValue="RAMPAGE" disabled={!isAdmin} />
                  </div>
                  <div style={{marginBottom:13}}>
                    <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Guild Motto</label>
                    <input className="dark-input" defaultValue="Conquer. Dominate. Rampage." disabled={!isAdmin} />
                  </div>
                  {isAdmin&&<button className="btn" style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",padding:"10px 22px",fontSize:13,marginTop:4}}>Save Changes</button>}
                </div>

                {/* Discord Integration */}
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px"}}>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:6,letterSpacing:"0.04em"}}>🎮 Discord Integration</h3>
                  <p style={{color:"#3d5070",fontSize:11.5,marginBottom:16,lineHeight:1.6}}>Connect a Discord webhook to get automatic notifications for boss kills, auction events, and winner announcements. Recommended bot: <strong style={{color:"#7289da"}}>Carl-bot</strong> or <strong style={{color:"#7289da"}}>MEE6</strong>.</p>
                  <div style={{marginBottom:13}}>
                    <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Webhook URL</label>
                    <input className="dark-input" placeholder="https://discord.com/api/webhooks/..." value={discordWebhook} onChange={e=>setDiscordWebhook(e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div style={{marginBottom:13}}>
                    <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Notify on</label>
                    {["Boss Kills","Auction Start","Winner Announced","New Member"].map(opt=>(
                      <label key={opt} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7,cursor:"pointer"}}>
                        <input type="checkbox" defaultChecked style={{accentColor:"#6366f1",width:14,height:14}} />
                        <span style={{color:"#94a3b8",fontSize:12.5}}>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {isAdmin&&<button className="btn" onClick={()=>{setDiscordConnected(true);showToast("🎮 Discord connected!");}}
                    style={{background:discordConnected?"rgba(52,211,153,0.15)":"linear-gradient(135deg,#5865f2,#7289da)",border:discordConnected?"1px solid rgba(52,211,153,0.3)":"none",color:discordConnected?"#34d399":"#fff",padding:"10px 22px",fontSize:13}}>
                    {discordConnected?"✅ Connected":"Connect Discord"}
                  </button>}
                </div>

                {/* Notification Bots */}
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"22px",gridColumn:"1/-1"}}>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:14,letterSpacing:"0.04em"}}>🤖 Recommended Discord Bots</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                    {[
                      {name:"Carl-bot",desc:"Webhooks, logging, automod, reaction roles",color:"#f97316",icon:"🤖"},
                      {name:"MEE6",desc:"Leveling, notifications, welcome messages",color:"#f43f5e",icon:"🎯"},
                      {name:"Dyno",desc:"Auto-moderation and custom commands",color:"#6366f1",icon:"⚡"},
                      {name:"GuildedBot",desc:"Cross-platform guild management",color:"#34d399",icon:"🏰"},
                    ].map(bot=>(
                      <div key={bot.name} style={{background:`${bot.color}10`,border:`1px solid ${bot.color}25`,borderRadius:13,padding:"14px 16px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                          <span style={{fontSize:20}}>{bot.icon}</span>
                          <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{bot.name}</span>
                        </div>
                        <p style={{fontSize:11.5,color:"#64748b",lineHeight:1.5}}>{bot.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ MODALS ═══ */}

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
              style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:400,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
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
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Points</label>
                <input className="dark-input" type="number" value={editMember.points} onChange={e=>setEditMember(p=>({...p,points:parseInt(e.target.value)||0}))} />
              </div>
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
              <p style={{color:"#3d5070",fontSize:12.5,marginBottom:20,letterSpacing:"0.02em"}}>{bosses.find(b=>b.id===bossModal)?.name}</p>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Minutes remaining</label>
              <input className="dark-input" type="number" placeholder="e.g. 45" min="0" value={manualMins} onChange={e=>setManualMins(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetManual()} style={{marginBottom:9}} />
              <p style={{color:"#3d5070",fontSize:11,marginBottom:22,letterSpacing:"0.02em"}}>Enter 0 to set boss as LIVE right now.</p>
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
              style={{background:"#0a0c18",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,padding:"30px 32px",width:400,boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <span style={{fontSize:28}}>{bidModal.image}</span>
                <div>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:21,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>{bidModal.name}</h3>
                  <span style={{fontSize:10.5,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color,fontWeight:700,letterSpacing:"0.07em"}}>{bidModal.rarity.toUpperCase()}</span>
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>CURRENT BID</div>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:24,fontWeight:700,color:(RARITY_STYLE[bidModal.rarity]||RARITY_STYLE.Common).color}}>{bidModal.currentBid.toLocaleString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#3d5070",letterSpacing:"0.07em",marginBottom:3}}>LEADER</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{bidModal.highBidder||"—"}</div>
                </div>
              </div>
              <label style={{display:"block",color:"#3d5070",fontSize:10.5,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Your Bid Amount</label>
              <input className="dark-input" type="number" placeholder={`Minimum: ${bidModal.currentBid+1}`} value={bidAmount} onChange={e=>setBidAmount(e.target.value)} style={{marginBottom:8}} onKeyDown={e=>e.key==="Enter"&&handleBid()} />
              <p style={{color:"#3d5070",fontSize:11,marginBottom:22}}>Must exceed current bid of {bidModal.currentBid.toLocaleString()} pts</p>
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
              style={{background:"#0a0c18",border:"1px solid rgba(248,113,113,0.25)",borderRadius:22,padding:"30px 32px",width:540,maxHeight:"80vh",overflow:"auto",boxShadow:"0 32px 100px rgba(0,0,0,0.9)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
                <span style={{fontSize:24}}>🔐</span>
                <div>
                  <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>Admin Control Panel</h3>
                  <p style={{color:"#3d5070",fontSize:11.5,marginTop:2}}>Manage member roles & permissions</p>
                </div>
              </div>

              <div style={{marginBottom:18}}>
                <div style={{fontSize:10.5,color:"#3d5070",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Permission Matrix</div>
                {[
                  {role:"Leader",perms:["Add Members","Edit Members","Remove Members","Mark Boss Kill","Announce Winners","Manage Attendance","Auction Control"]},
                  {role:"Elder",perms:["Add Members","Edit Members","Mark Boss Kill","Manage Attendance"]},
                  {role:"Member",perms:["View All","Bid in Auction"]},
                  {role:"Recruit",perms:["View All","Bid in Auction"]},
                ].map(r=>{
                  const rs=ROLE_STYLE[r.role]||ROLE_STYLE.Member;
                  return(
                    <div key={r.role} style={{background:rs.bg,border:`1px solid ${rs.border}`,borderRadius:12,padding:"12px 15px",marginBottom:9}}>
                      <div style={{fontWeight:700,color:rs.color,fontSize:13,marginBottom:7,letterSpacing:"0.03em"}}>{r.role}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {r.perms.map(p=>(
                          <span key={p} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"3px 9px",fontSize:10.5,color:"#94a3b8"}}>{p}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{marginBottom:18}}>
                <div style={{fontSize:10.5,color:"#3d5070",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Change Member Roles</div>
                {members.map(m=>{
                  const rs=ROLE_STYLE[m.role]||ROLE_STYLE.Member;
                  return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{width:30,height:30,borderRadius:8,background:rs.bg,border:`1px solid ${rs.border}`,color:rs.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{m.name[0]}</div>
                      <span style={{flex:1,fontSize:13,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.03em"}}>{m.name}</span>
                      <select className="dark-input" value={m.role} onChange={e=>handleChangeRole(m.id,e.target.value)}
                        style={{width:130,padding:"6px 10px",fontSize:12}}>
                        {["Leader","Elder","Member","Recruit"].map(o=><option key={o} value={o} style={{background:"#0a0c18"}}>{o}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>

              <button className="btn" onClick={()=>setShowPermissions(false)}
                style={{width:"100%",background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"11px",fontSize:13}}>
                Close Admin Panel
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── Members Table ────────────────────────────────────────────────────────────
function MembersTable({ filtered, currentUser, canManage, onEdit, onRemove, showFull }) {
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
                <td style={{padding:"13px 18px",color:"#64748b",fontSize:12.5}}>{m.cls}</td>
                <td style={{padding:"13px 18px"}}>
                  <span style={{display:"inline-flex",padding:"4px 11px",borderRadius:7,background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`,fontSize:10.5,fontWeight:700,letterSpacing:"0.04em"}}>{m.role}</span>
                </td>
                <td style={{padding:"13px 18px",color:"#fbbf24",fontWeight:700,fontSize:15,fontFamily:"'Rajdhani',sans-serif"}}>{m.points.toLocaleString()}</td>
                <td style={{padding:"13px 18px"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:7,background:ss.bg,color:ss.color,fontSize:10.5,fontWeight:700}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:ss.dot,flexShrink:0}} />{m.status}
                  </span>
                </td>
                <td style={{padding:"13px 18px"}}>
                  {canManage?(
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn" onClick={()=>onEdit(m)}
                        style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",color:"#a5b4fc",padding:"5px 13px",fontSize:11.5,borderRadius:8}}>Edit</button>
                      <button className="btn" onClick={()=>onRemove(m.id)}
                        style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",padding:"5px 11px",fontSize:11.5,borderRadius:8}}>✕</button>
                    </div>
                  ):(
                    <span style={{color:"#2d3a52",fontSize:11}}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Boss Panel ────────────────────────────────────────────────────────────────
function BossPanel({ bosses, onKill, onReset, onManual, killFlash, canManage }) {
  return(
    <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,fontWeight:700,color:"#f1f5f9",letterSpacing:"0.04em"}}>⚔️ Boss Timers</h3>
        <p style={{color:"#3d5070",fontSize:10.5,marginTop:2,letterSpacing:"0.04em"}}>Live countdown · click to control</p>
      </div>
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:9,padding:"13px 15px"}}>
        {bosses.map(b=>{
          const st=bossStatus(b.secs);
          const bs=BOSS_STATUS_STYLE[st];
          return(
            <div key={b.id} className={`boss-card${killFlash===b.id?" kill-flash":""}`}
              style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.065)",borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:b.color}} />
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.02em"}}>{b.name}</div>
                  <div style={{fontSize:10,color:"#3d5070",marginTop:1,letterSpacing:"0.04em"}}>{b.ch}</div>
                </div>
                <span style={{display:"inline-flex",padding:"2px 9px",borderRadius:6,background:bs.bg,color:bs.color,border:`1px solid ${bs.border}`,fontSize:9.5,fontWeight:700}}>{st}</span>
              </div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:28,fontWeight:700,color:b.color,letterSpacing:"0.06em",lineHeight:1,marginBottom:11}}>
                {fmtSecs(b.secs)}
              </div>
              {canManage&&<>
                <button className="kill-btn" onClick={()=>onKill(b.id)}
                  style={{background:`${b.color}20`,border:`1px solid ${b.color}45`,color:b.color,marginBottom:7}}>
                  ☠️ Mark Killed
                </button>
                <div style={{display:"flex",gap:6}}>
                  <button className="ghost-btn" onClick={()=>onReset(b.id)} style={{flex:1,fontSize:10,padding:"5px 6px"}}>🔴 LIVE now</button>
                  <button className="ghost-btn" onClick={()=>onManual(b.id)} style={{flex:1,fontSize:10,padding:"5px 6px"}}>⏱ Set timer</button>
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
//  AUTH SCREEN (animated)
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

        /* Animated bg particles */
        .auth-bg::before {
          content:'';
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 30%, rgba(99,102,241,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(251,191,36,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 60% 20%, rgba(96,165,250,0.06) 0%, transparent 70%);
          animation:bgShift 8s ease-in-out infinite alternate;
        }
        @keyframes bgShift {
          0%   { opacity:0.7; transform:scale(1); }
          100% { opacity:1;   transform:scale(1.04); }
        }

        /* Grid lines */
        .auth-bg::after {
          content:'';
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size:50px 50px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .auth-card {
          position:relative; z-index:10;
          background:rgba(10,12,24,0.88);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:26px;
          padding:42px 44px;
          width:100%; max-width:460px;
          backdrop-filter:blur(24px);
          box-shadow:0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset;
          animation:cardIn 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(32px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }

        .auth-input {
          width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          border-radius:13px; padding:13px 17px; color:#e2e8f0; font-size:14px;
          font-family:'Exo 2',sans-serif; outline:none; transition:all 0.2s;
        }
        .auth-input:focus {
          border-color:rgba(99,102,241,0.6);
          background:rgba(99,102,241,0.07);
          box-shadow:0 0 0 4px rgba(99,102,241,0.1);
        }
        .auth-input::placeholder { color:#2d3a52; }

        .auth-btn {
          width:100%; padding:14px; border:none; border-radius:13px;
          font-family:'Exo 2',sans-serif; font-weight:800; font-size:15px;
          letter-spacing:0.04em; cursor:pointer;
          transition:all 0.22s; position:relative; overflow:hidden;
        }
        .auth-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.12),transparent);
          opacity:0; transition:opacity 0.22s;
        }
        .auth-btn:hover::before { opacity:1; }
        .auth-btn:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(99,102,241,0.4); }
        .auth-btn:active { transform:translateY(0) scale(0.98); }

        .demo-hint {
          background:rgba(99,102,241,0.08);
          border:1px solid rgba(99,102,241,0.2);
          border-radius:10px; padding:10px 14px;
          margin-top:14px;
          font-size:11.5px; color:#6366f1;
          line-height:1.6; letter-spacing:0.02em;
        }

        .floating-icon {
          animation:floatIcon 4s ease-in-out infinite;
        }
        @keyframes floatIcon {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-10px); }
        }

        .tab-btn {
          flex:1; padding:11px; background:none; border:none; cursor:pointer;
          font-family:'Exo 2',sans-serif; font-weight:700; font-size:13.5px;
          letter-spacing:0.04em; transition:all 0.2s; border-radius:10px;
        }
        .tab-btn.active { background:rgba(99,102,241,0.18); color:#a5b4fc; }
        .tab-btn:not(.active) { color:#3d5070; }
        .tab-btn:not(.active):hover { color:#64748b; }

        .error-shake { animation:shake 0.4s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-7px)} 75%{transform:translateX(7px)} }
      `}</style>

      <div className="auth-bg">
        {/* Floating decorative orbs */}
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
              <div className="demo-hint">
                <strong>Demo accounts:</strong><br/>
                Leader: <code>valiant@rampage.gg</code> / <code>rampage123</code><br/>
                Elder: <code>xjinn@rampage.gg</code> / <code>rampage123</code>
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
              <p style={{textAlign:"center",color:"#3d5070",fontSize:11.5}}>New members join as <strong style={{color:"#a78bfa"}}>Recruit</strong> — Leaders can promote you.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
