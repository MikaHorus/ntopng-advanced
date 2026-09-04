import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Search } from "lucide-react";
import { getIpBandwidth, getIpDomains, type BandwidthDevice, type BandwidthDomainStat } from "./api";

const formatBytes = (bytes: number | null) => {
  if (bytes === null) return "Non disponible";
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${units[index]}`;
};

const IpBandwidthDetails = ({ localIp, onBack }: { localIp: string; onBack: () => void }) => {
  const [device, setDevice] = useState<BandwidthDevice | null>(null);
  const [domains, setDomains] = useState<BandwidthDomainStat[]>([]);
  const [filters, setFilters] = useState({ domain: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" });
  const [sortBy, setSortBy] = useState("total");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getIpBandwidth(localIp),
      getIpDomains(localIp, { page: 1, pageSize: 100, ...filters, sortBy }),
    ])
      .then(([deviceData, domainData]) => {
        if (!cancelled) {
          setDevice(deviceData);
          setDomains(domainData.items);
        }
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Impossible de charger l’analyse IP."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [localIp, filters, sortBy]);

  const reset = () => setFilters({ domain: "", dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" });
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return <section className="page-stack">
    <button type="button" className="back-button" onClick={onBack}>← Retour à la consommation</button>
    {error ? <div className="panel"><div className="empty-state">{error}</div></div> : loading || !device ? <div className="panel"><div className="empty-state">Chargement de l’analyse IP...</div></div> : <>
      <section className="panel page-panel">
        <span className="eyebrow">ANALYSE PAR ADRESSE IP</span>
        <h2>{localIp}</h2>
        <div className="device-meta"><span>{device.hostname ?? "Appareil inconnu"}</span><span className="mono">{device.mac_address ?? "MAC non disponible"}</span><span>Dernière activité : {device.last_seen ? new Date(device.last_seen).toLocaleString("fr-FR") : "-"}</span></div>
        <div className="metric-grid detail-metrics">
          <Metric icon={<ArrowUpFromLine />} label="Upload" value={formatBytes(device.upload_bytes)} accent="orange" />
          <Metric icon={<ArrowDownToLine />} label="Download" value={formatBytes(device.download_bytes)} accent="green" />
          <Metric icon={<ArrowDownToLine />} label="Total" value={formatBytes(device.total_bytes)} accent="teal" />
        </div>
      </section>
      <section className="panel page-panel">
        <div className="panel-heading"><div><span className="eyebrow">POSTGRESQL + NTOPNG</span><h2>Activité réseau par domaine</h2></div><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Trier les domaines"><option value="total">Total</option><option value="download">Download</option><option value="upload">Upload</option><option value="visits">Visites</option><option value="last_activity">Dernière activité</option></select></div>
        <div className="history-filter-panel ip-filter-panel">
          <label>Domaine<input value={filters.domain} onChange={(event) => setFilter("domain", event.target.value)} placeholder="google.com" /></label>
          <label>Date début<input type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} /></label>
          <label>Date fin<input type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} /></label>
          <label>Heure début<input type="time" value={filters.timeFrom} onChange={(event) => setFilter("timeFrom", event.target.value)} /></label>
          <label>Heure fin<input type="time" value={filters.timeTo} onChange={(event) => setFilter("timeTo", event.target.value)} /></label>
          <button type="button" className="reset-button" onClick={reset}>Réinitialiser</button>
        </div>
        {domains.length === 0 ? <div className="empty-state">Aucun domaine associé à cette IP.</div> : <div className="table-scroll"><table><thead><tr><th>Domaine</th><th>Upload</th><th>Download</th><th>Total</th><th>Visites</th><th>Dernière activité</th></tr></thead><tbody>{domains.map((item) => <tr key={item.domain}><td className="mono">{item.domain}</td><td>{formatBytes(item.upload_bytes)}</td><td>{formatBytes(item.download_bytes)}</td><td>{formatBytes(item.total_bytes)}</td><td>{item.visit_count}</td><td>{item.last_activity ? new Date(item.last_activity).toLocaleString("fr-FR") : "-"}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="panel page-panel"><div className="panel-heading"><div><span className="eyebrow">TOP 10</span><h2>Principaux domaines</h2></div><Search size={18} className="muted-icon" /></div><div className="domain-bars">{domains.slice(0, 10).map((item) => <div className="domain-bar" key={item.domain}><span>{item.domain}</span><strong>{formatBytes(item.total_bytes)}</strong><i style={{ width: `${Math.max(4, Math.min(100, (item.total_bytes ?? 0) / Math.max(1, domains[0]?.total_bytes ?? 1) * 100))}%` }} /></div>)}</div></section>
    </>}
  </section>;
};

const Metric = ({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) => <div className={`metric-card ${accent}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;

export default IpBandwidthDetails;
