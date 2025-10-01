import { presetPlatformResident } from "@/lib/mock";

export function usePresets() {
  const creationPresets: Array<{ id: string; name: string; desc: string; data: Partial<PublicKeyCredentialCreationOptions> }> = [
    { id: "platform-resident", name: "Platform + ResidentKey Required", desc: "ES256 / UV required / attestation none", data: presetPlatformResident },
  ];
  return { creationPresets };
}


