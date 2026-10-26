import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { installmentService } from '@/services/installmentService'

const INSTALLMENTS_QUERY_KEY = ['installments']

export const useInstallmentsList = (statusFilter?: string) => {
  return useQuery({
    queryKey: [...INSTALLMENTS_QUERY_KEY, 'list', statusFilter],
    queryFn: () => installmentService.listSeries(statusFilter),
    staleTime: 30000,
  })
}

export const useInstallmentDetail = (seriesId: number | null) => {
  return useQuery({
    queryKey: [...INSTALLMENTS_QUERY_KEY, 'detail', seriesId],
    queryFn: () => installmentService.getSeries(seriesId!),
    staleTime: 30000,
    enabled: !!seriesId,
  })
}

export const useMarkInstallmentsPaid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seriesId, upTo }: { seriesId: number; upTo: number }) =>
      installmentService.markInstallmentsPaid(seriesId, upTo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
    },
  })
}

export const useCreateFutureInstallments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seriesId, from }: { seriesId: number; from: number }) =>
      installmentService.createFutureInstallments(seriesId, from),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
    },
  })
}

export const useUpdateSeries = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      seriesId,
      data,
    }: {
      seriesId: number
      data: {
        description?: string
        merchant_name?: string
        not_duplicate_with?: number[]
      }
    }) => installmentService.updateSeries(seriesId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
    },
  })
}

export const useInstallmentDetails = (seriesId: number | null) => {
  return useQuery({
    queryKey: [...INSTALLMENTS_QUERY_KEY, 'details', seriesId],
    queryFn: () => installmentService.getInstallmentDetails(seriesId!),
    staleTime: 30000,
    enabled: !!seriesId,
  })
}
