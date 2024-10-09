import { APIResponse } from "@/lib/types";

export type ActiveBills = APIResponse<[]>;

export type BillsOverview = APIResponse<{
  totalPaid: number;
  totalAssigned: number;
  totalPaidAssigned: number;
  totalUnpaid: number;
}>;

export type Bill = {
  id: number;
  title: string;
  slug: string;
  description: string;
  totalAmount: number;
  currentAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
  ownerId: number;
  owner: {
    id: number;
    email: string;
    name: string;
    picture: string;
    createdAt: string;
    updatedAt: string;
  };
  members: unknown[];
  paidMembers: unknown[];
  unpaidMembers: unknown[];
};

export type RecentBills = APIResponse<Bill[]>;

export type Profile = APIResponse<{
  id: number;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  updatedAt: string;
}>;
