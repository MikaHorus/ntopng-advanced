import { useEffect, useState } from "react";
import { getFlows, getInterfaces, type InterfaceSummary, type PaginatedResponse } from "./api";

const Domains = () => {
  const [interfaces, setInterfaces] = useState<InterfaceSummary[]>([]);
  const [selectedInterface, setSelectedInterface] = useState(0);
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const interfacesResponse = await getInterfaces();
        const firstInterface = interfacesResponse.items[0]?.interface_id ?? 0;
        setInterfaces(interfacesResponse.items);
        setSelectedInterface(firstInterface);
        const response = await getFlows(firstInterface);
        setData(response);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const refresh = async (interfaceId: number) => {
    setLoading(true);
    setError("");
    try {
      const response = await getFlows(interfaceId);
      setData(response);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const uniqueDomains = Array.from(
    new Set(
      (data?.items ?? [])
        .map((row) => String(row.domain ?? (row.server as { name?: string } | undefined)?.name ?? ""))
        .filter(Boolean),
    ),
  );

  return (
    <section className="panel page-panel">
      <div className="panel-heading page-header">
        <div>
          <span className="eyebrow">DÉTECTION DNS</span>
          <h2>Domaines</h2>
        </div>
        <label className="interface-select compact">
          Interface
          <select
            value={selectedInterface}
            onChange={(event) => {
              const id = Number(event.target.value);
              setSelectedInterface(id);
              void refresh(id);
            }}
          >
            {interfaces.map((item) => (
              <option key={item.interface_id} value={item.interface_id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      {loading ? (
        <div className="empty-state">Chargement des domaines...</div>
      ) : uniqueDomains.length === 0 ? (
        <div className="empty-state">Aucun domaine détecté pour cette interface.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Domaine</th>
                <th>Flux associés</th>
              </tr>
            </thead>
            <tbody>
              {uniqueDomains.map((domain) => (
                <tr key={domain}>
                  <td className="mono">{domain}</td>
                  <td>{(data?.items ?? []).filter((row) => String(row.domain ?? (row.server as { name?: string } | undefined)?.name ?? "") === domain).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Domains;
