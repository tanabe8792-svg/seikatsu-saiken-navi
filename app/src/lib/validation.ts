import { API_LIMITS } from "./constants";
import type { ActionItem, ChatMessage, Priority, UserProfile } from "./types";
import { PRIORITY_ORDER } from "./types";

const VALID_PRIORITIES = new Set<Priority>(PRIORITY_ORDER);

export function isValidChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as ChatMessage;
  return (
    typeof msg.id === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    msg.content.length > 0 &&
    msg.content.length <= API_LIMITS.maxMessageLength
  );
}

export function sanitizeChatMessages(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > API_LIMITS.maxMessages) return null;

  const sanitized: ChatMessage[] = [];
  let totalLength = 0;

  for (const message of messages) {
    if (!isValidChatMessage(message)) return null;
    totalLength += message.content.length;
    if (totalLength > API_LIMITS.maxTotalContentLength) return null;
    sanitized.push({
      id: message.id.slice(0, 64),
      role: message.role,
      content: message.content.trim(),
      createdAt: message.createdAt,
    });
  }

  return sanitized;
}

export function sanitizeUserProfile(value: unknown): UserProfile {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  const profile: UserProfile = {};

  const stringFields = [
    "address",
    "municipality",
    "disasterType",
    "housingDamage",
    "currentShelter",
    "notes",
  ] as const;

  for (const field of stringFields) {
    if (typeof input[field] === "string" && input[field].trim()) {
      profile[field] = input[field].trim().slice(0, 200);
    }
  }

  if (typeof input.householdSize === "number" && input.householdSize > 0) {
    profile.householdSize = Math.min(input.householdSize, 20);
  }

  if (typeof input.hasElderly === "boolean") profile.hasElderly = input.hasElderly;
  if (typeof input.hasChildren === "boolean") profile.hasChildren = input.hasChildren;
  if (typeof input.hasPet === "boolean") profile.hasPet = input.hasPet;
  if (typeof input.hasPowerOutage === "boolean") profile.hasPowerOutage = input.hasPowerOutage;
  if (typeof input.hasWaterOutage === "boolean") profile.hasWaterOutage = input.hasWaterOutage;
  if (typeof input.hasGasOutage === "boolean") profile.hasGasOutage = input.hasGasOutage;
  if (typeof input.hasMortgage === "boolean") profile.hasMortgage = input.hasMortgage;
  if (typeof input.prior2016Disaster === "boolean") {
    profile.prior2016Disaster = input.prior2016Disaster;
  }
  if (typeof input.isSelfEmployed === "boolean") {
    profile.isSelfEmployed = input.isSelfEmployed;
  }
  if (typeof input.j00Completed === "boolean") {
    profile.j00Completed = input.j00Completed;
  }
  if (typeof input.startRecoveryPhase === "boolean") {
    profile.startRecoveryPhase = input.startRecoveryPhase;
  }

  if (typeof input.housingTenure === "string" && input.housingTenure.trim()) {
    profile.housingTenure = input.housingTenure.trim().slice(0, 32);
  }

  return profile;
}

export function sanitizeActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];

  const items: ActionItem[] = [];

  for (const raw of value.slice(0, 30)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<ActionItem>;
    if (typeof item.id !== "string" || typeof item.title !== "string") continue;

    const priority = VALID_PRIORITIES.has(item.priority as Priority)
      ? (item.priority as Priority)
      : "week";

    items.push({
      id: item.id.slice(0, 64),
      title: item.title.slice(0, 100),
      description: typeof item.description === "string"
        ? item.description.slice(0, 300)
        : "",
      priority,
      completed: Boolean(item.completed),
      procedureId:
        typeof item.procedureId === "string"
          ? item.procedureId.slice(0, 64)
          : undefined,
    });
  }

  return items;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  profile: UserProfile;
  existingActions: ActionItem[];
}

export function parseChatRequestBody(body: unknown): ChatRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const messages = sanitizeChatMessages(input.messages);
  if (!messages) return null;

  return {
    messages,
    profile: sanitizeUserProfile(input.profile),
    existingActions: sanitizeActionItems(input.existingActions),
  };
}
