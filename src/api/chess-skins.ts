import express from 'express';
import Stripe from 'stripe';
import { logger } from '../logger';
import { ChessSkinModel } from '../models/chess-skin';
import { getStripeCallbackUrl } from '../helpers/stripe';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  TransactionModel,
} from '../models/transaction';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { UserModel } from '../models/user';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const router = express.Router();

router.get('/', async (req: any, res) => {
  try {
    const userFromRequest = getUserFromRequest(req);
    const user = await UserModel.findById(userFromRequest._id).populate(
      'chessSkins'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skins = await ChessSkinModel.find();
    const withBought = skins.map((s) => ({
      ...s.toObject(),
      bought: !!user.chessSkins?.find(
        (bS) => bS._id.toString() === s._id.toString()
      ),
    }));

    res.status(200).json(withBought);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/buy', async (req: any, res) => {
  try {
    const { id } = req.body;
    const skin = await ChessSkinModel.findById(id);

    if (!skin) {
      return res.status(404).json({ message: 'Skin not found' });
    }

    const userFromRequest = getUserFromRequest(req);
    const user = await UserModel.findById(userFromRequest._id).populate(
      'chessSkins'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skinExists = user.chessSkins?.find(
      (s) => s._id.toString() === skin._id.toString()
    );

    if (skinExists) {
      return res.status(400).json({ message: 'Skin already purchased' });
    }

    // Test
    //  user.chessSkins?.push(skin);
    //  await user.save();

    // Payout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'USD',
            product_data: {
              name: skin.title,
            },
            unit_amount: skin.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: getStripeCallbackUrl(true),
      cancel_url: getStripeCallbackUrl(false),
    });

    await TransactionModel.create({
      user: user._id,
      sessionId: session.id,
      type: TRANSACTION_TYPE.CHESS_SKIN,
      status: TRANSACTION_STATUS.PENDING,
      additionalData: JSON.stringify({
        skinId: skin._id,
      }),
    });

    res.status(200).json({ id: session.id });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
