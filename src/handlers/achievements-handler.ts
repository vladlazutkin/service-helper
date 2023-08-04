import { AchievementModel } from '../models/achievement';
import { ACHIEVEMENT_EVENT } from '../interfaces/achievements';
import { io } from '../socket';

class AchievementsHandler {
  private async process(userId: string, event: ACHIEVEMENT_EVENT) {
    const achievement = await AchievementModel.findOne({
      user: userId,
      event,
    });
    if (!achievement) {
      return;
    }
    if (achievement.current >= achievement.total) {
      return;
    }
    const updated = await AchievementModel.findByIdAndUpdate(
      achievement._id,
      {
        current: achievement.current + 1,
      },
      { new: true }
    );
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
}

export default new AchievementsHandler();
