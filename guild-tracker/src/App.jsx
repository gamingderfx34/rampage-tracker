import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ============================================================
// USER ACCOUNTS — Edit these to set your guild's credentials
// ============================================================
const USERS = [
  { username: "admin",    password: "akosiderf",   role: "admin",   display: "Admin" },
  { username: "valiant",  password: "leader123",  role: "leader",  display: "VALIANT" },
  { username: "xjinnn",   password: "elder1",   role: "elder",   display: "XJINNN" },
  { username: "chmb",   password: "elder456",   role: "elder",   display: "CHMB" },
  { username: "xiloveher",  password: "member123",  role: "member",  display: "xILOVEHER" },
  { username: "baki",  password: "member456",  role: "member",  display: "Bakiハンマー" },
  { username: "yujiro",  password: "member789",  role: "member",  display: "Yujiroカンマ" },
  { username: "xlucypearl",  password: "member000",  role: "member",  display: "xLucyPearl" },
];

// ROLE PERMISSIONS
const CAN = {
  editMembers:   ["admin", "leader"],
  deleteMembers: ["admin", "leader"],
  killBoss:      ["admin", "leader", "elder"],
  editBoss:      ["admin", "leader", "elder", "member"],
  addAuction:    ["admin", "leader"],
  editAuction:   ["admin", "leader"],
  placeBid:      ["admin", "leader", "elder", "member"],
  manageUsers:   ["admin"],
  markAttendance:["admin", "leader"],
};
const can = (role, action) => CAN[action]?.includes(role);

// ============================================================
// DEFAULT DATA
// ============================================================
const CLASSES = ["Berserker", "Skald", "Warlord", "Volva", "Archer", "RuneFighter"];
const POSITIONS = ["Leader", "Elder", "Member", "Recruit"];

const BOSSES_DEFAULT = [
  { id: 1, name: "Lv. 66 Cruel Outlaw Gand- Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 2, name: "Lv. 67 Eternal Gatekeeper Amot - Kings Tomb 1F",   color: "#d94a4a", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 3, name: "Lv. 68 Ruthless Destroyer Hawler- Kings Tomb 1F",     color: "#4ad94a", respawnMin: 45, respawnMax: 90,  lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 4, name: "Lv. 69 Assulter of Tombs Laudd- Kings Tomb 1F",      color: "#d9a44a", respawnMin: 60, respawnMax: 120, lastKilled: null, windowDuration: 30, channel: 1 },
  { id: 5, name: "Lv. 66 Cruel Outlaw Gand- Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 6, name: "Lv. 67 Ethernal Destroyer Amot- Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 7, name: "Lv. 68 Ruthless Destroyer Hawler- Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
  { id: 8, name: "Lv. 69 Assulter of Tombs Laudd- Kings Tomb 1F",   color: "#4a90d9", respawnMin: 30, respawnMax: 60,  lastKilled: null, windowDuration: 30, channel: 2 },
];

const MEMBERS_DEFAULT = [
  { id: 1,  name: "VALIANT",       class: "Skald",       position: "Leader", growthPower: 222408, multiplier: 2.23, points: 223.71, activity: "Active",   comment: "" },
  { id: 2,  name: "두부우우우우",   class: "Archer",      position: "Elder",  growthPower: 260786, multiplier: 2.61, points: 233.80, activity: "Active",   comment: "" },
  { id: 3,  name: "xJiinnn",       class: "Archer",      position: "Elder",  growthPower: 272785, multiplier: 2.73, points: 213.47, activity: "Active",   comment: "" },
  { id: 4,  name: "Kiree",         class: "Skald",       position: "Elder",  growthPower: 221026, multiplier: 2.21, points: 141.37, activity: "Active",   comment: "" },
  { id: 5,  name: "Squee",         class: "RuneFighter", position: "Elder",  growthPower: 213180, multiplier: 2.13, points: 122.18, activity: "Active",   comment: "" },
  { id: 6,  name: "Yujiroカンマ",  class: "RuneFighter", position: "Elder",  growthPower: 205106, multiplier: 2.05, points: 103.45, activity: "Inactive", comment: "" },
  { id: 7,  name: "chmb",          class: "Archer",      position: "Elder",  growthPower: 208325, multiplier: 2.08, points: 66.53,  activity: "Inactive", comment: "" },
  { id: 8,  name: "xLucyPearl",    class: "Archer",      position: "Elder",  growthPower: 179550, multiplier: 1.80, points: 144.26, activity: "Active",   comment: "" },
  { id: 9,  name: "BL4iR",         class: "Warlord",     position: "Elder",  growthPower: 190526, multiplier: 1.91, points: 141.41, activity: "Active",   comment: "" },
  { id: 10, name: "Bakiハンマー",   class: "Skald",       position: "Member", growthPower: 124966, multiplier: 1.25, points: 138.25, activity: "Active",   comment: "" },
];

// ============================================================
// STYLES
// ============================================================
const inputStyle = { width: "100%", padding: "8px 10px", background: "#0f1320", border: "1px solid #374151", borderRadius: "6px", color: "#f3f4f6", fontSize: "13px", boxSizing: "border-box" };
const labelStyle = { display: "flex", flexDirection: "column", gap: "4px" };
const btnStyle = (bg, color) => ({ background: bg, border: `1px solid ${color}44`, color, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" });
const positionColors = { Leader: { bg: "#f59e0b", text: "#fff" }, Elder: { bg: "#dc2626", text: "#fff" }, Member: { bg: "#374151", text: "#9ca3af" }, Recruit: { bg: "#1e3a5f", text: "#60a5fa" } };
const activityColors = { Active: { bg: "#065f46", text: "#34d399", dot: "#34d399" }, Inactive: { bg: "#1f2937", text: "#9ca3af", dot: "#6b7280" } };
const roleColors = { admin: { bg: "#7f1d1d", text: "#fca5a5", label: "👑 Admin" }, leader: { bg: "#78350f", text: "#fcd34d", label: "🛡️ Leader" }, elder: { bg: "#1e3a5f", text: "#60a5fa", label: "⚔️ Elder" }, member: { bg: "#1f2937", text: "#9ca3af", label: "👤 Member" } };

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function formatCountdown(endsAt) {
  const diff = endsAt - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "520px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "20px" }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ display: "", username: "", password: "" });
  const [regError, setRegError] = useState("");

  const handleRegister = async () => {
    if (!regForm.username || !regForm.password || !regForm.display) { setRegError("Please fill in all fields."); return; }
    const { data: existing } = await supabase.from("users").select("*").eq("username", regForm.username).maybeSingle();
    if (existing) { setRegError("Username already taken."); return; }
    const { error } = await supabase.from("users").insert([{ username: regForm.username, password: regForm.password, display: regForm.display, role: "member" }]);
    if (error) setRegError("Registration failed. Try again.");
    else { setIsRegistering(false); setError("✅ Account created! You can now log in."); }
  };

  const handleLogin = async () => {
    const { data: user } = await supabase.from("users").select("*").eq("username", username).eq("password", password).maybeSingle();
    if (user) { setError(""); onLogin(user); }
    else setError("❌ Invalid username or password!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚔️</div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Guild Tracker</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "6px 0 0" }}>{isRegistering ? "Create a new account" : "Sign in to your guild account"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={labelStyle}>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>Username</span>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter username" style={inputStyle} autoFocus />
          </label>
          <label style={labelStyle}>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>Password</span>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter password" style={{ ...inputStyle, paddingRight: "40px" }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "16px" }}>{showPass ? "🙈" : "👁️"}</button>
            </div>
          </label>
          {error && <div style={{ color: error.startsWith("✅") ? "#34d399" : "#f87171", fontSize: "13px", textAlign: "center" }}>{error}</div>}
          <button onClick={handleLogin} style={{ ...btnStyle("#1e3a8a", "#a5b4fc"), width: "100%", padding: "12px", fontSize: "15px" }}>Login</button>
          {isRegistering && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <input placeholder="Display Name" value={regForm.display} onChange={e => setRegForm({...regForm, display: e.target.value})} style={inputStyle} />
              <input placeholder="Username" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} style={inputStyle} />
              <input type="password" placeholder="Password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} style={inputStyle} />
              {regError && <div style={{ color: "#f87171", fontSize: "13px" }}>{regError}</div>}
              <button onClick={handleRegister} style={{ background: "#1e3a8a", color: "#a5b4fc", border: "none", borderRadius: "8px", width: "100%", padding: "12px", fontSize: "15px", cursor: "pointer" }}>Register</button>
            </div>
          )}
          <button onClick={() => { setIsRegistering(!isRegistering); setError(""); setRegError(""); }} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
            {isRegistering ? "Back to Login" : "Register new account"}
          </button>
        </div>
        <div style={{ marginTop: "24px", padding: "16px", background: "#0f1320", borderRadius: "8px" }}>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px", fontWeight: "600" }}>ROLE PERMISSIONS</p>
          {Object.entries(roleColors).map(([role, c]) => (
            <div key={role} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: "20px", fontSize: "11px" }}>{c.label}</span>
              <span style={{ color: "#6b7280", fontSize: "11px" }}>
                {role === "admin" && "Full access + manage users"}
                {role === "leader" && "Edit members, bosses, auctions"}
                {role === "elder" && "Kill bosses, place bids"}
                {role === "member" && "View only + place bids"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USER MANAGEMENT (Admin only)
// ============================================================
function UsersTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "member", display: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    supabase.from("users").select("*").then(({ data }) => { if (data) setUsers(data); });
  }, []);

  const openAdd  = () => { setEditUser(null); setForm({ username: "", password: "", role: "member", display: "" }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ ...u }); setShowModal(true); };
  const handleSave = async () => {
    if (!form.username || !form.password) return;
    if (editUser) {
      await supabase.from("users").update({ ...form }).eq("username", editUser.username);
      setUsers(users.map(u => u.username === editUser.username ? { ...form } : u));
    } else {
      const { data } = await supabase.from("users").insert([{ ...form }]).select();
      if (data) setUsers([...users, ...data]);
    }
    setShowModal(false);
  };
  const handleDelete = async (username) => {
    if (username === currentUser.username) return alert("Cannot delete your own account!");
    await supabase.from("users").delete().eq("username", username);
    setUsers(users.filter(u => u.username !== username));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ color: "#9ca3af", fontSize: "14px" }}>{users.length} accounts</div>
        <button onClick={openAdd} style={btnStyle("#1e3a8a", "#a5b4fc")}>+ Add User</button>
      </div>
      <div style={{ background: "#0f1320", border: "1px solid #1f2937", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d3748" }}>
              {["Display Name", "Username", "Password", "Role", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: "500", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const rc = roleColors[u.role] || roleColors.member;
              return (
                <tr key={u.username} style={{ borderBottom: "1px solid #1f2937", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "12px 16px", color: "#f3f4f6", fontWeight: "600" }}>{u.display}</td>
                  <td style={{ padding: "12px 16px", color: "#60a5fa", fontFamily: "monospace" }}>{u.username}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontFamily: "monospace" }}>{"•".repeat(u.password?.length || 0)}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ background: rc.bg, color: rc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{rc.label}</span></td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => openEdit(u)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", marginRight: "8px" }}>Edit</button>
                    <button onClick={() => handleDelete(u.username)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>{editUser ? "Edit User" : "Add User"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Display Name</span><input type="text" value={form.display} onChange={e => setForm({ ...form, display: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Username</span><input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, paddingRight: "40px" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </label>
            <label style={labelStyle}>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>Role</span>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                {["admin", "leader", "elder", "member"].map(r => <option key={r} value={r}>{roleColors[r].label} — {r}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={handleSave} style={btnStyle("#1e3a8a", "#a5b4fc")}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MEMBERS TAB
// ============================================================
function MembersTab({ members, setMembers, role }) {
  const [supabaseUsers, setSupabaseUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ name: "", class: "Warrior", position: "Member", growthPower: "", multiplier: "", points: "", activity: "Active", comment: "" });
  const [sortBy, setSortBy] = useState("points");
  const [sortDir, setSortDir] = useState("desc");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from("users").select("id, display, points");
      if (data) setSupabaseUsers(data);
    };
    fetchUsers();
  }, []);

  const getPoints = (memberName) => {
    const u = supabaseUsers.find(u => u.display === memberName);
    return u ? u.points : 0;
  };

  const resetPoints = async (memberName) => {
    await supabase.from("users").update({ points: 0 }).eq("display", memberName);
    setSupabaseUsers(prev => prev.map(u => u.display === memberName ? { ...u, points: 0 } : u));
  };

  const openAdd  = () => { setEditMember(null); setForm({ name: "", class: "Warrior", position: "Member", growthPower: "", multiplier: "", points: "", activity: "Active", comment: "" }); setShowModal(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ ...m }); setShowModal(true); };
  const handleSave = () => {
    if (!form.name) return;
    if (editMember) setMembers(members.map(m => m.id === editMember.id ? { ...form, id: m.id, growthPower: +form.growthPower, multiplier: +form.multiplier, points: +form.points } : m));
    else setMembers([...members, { ...form, id: Date.now(), growthPower: +form.growthPower, multiplier: +form.multiplier, points: +form.points }]);
    setShowModal(false);
  };
  const handleDelete = (id) => setMembers(members.filter(m => m.id !== id));
  const handleSort = (col) => { if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(col); setSortDir("desc"); } };
  const sorted = [...members].sort((a, b) => { const v = sortDir === "asc" ? 1 : -1; return typeof a[sortBy] === "number" ? (a[sortBy] - b[sortBy]) * v : String(a[sortBy]).localeCompare(String(b[sortBy])) * v; });
  const handleImport = () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    const imported = lines.map((line, i) => { const c = line.split(/\t|,/); return { id: Date.now() + i, name: c[0]?.trim() || "Unknown", class: c[1]?.trim() || "Warrior", position: c[2]?.trim() || "Member", growthPower: parseFloat(c[3]) || 0, multiplier: parseFloat(c[4]) || 1, points: parseFloat(c[5]) || 0, activity: c[6]?.trim() || "Active", comment: c[7]?.trim() || "" }; });
    setMembers(prev => [...prev, ...imported]); setImportText(""); setShowImport(false);
  };
  const exportCSV = () => {
    const blob = new Blob(["Name,Class,Position,Growth Power,Multiplier,Points,Activity,Comment\n" + members.map(m => `${m.name},${m.class},${m.position},${m.growthPower},${m.multiplier},${m.points},${m.activity},${m.comment}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "guild_members.csv"; a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ color: "#9ca3af", fontSize: "14px" }}>{members.length} members</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={btnStyle("#1e3a5f", "#60a5fa")}>📤 Export CSV</button>
          {can(role, "editMembers") && <button onClick={() => setShowImport(true)} style={btnStyle("#1e3a5f", "#60a5fa")}>📥 Import</button>}
          {can(role, "editMembers") && <button onClick={openAdd} style={btnStyle("#1e3a8a", "#a5b4fc")}>+ Add Member</button>}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {[["#", null], ["Character Name", "name"], ["Class", "class"], ["Position", "position"], ["Growth Power", "growthPower"], ["Multiplier", "multiplier"], ["Points", "points"], ["Activity", "activity"], ["Comment", "comment"], ...(can(role, "editMembers") ? [["Action", null]] : [])].map(([label, col]) => (
                <th key={label} onClick={() => col && handleSort(col)} style={{ padding: "10px 8px", color: "#9ca3af", fontWeight: "500", textAlign: "left", cursor: col ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}>
                  {label} {col && sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => {
              const pc = positionColors[m.position] || positionColors.Member;
              const ac = activityColors[m.activity] || activityColors.Inactive;
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #1f2937", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "10px 8px", color: "#6b7280" }}>{i + 1}</td>
                  <td style={{ padding: "10px 8px", color: "#f3f4f6", fontWeight: "600" }}>{m.name}</td>
                  <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{m.class}</td>
                  <td style={{ padding: "10px 8px" }}><span style={{ background: pc.bg, color: pc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{m.position}</span></td>
                  <td style={{ padding: "10px 8px", color: "#e5e7eb" }}>{m.growthPower.toLocaleString()}</td>
                  <td style={{ padding: "10px 8px", color: "#fbbf24" }}>x{m.multiplier.toFixed(2)}</td>
                  <td style={{ padding: "10px 8px", color: "#f3f4f6", fontWeight: "700" }}>
                    {getPoints(m.name)}
                    {role === "admin" && (
                      <button onClick={() => resetPoints(m.name)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "11px", marginLeft: "6px" }}>↺ Reset</button>
                    )}
                  </td>
                  <td style={{ padding: "10px 8px" }}><span style={{ background: ac.bg, color: ac.text, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ac.dot }}></span>{m.activity}</span></td>
                  <td style={{ padding: "10px 8px", color: "#9ca3af", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.comment || "—"}</td>
                  {can(role, "editMembers") && (
                    <td style={{ padding: "10px 8px" }}>
                      <button onClick={() => openEdit(m)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", marginRight: "8px" }}>Edit</button>
                      {can(role, "deleteMembers") && <button onClick={() => handleDelete(m.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>Delete</button>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showModal && can(role, "editMembers") && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>{editMember ? "Edit Member" : "Add Member"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["Character Name", "name", "text"], ["Growth Power", "growthPower", "number"], ["Multiplier", "multiplier", "number"], ["Points", "points", "number"]].map(([label, key, type]) => (
              <label key={key} style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>{label}</span><input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} /></label>
            ))}
            {[["Class", "class", CLASSES], ["Position", "position", POSITIONS], ["Activity", "activity", ["Active", "Inactive"]]].map(([label, key, opts]) => (
              <label key={key} style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>{label}</span><select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle}>{opts.map(o => <option key={o}>{o}</option>)}</select></label>
            ))}
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Comment</span><input type="text" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} style={inputStyle} /></label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={handleSave} style={btnStyle("#1e3a8a", "#a5b4fc")}>Save</button>
          </div>
        </Modal>
      )}
      {showImport && (
        <Modal onClose={() => setShowImport(false)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>📥 Import Members</h2>
          <p style={{ color: "#9ca3af", fontSize: "13px" }}>Paste CSV or tab-separated rows:<br /><code style={{ color: "#60a5fa" }}>Name, Class, Position, GrowthPower, Multiplier, Points, Activity, Comment</code></p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowImport(false)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={handleImport} style={btnStyle("#065f46", "#34d399")}>Import</button>
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
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [editBoss, setEditBoss] = useState(null);
  const [form, setForm] = useState({ name: "", respawnMin: 30, respawnMax: 60, windowDuration: 30, channel: 1, color: "#4a90d9" });
  const [channel, setChannel] = useState(1);
  const [killModal, setKillModal] = useState(null);
  const [killOffset, setKillOffset] = useState(0);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const getBossState = (boss) => {
    if (!boss.lastKilled) return { state: "unknown", label: "No Data — waiting for first kill" };
    const elapsed = now - boss.lastKilled;
    const respawnMs = boss.respawnMin * 60000;
    const windowMs = boss.windowDuration * 60000;
    if (elapsed < respawnMs) return { state: "waiting", label: `Spawn window in ${formatTime(respawnMs - elapsed)}` };
    if (elapsed < respawnMs + windowMs) return { state: "spawning", label: `🟢 SPAWN WINDOW — ${formatTime(respawnMs + windowMs - elapsed)} left` };
    return { state: "overdue", label: "⚠️ Overdue — boss may have spawned!" };
  };

  const stateColors = { unknown: "#374151", waiting: "#1e3a5f", spawning: "#065f46", overdue: "#7f1d1d" };
  const stateDots  = { unknown: "#6b7280", waiting: "#60a5fa", spawning: "#34d399", overdue: "#f87171" };
  const filtered   = bosses.filter(b => b.channel === channel);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2].map(ch => <button key={ch} onClick={() => setChannel(ch)} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: channel === ch ? "#3b82f6" : "#1f2937", color: channel === ch ? "#fff" : "#9ca3af", fontWeight: "600" }}>Channel {ch}</button>)}
        </div>
        {can(role, "editBoss") && <button onClick={openAdd} style={btnStyle("#1e3a8a", "#a5b4fc")}>+ Add Boss</button>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map(boss => {
          const { state, label } = getBossState(boss);
          return (
            <div key={boss.id} style={{ background: stateColors[state], border: `1px solid ${stateDots[state]}33`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: boss.color + "33", border: `2px solid ${boss.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>👹</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ color: "#f3f4f6", fontWeight: "700", fontSize: "18px" }}>{boss.name}</span>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stateDots[state] }}></span>
                </div>
                <div style={{ color: state === "spawning" ? "#34d399" : state === "overdue" ? "#f87171" : "#9ca3af", fontSize: "14px" }}>{label}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  {[boss.respawnMin, boss.respawnMax].map(t => <span key={t} style={{ background: "#374151", color: "#9ca3af", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{t}m</span>)}
                  <span style={{ background: "#374151", color: "#9ca3af", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>Window: {boss.windowDuration}m</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {can(role, "editBoss") && <button onClick={() => openEdit(boss)} style={{ background: "#374151", border: "none", color: "#9ca3af", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Edit</button>}
                {can(role, "killBoss") && <button onClick={() => { setKillModal(boss); setKillOffset(0); }} style={{ background: "#7f1d1d", border: "1px solid #f87171", color: "#fca5a5", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Kill Boss</button>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>No bosses for Channel {channel}.</div>}
      </div>
      {killModal && (
        <Modal onClose={() => setKillModal(null)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>⚔️ Boss Killed: {killModal.name}</h2>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Adjust if you killed it a few minutes ago.</p>
          <label style={labelStyle}>
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>Minutes ago: {killOffset}m</span>
            <input type="range" min={0} max={60} step={1} value={killOffset} onChange={e => setKillOffset(+e.target.value)} style={{ width: "100%", marginTop: "8px" }} />
          </label>
          <p style={{ color: "#60a5fa", fontSize: "13px" }}>Kill time: {killOffset === 0 ? "Right now" : `${killOffset} minute(s) ago`}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setKillModal(null)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={confirmKill} style={btnStyle("#7f1d1d", "#fca5a5")}>Confirm Kill</button>
          </div>
        </Modal>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>{editBoss ? "Edit Boss" : "Add Boss"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["Boss Name", "name", "text"], ["Min Respawn (min)", "respawnMin", "number"], ["Max Respawn (min)", "respawnMax", "number"], ["Window Duration (min)", "windowDuration", "number"], ["Channel", "channel", "number"]].map(([label, key, type]) => (
              <label key={key} style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>{label}</span><input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} /></label>
            ))}
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Boss Color</span><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, height: "40px", cursor: "pointer" }} /></label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={handleSave} style={btnStyle("#1e3a8a", "#a5b4fc")}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// AUCTION TAB — Live bids via Supabase, persistent, anti-snipe
// ============================================================
// Requires a Supabase table: auctions
//   id (int8, primary key), name (text), type (text), image_emoji (text),
//   highest_bid (int8 default 0), bidder (text default '-'),
//   ends_at (int8), created_at (timestamptz)
// And a table: auction_winners
//   id (int8), name (text), type (text), image_emoji (text),
//   highest_bid (int8), bidder (text), ended_at (int8)

// Anti-snipe: if a bid comes in within SNIPE_WINDOW ms of end, extend by SNIPE_EXTEND ms
const SNIPE_WINDOW = 5 * 60 * 1000;   // 5 minutes
const SNIPE_EXTEND = 5 * 60 * 1000;   // extend by 5 minutes

function AuctionTab({ role, currentUser }) {
  const [auctions, setAuctions] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", type: "Equipment", image_emoji: "⚔️", highest_bid: 0, bidder: "-", hoursLeft: 48 });
  const [bidModal, setBidModal] = useState(null);
  const [bidForm, setBidForm] = useState({ amount: "", bidder: "" });
  const [loading, setLoading] = useState(true);
  const [timeEditModal, setTimeEditModal] = useState(null);
  const [timeEditForm, setTimeEditForm] = useState({ hours: 0, minutes: 0 });

  // Load auctions from Supabase
  const loadAuctions = async () => {
    const { data } = await supabase.from("auctions").select("*").order("id");
    if (data) setAuctions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAuctions();
    // Real-time subscription
    const channel = supabase
      .channel("auctions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, () => { loadAuctions(); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const EMOJIS = { Equipment: "⚔️", Material: "💎", Consumable: "🧪", Currency: "💰" };
  const types = ["All", "Equipment", "Material", "Consumable", "Currency"];
  const filtered = auctions.filter(a => filter === "All" || a.type === filter);

  const openAdd  = () => { setEditItem(null); setForm({ name: "", type: "Equipment", image_emoji: "⚔️", highest_bid: 0, bidder: "-", hoursLeft: 48 }); setShowModal(true); };
  const openEdit = (a) => {
    setEditItem(a);
    const hoursLeft = Math.max(0, ((a.ends_at - Date.now()) / 3600000)).toFixed(2);
    setForm({ ...a, hoursLeft });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    const item = {
      name: form.name,
      type: form.type,
      image_emoji: EMOJIS[form.type] || form.image_emoji,
      highest_bid: +form.highest_bid || 0,
      bidder: form.bidder || "-",
      ends_at: Date.now() + +form.hoursLeft * 3600000,
    };
    if (editItem) {
      await supabase.from("auctions").update(item).eq("id", editItem.id);
    } else {
      await supabase.from("auctions").insert([item]);
    }
    setShowModal(false);
    loadAuctions();
  };

  const handleDelete = async (id) => {
    await supabase.from("auctions").delete().eq("id", id);
    loadAuctions();
  };

  const openBid = (item) => {
    setBidModal(item);
    setBidForm({ amount: (item.highest_bid || 0) + 10, bidder: currentUser.display });
  };

  const confirmBid = async () => {
    const amt = +bidForm.amount;
    if (amt <= (bidModal.highest_bid || 0)) return;
    let newEndsAt = bidModal.ends_at;
    // Anti-snipe: extend timer if bid placed near end
    if (newEndsAt - Date.now() < SNIPE_WINDOW) {
      newEndsAt = Date.now() + SNIPE_EXTEND;
    }
    await supabase.from("auctions").update({
      highest_bid: amt,
      bidder: bidForm.bidder || "Anonymous",
      ends_at: newEndsAt,
    }).eq("id", bidModal.id);
    setBidModal(null);
    loadAuctions();
  };

  // Manual time edit (admin/leader)
  const openTimeEdit = (item) => {
    const remaining = Math.max(0, item.ends_at - Date.now());
    setTimeEditModal(item);
    setTimeEditForm({
      hours: Math.floor(remaining / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
    });
  };

  const confirmTimeEdit = async () => {
    const ms = (+timeEditForm.hours * 3600000) + (+timeEditForm.minutes * 60000);
    await supabase.from("auctions").update({ ends_at: Date.now() + ms }).eq("id", timeEditModal.id);
    setTimeEditModal(null);
    loadAuctions();
  };

  const getTimeColor = (endsAt) => { const diff = endsAt - now; if (diff < 3600000) return "#f87171"; if (diff < 86400000) return "#fbbf24"; return "#9ca3af"; };

  if (loading) return <div style={{ color: "#6b7280", textAlign: "center", padding: "60px" }}>Loading auctions...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {types.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", background: filter === t ? "#3b82f6" : "#1f2937", color: filter === t ? "#fff" : "#9ca3af", fontSize: "13px" }}>{t}</button>)}
        </div>
        {can(role, "addAuction") && <button onClick={openAdd} style={btnStyle("#1e3a8a", "#a5b4fc")}>+ Add Item</button>}
      </div>
      {auctions.length === 0 && <div style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>No auction items yet.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
        {filtered.map(item => {
          const ended = item.ends_at < now;
          return (
            <div key={item.id} style={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: "12px", overflow: "hidden", opacity: ended ? 0.6 : 1 }}>
              <div style={{ background: "#0f1320", padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", position: "relative" }}>
                {item.image_emoji}
                <span style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", background: ended ? "#374151" : "#92400e", color: ended ? "#9ca3af" : "#fcd34d", fontSize: "11px", padding: "2px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>{ended ? "ENDED" : "ONGOING BIDS"}</span>
              </div>
              <div style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{ color: getTimeColor(item.ends_at), fontSize: "11px", flex: 1 }}>⏱ {ended ? "Ended" : formatCountdown(item.ends_at)}</div>
                  {!ended && can(role, "editAuction") && (
                    <button onClick={() => openTimeEdit(item)} title="Edit Timer" style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", padding: "0 2px" }}>🕐</button>
                  )}
                </div>
                <div style={{ color: "#f3f4f6", fontWeight: "700", fontSize: "15px", marginBottom: "8px" }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ color: "#6b7280", fontSize: "12px" }}>Highest Bid</span><span style={{ color: item.highest_bid > 0 ? "#fbbf24" : "#f3f4f6", fontWeight: "700" }}>{item.highest_bid} PTS</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span style={{ color: "#6b7280", fontSize: "12px" }}>Bidder</span><span style={{ color: "#9ca3af", fontSize: "13px" }}>{item.bidder}</span></div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {!ended && can(role, "placeBid") && <button onClick={() => openBid(item)} style={{ flex: 1, background: "#92400e", border: "1px solid #fcd34d", color: "#fcd34d", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Place Bid</button>}
                  {can(role, "editAuction") && <button onClick={() => openEdit(item)} style={{ background: "#1f2937", border: "none", color: "#9ca3af", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Edit</button>}
                  {can(role, "editAuction") && <button onClick={() => handleDelete(item.id)} style={{ background: "#1f2937", border: "none", color: "#f87171", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>✕</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>{editItem ? "Edit Item" : "Add Auction Item"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Item Name</span><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Type</span><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>{["Equipment", "Material", "Consumable", "Currency"].map(t => <option key={t}>{t}</option>)}</select></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Hours Left</span><input type="number" value={form.hoursLeft} onChange={e => setForm({ ...form, hoursLeft: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Starting Bid (PTS)</span><input type="number" value={form.highest_bid} onChange={e => setForm({ ...form, highest_bid: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Current Bidder</span><input type="text" value={form.bidder} onChange={e => setForm({ ...form, bidder: e.target.value })} style={inputStyle} /></label>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowModal(false)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={handleSave} style={btnStyle("#1e3a8a", "#a5b4fc")}>Save</button>
          </div>
        </Modal>
      )}

      {/* Manual Time Edit Modal */}
      {timeEditModal && (
        <Modal onClose={() => setTimeEditModal(null)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>🕐 Edit Timer — {timeEditModal.name}</h2>
          <p style={{ color: "#9ca3af", fontSize: "13px" }}>Set how much time remains for this auction. Current: <strong style={{ color: "#fbbf24" }}>{formatCountdown(timeEditModal.ends_at)}</strong></p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Hours</span><input type="number" min="0" value={timeEditForm.hours} onChange={e => setTimeEditForm({ ...timeEditForm, hours: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Minutes</span><input type="number" min="0" max="59" value={timeEditForm.minutes} onChange={e => setTimeEditForm({ ...timeEditForm, minutes: e.target.value })} style={inputStyle} /></label>
          </div>
          <p style={{ color: "#60a5fa", fontSize: "12px", marginTop: "8px" }}>⚡ Anti-snipe: if someone bids in the last 5 minutes, the timer auto-extends by 5 minutes.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setTimeEditModal(null)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={confirmTimeEdit} style={btnStyle("#1e3a8a", "#a5b4fc")}>Update Timer</button>
          </div>
        </Modal>
      )}

      {/* Place Bid Modal */}
      {bidModal && (
        <Modal onClose={() => setBidModal(null)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>🏆 Place Bid — {bidModal.name}</h2>
          <p style={{ color: "#9ca3af", fontSize: "13px" }}>Current highest: <strong style={{ color: "#fbbf24" }}>{bidModal.highest_bid} PTS</strong> by {bidModal.bidder}</p>
          <p style={{ color: "#60a5fa", fontSize: "12px", marginTop: "-8px" }}>⏱ Time left: {formatCountdown(bidModal.ends_at)}</p>
          {bidModal.ends_at - Date.now() < SNIPE_WINDOW && (
            <div style={{ background: "#78350f22", border: "1px solid #fcd34d44", borderRadius: "6px", padding: "8px 12px", marginBottom: "10px", color: "#fcd34d", fontSize: "12px" }}>
              ⚡ Bidding now will extend the timer by 5 minutes (anti-snipe protection)!
            </div>
          )}
          <label style={labelStyle}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Your Bid (PTS)</span><input type="number" value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} style={inputStyle} /></label>
          <label style={{ ...labelStyle, marginTop: "10px" }}><span style={{ color: "#9ca3af", fontSize: "12px" }}>Your Character Name</span><input type="text" value={bidForm.bidder} onChange={e => setBidForm({ ...bidForm, bidder: e.target.value })} style={inputStyle} /></label>
          {+bidForm.amount <= (bidModal.highest_bid || 0) && <p style={{ color: "#f87171", fontSize: "12px" }}>⚠️ Bid must be higher than current bid!</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setBidModal(null)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={confirmBid} disabled={+bidForm.amount <= (bidModal.highest_bid || 0)} style={btnStyle("#92400e", "#fcd34d")}>Confirm Bid</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// AUCTION WINNERS TAB — Shows ended auctions with winners
// ============================================================
// Uses the same "auctions" table, just filters ended ones.
// Optionally uses "auction_winners" table for archived history.
function AuctionWinnersTab({ role }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiveModal, setArchiveModal] = useState(null);

  const loadWinners = async () => {
    // Load ended auctions from main table
    const { data } = await supabase
      .from("auctions")
      .select("*")
      .lt("ends_at", Date.now())
      .order("ends_at", { ascending: false });
    if (data) setWinners(data);
    setLoading(false);
  };

  useEffect(() => {
    loadWinners();
    const ch = supabase
      .channel("winners-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, loadWinners)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const handleArchiveAndDelete = async (item) => {
    // Optionally save to auction_winners table first
    await supabase.from("auction_winners").insert([{
      name: item.name,
      type: item.type,
      image_emoji: item.image_emoji,
      highest_bid: item.highest_bid,
      bidder: item.bidder,
      ended_at: item.ends_at,
    }]).catch(() => {}); // ignore if table doesn't exist
    await supabase.from("auctions").delete().eq("id", item.id);
    loadWinners();
    setArchiveModal(null);
  };

  if (loading) return <div style={{ color: "#6b7280", textAlign: "center", padding: "60px" }}>Loading winners...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h2 style={{ color: "#f3f4f6", margin: 0, fontSize: "18px" }}>🏅 Auction Winners</h2>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0" }}>All ended auctions and their winning bidders</p>
        </div>
        <button onClick={loadWinners} style={btnStyle("#1f2937", "#9ca3af")}>🔄 Refresh</button>
      </div>
      {winners.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏆</div>
          <div>No ended auctions yet. Winners will appear here when auctions expire.</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {winners.map((item, i) => (
          <div key={item.id} style={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "36px", minWidth: "44px", textAlign: "center" }}>{item.image_emoji}</div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <div style={{ color: "#f3f4f6", fontWeight: "700", fontSize: "15px" }}>{item.name}</div>
              <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>{item.type} · Ended {new Date(item.ends_at).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: "80px" }}>
              <div style={{ color: "#9ca3af", fontSize: "11px", marginBottom: "2px" }}>WINNER</div>
              <div style={{ color: "#fbbf24", fontWeight: "700", fontSize: "14px" }}>{item.bidder === "-" || !item.bidder ? "No Bids" : item.bidder}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: "80px" }}>
              <div style={{ color: "#9ca3af", fontSize: "11px", marginBottom: "2px" }}>FINAL BID</div>
              <div style={{ color: item.highest_bid > 0 ? "#34d399" : "#6b7280", fontWeight: "700", fontSize: "14px" }}>{item.highest_bid > 0 ? `${item.highest_bid} PTS` : "—"}</div>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ background: item.highest_bid > 0 ? "#065f4633" : "#37415133", color: item.highest_bid > 0 ? "#34d399" : "#9ca3af", border: `1px solid ${item.highest_bid > 0 ? "#34d39944" : "#37415144"}`, padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
                {item.highest_bid > 0 ? "✓ Sold" : "No Bids"}
              </span>
              {can(role, "editAuction") && (
                <button onClick={() => setArchiveModal(item)} style={{ background: "#7f1d1d22", border: "1px solid #f8717133", color: "#f87171", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Archive & Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {archiveModal && (
        <Modal onClose={() => setArchiveModal(null)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>📦 Archive Item</h2>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Remove <strong style={{ color: "#f3f4f6" }}>{archiveModal.name}</strong> from the auction board?</p>
          <p style={{ color: "#6b7280", fontSize: "13px" }}>Winner: <span style={{ color: "#fbbf24" }}>{archiveModal.bidder}</span> with <span style={{ color: "#34d399" }}>{archiveModal.highest_bid} PTS</span></p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setArchiveModal(null)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={() => handleArchiveAndDelete(archiveModal)} style={btnStyle("#7f1d1d", "#fca5a5")}>Archive & Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// ATTENDANCE TAB
// ============================================================
// Requires Supabase table: attendance
//   id (int8 primary key), member_name (text), date (date), present (bool), note (text)
function AttendanceTab({ members, role }) {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "summary"
  const [summaryData, setSummaryData] = useState([]);

  const loadAttendance = async (date) => {
    setLoading(true);
    const { data } = await supabase.from("attendance").select("*").eq("date", date);
    if (data) setRecords(data);
    setLoading(false);
  };

  const loadSummary = async () => {
    const { data } = await supabase.from("attendance").select("*").order("date", { ascending: false });
    if (data) setSummaryData(data);
  };

  useEffect(() => {
    if (viewMode === "daily") loadAttendance(selectedDate);
    else loadSummary();
  }, [selectedDate, viewMode]);

  const getRecord = (memberName) => records.find(r => r.member_name === memberName);

  const toggleAttendance = async (memberName) => {
    if (!can(role, "markAttendance")) return;
    const existing = getRecord(memberName);
    setSaving(s => ({ ...s, [memberName]: true }));
    if (existing) {
      await supabase.from("attendance").update({ present: !existing.present }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert([{ member_name: memberName, date: selectedDate, present: true, note: "" }]);
    }
    await loadAttendance(selectedDate);
    setSaving(s => ({ ...s, [memberName]: false }));
  };

  const openNote = (memberName) => {
    const r = getRecord(memberName);
    setNoteText(r?.note || "");
    setNoteModal(memberName);
  };

  const saveNote = async () => {
    const existing = getRecord(noteModal);
    if (existing) {
      await supabase.from("attendance").update({ note: noteText }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert([{ member_name: noteModal, date: selectedDate, present: false, note: noteText }]);
    }
    await loadAttendance(selectedDate);
    setNoteModal(null);
  };

  // Summary: count present days per member
  const getSummaryForMember = (memberName) => {
    const memberRecords = summaryData.filter(r => r.member_name === memberName);
    const totalDays = [...new Set(summaryData.map(r => r.date))].length;
    const presentDays = memberRecords.filter(r => r.present).length;
    return { presentDays, totalDays };
  };

  const presentCount = records.filter(r => r.present).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h2 style={{ color: "#f3f4f6", margin: 0, fontSize: "18px" }}>📋 Attendance</h2>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0" }}>Track guild member attendance by date</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setViewMode("daily")} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer", background: viewMode === "daily" ? "#3b82f6" : "#1f2937", color: viewMode === "daily" ? "#fff" : "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Daily View</button>
          <button onClick={() => setViewMode("summary")} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer", background: viewMode === "summary" ? "#3b82f6" : "#1f2937", color: viewMode === "summary" ? "#fff" : "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Summary</button>
        </div>
      </div>

      {viewMode === "daily" && (
        <>
          {/* Date picker + stats */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "160px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ background: "#065f4633", color: "#34d399", border: "1px solid #34d39944", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>✓ {presentCount} Present</span>
              <span style={{ background: "#37415133", color: "#9ca3af", border: "1px solid #37415144", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>✗ {members.length - presentCount} Absent</span>
            </div>
          </div>

          {loading ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Loading...</div>
          ) : (
            <div style={{ background: "#0f1320", border: "1px solid #1f2937", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2d3748" }}>
                    {["#", "Character Name", "Class", "Position", "Status", "Note", ...(can(role, "markAttendance") ? ["Action"] : [])].map(h => (
                      <th key={h} style={{ padding: "12px 14px", color: "#9ca3af", fontWeight: "500", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => {
                    const rec = getRecord(m.name);
                    const present = rec?.present || false;
                    const pc = positionColors[m.position] || positionColors.Member;
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid #1f2937", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "10px 14px", color: "#6b7280" }}>{i + 1}</td>
                        <td style={{ padding: "10px 14px", color: "#f3f4f6", fontWeight: "600" }}>{m.name}</td>
                        <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{m.class}</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ background: pc.bg, color: pc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{m.position}</span></td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: present ? "#065f46" : "#1f2937", color: present ? "#34d399" : "#9ca3af", border: `1px solid ${present ? "#34d39944" : "#37415144"}`, padding: "3px 12px", borderRadius: "20px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: present ? "#34d399" : "#6b7280" }}></span>
                            {present ? "Present" : "Absent"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: "12px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec?.note || "—"}</td>
                        {can(role, "markAttendance") && (
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => toggleAttendance(m.name)} disabled={saving[m.name]} style={{ background: present ? "#7f1d1d22" : "#065f4622", border: `1px solid ${present ? "#f8717133" : "#34d39933"}`, color: present ? "#f87171" : "#34d399", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                                {saving[m.name] ? "..." : present ? "Mark Absent" : "Mark Present"}
                              </button>
                              <button onClick={() => openNote(m.name)} style={{ background: "#1f2937", border: "none", color: "#9ca3af", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>📝</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {viewMode === "summary" && (
        <>
          <div style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "13px" }}>Showing attendance across all recorded dates.</div>
          <div style={{ background: "#0f1320", border: "1px solid #1f2937", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2d3748" }}>
                  {["#", "Character Name", "Class", "Position", "Days Present", "Total Days", "Rate"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: "#9ca3af", fontWeight: "500", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const { presentDays, totalDays } = getSummaryForMember(m.name);
                  const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                  const pc = positionColors[m.position] || positionColors.Member;
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #1f2937", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{i + 1}</td>
                      <td style={{ padding: "10px 14px", color: "#f3f4f6", fontWeight: "600" }}>{m.name}</td>
                      <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{m.class}</td>
                      <td style={{ padding: "10px 14px" }}><span style={{ background: pc.bg, color: pc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>{m.position}</span></td>
                      <td style={{ padding: "10px 14px", color: "#34d399", fontWeight: "700" }}>{presentDays}</td>
                      <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{totalDays}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#374151", borderRadius: "3px", minWidth: "60px" }}>
                            <div style={{ width: `${rate}%`, height: "100%", background: rate >= 80 ? "#34d399" : rate >= 50 ? "#fbbf24" : "#f87171", borderRadius: "3px", transition: "width 0.3s" }}></div>
                          </div>
                          <span style={{ color: rate >= 80 ? "#34d399" : rate >= 50 ? "#fbbf24" : "#f87171", fontWeight: "700", fontSize: "13px", minWidth: "36px" }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {noteModal && (
        <Modal onClose={() => setNoteModal(null)}>
          <h2 style={{ color: "#f3f4f6", marginTop: 0 }}>📝 Note for {noteModal}</h2>
          <label style={labelStyle}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>Note (e.g. reason for absence)</span>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button onClick={() => setNoteModal(null)} style={btnStyle("#374151", "#9ca3af")}>Cancel</button>
            <button onClick={saveNote} style={btnStyle("#1e3a8a", "#a5b4fc")}>Save Note</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function GuildTracker() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const saved = localStorage.getItem("guild_user"); return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState(MEMBERS_DEFAULT);
  const [bosses, setBosses]   = useState(BOSSES_DEFAULT);

  if (!currentUser) return <LoginPage onLogin={(user) => { setCurrentUser(user); localStorage.setItem("guild_user", JSON.stringify(user)); }} />;

  const role = currentUser.role;
  const rc = roleColors[role];

  const tabs = [
    { id: "members",    label: "👥 Members",         count: members.length },
    { id: "attendance", label: "📋 Attendance",       count: null },
    { id: "bosses",     label: "👹 Boss Timer",       count: null },
    { id: "auction",    label: "🏆 Auction House",    count: null },
    { id: "winners",    label: "🥇 Winners",          count: null },
    ...(can(role, "manageUsers") ? [{ id: "users", label: "🔐 Manage Users", count: null }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f3f4f6" }}>
      <div style={{ background: "#0f1320", borderBottom: "1px solid #1f2937", padding: "0 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "8px" }}><img src="https://mbalsusqtkbtoxuawjau.supabase.co/storage/v1/object/public/asset/RAMPAGE%20FOR%20APP.png" alt="Rampage" style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }} /> RAMPAGE TRACKER</h1>
              <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: "13px" }}>Attendance · Unique Boss  · Bidding</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#f3f4f6", fontWeight: "600", fontSize: "14px" }}>{currentUser.display}</div>
                <span style={{ background: rc.bg, color: rc.text, padding: "2px 10px", borderRadius: "20px", fontSize: "11px" }}>{rc.label}</span>
              </div>
              <button onClick={() => { setCurrentUser(null); localStorage.removeItem("guild_user"); }} style={{ background: "#7f1d1d", border: "1px solid #f8717133", color: "#fca5a5", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Logout</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", marginTop: "12px", flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", background: tab === t.id ? "#1f2937" : "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent", color: tab === t.id ? "#f3f4f6" : "#6b7280", cursor: "pointer", fontSize: "14px", fontWeight: tab === t.id ? "600" : "400", borderRadius: "6px 6px 0 0" }}>
                {t.label} {t.count !== null && <span style={{ background: "#374151", color: "#9ca3af", fontSize: "11px", padding: "1px 7px", borderRadius: "20px", marginLeft: "6px" }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        {tab === "members"    && <MembersTab members={members} setMembers={setMembers} role={role} />}
        {tab === "attendance" && <AttendanceTab members={members} role={role} />}
        {tab === "bosses"     && <BossTimerTab bosses={bosses} setBosses={setBosses} role={role} />}
        {tab === "auction"    && <AuctionTab role={role} currentUser={currentUser} />}
        {tab === "winners"    && <AuctionWinnersTab role={role} />}
        {tab === "users"      && can(role, "manageUsers") && <UsersTab currentUser={currentUser} />}
      </div>
    </div>
  );
}
