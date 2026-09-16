export type AnalyticsEvent =
  | 'app_open'
  | 'questionnaire_started'
  | 'questionnaire_completed'
  | 'recommendation_viewed'
  | 'recommendation_selected'
  | 'experience_started'
  | 'navigation_clicked'
  | 'experience_completed'
  | 'experience_not_completed'
  | 'second_experience_selected'
  | 'returning_user_detected'
  | 'continue_previous_selected'
  | 'different_hikone_selected'
  | 'qr_scanner_opened'
  | 'qr_checkin_success';

export function track(event:AnalyticsEvent, data:Record<string,unknown>={}){
  console.info('[analytics]', event, data);
}
