import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthState, login, loginWithPasskey, logout, registerPasskey, setup } from './auth';

const AUTH_KEY = ['auth', 'state'] as const;

export function useAuthState() {
  return useQuery({ queryKey: AUTH_KEY, queryFn: getAuthState });
}

/** Invalide l'état d'auth après une mutation (login/logout/setup). */
function useInvalidateAuth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: AUTH_KEY });
}

export function useLogin() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: (password: string) => login(password), onSuccess: invalidate });
}

export function useSetup() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: (password: string) => setup(password), onSuccess: invalidate });
}

export function useLoginWithPasskey() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: loginWithPasskey, onSuccess: invalidate });
}

export function useRegisterPasskey() {
  const invalidate = useInvalidateAuth();
  return useMutation({
    mutationFn: (label?: string) => registerPasskey(label),
    onSuccess: invalidate,
  });
}

export function useLogout() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: logout, onSuccess: invalidate });
}
