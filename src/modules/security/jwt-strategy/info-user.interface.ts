import { RoleEnum } from './role.enum';

export interface InfoUserInterface {
  id: string;
  sessionId: string;
  role: RoleEnum;
}
