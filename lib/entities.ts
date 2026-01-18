import { getObject, putObject, deleteObject, listObjects } from "./r2";
import { getEntityPath, getEntitiesPrefix } from "./paths";
import { CharacterCard, isValidCharacterCard } from "@/types";
import defaultAnonymous from "@/data/entities/anonymous.json";

export async function getCharacterCard(
  userId: string,
  entityId: string
): Promise<CharacterCard | null> {
  const path = getEntityPath(userId, entityId);
  const card = await getObject<CharacterCard>(path);

  if (card && !isValidCharacterCard(card)) {
    console.warn(`Invalid character card at ${path}`);
    return null;
  }

  return card;
}

export async function saveCharacterCard(
  userId: string,
  entityId: string,
  card: CharacterCard
): Promise<void> {
  if (!isValidCharacterCard(card)) {
    throw new Error("Invalid character card structure");
  }

  const path = getEntityPath(userId, entityId);
  await putObject(path, card);
}

export async function deleteCharacterCard(
  userId: string,
  entityId: string
): Promise<void> {
  const path = getEntityPath(userId, entityId);
  await deleteObject(path);
}

export async function listCharacterCards(userId: string): Promise<string[]> {
  const prefix = getEntitiesPrefix(userId);
  const keys = await listObjects(prefix);

  return keys
    .filter((key) => key.endsWith(".json"))
    .map((key) => {
      const filename = key.split("/").pop() || "";
      return filename.replace(".json", "");
    });
}

export async function getOrCreateAnonymousCard(
  userId: string
): Promise<CharacterCard> {
  const card = await getCharacterCard(userId, "anonymous");

  if (card) {
    return card;
  }

  // Copy default Anonymous card to user's storage
  const anonymousCard = defaultAnonymous as CharacterCard;
  await saveCharacterCard(userId, "anonymous", anonymousCard);
  return anonymousCard;
}
