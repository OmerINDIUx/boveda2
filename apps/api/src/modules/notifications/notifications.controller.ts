import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly scheduler: NotificationsScheduler
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.listForUser(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.markAsRead(user.id, id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllAsRead(user.id);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: RequestUser) {
    return this.notifications.listPreferences(user.id);
  }

  @Post('preferences')
  updatePreferences(@CurrentUser() user: RequestUser, @Body() dto: UpdateNotificationPreferencesDto) {
    return this.notifications.updatePreferences(user.id, dto.items);
  }

  @Post('jobs/run')
  runJobs() {
    return this.scheduler.runIfNeeded(true);
  }
}
