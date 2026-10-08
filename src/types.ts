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
