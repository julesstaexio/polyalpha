import { createServerSupabase } from "@/lib/supabase/server";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(
  process.env.CREDENTIALS_ENCRYPTION_KEY || randomBytes(32).toString("hex"),
  "hex"
);

interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

function encrypt(text: string): EncryptedData {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    data: encrypted,
    tag: cipher.getAuthTag().toString("hex"),
  };
}

function decrypt(encrypted: EncryptedData): string {
  const decipher = createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(encrypted.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));
  let decrypted = decipher.update(encrypted.data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function storeCLOBCredentials(
  userId: string,
  walletAddress: string,
  apiKey: string,
  secret: string,
  passphrase: string
): Promise<void> {
  const supabase = createServerSupabase();

  const encApiKey = JSON.stringify(encrypt(apiKey));
  const encSecret = JSON.stringify(encrypt(secret));
  const encPassphrase = JSON.stringify(encrypt(passphrase));

  await supabase.from("clob_credentials").upsert(
    {
      user_id: userId,
      wallet_address: walletAddress,
      api_key_encrypted: encApiKey,
      secret_encrypted: encSecret,
      passphrase_encrypted: encPassphrase,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function getCLOBCredentials(
  userId: string
): Promise<{ apiKey: string; secret: string; passphrase: string } | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("clob_credentials")
    .select("api_key_encrypted, secret_encrypted, passphrase_encrypted")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    apiKey: decrypt(JSON.parse(data.api_key_encrypted)),
    secret: decrypt(JSON.parse(data.secret_encrypted)),
    passphrase: decrypt(JSON.parse(data.passphrase_encrypted)),
  };
}

export async function deleteCLOBCredentials(userId: string): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.from("clob_credentials").delete().eq("user_id", userId);
}
