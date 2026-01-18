export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface UserCreateRequest {
    name: string;
    email: string;
    password: string;
    role: string;
}

export interface UserUpdateRequest {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

export interface UserUpdateProfileRequest {
    name?: string;
    email?: string;
}

export interface UserUpdatePasswordRequest {
    password?: string;
}