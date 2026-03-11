export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  stripePaymentIntentId?: string;
  createdAt: string;
}

export interface PaymentCreateInput {
  orderId: string;
  userId: string;
  amountCents: number;
  currency: string;
}

// Simulated database
const payments: Payment[] = [];

export const PaymentModel = {
  async create(input: PaymentCreateInput): Promise<Payment> {
    const payment: Payment = {
      id: `pay_${Date.now()}`,
      ...input,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    payments.push(payment);
    return payment;
  },

  async findById(id: string): Promise<Payment | null> {
    return payments.find((p) => p.id === id) || null;
  },

  async findByUserId(userId: string): Promise<Payment[]> {
    return payments.filter((p) => p.userId === userId);
  },
};
