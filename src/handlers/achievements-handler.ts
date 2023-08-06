import { AchievementModel } from '../models/achievement';
import { ACHIEVEMENT_EVENT } from '../interfaces/achievements';
import { io } from '../socket';
import { logger } from '../logger';

class AchievementsHandler {
  private async process(userId: string, event: ACHIEVEMENT_EVENT) {
    logger.debug(`Processing event: ${event} for user: ${userId}`);
    const achievement = await AchievementModel.findOne({
      user: userId,
      event,
    });
    if (!achievement) {
      logger.debug(
        `Achievement not found for event: ${event} and user: ${userId}`
      );
      return;
    }
    if (achievement.current >= achievement.total) {
      logger.debug(
        `Achievement already done for event: ${event} and user: ${userId}`
      );
      return;
    }
    const updated = await AchievementModel.findByIdAndUpdate(
      achievement._id,
      {
        current: achievement.current + 1,
      },
      { new: true }
    );
    logger.debug(`Achievement updated for event: ${event} and user: ${userId}`);
    io.to(userId).emit('achievement-update', updated);
  }

  async handlePrevious(userId: string) {
    await this.onRegister(userId);
  }

  async onLogin(userId: string) {
    await this.handlePrevious(userId);
    return this.process(userId, ACHIEVEMENT_EVENT.LOGIN);
  }

  async onRegister(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.REGISTER);
  }

  async onPlayChessGame(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.PLAY_CHESS_GAME);
  }

  async onChessMove(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.MOVE_CHESS);
  }

  async onCheckersMove(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.MOVE_CHECKERS);
  }

  async onChessCheckMade(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.CHESS_CHECK);
  }

  async onYourChessCheck(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.YOUR_CHESS_CHECK);
  }

  async onCheckersQueen(userId: string) {
    return this.process(userId, ACHIEVEMENT_EVENT.CHECKERS_QUEEN);
  }
}

export default new AchievementsHandler();
