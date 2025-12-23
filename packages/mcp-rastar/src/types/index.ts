export interface RastarAuth {
  accessToken: string;
}

export interface RastarTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
}

export interface MenuSchedule {
  id: string;
  date: string;
  updated_at: string;
  menu_item: MenuItem;
}

export interface UserMenuSelection {
  id: string;
  user_id: string;
  menu_schedule_id: string;
  created_at: string;
  menu_schedule?: {
    id: string;
    date: string;
    menu_item: MenuItem;
  };
}
