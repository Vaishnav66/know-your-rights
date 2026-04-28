import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
  te: "Telugu (Telugu script)",
};

const CATEGORIES = [
  "Wage & Labor Rights",
  "Women & Child Safety",
  "Land & Property Disputes",
  "Financial Fraud & Banking Issues",
  "Consumer Rights",
  "Police & Legal Rights",
  "Government Schemes",
  "Digital/Cyber Safety",
  "Education Rights",
  "Health & Medical Rights",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { situation, language = "en" } = await req.json();
    if (!situation || typeof situation !== "string" || situation.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Please describe the situation in a few words." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langName = LANG_NAMES[language] ?? "English";

    const systemPrompt = `You are a friendly, trustworthy legal-rights helper for citizens of India, especially people with limited literacy.
You MUST respond ONLY in ${langName}. Use very simple, short sentences (8–14 words each). Avoid legal jargon. When you must use a legal word, explain it in brackets in simple words.

You will receive a real-life situation. Identify the correct problem category from this list:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Then return a rich, structured decision via the give_decision tool. Be SPECIFIC to the user's exact situation — never generic. Mention amounts, time limits, deadlines, and named offices when relevant.

Always cite a real Indian law / Act / Section / Article when possible. Examples to draw from when relevant:
- Minimum Wages Act 1948, Payment of Wages Act 1936, Code on Wages 2019, Equal Remuneration Act 1976
- Bharatiya Nyaya Sanhita (BNS) 2023 sections, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, IPC sections (older cases)
- Protection of Women from Domestic Violence Act 2005, Sexual Harassment of Women at Workplace (POSH) Act 2013
- POCSO Act 2012, Juvenile Justice Act 2015, Child Labour (Prohibition) Act 1986
- SC/ST (Prevention of Atrocities) Act 1989
- Right to Education Act 2009, Right to Information Act 2005
- Consumer Protection Act 2019, Real Estate (RERA) Act 2016
- Transfer of Property Act 1882, Registration Act 1908, Indian Succession Act 1925, Hindu Succession Act 1956
- IT Act 2000 (Sections 66C, 66D, 67), DPDP Act 2023
- Banking Ombudsman Scheme / RBI guidelines, Negotiable Instruments Act 1881 (Sec 138 cheque bounce)
- Constitution Articles 14, 15, 17, 19, 21, 21A, 23, 24, 39, 41
- Motor Vehicles Act 1988, Maintenance and Welfare of Parents and Senior Citizens Act 2007

Helpline numbers to recommend when relevant:
112 (all emergencies), 100 (police), 101 (fire), 102/108 (ambulance),
181 (women), 1091 (women police), 1098 (child), 14567 (senior citizen),
1930 (cyber fraud), cybercrime.gov.in, 14400 (child labour),
14434 (anti-trafficking), 1950 (election), 1064 (anti-corruption),
1800-11-4000 (consumer NCH), 155214 (labour), 14401 (anti-ragging).

Tone: kind, calm, empowering. Reassure the user that help exists and the law protects them. Never scare them. Do not give a final legal verdict — give clear practical guidance and tell them when to consult a lawyer or DLSA (free legal aid: 15100).`;

    const tool = {
      type: "function",
      function: {
        name: "give_decision",
        description: "Return a rich, specific, structured legal decision for the user's situation.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: CATEGORIES },
            problem: {
              type: "string",
              description: "2-3 short sentences restating the problem in the user's own words, in simple language. Mention key facts (who, what, where, money/amount, time)."
            },
            decision: {
              type: "string",
              description: "The clear action the user should take, in 2-4 short sentences. Be direct and concrete (e.g., 'File an FIR at the nearest police station today'). Mention deadlines or time limits if any."
            },
            reasoning: {
              type: "string",
              description: "3-5 short sentences explaining WHY this is the right action. Connect the user's facts to their rights. Use kind, empowering language."
            },
            law: {
              type: "string",
              description: "2-4 short sentences. Name the Act + Section/Article, then explain in plain words what it protects and what punishment/remedy it provides. Example: 'Section 138, Negotiable Instruments Act 1881 — cheque bounce. The person who gave the bad cheque can be punished with up to 2 years jail or fine up to twice the amount.'"
            },
            rights: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 5,
              description: "Bullet list of the user's specific rights in this situation, in plain language. Each bullet 1 short sentence."
            },
            nextSteps: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 6,
              description: "Ordered, concrete steps. Each step ONE sentence with: WHAT to do, WHERE to go (specific office: police station, labour commissioner, consumer forum, panchayat, bank branch, DLSA, cyber cell), and HOW (documents needed, helpline number, website). First step = the most urgent action."
            },
            documents: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 6,
              description: "Documents/proof the user should gather (e.g., Aadhaar, salary slip, photos, screenshots, witness names, receipts, FIR copy). Plain words."
            },
            helplines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short name of the helpline / authority in the user's language." },
                  number: { type: "string", description: "Phone number or short code (e.g., 112, 1098, 1930)." }
                },
                required: ["name", "number"],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 5,
              description: "Most relevant helplines for THIS situation. Always include 112 if there is any safety risk."
            },
            warnings: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 4,
              description: "Short cautions: things the user MUST NOT do (e.g., 'Do not share OTP', 'Do not sign blank papers', 'Do not pay any bribe — it is illegal')."
            },
            freeHelp: {
              type: "string",
              description: "1-2 sentences telling the user about FREE legal aid: District Legal Services Authority (DLSA), helpline 15100, or NALSA. Mention they can get a free lawyer if they cannot afford one."
            },
            urgency: { type: "string", enum: ["low", "medium", "high"], description: "How urgent is this." }
          },
          required: [
            "category", "problem", "decision", "reasoning", "law",
            "rights", "nextSteps", "documents", "helplines", "warnings", "freeHelp", "urgency"
          ],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Situation:\n${situation}\n\nRespond ONLY in ${langName}. Be specific to these facts. Fill every field of the give_decision tool with rich, useful content.` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "give_decision" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ decision: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});