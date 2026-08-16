import type {
  ApplicationFormPayload,
  ApplicationFormSubmitPayload,
  PageFieldValue,
  PageImageValue,
  PagePremisesSource,
  PageSectionValue,
  PageShareholderSection,
} from "../state/page-state";

const normalizeValue = (value: string | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeField = (field: PageFieldValue): PageFieldValue => ({
  fkey: field.fkey,
  label: field.label,
  value: normalizeValue(field.value),
});

export function buildSubmitSections(sections: PageSectionValue[]): PageSectionValue[] {
  return sections.map((section) => ({
    key: section.key,
    label: section.label,
    fields: section.fields.map(normalizeField),
  }));
}

export function buildSubmitShareholderSections(items: PageShareholderSection[]): PageShareholderSection[] {
  const normalized = items.map((item) => ({
    id: item.id,
    key: item.key,
    label: item.label,
    fields: item.fields.map(normalizeField),
  }));
  return normalized.length ? normalized : [{ id: "shareholder-1", key: "shareholder", label: "股东一", fields: [] }];
}

export function buildSubmitImages(images: PageImageValue[]): PageImageValue[] {
  return images.map((image) => ({
    key: image.key,
    label: image.label,
    files: image.files
      .filter((file) => Number.isFinite(file.file_id))
      .map((file) => ({
        key: file.key,
        label: file.label,
        file_id: file.file_id,
        name: file.name,
      })),
  }));
}

export function buildSubmitPremisesSource(source: PagePremisesSource | null): PagePremisesSource | null {
  if (!source) {
    return null;
  }
  if (source.type === "rental_community") {
    return {
      type: "rental_community",
      community_id: source.community_id ?? null,
    };
  }
  return { type: "lease_material" };
}

export function buildApplicationFormPayload(input: ApplicationFormPayload): ApplicationFormSubmitPayload {
  return {
    version: 1,
    sections: buildSubmitSections(input.sections),
    shareholder_sections: buildSubmitShareholderSections(input.shareholder_sections),
    images: buildSubmitImages(input.images),
    premises_source: buildSubmitPremisesSource(input.premises_source),
  };
}
