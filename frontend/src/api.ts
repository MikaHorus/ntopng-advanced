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

export type BandwidthDevice = {
  id: string;
  hostname: string | null;
  local_ip: string | null;
  mac_address: string | null;
  upload_bytes: number;
  download_bytes: number;
  total_bytes: number;
  last_seen: string | null;
};

export type BandwidthDeviceList = {
  items: BandwidthDevice[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type BandwidthDeviceDetail = {
  device: BandwidthDevice;
  consumption: Omit<BandwidthDevice, "id" | "hostname" | "local_ip" | "mac_address" | "last_seen">;
};

export type BandwidthDomainStat = {
  domain: string;
  upload_bytes: number | null;
  download_bytes: number | null;
  total_bytes: number | null;
  visit_count: number;
  last_activity: string | null;
};
export type BandwidthDomainList = {
  items: BandwidthDomainStat[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};
export type BandwidthDestinationStat = {
  destination: string | null;
  remote_ip: string | null;
  upload_bytes: number;
  download_bytes: number;
  total_bytes: number;
};

export const getBandwidthDevices = (options: {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  interfaceId?: number;
}) => {
  const params = new URLSearchParams({
    page: String(options.page),
    page_size: String(options.pageSize),
    ifid: String(options.interfaceId ?? 0),
    sort_by: options.sortBy ?? "total",
    sort_order: options.sortOrder ?? "desc",
  });
  if (options.search) params.set("search", options.search);
  return request<BandwidthDeviceList>(`/api/v1/bandwidth/devices?${params.toString()}`);
};

export const getBandwidthDevice = (deviceId: string, interfaceId = 0) =>
  request<BandwidthDeviceDetail>(`/api/v1/bandwidth/devices/${encodeURIComponent(deviceId)}?ifid=${interfaceId}`);

export const getTopDomains = (deviceId: string) =>
  request<BandwidthDomainStat[]>(`/api/v1/bandwidth/devices/${encodeURIComponent(deviceId)}/top-domains`);

export const getDestinations = (deviceId: string, interfaceId = 0) =>
  request<BandwidthDestinationStat[]>(`/api/v1/bandwidth/devices/${encodeURIComponent(deviceId)}/destinations?ifid=${interfaceId}`);

export const getIpBandwidth = (localIp: string, interfaceId = 0) =>
  request<BandwidthDevice>(`/api/v1/bandwidth/ip/${encodeURIComponent(localIp)}?ifid=${interfaceId}`);

export const getIpDomains = (localIp: string, options: {
  page: number;
  pageSize: number;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  interfaceId?: number;
}) => {
  const params = new URLSearchParams({
    page: String(options.page),
    page_size: String(options.pageSize),
    ifid: String(options.interfaceId ?? 0),
    sort_by: options.sortBy ?? "total",
    sort_order: options.sortOrder ?? "desc",
  });
  if (options.domain) params.set("domain", options.domain);
  if (options.dateFrom) params.set("date_from", options.dateFrom);
  if (options.dateTo) params.set("date_to", options.dateTo);
  if (options.timeFrom) params.set("time_from", options.timeFrom);
  if (options.timeTo) params.set("time_to", options.timeTo);
  return request<BandwidthDomainList>(`/api/v1/bandwidth/ip/${encodeURIComponent(localIp)}/domains?${params.toString()}`);
};