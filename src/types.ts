export type DetourPreference='最短'|'少しなら'|'積極';
export type Answers={
  currentNodeId:string;
  finalNodeId:string;
  remainingTimeMin:number;
  interestTagIds:string[];
  availableMode:'徒歩';
  maxWalkMin:number|null;
  detourPreference:DetourPreference;
  discoveryOptIn:boolean;
  firstVisit:boolean;
};
export type VisitRecord={
  experienceId:string; startedAt:string; completedAt?:string; completed:boolean;
  helpful?:'great'|'okay'|'not'; counterfactual?:'no'|'probablyNo'|'yes';
};
export type HistoryState={visitHistory:VisitRecord[];preferences?:Partial<Answers>;firstVisitAt:string;lastVisitAt:string};
export type Recommendation={
  id:string;
  nodeId:string;
  nodeName:string;
  actionId:string;
  actionName:string;
  layer:'L1'|'L2';
  originalRouteMinutes:number;
  viaRouteMinutes:number;
  detourMinutes:number;
  originalDistanceM:number|null;
  viaDistanceM:number|null;
  additionalDistanceM:number|null;
  matchingTags:string[];
  reason:string;
  dataStatus:string;
};
export type ResearchCandidate={
  nodeId:string; nodeName:string; status:string; category:string; matchingTags:string[];
  priority?:'A'|'B'; blockers:string[]; note:string|null;
};

/* Legacy types kept temporarily so the older sample-data modules still type-check.
   The DB V4 flow does not use these modules. */
export type WalkingLevel='low'|'medium'|'high';
export type VerificationStatus='verified'|'sample'|'needs_review';
export type Place={
  id:string;name:string;category:string[];regionalPriority:number;
  navigationUrl:string;verificationStatus:VerificationStatus;source?:string;lastVerified?:string;active:boolean;
};
export type Hook={
  id:string;placeId:string;interests:string[];headline:string;body:string;
  hookType:'discovery'|'visual'|'taste'|'story'|'craft'|'local-life';
  verificationStatus:VerificationStatus;source?:string;lastVerified?:string;active:boolean;
};
export type ActionType='LOOK'|'FIND'|'PHOTOGRAPH'|'CHOOSE'|'TASTE'|'COMPARE'|'TOUCH'|'TALK'|'MAKE'|'COLLECT'|'WALK'|'LISTEN';
export type MicroExperience={
  id:string;placeId:string;name:string;description:string;actionType:ActionType;
  durationMinutes:number;interestTags:string[];walkingLevel:WalkingLevel;
  staffRequired:boolean;reservationRequired:boolean;costYen:number;
  weather:'indoor'|'outdoor'|'mixed';rainyDaySuitable:boolean;experienceQuality:number;active:boolean;sample:boolean;
};
export type PlaceEdge={
  fromPlaceId:string;toPlaceId:string;minutes:number;walkingMeters:number;
  bidirectional:boolean;verificationStatus:VerificationStatus;
};
