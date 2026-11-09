/**
 * Curated real workplace photos from Pexels.
 * Source pages: https://www.pexels.com/photo/<photoId>/
 * Provider licence: https://www.pexels.com/license/
 * Optimised local copies are served by the website, not hotlinked.
 */
export const solutionPhotos: Record<string, { photoId: number; alt: string }> = {
  "core-hrms": { photoId: 1181421, alt: "Colleagues discussing their work around a shared office table" },
  "time-and-workforce-management": { photoId: 14465804, alt: "A professional organising a work schedule with a planner and laptop" },
  "payroll-and-compliance": { photoId: 8297220, alt: "An accountant reviewing financial documents with a calculator" },
  "recruitment-and-ats": { photoId: 5439143, alt: "A candidate speaking with recruiters during an office interview" },
  "performance-and-talent-management": { photoId: 7654408, alt: "A team reviewing ideas and goals during a whiteboard presentation" },
  "employee-engagement": { photoId: 7792868, alt: "Colleagues sharing ideas during a collaborative team discussion" },
  "learning-and-development": { photoId: 8369660, alt: "Professionals taking part in a group learning session" },
  "hr-administration-and-operations": { photoId: 7644014, alt: "An office team coordinating plans and reviewing documents together" },
  "governance-and-specialised-compliance": { photoId: 7841499, alt: "Professionals reviewing and signing business documents" },
  "extended-hr-services": { photoId: 7652049, alt: "Business professionals collaborating on plans at an office table" },
  "posh-management": { photoId: 7868982, alt: "A diverse team listening and discussing workplace matters together" },
  "employer-of-record-eor": { photoId: 5439455, alt: "Two professionals reviewing employment paperwork in an office" },
  "frro-immigration": { photoId: 6726195, alt: "Travellers with luggage moving through an airport terminal" },
  "contract-labour-management": { photoId: 18503948, alt: "A construction professional wearing a hard hat and protective workwear" },
  "hr-outsourcing": { photoId: 7654132, alt: "Office professionals working together on documents and laptops" },
  "recruitment-outsourcing": { photoId: 4342496, alt: "A candidate discussing a role with an interviewer" },
  "background-verification": { photoId: 7841506, alt: "A professional checking and completing a business document" },
  "cpd-learning-development": { photoId: 7648042, alt: "A group of professionals attending a training presentation" },
  "employee-wellness": { photoId: 8436707, alt: "A group taking part in a yoga and wellbeing session" },
  "manpower-planning": { photoId: 15141493, alt: "A team reviewing a presentation and planning their work together" },
};

export function defaultSolutionPhoto(slug: string) {
  const photo = solutionPhotos[slug];
  if (!photo) throw new Error(`Missing default solution photograph: ${slug}`);
  return { imageUrl: `/solution-photos/${slug}.webp`, imageAlt: photo.alt };
}
