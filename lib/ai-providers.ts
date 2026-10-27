export const PROVIDERS = {
 openai: {label:'OpenAI',defaultModel:'gpt-4.1-mini',keysUrl:'https://platform.openai.com/api-keys',docsUrl:'https://developers.openai.com/api/docs/quickstart',endpoint:'https://api.openai.com/v1/chat/completions'},
 gemini: {label:'Google Gemini',defaultModel:'gemini-3.8-flash',keysUrl:'https://aistudio.google.com/api-keys',docsUrl:'https://ai.google.dev/gemini-api/docs/openai',endpoint:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'},
 anthropic: {label:'Anthropic Claude',defaultModel:'',keysUrl:'https://platform.claude.com/settings/keys',docsUrl:'https://platform.claude.com/docs/en/api/messages',endpoint:'https://api.anthropic.com/v1/messages'},
} as const;
export type Provider = keyof typeof PROVIDERS;
export type AIConfig = {provider:Provider;model:string;apiKey:string};
export function validConfig(c:any):c is AIConfig{return !!c&&Object.hasOwn(PROVIDERS,c.provider)&&typeof c.model==='string'&&/^[a-zA-Z0-9._:/-]{1,120}$/.test(c.model)&&typeof c.apiKey==='string'&&c.apiKey.length>=10&&c.apiKey.length<=600&&!/\s/.test(c.apiKey)}
