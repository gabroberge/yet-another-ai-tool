/**
 * Real-world companies, products, and marks that generated brands must not resemble.
 * Grouped so the list can grow by area. Spelling does not matter: entries are normalized
 * the same way as generated names before comparison.
 *
 * This is a confusion filter, not a clearance search. Passing it says nothing about
 * trademark availability.
 */
export const CONFLICT_GROUPS = {
  aiProducts: [
    "OpenAI", "ChatGPT", "GPT", "Codex", "Sora", "DALL-E", "Whisper", "Anthropic", "Claude", "Gemini", "Bard",
    "Copilot", "Cursor", "Windsurf", "Codeium", "Tabnine", "Replit", "Devin", "Cognition", "Perplexity", "Comet",
    "Mistral", "Le Chat", "Cohere", "Midjourney", "Jasper", "Grammarly", "Glean", "Harvey", "Gamma", "Llama",
    "Grok", "DeepSeek", "Qwen", "Kimi", "Hugging Face", "Stability", "Runway", "Synthesia", "ElevenLabs",
    "Character AI", "Inflection", "Adept", "Poe", "Phind", "Sourcegraph", "Cody", "Lovable", "Bolt", "Manus",
    "NotebookLM", "Watson", "Einstein", "Alexa", "Siri", "Cortana", "Bixby", "Nova", "Echo", "Atlas", "Operator",
    "Writer", "Otter", "Fireflies", "Tome", "Descript", "Pika", "Suno", "Udio", "Ideogram", "Leonardo",
    "Pinecone", "Weaviate", "Chroma", "Qdrant", "LangChain", "LlamaIndex", "Onyx", "Vega", "Kepler", "Juno",
  ],
  developerTools: [
    "GitHub", "GitLab", "Bitbucket", "Vercel", "Netlify", "Supabase", "Firebase", "Heroku", "Cloudflare",
    "Datadog", "Sentry", "PagerDuty", "Splunk", "New Relic", "Grafana", "Honeycomb", "Snowflake", "Databricks",
    "MongoDB", "Redis", "Elastic", "Confluent", "Docker", "Kubernetes", "Terraform", "HashiCorp", "Waypoint",
    "Postman", "Retool", "Linear", "Jira", "Atlassian", "Cortex", "Envoy", "Tempo", "Pingdom", "Statuspage",
    "Better Stack", "UptimeRobot", "Zephyr", "Scout", "Pulse", "Kairos", "Vantage", "Orbit", "Prisma", "Deno",
  ],
  workSoftware: [
    "Notion", "Airtable", "Figma", "Canva", "Miro", "Slack", "Zoom", "Loom", "Asana", "Monday", "ClickUp",
    "Zapier", "n8n", "Coda", "Lucid", "Calendly", "Superhuman", "Front", "Missive", "Courier", "Frame",
    "Canvas", "Quill", "Tabula", "Epoch", "Cadence", "Unify", "Compass", "Keystone", "Abacus", "Pilot",
  ],
  businessSoftware: [
    "Twilio", "SendGrid", "Mailchimp", "Postmark", "Mailgun", "Resend", "Stripe", "Plaid", "Brex", "Ramp",
    "Mercury", "Relay", "Wise", "Revolut", "PayPal", "Square", "Adyen", "Okta", "Auth0", "Vanta", "Drata",
    "OneTrust", "Segment", "Amplitude", "Mixpanel", "Intercom", "Zendesk", "HubSpot", "Salesforce", "Gong",
    "Rippling", "Gusto", "Deel", "Workday", "Palantir", "QuickBooks", "Xero", "Mint", "Ledger", "Column",
    "Parity", "Sterling", "Signal", "Telegram", "WhatsApp", "Lumen", "Proxim", "Delta", "Vista", "Halo",
  ],
  platforms: [
    "Google", "Android", "Chrome", "Apple", "Microsoft", "Windows", "Outlook", "Bing", "Azure", "Amazon", "AWS",
    "Meta", "Nvidia", "Intel", "IBM", "Oracle", "SAP", "Adobe", "Samsung", "Tesla", "Netflix", "Spotify", "Uber",
    "Airbnb", "Shopify", "Pixel", "Nest", "Aero", "Cirrus", "Isobar", "Terra",
  ],
  consumerBrands: [
    "Lumix", "Leica", "Nikon", "Canon", "Sony", "Bose", "Garmin", "Fitbit", "Kindle", "Roku", "Sonos", "Nokia",
    "Kodak", "Polaroid", "Lego", "Othello", "Monopoly",
  ],
  sampleCompanies: ["Northwind", "Contoso", "Fabrikam", "Tailspin", "Acme", "Initech", "Globex"],
} as const satisfies Record<string, readonly string[]>;

export const KNOWN_CONFLICTS: readonly string[] = Object.values(CONFLICT_GROUPS).flat();
