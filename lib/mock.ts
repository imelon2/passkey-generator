import { RunResult } from "./types";

export const presetPlatformResident: Partial<PublicKeyCredentialCreationOptions> = {
  rp: { id: "example.com", name: "Example" } as any,
  user: { id: "dXNlcjE", name: "user1", displayName: "User One" } as any,
  pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
  attestation: "none" as any,
  authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" } as any,
  timeout: 60000
};

export const dummyCreationRun: RunResult<Partial<PublicKeyCredentialCreationOptions>, any> = {
  ok: true,
  request: presetPlatformResident,
  response: { id: "cred-123", type: "public-key", rawId: "...", attestationObject: "...", clientDataJSON: "..." },
  at: new Date().toISOString(),
  method: "create"
};

export const dummyAssertionRun: RunResult<Partial<PublicKeyCredentialRequestOptions>, any> = {
  ok: false,
  request: { challenge: "abc", userVerification: "preferred" } as any,
  error: { name: "NotAllowedError", message: "User cancelled", code: "abort" },
  at: new Date().toISOString(),
  method: "get"
};


