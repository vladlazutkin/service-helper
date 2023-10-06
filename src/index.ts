import { initBot } from './telegram-bot';

require('dotenv').config();
import Stripe from 'stripe';
import { server } from './socket';
import { connectDatabase } from './database';
import { getStripeWebhookUrl } from './helpers/stripe';
import { chessSkins } from './constants/chess-skins';
import { ChessSkinModel } from './models/games/chess-skin';
import { createVapidDetails } from './external-api/webpush';
import { logger } from './logger';

const port = process.env.PORT || 5000;

const updateChessSkins = async () => {
  await ChessSkinModel.deleteMany({});
  await Promise.all(chessSkins.map((s) => ChessSkinModel.create(s)));
  logger.debug('Updated chess skins');
};

const addStripeWebhook = async () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2022-11-15',
  });

  const webhookEndpoints = await stripe.webhookEndpoints.list();

  await Promise.all(
    webhookEndpoints.data.map((e) => stripe.webhookEndpoints.del(e.id))
  );

  await stripe.webhookEndpoints.create({
    url: getStripeWebhookUrl(),
    enabled_events: [
      'checkout.session.async_payment_succeeded',
      'checkout.session.completed',
      'checkout.session.async_payment_failed',
    ],
  });
};

server.listen(port, async () => {
  logger.debug(`Listening: http://localhost:${port}`);
  await connectDatabase();
  createVapidDetails();
  await addStripeWebhook();
  await initBot();
  // updateChessSkins();
});
