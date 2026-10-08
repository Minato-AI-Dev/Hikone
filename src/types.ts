export type WalkingLevel = 'low' | 'medium' | 'high';
export type RecommendationMode = 'minimum_detour' | 'best_match' | 'explore_hikone';
export type VerificationStatus = 'verified' | 'sample' | 'needs_review';

export type Place = {
  id: string; name: string; category: string[]; regionalPriority: number;
  navigationUrl: string; verificationStatus: VerificationStatus;
  source?: string; lastVerified?: string; active: boolean;
};

export type Hook = {
  id: string; placeId: string; interests: string[]; headline: string; body: string;
  hookType: 'discovery'|'visual'|'taste'|'story'|'craft'|'local-life';
  verificationStatus: VerificationStatus; source?: string; lastVerified?: string; active: boolean;
};

export type ActionType = 'LOOK'|'FIND'|'PHOTOGRAPH'|'CHOOSE'|'TASTE'|'COMPARE'|'TOUCH'|'TALK'|'MAKE'|'COLLECT'|'WALK'|'LISTEN';

export type MicroExperience = {
  id: string; placeId: string; name: string; description: string; actionType: ActionType;
  durationMinutes: number; interestTags: string[]; walkingLevel: WalkingLevel;
  staffRequired: boolean; reservationRequired: boolean; costYen: number;
  weather: 'indoor'|'outdoor'|'mixed'; rainyDaySuitable: boolean;
  experienceQuality: number; active: boolean; sample: boolean;
};

export type PlaceEdge = {
  fromPlaceId: string; toPlaceId: string; minutes: number; walkingMeters: number;
  bidirectional: boolean; verificationStatus: VerificationStatus;
};

export type Answers = {
  currentLocation: string; finalDestination: string; time: number; interests: string[];
  walking: WalkingLevel; budget: number | null; firstVisit: boolean;
};

export type VisitRecord = {
  experienceId: string; startedAt: string; completedAt?: string; completed: boolean;
  helpful?: 'great'|'okay'|'not'; counterfactual?: 'no'|'probablyNo'|'yes';
};

export type HistoryState = {
  visitHistory: VisitRecord[]; preferences?: Partial<Answers>;
  firstVisitAt: string; lastVisitAt: string;
};

export type Recommendation = {
  id: string; mode: RecommendationMode; place: Place; hook: Hook; experience: MicroExperience;
  score: number; originalRouteMinutes: number; totalJourneyMinutes: number;
  detourMinutes: number; additionalWalkingMeters: number;
  travelOut: number; travelBack: number; buffer: number; reason: string;
};
