// app/api/generate/route.js

const HASHTAGS = '#AIIncome #PassiveIncome #AITools #MakeMoneyWithAI #AIAutomation #DigitalIncome #AIForBeginners #FutureOfWork #WorkSmart #AILife #MoneyMindset #SideHustle #OnlineIncome #AIRevolution #GrowthMindset #FinancialFreedom #AIContent #ContentCreator #AIBusiness #PassiveIncomeIdeas';

const PILLAR_FOCUS = {
  news: 'Focus on what this means for AI income builders. Make it urgent and actionable.',
  tool: 'Focus on practical use cases, time/money saved, how to start today.',
  income: 'Focus on specific numbers and replicable steps. Make reader believe they can do this.',
  transformation: 'Focus on identity shift and emotional resonance.',
  automation: 'Focus on exact steps, time saved, cost per output.',
};

export async function POST(request) {
  try {
    const { selectedItems, pillarFull, pillarId, format } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const context = selectedItems
      .map((item, i) => `${i + 1}. [${item.source} — ${item.date}] ${item.headline}\n   ${item.summary}`)
      .join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `Top Instagram strategist for @aibyvineet. Use ONLY provided content. Never fabricate. Return ONLY valid JSON.`,
        messages: [{
          role: 'user',
          content: `Create Instagram ${format} for "${pillarFull}". ${PILLAR_FOCUS[pillarId] || ''}

VERIFIED CONTENT:
${context}

Return: {"hook":"12 word max hook","slides":[{"title":"...","body":"2-3 lines","source":"..."},{"title":"...","body":"...","source":"..."},{"title":"...","body":"...","source":"..."},{"title":"...","body":"...","source":"..."},{"title":"CTA","body":"...follow @aibyvineet","source":""}],"caption":"150-200 chars emoji-rich ends with question","cta":"Strong CTA","canva_brief":"Visual direction","hashtags":"${HASHTAGS}"}`,
        }],
      }),
    });

    const data = await res.json();
    const text = (data.content || []).find(b => b.type === 'text')?.text || '';
    const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
    if (match) return Response.json(JSON.parse(match[0]));
    throw new Error('Parse failed');
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
