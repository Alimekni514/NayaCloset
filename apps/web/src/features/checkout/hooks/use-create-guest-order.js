import { useMutation, useQuery } from '@tanstack/react-query';
import { guestOrderApi } from '../api/guest-order-api';
export const useCheckoutGovernorates = () => useQuery({
    queryKey: ['checkout', 'governorates'],
    queryFn: () => guestOrderApi.listGovernorates(),
});
export const useCheckoutCities = (governorateId) => useQuery({
    queryKey: ['checkout', 'cities', governorateId],
    queryFn: () => guestOrderApi.listCities(governorateId),
    enabled: Boolean(governorateId),
});
export const useCheckoutLocalities = (cityId) => useQuery({
    queryKey: ['checkout', 'localities', cityId],
    queryFn: () => guestOrderApi.listLocalities(cityId),
    enabled: Boolean(cityId),
});
export const useCheckoutPostalCode = (localityId) => useQuery({
    queryKey: ['checkout', 'postal-code', localityId],
    queryFn: () => guestOrderApi.getPostalCode(localityId),
    enabled: Boolean(localityId),
});
export const useCreateGuestOrder = () => useMutation({
    mutationFn: guestOrderApi.createGuestOrder,
});
