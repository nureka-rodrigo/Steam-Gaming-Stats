export interface Milestone {
  hours: number;
  label: string;
  funLabel: string;
}

export const MILESTONES: Milestone[] = [
  { hours: 10, label: '10 hours', funLabel: 'enough to learn the basics' },
  {
    hours: 100,
    label: '100 hours',
    funLabel: 'enough to watch all of Breaking Bad 4×',
  },
  {
    hours: 500,
    label: '500 hours',
    funLabel: 'enough to drive from NYC to LA and back 3×',
  },
  { hours: 1000, label: '1,000 hours', funLabel: 'enough to fly around the world twice' },
  {
    hours: 2000,
    label: '2,000 hours',
    funLabel: 'enough to walk the entire Great Wall of China',
  },
  {
    hours: 5000,
    label: '5,000 hours',
    funLabel: "halfway to Gladwell's 10,000-hour mastery rule",
  },
  { hours: 10000, label: '10,000 hours', funLabel: "you've mastered gaming, per Gladwell" },
  { hours: 25000, label: '25,000 hours', funLabel: 'enough to orbit Earth 37× on the ISS' },
  {
    hours: 50000,
    label: '50,000 hours',
    funLabel: 'over 5 years of your life — Valve thanks you',
  },
];

export interface MilestoneResult {
  current: Milestone | null;
  next: Milestone | null;
  progressPercent: number;
}

export function findCurrentMilestone(totalHours: number): MilestoneResult {
  let current: Milestone | null = null;
  let next: Milestone | null = null;

  for (const milestone of MILESTONES) {
    if (totalHours >= milestone.hours) {
      current = milestone;
    } else {
      next = milestone;
      break;
    }
  }

  let progressPercent = 0;
  if (next) {
    const prevHours = current?.hours ?? 0;
    const range = next.hours - prevHours;
    progressPercent = Math.round(((totalHours - prevHours) / range) * 100);
  } else {
    progressPercent = 100;
  }

  return { current, next, progressPercent };
}
