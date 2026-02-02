import { z } from 'zod';

export const RoomSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  videoUrl: z.string().optional(),
  isPlaying: z.boolean(),
  currentTime: z.number(),
  updatedAt: z.number()
});

export type RoomState = z.infer<typeof RoomSchema>;

export const MessageSchema = z.object({
  type: z.enum(['SYNC', 'CHAT', 'JOIN', 'LEAVE']),
  payload: z.any()
});

export type Message = z.infer<typeof MessageSchema>;
