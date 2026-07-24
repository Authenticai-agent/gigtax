/**
 * Fields for the freelance-rate pSEO tree (add-on task 3).
 *
 * No rates or market figures live here — per the file's honesty rule, market
 * numbers come from BLS OES and the user, never invented. What is stored is
 * field-specific, genuinely varying content: the typical overhead of that field
 * and how much of the week is realistically billable, which is what changes the
 * floor-rate math from one field to the next.
 */
export interface FreelanceField {
  slug: string;
  name: string;
  blsGroup: string;
  /** Typical business overhead for this field — the deductible cost base. */
  overheadNote: string;
  /** How billable the week tends to be, and why — drives the rate uplift. */
  billableNote: string;
  /** A reasonable default weekly billable hours for the preset. */
  defaultBillable: number;
}

export const FREELANCE_FIELDS: FreelanceField[] = [
  { slug: 'graphic-designer', name: 'Graphic Designer', blsGroup: 'Graphic Designers (27-1024)',
    overheadNote: 'Design software subscriptions (Adobe CC, Figma), a capable machine, fonts and stock assets, and a portfolio site — modest but constant.',
    billableNote: 'Revisions, pitching, and admin eat into the week; many designers bill 20–25 of 40 hours, which pushes the required rate well above a naive salary split.', defaultBillable: 25 },
  { slug: 'web-developer', name: 'Web Developer', blsGroup: 'Web Developers (15-1254)',
    overheadNote: 'Hosting, dev tools and CI, a strong machine, and ongoing learning — plus errors-and-omissions insurance for client work.',
    billableNote: 'Debugging, scoping, and unpaid estimates reduce billable time; 25–30 billable hours is common, and fixed-bid projects hide the non-billable hours further.', defaultBillable: 28 },
  { slug: 'writer', name: 'Writer / Copywriter', blsGroup: 'Writers and Authors (27-3043)',
    overheadNote: 'Low overhead — research tools, a few subscriptions, a website. The main cost is unbillable time, not equipment.',
    billableNote: 'Research and revisions are often unpaid; effective billable hours can be low, so per-word or per-project pricing usually beats hourly for protecting the floor.', defaultBillable: 22 },
  { slug: 'photographer', name: 'Photographer', blsGroup: 'Photographers (27-4021)',
    overheadNote: 'The heaviest-overhead field here: bodies and lenses, lighting, insurance, editing software, storage, and gear replacement. Equipment depreciation is real money.',
    billableNote: 'Shoot time is a fraction of the job — editing, culling, travel, and marketing dominate. A one-hour shoot can carry several unbillable hours behind it.', defaultBillable: 18 },
  { slug: 'consultant', name: 'Consultant', blsGroup: 'Management Analysts (13-1111)',
    overheadNote: 'Low physical overhead but high business-development cost: proposals, networking, and a professional presence. Liability insurance where advice carries risk.',
    billableNote: 'Selling the next engagement is unpaid and constant; senior consultants may bill half their hours, which is exactly why day rates look high.', defaultBillable: 20 },
  { slug: 'marketing-consultant', name: 'Marketing Consultant', blsGroup: 'Marketing Managers (11-2021)',
    overheadNote: 'Ad-tech and analytics subscriptions, testing budgets, and tools — plus the pitching and reporting that clients rarely pay for directly.',
    billableNote: 'Reporting, meetings, and new-business work are heavy; retainers smooth the income but the non-billable share stays high.', defaultBillable: 24 },
  { slug: 'video-editor', name: 'Video Editor', blsGroup: 'Film and Video Editors (27-4032)',
    overheadNote: 'A powerful workstation, editing suites, plugins, fast storage, and render capacity — equipment-heavy and quick to date.',
    billableNote: 'Rendering, revisions, and asset management add unpaid hours; effective billable time is often well below the hours at the desk.', defaultBillable: 25 },
  { slug: 'bookkeeper', name: 'Bookkeeper', blsGroup: 'Bookkeeping, Accounting, and Auditing Clerks (43-3031)',
    overheadNote: 'Accounting software seats (QuickBooks, Xero), secure document handling, and professional insurance. Overhead is low and predictable.',
    billableNote: 'Client onboarding and cleanup are often underpriced; recurring monthly fees per client stabilise the billable picture better than hourly.', defaultBillable: 28 },
  { slug: 'virtual-assistant', name: 'Virtual Assistant', blsGroup: 'Secretaries and Administrative Assistants (43-6014)',
    overheadNote: 'Minimal — subscriptions, a reliable machine and connection. The cost is time between clients, not equipment.',
    billableNote: 'Task-switching and coordination are hard to bill fully; retainer hours protect the floor better than piecework.', defaultBillable: 30 },
  { slug: 'social-media-manager', name: 'Social Media Manager', blsGroup: 'Public Relations Specialists (27-3031)',
    overheadNote: 'Scheduling and analytics tools, design subscriptions, and sometimes a small content budget.',
    billableNote: 'Content creation, community management, and reporting spread across the week; clients often underestimate the hours, so packaged retainers help.', defaultBillable: 25 },
  { slug: 'translator', name: 'Translator', blsGroup: 'Interpreters and Translators (27-3091)',
    overheadNote: 'CAT tools, glossaries and reference resources, and a website. Low overhead, high skill.',
    billableNote: 'Per-word pricing is standard precisely because unbillable research and formatting would otherwise erode an hourly rate.', defaultBillable: 25 },
  { slug: 'personal-trainer', name: 'Personal Trainer', blsGroup: 'Exercise Trainers and Group Fitness Instructors (39-9031)',
    overheadNote: 'Certifications and continuing education, liability insurance, equipment, and gym space or rent — a real fixed base.',
    billableNote: 'Only session time is billable; travel, program design, and client acquisition are not, so the per-session rate has to carry all of it.', defaultBillable: 20 },
];

export const fieldBySlug = (slug: string) => FREELANCE_FIELDS.find((f) => f.slug === slug);
