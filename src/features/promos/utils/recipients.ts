/** Splits pasted text into user ids (#123 or 123) and phone numbers. */
export function parseRecipients(text: string): { userIds: number[]; phones: string[] } {
  const userIds = new Set<number>();
  const phones = new Set<string>();
  for (const raw of text.split(/[\s,،;]+/)) {
    const token = raw.trim();
    if (!token) continue;
    const id = token.match(/^#(\d+)$/);
    if (id) {
      userIds.add(Number(id[1]));
      continue;
    }
    const digits = token.replace(/[^\d+]/g, "");
    // Short numbers are user ids, anything phone-length is a phone.
    if (/^\d{1,7}$/.test(digits)) userIds.add(Number(digits));
    else if (digits.replace(/\D/g, "").length >= 8) phones.add(digits);
  }
  return { userIds: [...userIds], phones: [...phones] };
}
