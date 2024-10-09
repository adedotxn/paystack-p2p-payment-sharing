import { PrismaClient, BillStatus as PrismaBillStatus } from "@prisma/client";

export enum BillStatus {
  OPEN = "open",
  CLOSED = "closed",
  SETTLED = "settled",
}

class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserFromToken(authHeader: string) {
    const tokenParts = authHeader.split(" ");
    const accessToken = tokenParts[1];

    return this.prisma.userVerification.findUnique({
      where: { accessToken },
      include: { user: true },
    });
  }

  async getUserBills(userId: number, statusFilter?: BillStatus) {
    return this.prisma.bill.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        ...(statusFilter && {
          status: this.mapBillStatus(statusFilter),
        }),
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
            payments: true,
          },
        },
      },
    });
  }

  async getUserActiveBills(userId: number) {
    return this.prisma.bill.findMany({
      where: {
        members: {
          some: { userId },
        },
        status: PrismaBillStatus.OPEN,
      },
      include: { members: true },
    });
  }

  async getSumOfUserPayments(userId: number) {
    return this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
  }

  async getSumOfUserBillAssignedAmounts(userId: number) {
    return this.prisma.billMember.aggregate({
      _sum: { assignedAmount: true },
      where: { userId },
    });
  }

  async getSumOfUserBillPaidAmounts(userId: number) {
    return this.prisma.billMember.aggregate({
      _sum: { paidAmount: true },
      where: { userId },
    });
  }

  async getUserPaymentSummary(userId: number) {
    const [totalPaidResult, totalAssignedResult, totalPaidAssignedResult] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { userId },
        }),
        this.prisma.billMember.aggregate({
          _sum: { assignedAmount: true },
          where: { userId },
        }),
        this.prisma.billMember.aggregate({
          _sum: { paidAmount: true },
          where: { userId },
        }),
      ]);

    return {
      totalPaid: totalPaidResult._sum.amount || 0,
      totalAssigned: totalAssignedResult._sum.assignedAmount || 0,
      totalPaidAssigned: totalPaidAssignedResult._sum.paidAmount || 0,
    };
  }

  private mapBillStatus(status: BillStatus): PrismaBillStatus {
    switch (status) {
      case BillStatus.OPEN:
        return PrismaBillStatus.OPEN;
      case BillStatus.SETTLED:
        return PrismaBillStatus.SETTLED;
      case BillStatus.CLOSED:
        return PrismaBillStatus.CLOSED;
      default:
        throw new Error(`Unsupported BillStatus: ${status}`);
    }
  }
}

export const userService = new UserService();
