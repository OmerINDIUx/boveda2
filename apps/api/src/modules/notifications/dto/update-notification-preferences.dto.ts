import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, ValidateNested } from 'class-validator';
import { NOTIFICATION_TYPES } from '../notifications.constants';

class NotificationPreferenceItemDto {
  @IsIn(NOTIFICATION_TYPES)
  notificationType!: string;

  @IsBoolean()
  inAppEnabled!: boolean;

  @IsBoolean()
  emailEnabled!: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  items!: NotificationPreferenceItemDto[];
}
