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
