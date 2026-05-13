import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ============================================================
// ROLE PERMISSIONS
// ============================================================
const CAN = {
  editMembers:    ["admin", "leader"],
  deleteMembers:  ["admin", "leader"],
  killBoss:       ["admin", "leader", "elder"],
  editBoss:       ["admin", "leader", "elder", "member"],
  addAuction:     ["admin", "leader"],
  editAuction:    ["admin", "leader", "elder"],
  placeBid:       ["admin", "leader", "elder", "member"],
  manageUsers:    ["admin"],
  markAttendance: ["admin", "leader"],
  manageWinners:  ["admin", "leader"],
};
const can = (role, action) => CAN[action]?.includes(role);

// ============================================================
// CONSTANTS
// ============================================================
const CLASSES   = ["Berserker", "Skald", "Warlord", "Volva", "Archer", "RuneFighter"];
const POSITIONS = ["Leader", "Elder", "Member", "Recruit"];

const BOSSES_DEFAULT = [
  { id: 1, name: "Lv. 66 Cruel Outlaw Gand - Kings Tomb 1F",         color: "#4a90d9", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 2, name: "Lv. 67 Eternal Gatekeeper Amot - Kings Tomb 1F",   color: "#d94a4a", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 3, name: "Lv. 68 Ruthless Destroyer Hawler - Kings Tomb 1F", color: "#4ad94a", respawnMin: 45,  respawnMax: 90,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 4, name: "Lv. 69 Assulter of Tombs Laudd - Kings Tomb 1F",   color: "#d9a44a", respawnMin: 60,  respawnMax: 120, lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 5, name: "Lv. 66 Cruel Outlaw Gand - Kings Tomb 1F",         color: "#4a90d9", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 6, name: "Lv. 67 Ethernal Destroyer Amot - Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 7, name: "Lv. 68 Ruthless Destroyer Hawler - Kings Tomb 1F", color: "#4a90d9", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 8, name: "Lv. 69 Assulter of Tombs Laudd - Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30,  respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
];

// ============================================================
// THEME — Dark Fantasy / Forge aesthetic
// ============================================================
const T = {
  // Backgrounds
  bg0:       "#07080f",   // deepest bg
  bg1:       "#0c0e1a",   // main bg
  bg2:       "#111422",   // card bg
  bg3:       "#161926",   // elevated
  bg4:       "#1c2030",   // border-adjacent

  // Borders
  border:    "#252a3d",
  borderHi:  "#2d3452",

  // Text
  text:      "#e8eaf0",
  textSub:   "#8892a4",
  textMuted: "#4a5168",

  // Accent palette — ember gold + steel blue + blood red
  gold:      "#c9973a",
  goldHi:    "#e8b84b",
  goldGlow:  "#c9973a33",
  blue:      "#4a7fd4",
  blueHi:    "#6a9fe4",
  blueGlow:  "#4a7fd433",
  red:       "#c03a3a",
  redHi:     "#e05555",
  green:     "#2e7d50",
  greenHi:   "#3da866",
  greenGlow: "#2e7d5033",
  purple:    "#6e3fad",
  purpleHi:  "#8b5fd0",
};

const inputStyle = {
  width: "100%", padding: "9px 12px",
  background: T.bg0, border: `1px solid ${T.border}`,
  borderRadius: "7px", color: T.text, fontSize: "13px",
  boxSizing: "border-box", outline: "none",
  transition: "border-color 0.2s",
};
const labelStyle = { display: "flex", flexDirection: "column", gap: "5px" };

const btn = (variant = "blue") => {
  const map = {
    blue:   { bg: "#1a2f5c", border: T.blue,   color: T.blueHi },
    gold:   { bg: "#3a2510", border: T.gold,   color: T.goldHi },
    red:    { bg: "#3a1212", border: T.red,    color: T.redHi  },
    green:  { bg: "#0d2e1e", border: T.green,  color: T.greenHi},
    gray:   { bg: T.bg3,    border: T.border,  color: T.textSub},
    purple: { bg: "#281545", border: T.purple, color: T.purpleHi},
  };
  const v = map[variant] || map.blue;
  return {
    background: v.bg, border: `1px solid ${v.border}44`, color: v.color,
    padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
    fontSize: "13px", fontWeight: "600",
    transition: "all 0.15s", whiteSpace: "nowrap",
  };
};

const positionColors = {
  Leader:  { bg: "#3a2003", text: "#e8a93a", border: "#c9973a55" },
  Elder:   { bg: "#3a0a0a", text: "#e05555", border: "#c0404055" },
  Member:  { bg: T.bg3,     text: T.textSub,  border: T.border     },
  Recruit: { bg: "#0d1f3a", text: "#5a9fd4", border: "#4a7fd455" },
};
const activityColors = {
  Active:   { bg: "#0a2718", text: "#3da866", dot: "#3da866" },
  Inactive: { bg: T.bg3,    text: T.textMuted, dot: T.textMuted },
};
const roleColors = {
  admin:   { bg: "#3a0a0a", text: "#fca5a5", label: "👑 Admin"    },
  leader:  { bg: "#3a2003", text: "#fcd34d", label: "🛡️ Leader"  },
  elder:   { bg: "#0d1f3a", text: "#60a5fa", label: "⚔️ Elder"    },
  member:  { bg: T.bg3,    text: T.textSub,  label: "👤 Member"  },
  pending: { bg: T.bg3,    text: T.textMuted, label: "⏳ Pending" },
};

// Decorative divider line
const Divider = () => (
  <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${T.borderHi}, transparent)`, margin: "16px 0" }} />
);

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function formatCountdown(endsAt) {
  const diff = endsAt - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.borderHi}`, borderRadius: "14px", padding: "28px", width: "100%", maxWidth: wide ? "720px" : "520px", position: "relative", maxHeight: "90vh", overflowY: "auto",
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${T.border}` }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", color: T.textSub, cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================
function SectionHeader({ icon, title, sub, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "22px" }}>{icon}</span>
        <div>
          <div style={{ color: T.text, fontWeight: "700", fontSize: "16px", letterSpacing: "0.03em" }}>{title}</div>
          {sub && <div style={{ color: T.textMuted, fontSize: "12px", marginTop: "1px" }}>{sub}</div>}
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

// ============================================================
// STAT BADGE
// ============================================================
function StatBadge({ label, value, color }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "10px 16px", textAlign: "center" }}>
      <div style={{ color: color || T.goldHi, fontWeight: "700", fontSize: "20px" }}>{value}</div>
      <div style={{ color: T.textMuted, fontSize: "11px", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ onLogin }) {
  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [error, setError]                 = useState("");
  const [showPass, setShowPass]           = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm]             = useState({ display: "", username: "", password: "" });
  const [regError, setRegError]           = useState("");
  const [regSuccess, setRegSuccess]       = useState(false);

  const handleRegister = async () => {
    if (!regForm.username || !regForm.password || !regForm.display) { setRegError("Please fill in all fields."); return; }
    const { data: existing } = await supabase.from("users").select("id").eq("username", regForm.username.toLowerCase().trim()).maybeSingle();
    if (existing) { setRegError("Username already taken."); return; }
    const { error: insertErr } = await supabase.from("users").insert([{
      username: regForm.username.toLowerCase().trim(),
      password: regForm.password,
      display:  regForm.display.trim(),
      role:     "pending",
    }]);
    if (insertErr) setRegError("Registration failed. Try again.");
    else { setRegSuccess(true); setIsRegistering(false); }
  };

  const handleLogin = async () => {
    setError("");
    const { data: user } = await supabase.from("users").select("*").eq("username", username.toLowerCase().trim()).eq("password", password).maybeSingle();
    if (!user) { setError("❌ Invalid username or password!"); return; }
    if (user.role === "pending") { setError("⏳ Your account is awaiting admin approval."); return; }
    onLogin(user);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif",
      backgroundImage: "radial-gradient(ellipse at 30% 20%, #1a1f3a44 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #2a150a33 0%, transparent 60%)" }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.borderHi}`, borderRadius: "18px", padding: "44px", width: "100%", maxWidth: "400px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <img src="https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png" alt="Rampage" style={{ width: "80px", height: "80px", objectFit: "contain", marginBottom: "12px" }} onError={e => { e.target.style.display = "none"; }} />
          <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: "800", letterSpacing: "0.08em",
            background: `linear-gradient(135deg, ${T.goldHi}, ${T.blueHi})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>RAMPAGE TRACKER</h1>
          <p style={{ color: T.textMuted, fontSize: "13px", margin: 0 }}>
            {isRegistering ? "Create a new account" : "Sign in to your guild account"}
          </p>
        </div>

        {regSuccess && (
          <div style={{ background: T.greenGlow, border: `1px solid ${T.green}55`, borderRadius: "8px", color: T.greenHi, fontSize: "13px", padding: "10px 14px", marginBottom: "16px", textAlign: "center" }}>
            ✅ Account created! Waiting for admin approval.
          </div>
        )}

        {!isRegistering ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label style={labelStyle}>
              <span style={{ color: T.textSub, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>Username</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter username" style={inputStyle} autoFocus />
            </label>
            <label style={labelStyle}>
              <span style={{ color: T.textSub, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter password" style={{ ...inputStyle, paddingRight: "40px" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textSub, cursor: "pointer", fontSize: "16px" }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </label>
            {error && <div style={{ color: error.startsWith("⏳") ? T.goldHi : T.redHi, fontSize: "13px", textAlign: "center" }}>{error}</div>}
            <button onClick={handleLogin} style={{ ...btn("blue"), width: "100%", padding: "12px", fontSize: "15px" }}>Login</button>
            <button onClick={() => { setIsRegistering(true); setError(""); setRegSuccess(false); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "13px", cursor: "pointer" }}>Register new account</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input placeholder="Display Name (character name)" value={regForm.display} onChange={e => setRegForm({ ...regForm, display: e.target.value })} style={inputStyle} autoFocus />
            <input placeholder="Username (for login)" value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} style={inputStyle} />
            <input type="password" placeholder="Password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} style={inputStyle} />
            {regError && <div style={{ color: T.redHi, fontSize: "13px" }}>{regError}</div>}
            <div style={{ background: T.goldGlow, border: `1px solid ${T.gold}44`, borderRadius: "8px", color: T.gold, fontSize: "12px", padding: "10px 14px" }}>
              ⚠️ Account requires <strong>admin approval</strong> before logging in.
            </div>
            <button onClick={handleRegister} style={{ ...btn("blue"), width: "100%", padding: "12px", fontSize: "15px" }}>Register</button>
            <button onClick={() => { setIsRegistering(false); setRegError(""); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "13px", cursor: "pointer" }}>← Back to Login</button>
          </div>
        )}

        <Divider />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.entries(roleColors).filter(([r]) => r !== "pending").map(([role, c]) => (
            <div key={role} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: "20px", fontSize: "11px", minWidth: "72px", textAlign: "center" }}>{c.label}</span>
              <span style={{ color: T.textMuted, fontSize: "11px" }}>
                {role === "Creator"  && "xILOVEHER"}
                {role === "leader" && "VALIANT"}
                {role === "elder"  && "       "}
                {role === "member" && "       "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MANAGE USERS TAB
// ============================================================
function UsersTab({ currentUser }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState({ username: "", password: "", role: "member", display: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("users").select("*").order("created_at", { ascending: true });
      if (data) setUsers(data);
      setLoading(false);
    };
    load();
    const channel = supabase.channel("users-manage")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const pending  = users.filter(u => u.role === "pending");
  const approved = users.filter(u => u.role !== "pending");

  const approveUser = async (u, role) => { await supabase.from("users").update({ role }).eq("id", u.id); };
  const rejectUser  = async (u) => {
    if (window.confirm(`Reject & delete account for "${u.display}"?`)) await supabase.from("users").delete().eq("id", u.id);
  };

  const openAdd  = () => { setEditUser(null); setForm({ username: "", password: "", role: "member", display: "" }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ username: u.username, password: u.password, role: u.role, display: u.display }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.username || !form.password || !form.display) return;
    if (editUser) {
      await supabase.from("users").update({ username: form.username, password: form.password, role: form.role, display: form.display }).eq("id", editUser.id);
    } else {
      await supabase.from("users").insert([{ username: form.username, password: form.password, role: form.role, display: form.display }]);
    }
    setShowModal(false);
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser.id) return alert("Cannot delete your own account!");
    if (window.confirm(`Delete user "${u.display}"?`)) await supabase.from("users").delete().eq("id", u.id);
  };

  if (loading) return <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>Loading users…</div>;

  return (
    <div>
      <SectionHeader icon="🔐" title="Manage Users" sub={`${approved.length} approved · ${pending.length} pending`} actions={[
        <button key="add" onClick={openAdd} style={btn("blue")}>+ Add User</button>
      ]} />

      {pending.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ color: T.goldHi, fontWeight: "700", fontSize: "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: T.goldGlow, border: `1px solid ${T.gold}55`, padding: "3px 10px", borderRadius: "20px" }}>⏳ Pending Approvals ({pending.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pending.map(u => (
              <div key={u.id} style={{ background: T.goldGlow, border: `1px solid ${T.gold}33`, borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontWeight: "600" }}>{u.display}</div>
                  <div style={{ color: T.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{u.username}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["leader", "elder", "member"].map(r => (
                    <button key={r} onClick={() => approveUser(u, r)} style={{ ...btn(r === "leader" ? "gold" : r === "elder" ? "blue" : "gray"), fontSize: "12px", padding: "5px 12px" }}>
                      Approve as {r}
                    </button>
                  ))}
                  <button onClick={() => rejectUser(u)} style={{ ...btn("red"), fontSize: "12px", padding: "5px 12px" }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.borderHi}`, background: T.bg3 }}>
              {["Display Name", "Username", "Password", "Role", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: T.textSub, fontWeight: "600", textAlign: "left", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approved.map((u, i) => {
              const rc = roleColors[u.role] || roleColors.member;
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <td style={{ padding: "12px 16px", color: T.text, fontWeight: "600" }}>{u.display}</td>
                  <td style={{ padding: "12px 16px", color: T.blue, fontFamily: "monospace" }}>{u.username}</td>
                  <td style={{ padding: "12px 16px", color: T.textMuted, fontFamily: "monospace" }}>{"•".repeat(Math.min(u.password?.length || 0, 12))}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ background: rc.bg, color: rc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{rc.label}</span></td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => openEdit(u)} style={{ background: "none", border: "none", color: T.blueHi, cursor: "pointer", marginRight: "10px" }}>Edit</button>
                    <button onClick={() => handleDelete(u)} style={{ background: "none", border: "none", color: T.redHi, cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>{editUser ? "Edit User" : "Add User"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Display Name</span><input type="text" value={form.display} onChange={e => setForm({ ...form, display: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Username</span><input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>
              <span style={{ color: T.textSub, fontSize: "12px" }}>Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, paddingRight: "40px" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textSub, cursor: "pointer" }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </label>
            <label style={labelStyle}>
              <span style={{ color: T.textSub, fontSize: "12px" }}>Role</span>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                {["admin", "leader", "elder", "member"].map(r => <option key={r} value={r}>{roleColors[r].label} — {r}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btn("gray")}>Cancel</button>
            <button onClick={handleSave} style={btn("blue")}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MEMBERS TAB
// ============================================================
function MembersTab({ role }) {
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm]           = useState({ name: "", class: "Archer", position: "Member", growthPower: "", multiplier: "", activity: "Active", comment: "" });
  const [sortBy, setSortBy]       = useState("growthPower");
  const [sortDir, setSortDir]     = useState("desc");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const loadMembers = async () => {
    const { data: membersData, error } = await supabase.from("members").select("*").order("growthPower", { ascending: false });
    if (!error && membersData) {
      setMembers(membersData);
    } else {
      const { data: usersData } = await supabase.from("users").select("id, display, role, points").neq("role", "pending").order("created_at", { ascending: true });
      if (usersData) {
        const roleToPosition = { admin: "Leader", leader: "Leader", elder: "Elder", member: "Member" };
        setMembers(usersData.map(u => ({ id: u.id, name: u.display, class: "—", position: roleToPosition[u.role] || "Member", growthPower: 0, multiplier: 1, points: u.points || 0, activity: "Active", comment: "" })));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
    const ch1 = supabase.channel("members-rt").on("postgres_changes", { event: "*", schema: "public", table: "members" }, loadMembers).subscribe();
    const ch2 = supabase.channel("users-points-rt").on("postgres_changes", { event: "*", schema: "public", table: "users" }, loadMembers).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const resetPoints = async (member) => {
    await supabase.from("users").update({ points: 0 }).eq("display", member.name);
    await supabase.from("members").update({ points: 0 }).eq("id", member.id);
    loadMembers();
  };

  const openAdd  = () => { setEditMember(null); setForm({ name: "", class: "Archer", position: "Member", growthPower: "", multiplier: "", activity: "Active", comment: "" }); setShowModal(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ name: m.name, class: m.class, position: m.position, growthPower: m.growthPower, multiplier: m.multiplier, activity: m.activity, comment: m.comment || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return;
    const payload = { name: form.name, class: form.class, position: form.position, growthPower: +form.growthPower || 0, multiplier: +form.multiplier || 1, activity: form.activity, comment: form.comment };
    if (editMember) await supabase.from("members").update(payload).eq("id", editMember.id);
    else await supabase.from("members").insert([{ ...payload, points: 0 }]);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this member from the roster?")) await supabase.from("members").delete().eq("id", id);
  };

  const handleSort = (col) => { if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(col); setSortDir("desc"); } };
  const sorted = [...members].sort((a, b) => {
    const v = sortDir === "asc" ? 1 : -1;
    const av = a[sortBy], bv = b[sortBy];
    return typeof av === "number" ? (av - bv) * v : String(av).localeCompare(String(bv)) * v;
  });

  const handleImport = async () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    const rows = lines.map(line => {
      const c = line.split(/\t|,/);
      return { name: c[0]?.trim() || "Unknown", class: c[1]?.trim() || "Archer", position: c[2]?.trim() || "Member", growthPower: parseFloat(c[3]) || 0, multiplier: parseFloat(c[4]) || 1, points: parseFloat(c[5]) || 0, activity: c[6]?.trim() || "Active", comment: c[7]?.trim() || "" };
    });
    await supabase.from("members").insert(rows);
    setImportText(""); setShowImport(false);
  };

  const exportCSV = () => {
    const blob = new Blob(["Name,Class,Position,Growth Power,Multiplier,Points,Activity,Comment\n" + members.map(m => `${m.name},${m.class},${m.position},${m.growthPower},${m.multiplier},${m.points || 0},${m.activity},${m.comment || ""}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "guild_members.csv"; a.click();
  };

  if (loading) return <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>Loading members…</div>;

  return (
    <div>
      <SectionHeader icon="👥" title="Members Roster" sub={`${members.length} members`} actions={[
        <button key="exp" onClick={exportCSV} style={btn("blue")}>📤 Export CSV</button>,
        can(role, "editMembers") && <button key="imp" onClick={() => setShowImport(true)} style={btn("blue")}>📥 Import</button>,
        can(role, "editMembers") && <button key="add" onClick={openAdd} style={btn("gold")}>+ Add Member</button>,
      ].filter(Boolean)} />

      <div style={{ overflowX: "auto", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.borderHi}`, background: T.bg3 }}>
              {[["#", null], ["Character Name", "name"], ["Class", "class"], ["Position", "position"], ["Growth Power", "growthPower"], ["Multiplier", "multiplier"], ["Points", "points"], ["Activity", "activity"], ["Comment", "comment"], ...(can(role, "editMembers") ? [["Action", null]] : [])].map(([label, col]) => (
                <th key={label} onClick={() => col && handleSort(col)} style={{ padding: "11px 10px", color: T.textSub, fontWeight: "600", textAlign: "left", cursor: col ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label} {col && sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const pc = positionColors[m.position] || positionColors.Member;
              const ac = activityColors[m.activity]  || activityColors.Inactive;
              return (
                <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <td style={{ padding: "10px 10px", color: T.textMuted }}>{i + 1}</td>
                  <td style={{ padding: "10px 10px", color: T.text, fontWeight: "600" }}>{m.name}</td>
                  <td style={{ padding: "10px 10px", color: T.textSub }}>{m.class}</td>
                  <td style={{ padding: "10px 10px" }}><span style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{m.position}</span></td>
                  <td style={{ padding: "10px 10px", color: T.text }}>{(m.growthPower || 0).toLocaleString()}</td>
                  <td style={{ padding: "10px 10px", color: T.goldHi }}>x{(m.multiplier || 1).toFixed(2)}</td>
                  <td style={{ padding: "10px 10px", color: T.text, fontWeight: "700" }}>
                    {m.points || 0}
                    {can(role, "editMembers") && (
                      <button onClick={() => resetPoints(m)} style={{ background: "none", border: "none", color: T.redHi, cursor: "pointer", fontSize: "11px", marginLeft: "6px" }} title="Reset points">↺</button>
                    )}
                  </td>
                  <td style={{ padding: "10px 10px" }}><span style={{ background: ac.bg, color: ac.text, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ac.dot }}></span>{m.activity}</span></td>
                  <td style={{ padding: "10px 10px", color: T.textSub, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.comment || "—"}</td>
                  {can(role, "editMembers") && (
                    <td style={{ padding: "10px 10px" }}>
                      <button onClick={() => openEdit(m)} style={{ background: "none", border: "none", color: T.blueHi, cursor: "pointer", marginRight: "8px" }}>Edit</button>
                      {can(role, "deleteMembers") && <button onClick={() => handleDelete(m.id)} style={{ background: "none", border: "none", color: T.redHi, cursor: "pointer" }}>Delete</button>}
                    </td>
                  )}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={10} style={{ padding: "40px", color: T.textMuted, textAlign: "center" }}>No members yet. Add members manually or ask admin to approve registrations.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && can(role, "editMembers") && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>{editMember ? "Edit Member" : "Add Member"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["Character Name", "name", "text"], ["Growth Power", "growthPower", "number"], ["Multiplier", "multiplier", "number"]].map(([label, key, type]) => (
              <label key={key} style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>{label}</span><input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} /></label>
            ))}
            {[["Class", "class", CLASSES], ["Position", "position", POSITIONS], ["Activity", "activity", ["Active", "Inactive"]]].map(([label, key, opts]) => (
              <label key={key} style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>{label}</span><select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle}>{opts.map(o => <option key={o}>{o}</option>)}</select></label>
            ))}
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span style={{ color: T.textSub, fontSize: "12px" }}>Comment</span><input type="text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} style={inputStyle} /></label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btn("gray")}>Cancel</button>
            <button onClick={handleSave} style={btn("gold")}>Save</button>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal onClose={() => setShowImport(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>📥 Import Members</h2>
          <p style={{ color: T.textSub, fontSize: "13px" }}>Paste CSV or tab-separated rows:<br /><code style={{ color: T.blueHi }}>Name, Class, Position, GrowthPower, Multiplier, Points, Activity, Comment</code></p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowImport(false)} style={btn("gray")}>Cancel</button>
            <button onClick={handleImport} style={btn("green")}>Import</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// BOSS TIMER TAB
// ============================================================
function BossTimerTab({ bosses, setBosses, role }) {
  const [now, setNow]             = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [editBoss, setEditBoss]   = useState(null);
  const [form, setForm]           = useState({ name: "", respawnMin: 30, respawnMax: 60, windowDuration: 30, channel: 1, color: "#4a90d9" });
  const [channel, setChannel]     = useState(1);
  const [killModal, setKillModal] = useState(null);
  const [killOffset, setKillOffset] = useState(0);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const getBossState = (boss) => {
    if (!boss.lastKilled) return { state: "unknown", label: "No Data — waiting for first kill" };
    const elapsed   = now - boss.lastKilled;
    const respawnMs = boss.respawnMin * 60000;
    const windowMs  = boss.windowDuration * 60000;
    if (elapsed < respawnMs)            return { state: "waiting",  label: `Spawn window in ${formatTime(respawnMs - elapsed)}` };
    if (elapsed < respawnMs + windowMs) return { state: "spawning", label: `🟢 SPAWN WINDOW — ${formatTime(respawnMs + windowMs - elapsed)} left` };
    return { state: "overdue", label: "⚠️ Overdue — boss may have spawned!" };
  };

  const stateColors = { unknown: T.bg3, waiting: "#0d1f3a", spawning: "#0a2718", overdue: "#3a1212" };
  const stateDots   = { unknown: T.textMuted, waiting: T.blueHi, spawning: T.greenHi, overdue: T.redHi };
  const filtered    = bosses.filter(b => b.channel === channel);

  const openAdd  = () => { setEditBoss(null); setForm({ name: "", respawnMin: 30, respawnMax: 60, windowDuration: 30, channel: 1, color: "#4a90d9" }); setShowModal(true); };
  const openEdit = (b) => { setEditBoss(b); setForm({ ...b }); setShowModal(true); };
  const handleSave = () => {
    if (!form.name) return;
    if (editBoss) setBosses(bosses.map(b => b.id === editBoss.id ? { ...form, id: b.id, respawnMin: +form.respawnMin, respawnMax: +form.respawnMax, windowDuration: +form.windowDuration, channel: +form.channel, lastKilled: b.lastKilled } : b));
    else setBosses([...bosses, { ...form, id: Date.now(), respawnMin: +form.respawnMin, respawnMax: +form.respawnMax, windowDuration: +form.windowDuration, channel: +form.channel, lastKilled: null }]);
    setShowModal(false);
  };
  const confirmKill = () => { setBosses(bosses.map(b => b.id === killModal.id ? { ...b, lastKilled: Date.now() - killOffset * 60000 } : b)); setKillModal(null); };

  return (
    <div>
      <SectionHeader icon="👹" title="Boss Timers" sub="Real-time spawn tracking" actions={[
        <div key="ch" style={{ display: "flex", gap: "6px" }}>
          {[1, 2].map(ch => <button key={ch} onClick={() => setChannel(ch)} style={{ padding: "7px 18px", borderRadius: "8px", border: "none", cursor: "pointer", background: channel === ch ? T.blue : T.bg3, color: channel === ch ? "#fff" : T.textSub, fontWeight: "600", fontSize: "13px" }}>Ch {ch}</button>)}
        </div>,
        can(role, "editBoss") && <button key="add" onClick={openAdd} style={btn("blue")}>+ Add Boss</button>,
      ].filter(Boolean)} />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(boss => {
          const { state, label } = getBossState(boss);
          return (
            <div key={boss.id} style={{ background: stateColors[state], border: `1px solid ${stateDots[state]}44`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: boss.color + "22", border: `2px solid ${boss.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>👹</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ color: T.text, fontWeight: "700", fontSize: "16px" }}>{boss.name}</span>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stateDots[state], flexShrink: 0 }}></span>
                </div>
                <div style={{ color: state === "spawning" ? T.greenHi : state === "overdue" ? T.redHi : T.textSub, fontSize: "14px" }}>{label}</div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                  {[boss.respawnMin, boss.respawnMax].map(t => <span key={t} style={{ background: T.bg0, color: T.textSub, border: `1px solid ${T.border}`, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{t}m</span>)}
                  <span style={{ background: T.bg0, color: T.textSub, border: `1px solid ${T.border}`, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>Window: {boss.windowDuration}m</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {can(role, "editBoss") && <button onClick={() => openEdit(boss)} style={btn("gray")}>Edit</button>}
                {can(role, "killBoss") && <button onClick={() => { setKillModal(boss); setKillOffset(0); }} style={btn("red")}>⚔️ Kill Boss</button>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>No bosses for Channel {channel}.</div>}
      </div>

      {killModal && (
        <Modal onClose={() => setKillModal(null)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>⚔️ Boss Killed: {killModal.name}</h2>
          <p style={{ color: T.textSub, fontSize: "14px" }}>Adjust if you killed it a few minutes ago.</p>
          <label style={labelStyle}>
            <span style={{ color: T.textSub, fontSize: "13px" }}>Minutes ago: {killOffset}m</span>
            <input type="range" min={0} max={60} step={1} value={killOffset} onChange={e => setKillOffset(+e.target.value)} style={{ width: "100%", marginTop: "8px", accentColor: T.red }} />
          </label>
          <p style={{ color: T.blueHi, fontSize: "13px" }}>Kill time: {killOffset === 0 ? "Right now" : `${killOffset} minute(s) ago`}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setKillModal(null)} style={btn("gray")}>Cancel</button>
            <button onClick={confirmKill} style={btn("red")}>Confirm Kill</button>
          </div>
        </Modal>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>{editBoss ? "Edit Boss" : "Add Boss"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["Boss Name", "name", "text"], ["Min Respawn (min)", "respawnMin", "number"], ["Max Respawn (min)", "respawnMax", "number"], ["Window Duration (min)", "windowDuration", "number"], ["Channel", "channel", "number"]].map(([label, key, type]) => (
              <label key={key} style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>{label}</span><input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} /></label>
            ))}
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Boss Color</span><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, height: "40px", cursor: "pointer" }} /></label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btn("gray")}>Cancel</button>
            <button onClick={handleSave} style={btn("blue")}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// ATTENDANCE TAB — real-time, member check-in + admin mark
// ============================================================
function AttendanceTab({ role, currentUser }) {
  const [sessions, setSessions]     = useState([]);
  const [records, setRecords]       = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  const loadAll = async () => {
    const [{ data: sData }, { data: rData }, { data: mData }] = await Promise.all([
      supabase.from("attendance_sessions").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_records").select("*"),
      supabase.from("members").select("id, name").order("name"),
    ]);
    if (sData) {
      setSessions(sData);
      const active = sData.find(s => s.is_active);
      setActiveSession(active || null);
      if (!selectedSession && sData.length > 0) setSelectedSession(sData[0].id);
    }
    if (rData) setRecords(rData);
    if (mData) setMembers(mData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("attendance-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const createSession = async () => {
    if (!newSessionName.trim()) return;
    // Close any active session first
    if (activeSession) {
      await supabase.from("attendance_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("id", activeSession.id);
    }
    const { data } = await supabase.from("attendance_sessions").insert([{
      name: newSessionName.trim(),
      is_active: true,
      created_by: currentUser.display,
    }]).select().single();
    setNewSessionName("");
    setShowNewSession(false);
    if (data) setSelectedSession(data.id);
  };

  const closeSession = async (sessionId) => {
    if (!window.confirm("Close this attendance session?")) return;
    await supabase.from("attendance_sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("id", sessionId);
  };

  const checkIn = async (memberName, sessionId, markedBy) => {
    const sid = sessionId || activeSession?.id;
    if (!sid) return alert("No active session to check in to.");
    // Prevent duplicate
    const existing = records.find(r => r.session_id === sid && r.member_name === memberName);
    if (existing) return;
    await supabase.from("attendance_records").insert([{
      session_id: sid,
      member_name: memberName,
      checked_in_at: new Date().toISOString(),
      marked_by: markedBy || currentUser.display,
    }]);
  };

  const removeRecord = async (recordId) => {
    await supabase.from("attendance_records").delete().eq("id", recordId);
  };

  const selfCheckIn = async () => {
    await checkIn(currentUser.display, activeSession?.id, currentUser.display);
  };

  // Get records for the selected session
  const sessionRecords = records.filter(r => r.session_id === selectedSession);
  const sessionMemberNames = new Set(sessionRecords.map(r => r.member_name));
  const presentCount  = sessionRecords.length;
  const absentCount   = members.length - presentCount;
  const selectedSess  = sessions.find(s => s.id === selectedSession);

  // Stats
  const totalSessions = sessions.filter(s => !s.is_active).length;
  const myCheckIns    = records.filter(r => r.member_name === currentUser.display).length;

  const isAlreadyCheckedIn = activeSession && records.some(r => r.session_id === activeSession.id && r.member_name === currentUser.display);

  if (loading) return <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>Loading attendance…</div>;

  return (
    <div>
      <SectionHeader icon="📋" title="Attendance" sub="Real-time check-ins per session" actions={[
        can(role, "markAttendance") && <button key="new" onClick={() => setShowNewSession(true)} style={btn("gold")}>+ New Session</button>,
        activeSession && can(role, "markAttendance") && <button key="close" onClick={() => closeSession(activeSession.id)} style={btn("red")}>🔒 Close Session</button>,
      ].filter(Boolean)} />

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        <StatBadge label="Total Sessions" value={sessions.length} color={T.blueHi} />
        <StatBadge label="Completed" value={totalSessions} color={T.textSub} />
        <StatBadge label="My Check-ins" value={myCheckIns} color={T.greenHi} />
        {selectedSess && <StatBadge label="Present" value={presentCount} color={T.greenHi} />}
        {selectedSess && <StatBadge label="Absent" value={absentCount < 0 ? 0 : absentCount} color={T.redHi} />}
      </div>

      {/* Active session banner + self check-in */}
      {activeSession ? (
        <div style={{ background: T.greenGlow, border: `1px solid ${T.green}55`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ color: T.greenHi, fontWeight: "700", fontSize: "14px" }}>🟢 Active Session: {activeSession.name}</div>
            <div style={{ color: T.textSub, fontSize: "12px", marginTop: "2px" }}>Started by {activeSession.created_by} · {formatDate(activeSession.created_at)}</div>
          </div>
          {!isAlreadyCheckedIn ? (
            <button onClick={selfCheckIn} style={{ ...btn("green"), fontSize: "14px", padding: "10px 22px" }}>✅ Check In Now</button>
          ) : (
            <span style={{ background: T.greenGlow, border: `1px solid ${T.green}55`, color: T.greenHi, padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>✓ Checked In</span>
          )}
        </div>
      ) : (
        <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: T.textMuted, fontSize: "14px" }}>
          ⚪ No active session. {can(role, "markAttendance") ? 'Click "+ New Session" to start one.' : "Wait for admin to open a session."}
        </div>
      )}

      {/* Session selector */}
      {sessions.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: T.textSub, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>View Session</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => setSelectedSession(s.id)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${selectedSession === s.id ? T.blue : T.border}`, cursor: "pointer", background: selectedSession === s.id ? "#1a2f5c" : T.bg3, color: selectedSession === s.id ? T.blueHi : T.textSub, fontSize: "12px", fontWeight: selectedSession === s.id ? "700" : "400", display: "flex", alignItems: "center", gap: "6px" }}>
                {s.is_active && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.greenHi }}></span>}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attendance table for selected session */}
      {selectedSess && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ color: T.text, fontWeight: "600" }}>{selectedSess.name}</div>
            <div style={{ color: T.textMuted, fontSize: "12px" }}>{formatDate(selectedSess.created_at)}{!selectedSess.is_active && selectedSess.ended_at ? ` — ${formatDate(selectedSess.ended_at)}` : ""}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {/* Present members */}
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: T.greenGlow, borderBottom: `1px solid ${T.green}44`, padding: "10px 14px", color: T.greenHi, fontWeight: "700", fontSize: "13px" }}>✅ Present ({presentCount})</div>
              <div style={{ padding: "8px" }}>
                {sessionRecords.length === 0 && <div style={{ color: T.textMuted, padding: "12px", fontSize: "13px" }}>No check-ins yet.</div>}
                {sessionRecords.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ color: T.text, fontSize: "13px", fontWeight: "600" }}>{r.member_name}</div>
                      <div style={{ color: T.textMuted, fontSize: "11px" }}>
                        {formatDate(r.checked_in_at)}
                        {r.marked_by && r.marked_by !== r.member_name && ` · by ${r.marked_by}`}
                      </div>
                    </div>
                    {can(role, "markAttendance") && (
                      <button onClick={() => removeRecord(r.id)} style={{ background: "none", border: "none", color: T.redHi, cursor: "pointer", fontSize: "16px", padding: "4px 6px" }} title="Remove">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Absent / not checked in */}
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "#3a121222", borderBottom: `1px solid ${T.red}33`, padding: "10px 14px", color: T.redHi, fontWeight: "700", fontSize: "13px" }}>❌ Absent ({Math.max(0, members.length - presentCount)})</div>
              <div style={{ padding: "8px" }}>
                {members.filter(m => !sessionMemberNames.has(m.name)).length === 0 && (
                  <div style={{ color: T.textMuted, padding: "12px", fontSize: "13px" }}>Everyone is present! 🎉</div>
                )}
                {members.filter(m => !sessionMemberNames.has(m.name)).map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ color: T.textSub, fontSize: "13px" }}>{m.name}</div>
                    {can(role, "markAttendance") && activeSession && (
                      <button onClick={() => checkIn(m.name, activeSession.id, currentUser.display)} style={{ ...btn("green"), fontSize: "11px", padding: "4px 10px" }}>Mark Present</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>No sessions yet. {can(role, "markAttendance") ? 'Click "+ New Session" to create one.' : ""}</div>
      )}

      {showNewSession && (
        <Modal onClose={() => setShowNewSession(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>📋 New Attendance Session</h2>
          <label style={labelStyle}>
            <span style={{ color: T.textSub, fontSize: "12px" }}>Session Name (e.g. "Guild War 2025-06-01", "Weekly Raid")</span>
            <input type="text" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} onKeyDown={e => e.key === "Enter" && createSession()} style={inputStyle} autoFocus placeholder="e.g. Weekly Raid - May 14" />
          </label>
          {activeSession && (
            <div style={{ marginTop: "10px", background: T.goldGlow, border: `1px solid ${T.gold}44`, borderRadius: "8px", color: T.gold, fontSize: "12px", padding: "10px 14px" }}>
              ⚠️ This will close the current active session: <strong>{activeSession.name}</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowNewSession(false)} style={btn("gray")}>Cancel</button>
            <button onClick={createSession} style={btn("green")}>Start Session</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// AUCTION TAB — with real-time point deduction / refund
// ============================================================
function AuctionTab({ role, currentUser }) {
  const [auctions, setAuctions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [now, setNow]             = useState(Date.now());
  const [filter, setFilter]       = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState({ name: "", type: "Equipment", highestBid: 0, bidder: "-", hoursLeft: 48 });
  const [bidModal, setBidModal]   = useState(null);
  const [bidForm, setBidForm]     = useState({ amount: "", bidder: "" });
  const [saveError, setSaveError] = useState("");
  const [bidError, setBidError]   = useState("");
  const colFormat = useRef(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const loadAuctions = async () => {
    const { data, error } = await supabase.from("auction_items").select("*").order("created_at", { ascending: true });
    if (error) { setLoading(false); return; }
    if (data && data.length > 0) {
      const first = data[0];
      if ("highestBid" in first) colFormat.current = "camel";
      else if ("highest_bid" in first) colFormat.current = "snake";
    }
    if (data) {
      setAuctions(data.map(row => ({
        id:         row.id,
        name:       row.name,
        type:       row.type || "Equipment",
        imageEmoji: row.imageEmoji || row.image_emoji || "⚔️",
        highestBid: row.highestBid ?? row.highest_bid ?? 0,
        bidder:     row.bidder ?? "-",
        endsAt:     row.endsAt || row.ends_at ? new Date(row.endsAt ?? row.ends_at).getTime() : Date.now() + 3600000 * 48,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAuctions();
    const ch = supabase.channel("auctions-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_items" }, loadAuctions)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const buildPayload = (fields) => {
    if (colFormat.current === "camel") return { name: fields.name, type: fields.type, imageEmoji: fields.emoji, highestBid: fields.highestBid, bidder: fields.bidder, endsAt: fields.endsAt };
    return { name: fields.name, type: fields.type, image_emoji: fields.emoji, highest_bid: fields.highestBid, bidder: fields.bidder, ends_at: fields.endsAt };
  };

  const EMOJIS = { Equipment: "⚔️", Material: "💎", Consumable: "🧪", Currency: "💰" };
  const types  = ["All", "Equipment", "Material", "Consumable", "Currency"];
  const filtered = auctions.filter(a => filter === "All" || a.type === filter);

  const openAdd  = () => { setSaveError(""); setEditItem(null); setForm({ name: "", type: "Equipment", highestBid: 0, bidder: "-", hoursLeft: 48 }); setShowModal(true); };
  const openEdit = (a) => { setSaveError(""); setEditItem(a); setForm({ ...a, hoursLeft: Math.max(0, Math.round((a.endsAt - Date.now()) / 3600000)) }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaveError("");
    const endsAt  = new Date(Date.now() + +form.hoursLeft * 3600000).toISOString();
    const payload = buildPayload({ name: form.name, type: form.type, emoji: EMOJIS[form.type] || "⚔️", highestBid: +form.highestBid, bidder: form.bidder || "-", endsAt });
    let result;
    if (editItem) result = await supabase.from("auction_items").update(payload).eq("id", editItem.id).select();
    else result = await supabase.from("auction_items").insert([payload]).select();
    if (result.error) { setSaveError(`❌ ${result.error.message}`); return; }
    setShowModal(false);
    loadAuctions();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this auction item?")) {
      await supabase.from("auction_items").delete().eq("id", id);
    }
  };

  const openBid = (item) => {
    setBidError("");
    setBidModal(item);
    setBidForm({ amount: item.highestBid + 10, bidder: currentUser.display });
  };

  // ── Real-time bidding with point deduction & refund ──
  const confirmBid = async () => {
    setBidError("");
    const newBid     = +bidForm.amount;
    const bidderName = bidForm.bidder || currentUser.display;

    if (newBid <= bidModal.highestBid) { setBidError("Bid must be higher than current bid!"); return; }

    // Get bidder's current points from users table
    const { data: bidderUser } = await supabase.from("users").select("id, points, display").eq("display", bidderName).maybeSingle();
    if (!bidderUser) { setBidError("Could not find your user account."); return; }
    if ((bidderUser.points || 0) < newBid) { setBidError(`Not enough points! You have ${bidderUser.points || 0} PTS but need ${newBid} PTS.`); return; }

    // Refund previous bidder if not the same person
    const prevBidder = bidModal.bidder;
    const prevAmount = bidModal.highestBid;
    if (prevBidder && prevBidder !== "-" && prevBidder !== bidderName && prevAmount > 0) {
      const { data: prevUser } = await supabase.from("users").select("id, points").eq("display", prevBidder).maybeSingle();
      if (prevUser) {
        await supabase.from("users").update({ points: (prevUser.points || 0) + prevAmount }).eq("id", prevUser.id);
      }
    }

    // Deduct points from new bidder
    await supabase.from("users").update({ points: (bidderUser.points || 0) - newBid }).eq("id", bidderUser.id);

    // Update the auction item
    const bidPayload = colFormat.current === "camel"
      ? { highestBid: newBid, bidder: bidderName }
      : { highest_bid: newBid, bidder: bidderName };
    const { error } = await supabase.from("auction_items").update(bidPayload).eq("id", bidModal.id);
    if (error) { setBidError("Bid failed: " + error.message); return; }

    // Log to auction_winners
    await supabase.from("auction_winners").upsert([{
      item_id:   bidModal.id,
      item_name: bidModal.name,
      bidder:    bidderName,
      amount:    newBid,
      claimed:   false,
    }], { onConflict: "item_id" });

    setBidModal(null);
  };

  const getTimeColor = (endsAt) => { const diff = endsAt - now; if (diff < 3600000) return T.redHi; if (diff < 86400000) return T.goldHi; return T.textSub; };

  if (loading) return <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>Loading auctions…</div>;

  return (
    <div>
      <SectionHeader icon="🏆" title="Auction House" sub="Bid with guild points — real-time deduction & refund" actions={[
        can(role, "addAuction") && <button key="add" onClick={openAdd} style={btn("gold")}>+ Add Item</button>,
      ].filter(Boolean)} />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", background: filter === t ? T.gold : T.bg3, color: filter === t ? "#fff" : T.textSub, fontSize: "13px", fontWeight: filter === t ? "700" : "400" }}>{t}</button>)}
      </div>

      {auctions.length === 0 && <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>No auction items yet.{can(role, "addAuction") ? " Click \"+ Add Item\" to create one." : ""}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
        {filtered.map(item => {
          const ended = item.endsAt < now;
          return (
            <div key={item.id} style={{ background: T.bg2, border: `1px solid ${ended ? T.border : T.borderHi}`, borderRadius: "14px", overflow: "hidden", opacity: ended ? 0.65 : 1, transition: "transform 0.15s" }}>
              <div style={{ background: T.bg3, padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px", position: "relative" }}>
                {item.imageEmoji}
                <span style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", background: ended ? T.bg0 : T.goldGlow, color: ended ? T.textMuted : T.goldHi, border: `1px solid ${ended ? T.border : T.gold}55`, fontSize: "10px", padding: "2px 10px", borderRadius: "20px", whiteSpace: "nowrap", fontWeight: "700", letterSpacing: "0.06em" }}>{ended ? "ENDED" : "LIVE"}</span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ color: getTimeColor(item.endsAt), fontSize: "11px", marginBottom: "4px" }}>⏱ {ended ? "Ended" : formatCountdown(item.endsAt)}</div>
                <div style={{ color: T.text, fontWeight: "700", fontSize: "15px", marginBottom: "8px" }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ color: T.textMuted, fontSize: "12px" }}>Highest Bid</span><span style={{ color: item.highestBid > 0 ? T.goldHi : T.text, fontWeight: "700" }}>{item.highestBid} PTS</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span style={{ color: T.textMuted, fontSize: "12px" }}>Bidder</span><span style={{ color: T.textSub, fontSize: "13px" }}>{item.bidder}</span></div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {!ended && can(role, "placeBid") && <button onClick={() => openBid(item)} style={{ flex: 1, ...btn("gold"), padding: "6px", justifyContent: "center", textAlign: "center" }}>Place Bid</button>}
                  {can(role, "editAuction") && <button onClick={() => openEdit(item)} style={{ ...btn("gray"), padding: "6px 10px" }}>Edit</button>}
                  {can(role, "editAuction") && <button onClick={() => handleDelete(item.id)} style={{ ...btn("red"), padding: "6px 10px" }}>✕</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>{editItem ? "Edit Item" : "Add Auction Item"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span style={{ color: T.textSub, fontSize: "12px" }}>Item Name</span><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Type</span><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>{["Equipment", "Material", "Consumable", "Currency"].map(t => <option key={t}>{t}</option>)}</select></label>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Hours Left</span><input type="number" value={form.hoursLeft} onChange={e => setForm({ ...form, hoursLeft: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Starting Bid (PTS)</span><input type="number" value={form.highestBid} onChange={e => setForm({ ...form, highestBid: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Starting Bidder</span><input type="text" value={form.bidder} onChange={e => setForm({ ...form, bidder: e.target.value })} style={inputStyle} /></label>
          </div>
          {saveError && <div style={{ color: T.redHi, fontSize: "12px", marginTop: "8px" }}>{saveError}</div>}
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btn("gray")}>Cancel</button>
            <button onClick={handleSave} style={btn("gold")}>Save</button>
          </div>
        </Modal>
      )}

      {bidModal && (
        <Modal onClose={() => setBidModal(null)}>
          <h2 style={{ color: T.text, marginTop: 0 }}>🏆 Place Bid — {bidModal.name}</h2>
          <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: T.textSub, fontSize: "13px" }}>Current Highest</span>
              <span style={{ color: T.goldHi, fontWeight: "700" }}>{bidModal.highestBid} PTS — {bidModal.bidder}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textSub, fontSize: "13px" }}>Your Points</span>
              <span style={{ color: T.blueHi, fontWeight: "700" }}>— (loaded from DB)</span>
            </div>
          </div>
          <div style={{ background: T.blueGlow, border: `1px solid ${T.blue}44`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", color: T.blueHi, fontSize: "12px" }}>
            💡 Your bid is <strong>deducted immediately</strong>. If you get outbid, your points are <strong>refunded automatically</strong>.
          </div>
          <label style={labelStyle}><span style={{ color: T.textSub, fontSize: "12px" }}>Your Bid (PTS)</span><input type="number" value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} style={inputStyle} /></label>
          <label style={{ ...labelStyle, marginTop: "10px" }}><span style={{ color: T.textSub, fontSize: "12px" }}>Your Character Name</span><input type="text" value={bidForm.bidder} onChange={e => setBidForm({ ...bidForm, bidder: e.target.value })} style={inputStyle} /></label>
          {bidError && <p style={{ color: T.redHi, fontSize: "12px", marginTop: "8px" }}>⚠️ {bidError}</p>}
          {+bidForm.amount <= bidModal.highestBid && !bidError && <p style={{ color: T.redHi, fontSize: "12px" }}>⚠️ Bid must be higher than current bid!</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
            <button onClick={() => setBidModal(null)} style={btn("gray")}>Cancel</button>
            <button onClick={confirmBid} disabled={+bidForm.amount <= bidModal.highestBid} style={{ ...btn("gold"), opacity: +bidForm.amount <= bidModal.highestBid ? 0.5 : 1 }}>Confirm Bid</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// AUCTION WINNERS TAB — history log, claimed/unclaimed
// ============================================================
function WinnersTab({ role, currentUser }) {
  const [winners, setWinners]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterClaim, setFilterClaim] = useState("All");
  const [detailModal, setDetailModal] = useState(null);

  const loadWinners = async () => {
    const { data } = await supabase
      .from("auction_winners")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setWinners(data);
    setLoading(false);
  };

  useEffect(() => {
    loadWinners();
    const ch = supabase.channel("winners-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_winners" }, loadWinners)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const toggleClaim = async (w) => {
    const newClaimed = !w.claimed;
    await supabase.from("auction_winners").update({
      claimed: newClaimed,
      claimed_at: newClaimed ? new Date().toISOString() : null,
      claimed_by: newClaimed ? currentUser.display : null,
    }).eq("id", w.id);
  };

  const deleteWinner = async (id) => {
    if (window.confirm("Remove this winner record?")) {
      await supabase.from("auction_winners").delete().eq("id", id);
    }
  };

  const filtered = winners.filter(w => {
    if (filterClaim === "Claimed")   return w.claimed;
    if (filterClaim === "Unclaimed") return !w.claimed;
    return true;
  });

  const totalSpent     = winners.reduce((s, w) => s + (w.amount || 0), 0);
  const totalClaimed   = winners.filter(w => w.claimed).length;
  const totalUnclaimed = winners.filter(w => !w.claimed).length;

  if (loading) return <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>Loading winners…</div>;

  return (
    <div>
      <SectionHeader icon="🥇" title="Auction Winners" sub="History log · claimed & unclaimed items" />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        <StatBadge label="Total Won" value={winners.length} color={T.goldHi} />
        <StatBadge label="Claimed" value={totalClaimed} color={T.greenHi} />
        <StatBadge label="Unclaimed" value={totalUnclaimed} color={T.redHi} />
        <StatBadge label="Points Spent" value={totalSpent} color={T.blueHi} />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {["All", "Unclaimed", "Claimed"].map(f => (
          <button key={f} onClick={() => setFilterClaim(f)} style={{ padding: "6px 16px", borderRadius: "20px", border: "none", cursor: "pointer", background: filterClaim === f ? (f === "Claimed" ? T.green : f === "Unclaimed" ? T.red : T.blue) : T.bg3, color: filterClaim === f ? "#fff" : T.textSub, fontSize: "13px", fontWeight: filterClaim === f ? "700" : "400" }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ color: T.textMuted, textAlign: "center", padding: "40px" }}>No winner records yet. Winners are recorded when a bid is placed.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(w => (
          <div key={w.id} style={{ background: T.bg2, border: `1px solid ${w.claimed ? T.green + "44" : T.border}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Status dot */}
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: w.claimed ? T.greenHi : T.redHi, flexShrink: 0 }}></div>

            {/* Item info */}
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ color: T.text, fontWeight: "700", fontSize: "14px" }}>{w.item_name || "Unknown Item"}</div>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                <span style={{ color: T.textSub, fontSize: "12px" }}>🏆 Won by <strong style={{ color: T.goldHi }}>{w.bidder}</strong></span>
                <span style={{ color: T.textSub, fontSize: "12px" }}>💰 <strong style={{ color: T.goldHi }}>{w.amount} PTS</strong></span>
                <span style={{ color: T.textMuted, fontSize: "12px" }}>📅 {formatDate(w.created_at)}</span>
              </div>
              {w.claimed && w.claimed_at && (
                <div style={{ color: T.greenHi, fontSize: "11px", marginTop: "4px" }}>
                  ✅ Claimed on {formatDate(w.claimed_at)}{w.claimed_by ? ` by ${w.claimed_by}` : ""}
                </div>
              )}
            </div>

            {/* Status badge */}
            <span style={{ background: w.claimed ? T.greenGlow : "#3a121222", border: `1px solid ${w.claimed ? T.green + "66" : T.red + "55"}`, color: w.claimed ? T.greenHi : T.redHi, padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
              {w.claimed ? "✅ Claimed" : "⏳ Unclaimed"}
            </span>

            {/* Actions */}
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {can(role, "manageWinners") && (
                <button onClick={() => toggleClaim(w)} style={{ ...btn(w.claimed ? "gray" : "green"), fontSize: "12px", padding: "6px 12px" }}>
                  {w.claimed ? "Unmark" : "Mark Claimed"}
                </button>
              )}
              {can(role, "manageWinners") && (
                <button onClick={() => deleteWinner(w.id)} style={{ ...btn("red"), fontSize: "12px", padding: "6px 10px" }}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Per-member summary */}
      {winners.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <div style={{ color: T.textSub, fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Per-Member Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {Object.entries(winners.reduce((acc, w) => {
              if (!acc[w.bidder]) acc[w.bidder] = { wins: 0, spent: 0, claimed: 0 };
              acc[w.bidder].wins++;
              acc[w.bidder].spent += w.amount || 0;
              if (w.claimed) acc[w.bidder].claimed++;
              return acc;
            }, {})).sort((a, b) => b[1].spent - a[1].spent).map(([name, stats]) => (
              <div key={name} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ color: T.text, fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>{name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ color: T.textMuted, fontSize: "12px" }}>Wins</span>
                  <span style={{ color: T.goldHi, fontSize: "12px", fontWeight: "700" }}>{stats.wins}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ color: T.textMuted, fontSize: "12px" }}>Total Spent</span>
                  <span style={{ color: T.blueHi, fontSize: "12px", fontWeight: "700" }}>{stats.spent} PTS</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.textMuted, fontSize: "12px" }}>Claimed</span>
                  <span style={{ color: T.greenHi, fontSize: "12px", fontWeight: "700" }}>{stats.claimed}/{stats.wins}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function GuildTracker() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const saved = localStorage.getItem("guild_user"); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [tab, setTab]     = useState("members");
  const [bosses, setBosses] = useState(BOSSES_DEFAULT);

  useEffect(() => {
    if (!currentUser) return;
    supabase.from("users").select("*").eq("id", currentUser.id).maybeSingle().then(({ data }) => {
      if (!data || data.role === "pending") {
        setCurrentUser(null); localStorage.removeItem("guild_user");
      } else if (data.role !== currentUser.role) {
        const updated = { ...currentUser, ...data };
        setCurrentUser(updated); localStorage.setItem("guild_user", JSON.stringify(updated));
      }
    });
  }, []);

  if (!currentUser) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); localStorage.setItem("guild_user", JSON.stringify(user)); }} />;
  }

  const role = currentUser.role;
  const rc   = roleColors[role] || roleColors.member;

  const tabs = [
    { id: "members",    label: "👥 Members"      },
    { id: "attendance", label: "📋 Attendance"    },
    { id: "bosses",     label: "👹 Boss Timer"    },
    { id: "auction",    label: "🏺 Auction House" },
    { id: "winners",    label: "🥇 Winners"       },
    ...(can(role, "manageUsers") ? [{ id: "users", label: "🔐 Manage Users" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, fontFamily: "'Segoe UI', system-ui, sans-serif", color: T.text,
      backgroundImage: "radial-gradient(ellipse at 10% 0%, #1a1f3a22 0%, transparent 50%), radial-gradient(ellipse at 90% 100%, #2a150a18 0%, transparent 50%)" }}>

      {/* ── Header ── */}
      <div style={{ background: T.bg1, borderBottom: `1px solid ${T.borderHi}`, padding: "0 24px",
        boxShadow: `0 2px 20px rgba(0,0,0,0.4)` }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img src="https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png" alt="Rampage" style={{ width: "68px", height: "68px", objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              <div>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", letterSpacing: "0.1em",
                  background: `linear-gradient(135deg, ${T.goldHi} 0%, ${T.blueHi} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>RAMPAGE TRACKER</h1>
                <p style={{ margin: "2px 0 0", color: T.textMuted, fontSize: "12px", letterSpacing: "0.04em" }}>Attendance · Boss Timers · Auction House · Winners</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.text, fontWeight: "600", fontSize: "14px" }}>{currentUser.display}</div>
                <span style={{ background: rc.bg, color: rc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "11px" }}>{rc.label}</span>
              </div>
              <button onClick={() => { setCurrentUser(null); localStorage.removeItem("guild_user"); }} style={{ ...btn("red"), fontSize: "13px" }}>Logout</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "2px", marginTop: "14px", flexWrap: "wrap", overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", background: tab === t.id ? T.bg3 : "transparent", border: "none", borderBottom: `2px solid ${tab === t.id ? T.gold : "transparent"}`, color: tab === t.id ? T.text : T.textMuted, cursor: "pointer", fontSize: "13px", fontWeight: tab === t.id ? "700" : "400", borderRadius: "6px 6px 0 0", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px" }}>
        {tab === "members"    && <MembersTab role={role} />}
        {tab === "attendance" && <AttendanceTab role={role} currentUser={currentUser} />}
        {tab === "bosses"     && <BossTimerTab bosses={bosses} setBosses={setBosses} role={role} />}
        {tab === "auction"    && <AuctionTab role={role} currentUser={currentUser} />}
        {tab === "winners"    && <WinnersTab role={role} currentUser={currentUser} />}
        {tab === "users"      && can(role, "manageUsers") && <UsersTab currentUser={currentUser} />}
      </div>
    </div>
  );
}
