import { z } from 'zod';

declare const process: {
  env: Record<string, string | undefined>;
};

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string({ error: 'EXPO_PUBLIC_SUPABASE_URL is required.' })
    .trim()
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required.' })
    .trim()
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required.'),
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;

export function parseMobileEnv(source: Record<string, string | undefined>): MobileEnv {
  const parsed = mobileEnvSchema.safeParse(source);

  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => `- ${issue.message}`).join('\n');

    throw new Error(
      `Missing or invalid mobile environment configuration:\n${messages}\n\n` +
        'Create apps/mobile/.env with the required EXPO_PUBLIC_* values.',
    );
  }

  return parsed.data;
}

export function getMobileEnv(): MobileEnv {
  return parseMobileEnv(process.env);
}
