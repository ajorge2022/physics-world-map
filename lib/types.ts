export type Physicist = {
  id: string;
  name: string;
  university_origin: string | null;
  current_city: string;
  country: string;
  current_institution: string | null;
  position: string | null;
  research_field: string | null;
  email: string | null;
  show_email: boolean;
  website: string | null;
  orcid: string | null;
  linkedin: string | null;
  year_left_university: number | null;
  latitude: number;
  longitude: number;
  is_approved: boolean;
  is_public: boolean;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicPhysicist = Omit<
  Physicist,
  "email" | "is_approved" | "is_public" | "consent_given" | "created_at" | "updated_at"
> & {
  email: string | null;
};
