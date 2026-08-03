import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSocialMediaPlatforms,
  createSocialMediaPlatform,
  updateSocialMediaPlatform,
  deleteSocialMediaPlatform,
  getSocialLinks,
  setSocialLinks,
} from "../services/social-media-service";
import type {
  AddSocialMediaPlatformRequest,
  UpdateSocialMediaPlatformRequest,
  SetSocialLinksRequest,
  SocialProviderType,
} from "../types/api";

export const SOCIAL_PLATFORMS_QUERY_KEY = ["social-media", "platforms"];
export const SOCIAL_LINKS_QUERY_KEY = ["social-media", "links"];

/** Admin catalog read — includes deactivated platforms (activeOnly=false). */
export function useSocialMediaPlatforms() {
  return useQuery({
    queryKey: [...SOCIAL_PLATFORMS_QUERY_KEY, "all"],
    queryFn: ({ signal }) => getAllSocialMediaPlatforms(false, signal),
    staleTime: 60 * 1000,
  });
}

/** Active-only catalog — for the link editor's platform dropdown. */
export function useActiveSocialMediaPlatforms(enabled = true) {
  return useQuery({
    queryKey: [...SOCIAL_PLATFORMS_QUERY_KEY, "active"],
    queryFn: ({ signal }) => getAllSocialMediaPlatforms(true, signal),
    staleTime: 60 * 1000,
    enabled,
  });
}

/** Links for one provider. */
export function useSocialLinks(
  providerType: SocialProviderType,
  providerId: number | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: [...SOCIAL_LINKS_QUERY_KEY, providerType, providerId],
    queryFn: ({ signal }) => getSocialLinks(providerType, providerId!, signal),
    enabled: enabled && providerId != null && providerId > 0,
  });
}

/** Replace the full link list for a provider. */
export function useSetSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetSocialLinksRequest) => setSocialLinks(data),
    onSuccess: (_res, vars) =>
      queryClient.invalidateQueries({
        queryKey: [...SOCIAL_LINKS_QUERY_KEY, vars.providerType, vars.providerId],
      }),
  });
}

export function useCreateSocialMediaPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddSocialMediaPlatformRequest) => createSocialMediaPlatform(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOCIAL_PLATFORMS_QUERY_KEY }),
  });
}

export function useUpdateSocialMediaPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSocialMediaPlatformRequest }) =>
      updateSocialMediaPlatform(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOCIAL_PLATFORMS_QUERY_KEY }),
  });
}

export function useDeleteSocialMediaPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSocialMediaPlatform(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOCIAL_PLATFORMS_QUERY_KEY }),
  });
}
