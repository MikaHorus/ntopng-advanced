import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { getNavigationHistory, type NavigationHistoryResponse } from "./api";
import HistoryExport from "./HistoryExport";

const emptyFilters = {
  localIp: "",
  domain: "",
  dateFrom: "",
  dateTo: "",
  timeFrom: "",
  timeTo: "",
};

const NavigationHistory = () => {
  const [data, setData] = useState<NavigationHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getNavigationHistory({
      page,
      pageSize,
      search: search.trim() || undefined,
      localIp: filters.localIp.trim() || undefined,
      domain: filters.domain.trim() || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      timeFrom: filters.timeFrom || undefined,
      timeTo: filters.timeTo || undefined,
    })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, filters]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSearch("");
    setPage(1);
  };

  return (
    <section className="panel history-page" id="history">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CONSERVATION POSTGRESQL</span>
          <h2>Historique de navigation</h2>
          <span className="panel-subtitle">Domaines réellement détectés par ntopng</span>
        </div>
        <form className="history-search" onSubmit={submitSearch}>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="IP, hôte ou domaine"
            aria-label="Rechercher"
          />
        </form>
      </div>

      <div className="history-filter-panel">
        <label>
          Adresse IP
          <input
            value={filters.localIp}
            onChange={(event) => setFilters((current) => ({ ...current, localIp: event.target.value }))}
            placeholder="192.168.1.10"
          />
        </label>
        <label>
          Domaine
          <input
            value={filters.domain}
            onChange={(event) => setFilters((current) => ({ ...current, domain: event.target.value }))}
            placeholder="google.com"
          />
        </label>
        <label>
          Date de début
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
          />
        </label>
        <label>
          Date de fin
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
          />
        </label>
        <label>
          Heure de début
          <input
            type="time"
            value={filters.timeFrom}
            onChange={(event) => setFilters((current) => ({ ...current, timeFrom: event.target.value }))}
          />
        </label>
        <label>
          Heure de fin
          <input
            type="time"
            value={filters.timeTo}
            onChange={(event) => setFilters((current) => ({ ...current, timeTo: event.target.value }))}
          />
        </label>
        <button type="button" className="reset-button" onClick={resetFilters}>Réinitialiser</button>
      </div>

      <div className="history-actions">
        <HistoryExport filters={{
          localIp: filters.localIp.trim() || undefined,
          domain: filters.domain.trim() || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          timeFrom: filters.timeFrom || undefined,
          timeTo: filters.timeTo || undefined,
          search: search.trim() || undefined,
        }} />
      </div>

      {error && <div className="empty-state">{error}</div>}
      {loading ? (
        <div className="empty-state">Chargement de l’historique...</div>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">Aucune activité enregistrée.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>IP locale</th>
                <th>Nom d’hôte</th>
                <th>Domaine</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => {
                const date = new Date(item.timestamp);
                return (
                  <tr key={item.id}>
                    <td>{date.toLocaleDateString("fr-FR")}</td>
                    <td className="mono">{date.toLocaleTimeString("fr-FR")}</td>
                    <td className="mono">{item.local_ip}</td>
                    <td>{item.hostname ?? "Non résolu"}</td>
                    <td>{item.domain}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-pagination">
        <span>{data?.total ?? 0} enregistrement(s)</span>
        <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Précédente</button>
        <strong>
          Page {page} / {data?.total_pages ?? 0}
        </strong>
        <button disabled={!data || page >= data.total_pages || loading} onClick={() => setPage((current) => current + 1)}>Suivante</button>
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
          aria-label="Nombre d’éléments par page"
        >
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
          <option value="200">200 / page</option>
        </select>
      </div>
    </section>
  );
};

export default NavigationHistory;