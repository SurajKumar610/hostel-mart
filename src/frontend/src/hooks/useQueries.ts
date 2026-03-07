import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  Condition,
  ExternalBlob,
  ItemListing,
  ListingStatus,
  ListingType,
  UserProfile,
  WantedRequest,
} from "../backend";
import { listingStore } from "../lib/listingStore";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery({
    queryKey: ["callerProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUserProfile(principal: Principal | null | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", identity?.getPrincipal().toString()],
      });
    },
  });
}

// ─── Listings ────────────────────────────────────────────────────────────────

export function useListingsBySeller(sellerId: Principal | null | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ItemListing[]>({
    queryKey: ["listings", "seller", sellerId?.toString()],
    queryFn: async () => {
      if (!actor || !sellerId) return [];
      return actor.getListingsBySeller(sellerId);
    },
    enabled: !!actor && !isFetching && !!sellerId,
  });
}

export function useListing(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ItemListing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor || !id) throw new Error("No id");
      return actor.getListing(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateListing() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      desc: string;
      price: bigint | null;
      category: Category;
      listingType: ListingType;
      condition: Condition;
      photos: ExternalBlob[];
    }) => {
      if (!actor || isFetching) throw new Error("Not connected");
      return actor.createListing(
        params.title,
        params.desc,
        params.price,
        params.category,
        params.listingType,
        params.condition,
        params.photos,
      );
    },
    onSuccess: (id) => {
      // Store the new listing ID and seller ID for discovery
      listingStore.addListingId(id);
      if (identity) {
        listingStore.addSellerId(identity.getPrincipal().toString());
      }
      // Invalidate all relevant queries so the listing appears everywhere
      queryClient.invalidateQueries({
        queryKey: ["listings", "seller", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["discoveredListings"] });
      // Invalidate requests so auto-fulfilled ones reflect their new status
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useMarkListingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      status,
    }: {
      listingId: string;
      status: ListingStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.markListingStatus(listingId, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listing", variables.listingId],
      });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// ─── Requests ────────────────────────────────────────────────────────────────

export function useRequestsByRequester(
  requesterId: Principal | null | undefined,
) {
  const { actor, isFetching } = useActor();
  return useQuery<WantedRequest[]>({
    queryKey: ["requests", "requester", requesterId?.toString()],
    queryFn: async () => {
      if (!actor || !requesterId) return [];
      return actor.getRequestsByRequester(requesterId);
    },
    enabled: !!actor && !isFetching && !!requesterId,
  });
}

export function useRequest(id: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<WantedRequest>({
    queryKey: ["request", id],
    queryFn: async () => {
      if (!actor || !id) throw new Error("No id");
      return actor.getRequest(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateRequest() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      desc: string;
      category: Category;
      budget: bigint | null;
    }) => {
      if (!actor || isFetching) throw new Error("Not connected");
      return actor.createRequest(
        params.title,
        params.desc,
        params.category,
        params.budget,
      );
    },
    onSuccess: (id) => {
      // Store the new request ID for discovery
      listingStore.addRequestId(id);
      if (identity) {
        listingStore.addSellerId(identity.getPrincipal().toString());
      }
      queryClient.invalidateQueries({
        queryKey: [
          "requests",
          "requester",
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["discoveredRequests"] });
    },
  });
}

export function useMarkRequestFulfilled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.markRequestFulfilled(requestId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["request", variables] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useDeleteRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
