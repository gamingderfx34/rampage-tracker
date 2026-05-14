export default function RampageDashboard() {
  const stats = [
    { label: 'Total Members', value: 54, icon: '👥' },
    { label: 'Bosses Active', value: 8, icon: '⚔️' },
    { label: 'Attendance', value: '92%', icon: '📅' },
    { label: 'Guild Points', value: '14.2K', icon: '🏆' },
  ];

  const members = [
    {
      name: 'VALIANT',
      role: 'Leader',
      class: 'Berserker',
      points: 3200,
      status: 'Active',
    },
    {
      name: 'xJINN',
      role: 'Elder',
      class: 'Archer',
      points: 2400,
      status: 'Active',
    },
    {
      name: 'CHMB',
      role: 'Elder',
      class: 'Volva',
      points: 2100,
      status: 'Offline',
    },
    {
      name: 'YUJIRO',
      role: 'Member',
      class: 'Warlord',
      points: 1800,
      status: 'Active',
    },
  ];

  const bosses = [
    {
      name: 'Cruel Outlaw Gand',
      timer: '00:21:14',
      status: 'Respawning',
      channel: 'CH 1',
    },
    {
      name: 'Gatekeeper Amot',
      timer: '00:49:33',
      status: 'Waiting',
      channel: 'CH 2',
    },
    {
      name: 'Destroyer Hawler',
      timer: 'LIVE',
      status: 'Alive',
      channel: 'CH 3',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0d1019] border-r border-white/10 p-6 hidden lg:flex flex-col">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-blue-500 flex items-center justify-center text-xl font-bold shadow-lg">
              ⚔️
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide">RAMPAGE</h1>
              <p className="text-xs text-gray-400">Guild Tracker</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              'Dashboard',
              'Members',
              'Boss Timers',
              'Attendance',
              'Events',
              'Rankings',
              'Settings',
            ].map((item, i) => (
              <button
                key={item}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                  i === 0
                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border border-white/10 rounded-2xl p-4 bg-white/5">
          <p className="text-sm text-gray-400 mb-1">Logged in as</p>
          <h3 className="font-bold text-lg">VALIANT</h3>
          <p className="text-yellow-400 text-sm">Guild Leader</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black">Guild Dashboard</h2>
            <p className="text-gray-400 mt-1">
              Manage your members, events, and boss timers.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all font-semibold shadow-lg shadow-blue-500/20">
              + Add Member
            </button>
            <button className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
              Export Data
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#10131d] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{stat.icon}</span>
                <span className="text-xs uppercase tracking-widest text-gray-500">
                  Live
                </span>
              </div>

              <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Members */}
          <div className="xl:col-span-2 bg-[#10131d] border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Guild Members</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Active guild roster and contribution tracking.
                </p>
              </div>

              <input
                placeholder="Search member..."
                className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-4">Member</th>
                    <th className="text-left p-4">Class</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Points</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.name}
                      className="border-t border-white/5 hover:bg-white/5 transition-all"
                    >
                      <td className="p-4 font-semibold">{member.name}</td>
                      <td className="p-4 text-gray-300">{member.class}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            member.role === 'Leader'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : member.role === 'Elder'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-yellow-400 font-bold">
                        {member.points}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            member.status === 'Active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boss Timers */}
          <div className="bg-[#10131d] border border-white/10 rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold">Boss Timers</h3>
              <p className="text-gray-400 text-sm mt-1">
                Live tracking and respawn monitoring.
              </p>
            </div>

            <div className="space-y-4">
              {bosses.map((boss) => (
                <div
                  key={boss.name}
                  className="border border-white/10 rounded-2xl p-4 bg-black/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold">{boss.name}</h4>
                      <p className="text-gray-500 text-sm">{boss.channel}</p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        boss.status === 'Alive'
                          ? 'bg-green-500/20 text-green-400'
                          : boss.status === 'Respawning'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {boss.status}
                    </span>
                  </div>

                  <div className="text-3xl font-black tracking-widest">
                    {boss.timer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
