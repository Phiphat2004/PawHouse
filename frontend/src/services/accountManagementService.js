import { api } from "./api";

const ACCOUNT_MANAGEMENT_BASE = "/admin/account-management";

export const getAccounts = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.role && params.role !== "all")
    queryParams.append("role", params.role);
  if (params.status && params.status !== "all")
    queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const queryString = queryParams.toString();
  const url = `${ACCOUNT_MANAGEMENT_BASE}/accounts${queryString ? `?${queryString}` : ""}`;

  return api.get(url);
};

export const getAccountDetail = async (accountId) => {
  return api.get(`${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}`);
};

export const assignRole = async (accountId, role) => {
  return api.put(`${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}/role`, {
    role,
  });
};

export const banUnbanAccount = async (accountId, status) => {
  return api.put(`${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}/ban`, {
    status,
  });
};

export const deleteAccount = async (accountId) => {
  return api.delete(`${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}`);
};

export const restoreAccount = async (accountId) => {
  return api.put(
    `${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}/restore`,
    {},
  );
};
