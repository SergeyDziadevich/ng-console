export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
}

export interface SubscriptionData {
  status: string;
  plan: string;
  currentPeriodEnd: string;
}

export interface InvoiceData {
  id: string;
  amount: number;
  status: string;
  date: string;
  downloadUrl?: string;
}