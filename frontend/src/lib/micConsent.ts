const CONSENT_KEY = "kisan-mic-consent";

export function hasMicConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "1";
}

export function setMicConsent(granted: boolean) {
  localStorage.setItem(CONSENT_KEY, granted ? "1" : "0");
}
