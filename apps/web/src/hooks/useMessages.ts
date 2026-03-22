/**
 * React Query hooks for Command Center message operations.
 * All API calls go through authedFetch (injects Bearer token, handles 401).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { authedFetch } from '../utils/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
  submissionId: string;
  name: string;
  email: string;
  type: 'general-inquiry' | 'feature-request' | 'bug-report' | 'privacy-question' | 'report-abuse';
  preview: string;
  status: 'new' | 'in-progress' | 'closed';
  timestamp: string;
  source?: string;
}

export interface Reply {
  body: string;
  sentAt: string;
  sentTo: string;
}

export interface MessageDetail extends Message {
  message: string;
  replies?: Reply[];
}

export interface MessageFilters {
  category?: string;
  status?: string;
  search?: string;
}

export interface UpdateStatusPayload {
  id: string;
  status: Message['status'];
}

export interface ReplyPayload {
  id: string;
  body: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const messageKeys = {
  all: ['messages'] as const,
  detail: (id: string) => ['messages', id] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all messages. Filters are applied client-side over the full response.
 */
export function useMessages(): UseQueryResult<Message[]> {
  return useQuery({
    queryKey: messageKeys.all,
    queryFn: async () => {
      const res = await authedFetch('/v1/admin/messages');
      if (!res.ok) throw Object.assign(new Error('Failed to load messages'), { status: res.status });
      const data = await res.json() as { messages: Message[] };
      return data.messages;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetches a single message by ID (used for direct-link access).
 */
export function useMessage(id: string): UseQueryResult<MessageDetail> {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: async () => {
      const res = await authedFetch(`/v1/admin/messages/${id}`);
      if (!res.ok) throw Object.assign(new Error('Message not found'), { status: res.status });
      const data = await res.json() as { message: MessageDetail };
      return data.message;
    },
    staleTime: 30_000,
    enabled: Boolean(id),
  });
}

/**
 * Updates message status with optimistic update and rollback on error.
 */
export function useUpdateStatus(): UseMutationResult<
  Message,
  Error,
  UpdateStatusPayload,
  { previousMessages: Message[] | undefined; previousDetail: MessageDetail | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateStatusPayload) => {
      const res = await authedFetch(`/v1/admin/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw Object.assign(new Error('Failed to update status'), { status: res.status });
      const data = await res.json() as { message: Message };
      return data.message;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all });
      await queryClient.cancelQueries({ queryKey: messageKeys.detail(id) });

      const previousMessages = queryClient.getQueryData<Message[]>(messageKeys.all);
      const previousDetail = queryClient.getQueryData<MessageDetail>(messageKeys.detail(id));

      // Optimistic update on the list
      queryClient.setQueryData<Message[]>(messageKeys.all, (old) =>
        old?.map((m) => (m.submissionId === id ? { ...m, status } : m)) ?? old,
      );

      // Optimistic update on the detail
      queryClient.setQueryData<MessageDetail>(messageKeys.detail(id), (old) =>
        old ? { ...old, status } : old,
      );

      return { previousMessages, previousDetail };
    },
    onSuccess: (updatedMessage, { id }) => {
      // Write the server response directly into the cache — avoids a round-trip
      // re-fetch and keeps list + detail consistent without a race-condition window.
      queryClient.setQueryData<Message[]>(messageKeys.all, (old) =>
        old?.map((m) => (m.submissionId === id ? { ...m, ...updatedMessage } : m)) ?? old,
      );
      queryClient.setQueryData<MessageDetail>(messageKeys.detail(id), (old) =>
        old ? { ...old, ...updatedMessage } : old,
      );
    },
    onError: (_err, { id }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.all, context.previousMessages);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(messageKeys.detail(id), context.previousDetail);
      }
    },
  });
}

/**
 * Deletes a message. Invalidates the message list on success.
 */
export function useDeleteMessage(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(`/v1/admin/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw Object.assign(new Error('Failed to delete message'), { status: res.status });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

/**
 * Sends a reply to a message. Invalidates the message detail on success.
 */
export function useReplyToMessage(): UseMutationResult<Reply, Error, ReplyPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: ReplyPayload) => {
      const res = await authedFetch(`/v1/admin/messages/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw Object.assign(new Error('Failed to send reply'), { status: res.status });
      const data = await res.json() as { reply: Reply };
      return data.reply;
    },
    onSuccess: (_data, { id }) => {
      // The Lambda sets status → in_progress on every reply, so both the detail
      // and the list need to reflect the new status. Without invalidating the list,
      // the status in the table would remain stale until a manual refresh.
      void queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}
