import { EventBus } from './EventBus';

export interface ApplicationEventMap {
  'app:initialized': { timestamp: number };
  'app:routeChange': { from: string; to: string };
  'app:error': { error: Error; context?: string };
  'app:themeChange': { mode: 'light' | 'dark' };
  'app:sidebarToggle': { collapsed: boolean };
  'app:languageChange': { locale: string };
}

export type ApplicationEvent = keyof ApplicationEventMap;

export const applicationEvents = new EventBus();
