import express from 'express';
import { logger } from '../logger';
import {
  Transaction,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
  TransactionModel,
} from '../models/transaction';
import { UserModel } from '../models/user';
import { ChessSkinModel } from '../models/games/chess-skin';
import { assertCannotReach } from '../helpers/shared/assertCannotReach';

const router = express.Router();

const applyTransaction = async (
  transaction: Transaction
): Promise<{ result: boolean }> => {
  switch (transaction.type) {
    case TRANSACTION_TYPE.CHESS_SKIN:
      if (!transaction.additionalData) {
        return {
          result: false,
        };
      }
      const data = JSON.parse(transaction.additionalData);
      if (!data.skinId) {
        return {
          result: false,
        };
      }
      const skin = await ChessSkinModel.findById(data.skinId);
      if (!skin) {
        return {
          result: false,
        };
      }
      const user = await UserModel.findById(transaction.user._id).populate(
        'chessSkins'
      );
      if (user) {
        user.chessSkins?.push(skin);
        await user.save();
      }
      logger.debug('Chess skin added');
      return { result: true };
    case TRANSACTION_TYPE.CHECKERS_SKIN:
      return { result: true };
    default:
      assertCannotReach(transaction.type);
  }

  return {
    result: false,
  };
};

// router.get('/success', async (req: any, res) => {
//   try {
//     const { session_id } = req.query;
//
//     const transaction = await TransactionModel.findOne({
//       sessionId: session_id,
//     }).populate('user');
//
//     if (!transaction) {
//       return res.status(404).json({ message: 'Transaction not found' });
//     }
//
//     const { result } = await applyTransaction(transaction);
//
//     if (!result) {
//       await TransactionModel.findByIdAndUpdate(transaction._id, {
//         status: TRANSACTION_STATUS.FAIL,
//       });
//       return res.status(500).json({
//         message: 'Something went wrong when applying the transaction',
//       });
//     }
//     await TransactionModel.findByIdAndUpdate(transaction._id, {
//       status: TRANSACTION_STATUS.SUCCESS,
//     });
//
//     res.status(200).json({ message: 'ok' });
//   } catch (e: any) {
//     const message = e.message || e.msg || 'Error';
//     logger.error(message);
//     res.status(500).json({ error: message });
//   }
// });
//
// router.get('/cancel', async (req: any, res) => {
//   try {
//     const { session_id } = req.query;
//
//     const transaction = await TransactionModel.findOne({
//       sessionId: session_id,
//     });
//
//     if (!transaction) {
//       return res.status(404).json({ message: 'Transaction not found' });
//     }
//
//     await TransactionModel.findByIdAndUpdate(transaction._id, {
//       status: TRANSACTION_STATUS.FAIL,
//     });
//
//     res.json({
//       message: 'ok',
//     });
//   } catch (e: any) {
//     const message = e.message || e.msg || 'Error';
//     logger.error(message);
//     res.status(500).json({ error: message });
//   }
// });

router.post('/webhook', async (req, res) => {
  const event = req.body;

  logger.debug(`Stripe event is: ${event.type}`);
  switch (event.type) {
    case 'checkout.session.completed': {
      console.log(event.data);
      const { id } = event.data.object;
      const transaction = await TransactionModel.findOne({
        sessionId: id,
      }).populate('user');

      if (!transaction) {
        logger.error('Transaction not found');
        return res.json({ received: true });
      }

      const { result } = await applyTransaction(transaction);

      if (!result) {
        await TransactionModel.findByIdAndUpdate(transaction._id, {
          status: TRANSACTION_STATUS.FAIL,
        });
        logger.error('Something went wrong when applying the transaction');
        return res.json({ received: true });
      }
      await TransactionModel.findByIdAndUpdate(transaction._id, {
        status: TRANSACTION_STATUS.SUCCESS,
      });
      break;
    }
    case 'checkout.session.async_payment_failed': {
      const { id } = event.data.object;
      const transaction = await TransactionModel.findOne({
        sessionId: id,
      });

      if (!transaction) {
        logger.error('Transaction not found');
        return res.json({ received: true });
      }

      await TransactionModel.findByIdAndUpdate(transaction._id, {
        status: TRANSACTION_STATUS.FAIL,
      });
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
