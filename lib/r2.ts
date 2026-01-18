import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const R2_PREFIX = "anomanet/";

const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const bucket = process.env.R2_BUCKET || "mythic-os";

function prefixKey(key: string): string {
  return `${R2_PREFIX}${key}`;
}

export async function getObject<T>(key: string): Promise<T | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: prefixKey(key),
    });
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

export async function putObject<T>(key: string, data: T): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: prefixKey(key),
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  });
  await s3Client.send(command);
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: prefixKey(key),
  });
  await s3Client.send(command);
}

export async function listObjects(prefix: string): Promise<string[]> {
  const fullPrefix = prefixKey(prefix);
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: fullPrefix,
  });
  const response = await s3Client.send(command);
  const keys = response.Contents?.map((obj) => obj.Key || "") || [];
  // Remove the anomanet/ prefix from returned keys
  return keys.map((key) => key.replace(R2_PREFIX, ""));
}
