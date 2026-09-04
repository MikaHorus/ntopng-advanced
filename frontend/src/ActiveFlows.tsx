import { useEffect, useState } from "react";
import { getFlows, getInterfaces, type InterfaceSummary, type PaginatedResponse } from "./api";

const ActiveFlows = () => {
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

  const rows = data?.items ?? [];

  return (
    <section className="panel page-panel">
      <div className="panel-heading page-header">
        <div>
          <span className="eyebrow">CAPTURE EN DIRECT</span>
          <h2>Flows actifs</h2>
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
        <div className="empty-state">Chargement des flows...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">Aucun flow actif.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Serveur</th>
                <th>Protocole</th>
                <th>Domaine</th>
                <th>Octets</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="mono">{String((row.client as { ip?: string } | undefined)?.ip ?? "—")}</td>
                  <td className="mono">{String((row.server as { ip?: string } | undefined)?.ip ?? "—")}</td>
                  <td><span className="protocol">{String((row.protocol as { l7?: string } | undefined)?.l7 ?? "—")}</span></td>
                  <td>{String(row.domain ?? "—")}</td>
                  <td>{String(row.bytes ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ActiveFlows;
