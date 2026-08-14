import { UserResponse } from './user.interface';

export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Public sign-up carries no role: the API always creates a manager. Elevated
 * accounts are created from the user management screen by someone authorized.
 */
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserResponse;
}
