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

/** Matches the API contract: the current password is verified before the change. */
export interface UserUpdatePasswordRequest {
    current_password: string;
    new_password: string;
}
