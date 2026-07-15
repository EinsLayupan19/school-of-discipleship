import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type ListUsersParams } from "./api";
import type { CreateUserValues, UpdateUserValues } from "./schemas";

const USERS_KEY = "users";

export function useUsersQuery(params: ListUsersParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersApi.list(params),
    placeholderData: (prev) => prev, // keeps the old page visible while the next page loads
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
}

export function useCreateUserMutation() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: CreateUserValues) => usersApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateUserMutation() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserValues }) =>
      usersApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeactivateUserMutation() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: invalidate,
  });
}

export function useReactivateUserMutation() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => usersApi.reactivate(id),
    onSuccess: invalidate,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
  });
}
