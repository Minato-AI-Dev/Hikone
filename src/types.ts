export type WalkingLevel = 'low' | 'medium' | 'high';
export type Experience = {
  id: string; name: string; shortDescription: string; area: string; category: string[]; theme: string[];
  durationMinutes: number; budgetMin: number; budgetMax: number; walkingLevel: WalkingLevel;
  indoorOutdoor: 'indoor'|'outdoor'|'mixed'; rainyDaySuitable: boolean; recommendedForFirstVisit: boolean;
  recommendedForRepeatVisit: boolean; navigationUrl: string; story?: string; mission?: string;
  relatedExperienceIds: string[]; continuationOf?: string[]; active: boolean; sample: boolean;
};
export type Answers = { time: number; returnTo: string; interests: string[]; walking: WalkingLevel; budget: number | null; firstVisit: boolean };
export type VisitRecord = { experienceId: string; startedAt: string; completedAt?: string; completed: boolean; helpful?: 'great'|'okay'|'not'; counterfactual?: 'no'|'probablyNo'|'yes' };
export type HistoryState = { visitHistory: VisitRecord[]; preferences?: Partial<Answers>; firstVisitAt: string; lastVisitAt: string };
export type Recommendation = { experience: Experience; score: number; totalMinutes: number; travelOut: number; travelBack: number; buffer: number; reason: string };
