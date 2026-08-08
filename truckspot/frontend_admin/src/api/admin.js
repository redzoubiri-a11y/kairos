import client, { cleanParams } from './client';

/**
 * @typedef {{ items: any[], total: number, page: number, limit: number, pages: number }} Paginated
 */

/**
 * @returns {Promise<{
 *   users: { total: number, clients: number, transporters: number },
 *   transporters: { pending: number, verified: number },
 *   trucks: { total: number, available: number },
 *   trips: { total: number, active: number },
 *   missions: { total: number, byStatus: Record<string, number>, completionRate: number }
 * }>}
 */
export async function getStats() {
  const { data } = await client.get('/admin/stats');
  return data;
}

/**
 * @param {{ status?: 'PENDING'|'VERIFIED'|'REJECTED', search?: string, page?: number, limit?: number }} filters
 * @returns {Promise<Paginated>}
 */
export async function listTransporters({ status, search, page = 1, limit = 20 } = {}) {
  const { data } = await client.get('/admin/transporters', {
    params: cleanParams({ status, search, page, limit }),
  });
  return data;
}

/**
 * The API exposes no `GET /admin/transporters/:id`, so the detail view resolves
 * a profile by walking the paginated list. Pages are requested at the maximum
 * server-allowed size to keep this to a single round-trip in practice.
 *
 * @param {string} id
 */
export async function getTransporter(id) {
  const limit = 100;
  let page = 1;
  let pages = 1;

  do {
    const data = await listTransporters({ page, limit });
    const found = data.items.find((item) => item.id === id);
    if (found) return found;
    pages = data.pages;
    page += 1;
  } while (page <= pages);

  const error = new Error('Transporteur introuvable.');
  error.status = 404;
  throw error;
}

/**
 * @param {{ transporterId: string, status: 'VERIFIED'|'REJECTED'|'PENDING', reason?: string }} payload
 */
export async function verifyTransporter({ transporterId, status, reason }) {
  const body = { transporterId, status };
  if (status === 'REJECTED') {
    body.reason = reason;
  }
  const { data } = await client.patch('/admin/verify-transporter', body);
  return data;
}

/**
 * @param {{ status?: string, originCity?: string, destinationCity?: string, page?: number, limit?: number }} filters
 * @returns {Promise<Paginated>}
 */
export async function listTrips({
  status,
  originCity,
  destinationCity,
  page = 1,
  limit = 20,
} = {}) {
  const { data } = await client.get('/admin/trips', {
    params: cleanParams({ status, originCity, destinationCity, page, limit }),
  });
  return data;
}

/**
 * @param {{ status?: string, page?: number, limit?: number }} filters
 * @returns {Promise<Paginated>}
 */
export async function listMissions({ status, page = 1, limit = 20 } = {}) {
  const { data } = await client.get('/admin/missions', {
    params: cleanParams({ status, page, limit }),
  });
  return data;
}

/**
 * @param {{ role?: 'CLIENT'|'TRANSPORTER'|'ADMIN', search?: string, page?: number, limit?: number }} filters
 * @returns {Promise<Paginated>}
 */
export async function listUsers({ role, search, page = 1, limit = 20 } = {}) {
  const { data } = await client.get('/admin/users', {
    params: cleanParams({ role, search, page, limit }),
  });
  return data;
}

/**
 * Responds with a partial user ({ id, email, fullName, role, isActive }) —
 * merge it into the existing row instead of replacing it.
 *
 * @param {string} id
 * @param {boolean} isActive
 */
export async function setUserActive(id, isActive) {
  const { data } = await client.patch(`/admin/users/${id}/active`, { isActive });
  return data;
}
