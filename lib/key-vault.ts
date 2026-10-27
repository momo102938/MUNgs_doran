// Pure WebCrypto, imported by server routes only. Bind ciphertext to the user ID.
const enc = new TextEncoder(), dec = new TextDecoder();
const b64=(a:Uint8Array)=>btoa(String.fromCharCode(...a));
const unb64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(secret:string){if(!/^[a-f0-9]{64}$/.test(secret))throw new Error('VAULT_NOT_CONFIGURED');return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g)!,x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function seal(value:string,owner:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(owner)},await key(secret),enc.encode(value));return b64(iv)+'.'+b64(new Uint8Array(data))}
export async function unseal(value:string,owner:string,secret:string){const [iv,data]=value.split('.');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:enc.encode(owner)},await key(secret),unb64(data));return dec.decode(plain)}
