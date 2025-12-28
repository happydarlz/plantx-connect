// Simple client-side encryption for chat messages
// In production, use a proper E2E encryption library like Signal Protocol

const ENCRYPTION_KEY = 'plantx-chat-key';

export const generateKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (message: string, key?: CryptoKey): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Simple XOR encryption for demo (use proper encryption in production)
    const encrypted = Array.from(data).map((byte, i) => 
      byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
    
    return btoa(String.fromCharCode(...encrypted));
  } catch {
    return message;
  }
};

export const decryptMessage = async (encryptedMessage: string, key?: CryptoKey): Promise<string> => {
  try {
    const decoded = atob(encryptedMessage);
    const data = Array.from(decoded).map((char) => char.charCodeAt(0));
    
    const decrypted = data.map((byte, i) => 
      byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
    
    return new TextDecoder().decode(new Uint8Array(decrypted));
  } catch {
    return encryptedMessage;
  }
};

export const isEncrypted = (message: string): boolean => {
  try {
    atob(message);
    return true;
  } catch {
    return false;
  }
};
