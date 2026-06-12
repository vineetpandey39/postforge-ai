import { jsonResponse } from '../../lib/validation';

export async function GET() {
  return jsonResponse({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
}
