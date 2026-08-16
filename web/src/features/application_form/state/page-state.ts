import {
  applicationFormImages,
  applicationFormSections,
  applicationFormShareholderFields,
} from "../config/form-config";

export type PageFieldValue = {
  fkey: string;
  label: string;
  value: string | null;
};

export type PageSectionValue = {
  key: string;
  label: string;
  fields: PageFieldValue[];
};

export type PageShareholderSection = PageSectionValue & {
  id: string;
};

export type PageUploadedImage = {
  key: string;
  label: string;
  file_id: number;
  name: string;
};

export type PageImageValue = {
  key: string;
  label: string;
  files: PageUploadedImage[];
};

export type PagePremisesSource =
  | { type: "lease_material"; community_id?: string | null }
  | { type: "rental_community"; community_id?: string | null };

export type ApplicationFormPayload = {
  version: 1;
  sections: PageSectionValue[];
  shareholder_sections: PageShareholderSection[];
  images: PageImageValue[];
  premises_source: PagePremisesSource | null;
};

export type ApplicationFormDraftPayload = ApplicationFormPayload;
export type ApplicationFormSubmitPayload = ApplicationFormPayload;

export function createApplicationFormPayload(): ApplicationFormPayload {
  return {
    version: 1,
    sections: applicationFormSections.map((section) => ({
      key: section.key,
      label: section.label,
      fields: section.fields.map((field) => ({
        fkey: field.fkey,
        label: field.label,
        value: null,
      })),
    })),
    shareholder_sections: [createShareholderSection("shareholder-1", "股东一")],
    images: applicationFormImages.map((image) => ({
      key: image.key,
      label: image.label,
      files: [],
    })),
    premises_source: null,
  };
}

export function createShareholderSection(id: string, label: string): PageShareholderSection {
  return {
    id,
    key: "shareholder",
    label,
    fields: applicationFormShareholderFields.map((field) => ({
      fkey: field.fkey,
      label: field.label,
      value: null,
    })),
  };
}
