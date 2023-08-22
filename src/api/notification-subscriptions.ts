import express from 'express';
import webpush, { SendResult } from 'web-push';
import jwtAdminAuthMiddleware from '../middlewares/jwt-admin.auth.middleware';
import { NotificationSubscriptionModel } from '../models/notification-subscription';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';

const router = express.Router();

router.get('/', jwtAdminAuthMiddleware, async (req: any, res) => {
  try {
    const { order, orderBy, limit, skip, search } = req.query;
    const subscriptions = await NotificationSubscriptionModel.find()
      .sort({
        [orderBy]: order === 'asc' ? 1 : -1,
      })
      .skip(skip)
      .limit(limit)
      .populate('user');
    const mapped = subscriptions.map((sub) => {
      const { _id, user } = sub.toObject();
      return {
        _id,
        email: user.email,
      };
    });
    const total = await NotificationSubscriptionModel.count();
    res.status(200).json({
      data: mapped,
      total,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const subscription = await NotificationSubscriptionModel.findOne({
      user: user._id,
    });
    return res.status(200).json(subscription);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/send', jwtAdminAuthMiddleware, async (req, res) => {
  try {
    try {
      const notification = req.body;

      const subscriptions = await NotificationSubscriptionModel.find();

      const notifications: Promise<SendResult>[] = [];
      subscriptions.forEach((subscription) => {
        notifications.push(
          webpush.sendNotification(subscription, JSON.stringify(notification))
        );
      });

      await Promise.all(notifications);
      res.sendStatus(200);
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/send/:id', jwtAdminAuthMiddleware, async (req, res) => {
  try {
    try {
      const { id } = req.params;
      const notification = req.body;

      const subscription = await NotificationSubscriptionModel.findById(id);

      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(notification)
      );

      res.sendStatus(200);
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const user = getUserFromRequest(req);

    const subscription = await NotificationSubscriptionModel.create({
      ...data,
      user: user._id,
    });

    const notification = { title: 'Test notification' };

    await webpush.sendNotification(subscription, JSON.stringify(notification));

    return res.status(200).json(subscription);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const subscription = await NotificationSubscriptionModel.findById(
      id
    ).populate('user');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    if (subscription.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await NotificationSubscriptionModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
