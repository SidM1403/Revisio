import Razorpay from 'razorpay';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: 999 * 100, // INR
      currency: 'INR',
      receipt: `receipt_${userId}`,
      payment_capture: 1,
    };

    const response = await razorpay.orders.create(options);
    return Response.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
