// Reads what the service worker saved when the user shared a message to Hifazat from the phone's Share menu.
export interface SharedPayload {
  text: string;
  image: File | null;
}

export async function takeShared(): Promise<SharedPayload | null> {
  try {
    if (!("caches" in window)) return null;
    const cache = await caches.open("hifazat-share");
    const textRes = await cache.match("/__share/text");
    const imageRes = await cache.match("/__share/image");
    if (!textRes && !imageRes) return null;
    const text = textRes ? await textRes.text() : "";
    const blob = imageRes ? await imageRes.blob() : null;
    await Promise.all([cache.delete("/__share/text"), cache.delete("/__share/image")]);
    const image = blob && blob.size ? new File([blob], "shared.png", { type: blob.type || "image/png" }) : null;
    return text || image ? { text, image } : null;
  } catch {
    return null;
  }
}
