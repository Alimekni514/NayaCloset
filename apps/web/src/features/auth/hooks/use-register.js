import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { authQueryKeys } from '../auth-query-keys';
export const useRegister = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.register,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
        },
    });
};
