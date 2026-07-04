import type { MergedPlaceList, PlaceListFileFront } from './schema';

export function mergePair(
  koFront: PlaceListFileFront,
  enFront: PlaceListFileFront,
  slug: string,
  filename: string
): MergedPlaceList {
  // Validate before merging
  const errors = validatePair(koFront, enFront, filename);
  if (errors.length > 0) {
    throw new Error(`Merge validation failed:\n${errors.join('\n')}`);
  }

  // Apply canonical rule: KO is canonical for region, asOfDate, sourceUrl
  const region = koFront.region;
  const asOfDate = koFront.asOfDate;
  const sourceUrl = koFront.sourceUrl;
  const city = koFront.city || enFront.city;

  // Add place id to each place: ${listSlug}#${index}
  const koPlaces = koFront.places!.map((place, index) => ({
    ...place,
    id: `${slug}#${index}`,
  }));

  const enPlaces = enFront.places!.map((place, index) => ({
    ...place,
    id: `${slug}#${index}`,
  }));

  // EN sourceNote inherits from KO if absent
  const enSourceNote = enFront.sourceNote || koFront.sourceNote;

  return {
    slug,
    region,
    city,
    asOfDate,
    sourceUrl,
    ko: {
      title: koFront.title,
      sourceNote: koFront.sourceNote,
      places: koPlaces,
    },
    en: {
      title: enFront.title,
      sourceNote: enSourceNote,
      places: enPlaces,
    },
  };
}

export function validatePair(
  koFront: PlaceListFileFront,
  enFront: PlaceListFileFront,
  filename: string
): string[] {
  const errors: string[] = [];

  // Check KO required fields
  if (!koFront.title || koFront.title.trim().length === 0) {
    errors.push(`${filename} (KO): title is required`);
  }

  if (!koFront.region) {
    errors.push(`${filename} (KO): region is required`);
  }

  if (!koFront.asOfDate) {
    errors.push(`${filename} (KO): asOfDate is required`);
  }

  if (!koFront.sourceNote || koFront.sourceNote.trim().length === 0) {
    errors.push(`${filename} (KO): sourceNote is required`);
  }

  // Check EN required fields
  if (!enFront.title || enFront.title.trim().length === 0) {
    errors.push(`${filename} (EN): title is required`);
  }

  // EN sourceNote can inherit from KO, so not strictly required
  if (!enFront.sourceNote && !koFront.sourceNote) {
    errors.push(`${filename} (EN): sourceNote required (neither EN nor KO provided)`);
  }

  // Check places array
  if (!koFront.places || koFront.places.length < 3) {
    errors.push(`${filename} (KO): must have at least 3 places`);
  }

  if (!enFront.places || enFront.places.length < 3) {
    errors.push(`${filename} (EN): must have at least 3 places`);
  }

  // Check ko/en places length match
  if (koFront.places && enFront.places && koFront.places.length !== enFront.places.length) {
    errors.push(
      `${filename}: KO places (${koFront.places.length}) and EN places (${enFront.places.length}) length mismatch`
    );
  }

  // Validate each place
  if (koFront.places) {
    koFront.places.forEach((place, index) => {
      if (!place.name || place.name.trim().length === 0) {
        errors.push(`${filename} (KO) place[${index}]: name is required`);
      }

      if (!place.address || place.address.trim().length === 0) {
        errors.push(`${filename} (KO) place[${index}]: address is required`);
      }

      if (!place.description || place.description.trim().length === 0) {
        errors.push(`${filename} (KO) place[${index}]: description is required`);
      }

      if (!place.personalNote || place.personalNote.trim().length === 0) {
        errors.push(`${filename} (KO) place[${index}]: personalNote is required (non-empty)`);
      }

      if (place.lat < 33 || place.lat > 39) {
        errors.push(
          `${filename} (KO) place[${index}]: latitude ${place.lat} outside bounds [33, 39]`
        );
      }

      if (place.lng < 124 || place.lng > 132) {
        errors.push(
          `${filename} (KO) place[${index}]: longitude ${place.lng} outside bounds [124, 132]`
        );
      }
    });
  }

  if (enFront.places) {
    enFront.places.forEach((place, index) => {
      if (!place.name || place.name.trim().length === 0) {
        errors.push(`${filename} (EN) place[${index}]: name is required`);
      }

      if (!place.address || place.address.trim().length === 0) {
        errors.push(`${filename} (EN) place[${index}]: address is required`);
      }

      if (!place.description || place.description.trim().length === 0) {
        errors.push(`${filename} (EN) place[${index}]: description is required`);
      }

      if (!place.personalNote || place.personalNote.trim().length === 0) {
        errors.push(`${filename} (EN) place[${index}]: personalNote is required (non-empty)`);
      }

      if (place.lat < 33 || place.lat > 39) {
        errors.push(
          `${filename} (EN) place[${index}]: latitude ${place.lat} outside bounds [33, 39]`
        );
      }

      if (place.lng < 124 || place.lng > 132) {
        errors.push(
          `${filename} (EN) place[${index}]: longitude ${place.lng} outside bounds [124, 132]`
        );
      }
    });
  }

  return errors;
}
