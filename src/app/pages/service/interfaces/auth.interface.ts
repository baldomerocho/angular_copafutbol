import { UserResponse } from "./user.interface";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    name: string;
    password: string;
    role?: string;
}

export interface LoginResponse {
    token: string;
    user: UserResponse;
}
