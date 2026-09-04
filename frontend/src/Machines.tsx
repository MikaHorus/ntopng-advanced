import { useEffect, useState } from "react";
import { getHosts, getInterfaces, type InterfaceSummary, type PaginatedResponse } from "./api";

const Machines = () => {
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
        const response = await getHosts(firstInterface);
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
      const response = await getHosts(interfaceId);
      setData(response);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const rows = data?.items ?? [];

  return (
    <section className="panel page-panel">
      <div className="panel-heading page-header">
        <div>
          <span className="eyebrow">RÉSEAU LOCAL</span>
          <h2>Machines</h2>
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
        <div className="empty-state">Chargement des machines...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">Aucune machine détectée.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>IP locale</th>
                <th>Nom d’hôte</th>
                <th>MAC</th>
                <th>Dernière activité</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="mono">{String((row.ip as string | undefined) ?? "—")}</td>
                  <td>{String((row.name as string | undefined) ?? "Non résolu")}</td>
                  <td className="mono">{String((row.mac as string | undefined) ?? "—")}</td>
                  <td>{String((row.last_seen as string | undefined) ?? "—")}</td>
                  <td>{String((row.bytes as { total?: number } | undefined)?.total ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Machines;
