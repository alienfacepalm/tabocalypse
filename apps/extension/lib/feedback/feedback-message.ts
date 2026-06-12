export const TABOCALYPSE_FEEDBACK_SEND = "tabocalypse/feedbackSend" as const;

export type TFeedbackKind = "feedback" | "featureRequest";

export type TTabocalypseFeedbackSendRequest = {
  type: typeof TABOCALYPSE_FEEDBACK_SEND;
  kind: TFeedbackKind;
  message: string;
  replyEmail?: string;
  extensionVersion: string;
  userAgent: string;
};

export type TTabocalypseFeedbackSendOk = {
  ok: true;
};

export type TTabocalypseFeedbackSendErr = {
  ok: false;
  error: string;
};

export type TTabocalypseFeedbackSendResponse =
  | TTabocalypseFeedbackSendOk
  | TTabocalypseFeedbackSendErr;
