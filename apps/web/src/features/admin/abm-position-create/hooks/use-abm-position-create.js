import { useMutation, useQuery } from '@tanstack/react-query';
import { abmPositionCreateApi } from '../api/abm-position-create-api';
export const usePositionFormOptions = () => useQuery({
    queryKey: ['admin', 'abm', 'positions', 'form-options'],
    queryFn: () => abmPositionCreateApi.getFormOptions(),
    staleTime: 60_000,
});
export const useGovernorates = () => useQuery({
    queryKey: ['admin', 'abm', 'locations', 'governorates'],
    queryFn: () => abmPositionCreateApi.getGovernorates(),
    staleTime: 60_000,
});
export const useCities = (governorateId) => useQuery({
    queryKey: ['admin', 'abm', 'locations', 'cities', governorateId],
    queryFn: () => abmPositionCreateApi.getCities(governorateId),
    enabled: Boolean(governorateId),
    staleTime: 60_000,
});
export const useLocalities = (cityId) => useQuery({
    queryKey: ['admin', 'abm', 'locations', 'localities', cityId],
    queryFn: () => abmPositionCreateApi.getLocalities(cityId),
    enabled: Boolean(cityId),
    staleTime: 60_000,
});
export const usePostalCode = (localityId) => useQuery({
    queryKey: ['admin', 'abm', 'locations', 'postal-code', localityId],
    queryFn: () => abmPositionCreateApi.getPostalCode(localityId),
    enabled: Boolean(localityId),
    staleTime: 60_000,
});
export const usePickupAddressDetail = (id) => useQuery({
    queryKey: ['admin', 'abm', 'positions', 'addresses', 'pickup', id],
    queryFn: () => abmPositionCreateApi.getPickupAddress(id),
    enabled: Boolean(id),
    staleTime: 60_000,
});
export const useDeliveryAddressDetail = (id) => useQuery({
    queryKey: ['admin', 'abm', 'positions', 'addresses', 'delivery', id],
    queryFn: () => abmPositionCreateApi.getDeliveryAddress(id),
    enabled: Boolean(id),
    staleTime: 60_000,
});
export const useCreateAbmPosition = () => useMutation({
    mutationFn: abmPositionCreateApi.createPosition,
});
