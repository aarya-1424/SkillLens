/**
 * services/api.js — the single API layer for the frontend.
 *
 * Pages import { get, post, put, del } and never call axios directly.
 * Every request carries the Supabase access token; the FastAPI backend
 * verifies it. Errors are normalised to ApiError { status, detail }.
 */
import axios from 'axios';
import { getSession } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(status, detail, data) {
    super(typeof detail === 'string' ? detail : 'Request failed');
    this.status = status;
    this.detail = detail;
    this.data = data;
  }
}

const client = axios.create({ baseURL: BASE_URL, timeout: 20_000 });

client.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

async function request(method, url, data, config) {
  try {
    const res = await client.request({ method, url, data, ...config });
    return res.data;
  } catch (err) {
    const status = err.response?.status ?? 0;
    const detail = err.response?.data?.detail ?? (status ? err.message : 'Could not reach the server');
    throw new ApiError(status, detail, err.response?.data);
  }
}

export const get = (url, config) => request('get', url, undefined, config);
export const post = (url, data, config) => request('post', url, data, config);
export const put = (url, data, config) => request('put', url, data, config);
export const del = (url, config) => request('delete', url, undefined, config);
