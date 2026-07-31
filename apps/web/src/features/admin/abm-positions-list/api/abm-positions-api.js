import { apiClient } from '@/lib/api-client';
/** List ABM positions with optional filters/pagination. */
export async function listAbmPositions(params) {
    const response = await apiClient.get('/admin/abm/positions', {
        params,
    });
    return response.data;
}
/** Delete a single ABM position by its internal ID. */
export async function deleteAbmPosition(positionId) {
    await apiClient.delete(`/admin/abm/positions/${positionId}`);
}
