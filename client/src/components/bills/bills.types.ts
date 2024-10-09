import { APIResponse } from "@/lib/types";
import { Profile } from "../dashboard/dashboard.types";

export type BillsResponse = APIResponse<FullBill[]>;
export type BillDetailResponse = APIResponse<BillDetail>;

export type FullBill = {
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
  owner: Profile["data"];
  members: BillMember[];
  paidMembers: BillMember[];
  unpaidMembers: BillMember[];
};

export type BillDetail = Omit<FullBill, "paidMembers" | "unpaidMembers"> & {
  invitations: Invitation[];
  payments: Payment[];
  unassignedAmount: number;
};

export type BillMember = {
  id: number;
  userId: number;
  billId: number;
  role: string;
  joinedAt: string;
  assignedAmount: number;
  paidAmount: number;
  user: Profile["data"];
  payments: Payment[];
};

export type Invitation = {
  id: number;
  email: string;
  billId: number;
  status: string;
  assignedAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: number;
  amount: number;
  status: string;
  paystackRef: string;
  userId: number;
  billId: number;
  billMemberId: number;
  createdAt: string;
  updatedAt: string;
};
