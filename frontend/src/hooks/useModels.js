import { useQuery } from '@tanstack/react-query'
import { getModels } from '../api/client'

export function useModels() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
    staleTime: 60_000,
    retry: 2,
  })
  return { models: data ?? [], isLoading, error, refetch }
}
