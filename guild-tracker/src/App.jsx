import { useState, useEffect } from "react";

const COLORS = {
  bg: "#07080f",
  sidebar: "#0b0d16",
  card: "#0f1220",
  cardBorder: "rgba(255,255,255,0.07)",
  accent: "#5b6af5",
  accentGlow: "rgba(91,106,245,0.25)",
  gold: "#f0b429",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.12)",
  yellow: "#facc15",
  yellowBg: "rgba(250,204,21,0.12)",
  blue: "#60a5fa",
  blueBg: "rgba(96,165,250,0.12)",
  gray: "#6b7280",
  grayBg: "rgba(107,114,128,0.12)",
  text: "#f1f5f9",
  muted: "#64748b",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.12)",
};

const NAV_ITEMS = ["Dashboard","Members","Boss Timers","Attendance","Events","Rankings","Settings"];

const INITIAL_BOSSES = [
  { name: "Cruel Outlaw Gand", seconds: 1274, status: "Respawning", channel: "CH 1" },
  { name: "Gatekeeper Amot", seconds: 2973, status: "Waiting", channel: "CH 2" },
  { name: "Destroyer Hawler", seconds: 0, status: "Alive", channel: "CH 3" },
];

const MEMBERS = [
  { name: "VALIANT", role: "Leader", cls: "Berserker", points: 3200, status: "Active" },
  { name: "xJINN", role: "Elder", cls: "Archer", points: 2400, status: "Active" },
  { name: "CHMB", role: "Elder", cls: "Volva", points: 2100, status: "Offline" },
  { name: "YUJIRO", role: "Member", cls: "Warlord", points: 1800, status: "Active" },
  { name: "KROSS", role: "Member", cls: "Ranger", points: 1540, status: "Active" },
  { name: "SILV", role: "Member", cls: "Mage", points: 980, status: "Offline" },
];

function fmt(s) {
  if (s <= 0) return "LIVE";
  const h = Math.floor(s / 3600).toString().padStart(2,"0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2,"0");
  const sec = (s % 60).toString().padStart(2,"0");
  return `${h}:${m}:${sec}`;
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.04em",
      color,
      background: bg,
      display: "inline-block",
    }}>{label}</span>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 20,
      padding: "24px 22px",
      flex: "1 1 160px",
      minWidth: 140,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80,
        borderRadius: "50%",
        background: COLORS.accentGlow,
        filter: "blur(24px)",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <span style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function BossCard({ boss }) {
  const isAlive = boss.status === "Alive";
  const isRespawning = boss.status === "Respawning";
  const statusColor = isAlive ? COLORS.green : isRespawning ? COLORS.yellow : COLORS.blue;
  const statusBg = isAlive ? COLORS.greenBg : isRespawning ? COLORS.yellowBg : COLORS.blueBg;

  return (
    <div style={{
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 16,
      padding: "16px 18px",
      background: "rgba(0,0,0,0.25)",
      position: "relative",
      overflow: "hidden",
    }}>
      {isAlive && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(34,197,94,0.04)",
          borderRadius: 16,
          boxShadow: "inset 0 0 0 1px rgba(34,197,94,0.2)",
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{boss.name}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{boss.channel}</div>
        </div>
        <Badge label={boss.status} color={statusColor} bg={statusBg} />
      </div>
      <div style={{
        fontSize: isAlive ? 28 : 26,
        fontWeight: 900,
        letterSpacing: "0.08em",
        color: isAlive ? COLORS.green : COLORS.text,
        fontVariantNumeric: "tabular-nums",
      }}>
        {fmt(boss.seconds)}
      </div>
    </div>
  );
}

export default function RampageDashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const [search, setSearch] = useState("");
  const [bosses, setBosses] = useState(INITIAL_BOSSES);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBosses(prev => prev.map(b => ({
        ...b,
        seconds: b.seconds > 0 ? b.seconds - 1 : 0,
        status: b.seconds === 1 ? "Alive" : b.status,
      })));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cls.toLowerCase().includes(search.toLowerCase())
  );

  const sidebarStyle = {
    width: 256,
    minWidth: 256,
    background: COLORS.sidebar,
    borderRight: `1px solid ${COLORS.cardBorder}`,
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      position: "relative",
    }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        ...sidebarStyle,
        position: window.innerWidth < 900 ? "fixed" : "sticky",
        top: 0,
        height: "100vh",
        zIndex: window.innerWidth < 900 ? 50 : 1,
        transform: window.innerWidth < 900 && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s ease",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #f0b429, #5b6af5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 4px 20px rgba(91,106,245,0.4)",
          }}>⚔️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "0.06em" }}>RAMPAGE</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Guild Tracker</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item}
              onClick={() => { setActiveNav(i); setSidebarOpen(false); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "11px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                marginBottom: 4,
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.15s",
                background: i === activeNav
                  ? "linear-gradient(90deg, rgba(91,106,245,0.3), rgba(139,92,246,0.2))"
                  : "transparent",
                color: i === activeNav ? COLORS.text : COLORS.muted,
                boxShadow: i === activeNav ? `inset 0 0 0 1px rgba(91,106,245,0.35)` : "none",
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div style={{
          marginTop: 24,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: "14px 16px",
        }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Logged in as</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>VALIANT</div>
          <div style={{ fontSize: 12, color: COLORS.gold, marginTop: 2, fontWeight: 600 }}>Guild Leader</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 28px", overflowX: "hidden", minWidth: 0 }}>

        {/* Mobile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: window.innerWidth >= 900 ? "none" : "flex",
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              color: COLORS.text,
              fontSize: 18,
            }}
          >☰</button>
        </div>

        {/* Page header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.01em" }}>Guild Dashboard</h2>
            <p style={{ margin: "6px 0 0", color: COLORS.muted, fontSize: 14 }}>Manage your members, events, and boss timers.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: COLORS.accent, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(91,106,245,0.4)",
              transition: "all 0.15s",
            }}>+ Add Member</button>
            <button style={{
              padding: "10px 20px", borderRadius: 12,
              border: `1px solid ${COLORS.cardBorder}`,
              background: "transparent", color: COLORS.muted,
              fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Export Data</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <StatCard icon="👥" value={54} label="Total Members" />
          <StatCard icon="⚔️" value={8} label="Bosses Active" />
          <StatCard icon="📅" value="92%" label="Attendance" />
          <StatCard icon="🏆" value="14.2K" label="Guild Points" />
        </div>

        {/* Main grid: Members + Boss Timers */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* Members table */}
          <div style={{
            flex: "2 1 520px",
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 20,
            overflow: "hidden",
            minWidth: 0,
          }}>
            <div style={{
              padding: "20px 22px",
              borderBottom: `1px solid ${COLORS.cardBorder}`,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Guild Members</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>Active guild roster and contribution tracking.</div>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search member..."
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  color: COLORS.text,
                  fontSize: 13,
                  outline: "none",
                  width: 180,
                }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Member","Class","Role","Points","Status"].map(h => (
                      <th key={h} style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.muted,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.name} style={{
                      borderTop: `1px solid ${COLORS.cardBorder}`,
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 14 }}>{m.name}</td>
                      <td style={{ padding: "13px 16px", color: "#94a3b8", fontSize: 14 }}>{m.cls}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <Badge
                          label={m.role}
                          color={m.role === "Leader" ? COLORS.gold : m.role === "Elder" ? COLORS.blue : COLORS.gray}
                          bg={m.role === "Leader" ? "rgba(240,180,41,0.15)" : m.role === "Elder" ? COLORS.blueBg : COLORS.grayBg}
                        />
                      </td>
                      <td style={{ padding: "13px 16px", color: COLORS.gold, fontWeight: 800, fontSize: 15 }}>
                        {m.points.toLocaleString()}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <Badge
                          label={m.status}
                          color={m.status === "Active" ? COLORS.green : COLORS.gray}
                          bg={m.status === "Active" ? COLORS.greenBg : COLORS.grayBg}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boss timers */}
          <div style={{
            flex: "1 1 260px",
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 20,
            padding: "20px 22px",
            minWidth: 240,
          }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Boss Timers</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 20 }}>Live tracking and respawn monitoring.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {bosses.map(b => <BossCard key={b.name} boss={b} />)}
            </div>

            <button style={{
              width: "100%",
              marginTop: 18,
              padding: "11px",
              borderRadius: 12,
              border: `1px dashed rgba(91,106,245,0.4)`,
              background: "rgba(91,106,245,0.06)",
              color: COLORS.accent,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}>+ Add Boss Timer</button>
          </div>

        </div>
      </main>
    </div>
  );
}
