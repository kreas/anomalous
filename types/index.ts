export type {
  EntityType,
  AnomaNetExtensions,
  DepthPrompt,
  CharacterExtensions,
  CharacterData,
  CharacterCard,
} from "./character-card";

export { isValidCharacterCard } from "./character-card";

export type {
  Phase,
  RelationshipPath,
  PathScores,
  EntityMemory,
  RelationshipState,
  ConversationSignalType,
  ConversationSignal,
} from "./relationship";

export type {
  ChannelType,
  MessageType,
  ChannelMessage,
  Channel,
  QueryWindow,
  ChannelState,
  MessageChunk,
  GetMessagesOptions,
} from "./channel";

export {
  isQueryWindow,
  isValidChannel,
  isValidChannelMessage,
} from "./channel";

// Case types (Phase 3)
export type {
  CaseType,
  CaseRarity,
  CaseStatus,
  CaseOutcome,
  RequiredEvidence,
  CaseRewards,
  CaseSource,
  Case,
  UserCaseState,
} from "./case";

export { isValidCase, isValidUserCaseState } from "./case";

// Evidence types (Phase 3)
export type {
  EvidenceType,
  EvidenceRarity,
  EvidenceSource,
  Evidence,
  EvidenceMetadata,
  EvidenceConnection,
  EvidenceConnectionReward,
  EvidenceInventory,
} from "./evidence";

export {
  isValidEvidence,
  isValidEvidenceInventory,
  isValidEvidenceConnection,
} from "./evidence";
