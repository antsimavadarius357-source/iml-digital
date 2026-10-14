import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useBeneficiariesCount() {
  const query = useQuery({
    queryKey: ['beneficiaries-count'],
    queryFn: () => api<{ total: number }>('/beneficiaries?pageSize=1'),
    staleTime: 30_000,
  });

  return {
    count: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
