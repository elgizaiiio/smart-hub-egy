// Subscription gating logic for media/code features
import { FREE_MODEL_IDS } from "@/lib/modelDetails";

export const PAID_PLANS = ["starter", "pro", "elite", "enterprise"];

export const isFreeModel = (modelId: string): boolean => {
  return FREE_MODEL_IDS.includes(modelId);
};

export const isPaidUser = (plan: string | null | undefined): boolean => {
  if (!plan) return false;
  return PAID_PLANS.includes(plan.toLowerCase());
};

export const canUseModel = (modelId: string, plan: string | null | undefined): boolean => {
  if (isFreeModel(modelId)) return true;
  return isPaidUser(plan);
};

export const canUseCodeWorkspace = (plan: string | null | undefined): boolean => {
  return isPaidUser(plan);
};
