import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

/* ── Menu & categories ──────────────────────────── */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });
}

export function useMenu(params = {}) {
  return useQuery({
    queryKey: ['menu', params],
    queryFn: async () => {
      const { data } = await api.get('/menu', { params });
      return { items: data.data, meta: data.meta };
    },
    keepPreviousData: true,
  });
}

export function useFeatured() {
  return useQuery({
    queryKey: ['menu', 'featured'],
    queryFn: async () => (await api.get('/menu/featured')).data.data,
  });
}

export function usePopular() {
  return useQuery({
    queryKey: ['menu', 'popular'],
    queryFn: async () => (await api.get('/menu/popular')).data.data,
  });
}

export function useMenuItem(slug) {
  return useQuery({
    queryKey: ['menu', slug],
    queryFn: async () => (await api.get(`/menu/${slug}`)).data.data,
    enabled: Boolean(slug),
  });
}

/* ── Orders ────────────────────────────────────── */
export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => (await api.get('/orders/mine')).data.data,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

/* ── Admin analytics ──────────────────────────── */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
  });
}

export function useSalesSeries(days = 30) {
  return useQuery({
    queryKey: ['admin', 'sales', days],
    queryFn: async () => (await api.get('/admin/stats/sales', { params: { days } })).data.data,
  });
}
