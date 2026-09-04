import { useState } from "react";
import { Download } from "lucide-react";
import type { NavigationHistoryFilters } from "./api";

const HistoryExport = ({ filters }: { filters: Omit<NavigationHistoryFilters, "page" | "pageSize"> }) => {
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exportHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.localIp) params.set("local_ip", filters.localIp);
      if (filters.domain) params.set("domain", filters.domain);
      if (filters.dateFrom) params.set("date_from", filters.dateFrom);
      if (filters.dateTo) params.set("date_to", filters.dateTo);
      if (filters.timeFrom) params.set("time_from", filters.timeFrom);
      if (filters.timeTo) params.set("time_to", filters.timeTo);
      if (filters.search) params.set("search", filters.search);

      const response = await fetch(`/api/v1/navigation-history/export/${format}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(response.status === 413 ? "L’export dépasse la limite de 100 000 lignes." : "Impossible de générer le fichier d’export.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `historique_navigation.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de générer le fichier d’export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-export">
      <select value={format} onChange={(event) => setFormat(event.target.value as "csv" | "xlsx")} aria-label="Format d’export">
        <option value="xlsx">Excel (.xlsx)</option>
        <option value="csv">CSV (.csv)</option>
      </select>
      <button type="button" className="export-button" onClick={() => void exportHistory()} disabled={loading}>
        <Download size={15} /> {loading ? "Export en cours..." : "Exporter"}
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
};

export default HistoryExport;
