import { PrismaClient } from "@prisma/client";

class PaymentService {
  private prisma = new PrismaClient();

  async findUserByAccessToken(authHeader: string) {
    const tokenParts = authHeader.split(" ");
    const access_token = tokenParts[1];

    return this.prisma.userVerification.findUnique({
      where: { accessToken: access_token },
      include: { user: true },
    });
  }

  async findBillMember(userId: number, billId: number) {
    return this.prisma.billMember.findFirst({
      where: { userId, billId },
    });
  }

  async createPayment(data: {
    amount: number;
    status: "PENDING" | "SUCCESSFUL" | "FAILED";
    paystackRef: string;
    userId: number;
    billId: number;
    billMemberId: number;
    updatedAt?: Date;
  }) {
    return this.prisma.payment.create({ data });
  }

  async updateBillMember(billMemberId: number, paidAmount: number) {
    return this.prisma.billMember.update({
      where: { id: billMemberId },
      data: { paidAmount },
    });
  }

  async findBillById(billId: number) {
    return this.prisma.bill.findUnique({
      where: { id: billId },
      include: { owner: true },
    });
  }

  async updateBill(billId: number, currentAmount: number) {
    return this.prisma.bill.update({
      where: { id: billId },
      data: { currentAmount },
    });
  }

  async settleBill(billId: number) {
    return this.prisma.bill.update({
      where: { id: billId },
      data: { status: "SETTLED" },
    });
  }

  async closeBill(billId: number) {
    return this.prisma.bill.update({
      where: { id: billId },
      data: { status: "CLOSED" },
    });
  }

  async finalizeBill(billId: number) {
    return this.prisma.bill.update({
      where: { id: billId },
      data: { status: "SETTLED" },
    });
  }
}

export const paymentService = new PaymentService();
