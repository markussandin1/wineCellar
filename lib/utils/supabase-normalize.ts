function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function camelCaseKey(key: string) {
  return key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function camelCaseKeys<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => camelCaseKeys(item)) as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    result[camelCaseKey(key)] = camelCaseKeys(value);
  }

  return result as T;
}

function normalizeConsumptionLog(log: any) {
  const normalized = camelCaseKeys(log);
  if (normalized.consumedDate === undefined && log.consumed_date !== undefined) {
    normalized.consumedDate = log.consumed_date;
  }
  if (normalized.tastingNotes === undefined && log.tasting_notes !== undefined) {
    normalized.tastingNotes = log.tasting_notes;
  }
  return normalized;
}

export function normalizeBottleRecord<RecordType extends Record<string, any>>(record: RecordType) {
  const bottle: any = camelCaseKeys(record);

  if (bottle.purchasePrice !== null && bottle.purchasePrice !== undefined) {
    bottle.purchasePrice = bottle.purchasePrice.toString();
  } else {
    bottle.purchasePrice = null;
  }

  if (bottle.labelImageUrl === undefined && (record as any).label_image_url !== undefined) {
    bottle.labelImageUrl = (record as any).label_image_url;
  }

  if (bottle.personalNotes === undefined && (record as any).personal_notes !== undefined) {
    bottle.personalNotes = (record as any).personal_notes;
  }

  if (Array.isArray(bottle.consumptionLogs)) {
    bottle.consumptionLogs = bottle.consumptionLogs.map(normalizeConsumptionLog);
  }

  if (bottle.wine && typeof bottle.wine === 'object' && !Array.isArray(bottle.wine)) {
    const normalizedWine: any = camelCaseKeys(bottle.wine);
    if (normalizedWine.alcoholPercentage !== null && normalizedWine.alcoholPercentage !== undefined) {
      normalizedWine.alcoholPercentage = normalizedWine.alcoholPercentage.toString();
    }
    bottle.wine = normalizedWine;
  } else if (bottle.wine !== null && bottle.wine !== undefined) {
    bottle.wine = null;
  }

  return bottle;
}
