import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/auth-api';
import { authQueryKeys } from '../auth-query-keys';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    },
  });
};
