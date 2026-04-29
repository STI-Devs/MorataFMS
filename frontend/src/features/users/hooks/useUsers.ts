import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { userKeys } from '../utils/queryKeys';
import type { CreateUserData, UpdateUserData } from '../types/user.types';

export const useUsers = () =>
    useQuery({
        queryKey: userKeys.all,
        queryFn: () => userApi.getUsers(),
        select: (res) => res.data ?? [],
    });

export const useCreateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserData) => userApi.createUser(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};

export const useUpdateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) => userApi.updateUser(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};

export const useDeactivateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userApi.deactivateUser(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};

export const useActivateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userApi.activateUser(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};
