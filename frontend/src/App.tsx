import { Globe2, Menu, MonitorSmartphone, Network, Waypoints, CircleGauge, Database, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";

import ActiveFlows from "./ActiveFlows";
import BandwidthConsumption, { DeviceBandwidthDetails } from "./BandwidthConsumption";
import IpBandwidthDetails from "./IpBandwidthDetails";
import Dashboard from "./Dashboard";
import Domains from "./Domains";
import Machines from "./Machines";
import NavigationHistory from "./NavigationHistory";

type View = "dashboard" | "history" | "machines" | "active-flows" | "domains" | "bandwidth-consumption";

const navItems: Array<{ key: View; label: string; icon: typeof CircleGauge }> = [
  { key: "dashboard", label: "Dashboard", icon: CircleGauge },
  { key: "history", label: "Historique", icon: Database },
  { key: "machines", label: "Machines", icon: MonitorSmartphone },
  { key: "active-flows", label: "Flows actifs", icon: Waypoints },
  { key: "domains", label: "Domaines", icon: Globe2 },
  { key: "bandwidth-consumption", label: "Consommation", icon: Waypoints },
];

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Network size={20} /></div>
          <div><strong>ntopng</strong><span>ADVANCED</span></div>
        </div>
        <div className="side-label">Surveillance</div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <NavLink
              key={key}
              to={key === "dashboard" ? "/dashboard" : `/${key}`}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={16} /> Source : ntopng
          <small>Lecture seule · Données live</small>
        </div>
      </aside>

      <main className="main-content">
        <div className="mobile-topbar">
          <button type="button" className="mobile-menu-button" onClick={() => setMobileMenuOpen((open) => !open)}>
            <Menu size={18} />
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<NavigationHistory />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/active-flows" element={<ActiveFlows />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/bandwidth-consumption" element={<BandwidthPage />} />
          <Route path="/bandwidth-consumption/:deviceId" element={<BandwidthDevicePage />} />
          <Route path="/bandwidth-consumption/ip/:localIp" element={<IpBandwidthPage />} />
        </Routes>
        <footer className="page-footer">Ntopng Advanced <span>•</span> données fournies par l’instance ntopng configurée</footer>
      </main>
    </div>
  );
};

const BandwidthPage = () => {
  const navigate = useNavigate();
  return <BandwidthConsumption onSelect={(localIp) => navigate(`/bandwidth-consumption/ip/${encodeURIComponent(localIp)}`)} />;
};

const IpBandwidthPage = () => {
  const navigate = useNavigate();
  const { localIp } = useParams();
  return <IpBandwidthDetails localIp={decodeURIComponent(localIp ?? "")} onBack={() => navigate("/bandwidth-consumption")} />;
};

const BandwidthDevicePage = () => {
  const navigate = useNavigate();
  const { deviceId } = useParams();
  return <DeviceBandwidthDetails deviceId={decodeURIComponent(deviceId ?? "")} onBack={() => navigate("/bandwidth-consumption")} />;
};

export default App;