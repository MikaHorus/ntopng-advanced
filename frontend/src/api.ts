export type InterfaceSummary = {
  interface_id: number;
  name: string;
};

export type PaginatedResponse = {
  items: Record<string, unknown>[];
  page: number;
  page_size: number;
  total: number | null;
};

export type NavigationHistoryItem = {
  id: number;
  timestamp: string;
  local_ip: string;
  hostname: string | null;
  domain: string;
};

export type NavigationHistoryResponse = {
  items: NavigationHistoryItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type NavigationHistoryFilters = {
  page: number;
  pageSize: number;
  localIp?: string;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  search?: string;
};

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Erreur API HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getInterfaces = () =>
  request<{ items: InterfaceSummary[] }>("/api/v1/ntopng/interfaces");

export const getInterfaceData = (interfaceId: number) =>
  request<{ data: Record<string, unknown> }>(
    `/api/v1/ntopng/interfaces/${interfaceId}`,
  );

export const getHosts = (interfaceId: number) =>
  request<PaginatedResponse>(
    `/api/v1/ntopng/hosts?ifid=${interfaceId}&page=1&page_size=8`,
  );

export const getFlows = (interfaceId: number) =>
  request<PaginatedResponse>(
    `/api/v1/ntopng/flows?ifid=${interfaceId}&page=1&page_size=8`,
  );

export const getNavigationHistory = (options: NavigationHistoryFilters) => {
  const params = new URLSearchParams({
    page: String(options.page),
    page_size: String(options.pageSize),
  });
  if (options.localIp) params.set("local_ip", options.localIp);
  if (options.domain) params.set("domain", options.domain);
  if (options.dateFrom) params.set("date_from", options.dateFrom);
  if (options.dateTo) params.set("date_to", options.dateTo);
  if (options.timeFrom) params.set("time_from", options.timeFrom);
  if (options.timeTo) params.set("time_to", options.timeTo);
  if (options.search) params.set("search", options.search);
  return request<NavigationHistoryResponse>(
    `/api/v1/navigation-history?${params.toString()}`,
  );
};