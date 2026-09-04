import { useEffect, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Search } from "lucide-react";
import { getBandwidthDevices, getBandwidthDevice, getDestinations, getTopDomains, type BandwidthDevice, type BandwidthDestinationStat, type BandwidthDomainStat } from "./api";

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${units[index]}`;
};

const BandwidthConsumption = ({ onSelect }: { onSelect: (localIp: string) => void }) => {
  const [devices, setDevices] = useState<BandwidthDevice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBandwidthDevices({ page, pageSize: 50, search: search.trim() || undefined, sortBy })
      .then((response) => { if (!cancelled) { setDevices(response.items); setTotalPages(response.total_pages); setTotal(response.total); } })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Impossible de charger la consommation."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, sortBy]);

  return <section className="panel page-panel">
    <div className="panel-heading page-header">
      <div><span className="eyebrow">NTOPNG · DONNÉES LIVE</span><h2>Consommation de bande passante</h2><span className="panel-subtitle">Upload et download observés sur les hosts actifs</span></div>
      <div className="bandwidth-controls">
        <label className="history-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un appareil" aria-label="Rechercher un appareil" /></label>
        <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} aria-label="Trier par"><option value="total">Total</option><option value="download">Download</option><option value="upload">Upload</option><option value="hostname">Nom</option><option value="ip">Adresse IP</option></select>
      </div>
    </div>
    {error ? <div className="empty-state">{error}</div> : loading ? <div className="empty-state">Chargement de la consommation...</div> : devices.length === 0 ? <div className="empty-state">Aucun appareil local détecté.</div> : <><div className="table-scroll"><table><thead><tr><th>Appareil</th><th>Adresse IP</th><th>Adresse MAC</th><th>Upload</th><th>Download</th><th>Total</th><th>Dernière activité</th><th /></tr></thead><tbody>{devices.map((device) => <tr key={device.id} className="clickable-row" onClick={() => device.local_ip && onSelect(device.local_ip)}><td>{device.hostname ?? "Inconnu"}</td><td className="mono"><button type="button" className="ip-link" onClick={(event) => { event.stopPropagation(); if (device.local_ip) onSelect(device.local_ip); }}>{device.local_ip ?? "-"}</button></td><td className="mono">{device.mac_address ?? "Non disponible"}</td><td>{formatBytes(device.upload_bytes)}</td><td>{formatBytes(device.download_bytes)}</td><td><strong>{formatBytes(device.total_bytes)}</strong></td><td>{device.last_seen ? new Date(device.last_seen).toLocaleString("fr-FR") : "-"}</td><td><ChevronRight size={16} /></td></tr>)}</tbody></table></div><div className="bandwidth-pagination"><span>{total} appareil(s)</span><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Précédente</button><strong>Page {page} / {totalPages}</strong><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Suivante</button></div></>}
  </section>;
};

export const DeviceBandwidthDetails = ({ deviceId, onBack }: { deviceId: string; onBack: () => void }) => {
  const [device, setDevice] = useState<BandwidthDevice | null>(null);
  const [domains, setDomains] = useState<BandwidthDomainStat[]>([]);
  const [destinations, setDestinations] = useState<BandwidthDestinationStat[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getBandwidthDevice(deviceId), getTopDomains(deviceId), getDestinations(deviceId)])
      .then(([detail, topDomains, topDestinations]) => { setDevice(detail.device); setDomains(topDomains); setDestinations(topDestinations); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Impossible de charger le détail."));
  }, [deviceId]);
  if (error) return <section className="panel page-panel"><div className="empty-state">{error}</div></section>;
  if (!device) return <section className="panel page-panel"><div className="empty-state">Chargement du détail...</div></section>;
  return <section className="page-stack"><button type="button" className="back-button" onClick={onBack}>← Retour à la consommation</button><section className="panel page-panel"><span className="eyebrow">ANALYSE APPAREIL</span><h2>{device.hostname ?? "Appareil inconnu"}</h2><div className="device-meta"><span className="mono">{device.local_ip ?? "-"}</span><span className="mono">{device.mac_address ?? "MAC non disponible"}</span></div><div className="metric-grid detail-metrics"><Metric icon={<ArrowUpFromLine />} label="Upload" value={formatBytes(device.upload_bytes)} accent="orange" /><Metric icon={<ArrowDownToLine />} label="Download" value={formatBytes(device.download_bytes)} accent="green" /><Metric icon={<ChevronRight />} label="Total" value={formatBytes(device.total_bytes)} accent="teal" /></div></section><section className="detail-columns"><StatTable title="Domaines les plus visités" headers={["Domaine", "Visites"]} rows={domains.map((item) => [item.domain, String(item.visit_count)])} /><StatTable title="Principales destinations réseau" headers={["Destination", "IP distante", "Total"]} rows={destinations.map((item) => [item.destination ?? "Inconnu", item.remote_ip ?? "-", formatBytes(item.total_bytes)])} /></section><p className="data-note">L’évolution historique de la consommation sera disponible lorsque ntopng fournira une rétention temporelle exploitable.</p></section>;
};

const Metric = ({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) => <div className={`metric-card ${accent}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
const StatTable = ({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) => <div className="panel"><h2>{title}</h2>{rows.length === 0 ? <div className="empty-state">Aucune donnée disponible.</div> : <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, cellIndex) => <td key={cellIndex} className={cellIndex > 0 ? "mono" : ""}>{value}</td>)}</tr>)}</tbody></table></div>}</div>;

export default BandwidthConsumption;