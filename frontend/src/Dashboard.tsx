import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  CircleGauge,
  Database,
  Globe2,
  MonitorSmartphone,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import {
  getFlows,
  getHosts,
  getInterfaceData,
  getInterfaces,
  type InterfaceSummary,
  type PaginatedResponse,
} from "./api";

type InterfaceData = Record<string, unknown>;

const numberValue = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString("fr-FR") : "—";

const Dashboard = () => {
  const [interfaces, setInterfaces] = useState<InterfaceSummary[]>([]);
  const [selectedInterface, setSelectedInterface] = useState(0);
  const [interfaceData, setInterfaceData] = useState<InterfaceData>({});
  const [hosts, setHosts] = useState<PaginatedResponse | null>(null);
  const [flows, setFlows] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async (interfaceId: number) => {
    setLoading(true);
    setError("");
    try {
      const [data, hostData, flowData] = await Promise.all([
        getInterfaceData(interfaceId),
        getHosts(interfaceId),
        getFlows(interfaceId),
      ]);
      setInterfaceData(data.data ?? {});
      setHosts(hostData);
      setFlows(flowData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    try {
      const response = await getInterfaces();
      setInterfaces(response.items);
      const interfaceId = response.items[0]?.interface_id ?? 0;
      setSelectedInterface(interfaceId);
      await loadDashboard(interfaceId);
    } catch (cause) {
      setLoading(false);
      setError(cause instanceof Error ? cause.message : "Connexion impossible");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const bytesUpload = numberValue(interfaceData.bytes_upload);
  const bytesDownload = numberValue(interfaceData.bytes_download);
  const domainRows = (flows?.items ?? [])
    .map((row) => String(row.domain ?? (row.server as { name?: string } | undefined)?.name ?? ""))
    .filter(Boolean)
    .map((domain) => ({ domain }));

  return (
    <div className="page-stack">
      <header className="topbar">
        <div>
          <span className="eyebrow">CENTRE DE CONTRÔLE</span>
          <h1>Vue réseau</h1>
        </div>
        <div className="top-actions">
          <label className="interface-select">
            Interface
            <select
              value={selectedInterface}
              onChange={(event) => {
                const id = Number(event.target.value);
                setSelectedInterface(id);
                void loadDashboard(id);
              }}
            >
              {interfaces.map((item) => (
                <option key={item.interface_id} value={item.interface_id}>
                  {item.name} · ifid {item.interface_id}
                </option>
              ))}
            </select>
          </label>
          <button className="icon-button" title="Actualiser" onClick={() => void load()}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      <section className="status-strip">
        <div className="live-status">
          <span className="pulse" /> Connexion ntopng opérationnelle
        </div>
        <span>
          Actualisé à l’ouverture · interface {interfaces.find((item) => item.interface_id === selectedInterface)?.name ?? "—"}
        </span>
      </section>

      {error && (
        <div className="error-banner">
          <Database size={18} /> {error}
          <button onClick={() => void load()}>Réessayer</button>
        </div>
      )}

      <section className="metric-grid">
        <Metric icon={<MonitorSmartphone />} label="Machines actives" value={hosts?.total ?? hosts?.items.length ?? "—"} accent="blue" />
        <Metric icon={<Waypoints />} label="Flows actifs" value={flows?.total ?? flows?.items.length ?? "—"} accent="teal" />
        <Metric icon={<ArrowUpFromLine />} label="Upload" value={bytesUpload} accent="orange" />
        <Metric icon={<ArrowDownToLine />} label="Download" value={bytesDownload} accent="green" />
      </section>

      <section className="content-grid">
        <div className="panel traffic-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CAPTURE EN DIRECT</span>
              <h2>État de l’interface</h2>
            </div>
            <span className="live-badge">
              <Activity size={14} /> LIVE
            </span>
          </div>
          <div className="traffic-visual">
            <div className="traffic-line" />
            <div className="traffic-line muted" />
            <div className="traffic-label">
              <strong>
                {numberValue(interfaceData.throughput_bps)} <small>bps</small>
              </strong>
              <span>Débit actuel</span>
            </div>
          </div>
          <div className="traffic-foot">
            <span>
              <i className="dot blue-dot" /> Download <strong>{bytesDownload} octets</strong>
            </span>
            <span>
              <i className="dot orange-dot" /> Upload <strong>{bytesUpload} octets</strong>
            </span>
          </div>
        </div>

        <div className="panel interface-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">POINT DE CAPTURE</span>
              <h2>{interfaces.find((item) => item.interface_id === selectedInterface)?.name ?? "Interface"}</h2>
            </div>
            <Server size={22} className="muted-icon" />
          </div>
          <div className="detail-list">
            <Detail label="Hôtes vus" value={numberValue(interfaceData.num_hosts)} />
            <Detail label="Flows observés" value={numberValue(interfaceData.num_flows)} />
            <Detail label="Paquets" value={numberValue(interfaceData.packets)} />
            <Detail label="Uptime" value={String(interfaceData.uptime ?? "—")} />
          </div>
        </div>
      </section>

      <section className="tables-grid">
        <DataTable id="hosts" title="Machines actives" subtitle="Présences détectées par ntopng" rows={hosts?.items ?? []} type="hosts" />
        <DataTable id="flows" title="Flows actifs" subtitle="Connexions en cours" rows={flows?.items ?? []} type="flows" />
      </section>
      <DataTable id="domains" title="Domaines détectés" subtitle="Domaines présents dans les flows actifs" rows={domainRows} type="domains" />
    </div>
  );
};

const Metric = ({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string | number; accent: string }) => (
  <div className={`metric-card ${accent}`}>
    <div className="metric-icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
    <div className="metric-arrow">↗</div>
  </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="detail-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const DataTable = ({ id, title, subtitle, rows, type }: { id: string; title: string; subtitle: string; rows: Record<string, unknown>[]; type: "hosts" | "flows" | "domains" }) => (
  <div className="panel table-panel" id={id}>
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <span className="panel-subtitle">{subtitle}</span>
      </div>
      <span className="count-badge">{rows.length} affichés</span>
    </div>
    {rows.length === 0 ? (
      <div className="empty-state">Aucune donnée actuellement disponible.</div>
    ) : (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {type === "hosts" ? (
                <>
                  <th>Adresse IP</th>
                  <th>Nom</th>
                  <th>Trafic</th>
                </>
              ) : type === "domains" ? (
                <th>Domaine</th>
              ) : (
                <>
                  <th>Client</th>
                  <th>Serveur</th>
                  <th>Protocole</th>
                  <th>Octets</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) =>
              type === "hosts" ? (
                <tr key={index}>
                  <td className="mono">{String(row.ip ?? "—")}</td>
                  <td>{String(row.name || "Non résolu")}</td>
                  <td>{numberValue((row.bytes as { total?: number } | undefined)?.total)}</td>
                </tr>
              ) : type === "domains" ? (
                <tr key={index}>
                  <td className="mono">{String(row.domain)}</td>
                </tr>
              ) : (
                <tr key={index}>
                  <td className="mono">{String((row.client as { ip?: string } | undefined)?.ip ?? "—")}</td>
                  <td className="mono">{String((row.server as { ip?: string } | undefined)?.ip ?? "—")}</td>
                  <td>
                    <span className="protocol">{String((row.protocol as { l7?: string } | undefined)?.l7 ?? "—")}</span>
                  </td>
                  <td>{numberValue(row.bytes)}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default Dashboard;
