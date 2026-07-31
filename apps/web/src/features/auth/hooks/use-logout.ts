import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/auth-api';
import { authQueryKeys } from '../auth-query-keys';

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.currentUser });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
    },
  });
};
