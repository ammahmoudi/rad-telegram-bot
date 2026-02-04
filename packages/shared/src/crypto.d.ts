export type EncryptedString = {
    v: 1;
    iv: string;
    tag: string;
    data: string;
};
export declare function encryptString(plaintext: string): string;
export declare function decryptString(payloadJson: string): string;
