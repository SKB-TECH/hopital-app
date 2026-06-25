export type AuthUser = {
    id: string;
    email: string;
    phone?: string;
    fullName: string;
    avatarUrl?: string | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    roles?: unknown[];
};

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
};

export type LoginPayload = {
    identifier: string;
    password: string;
};

export type HospitalLoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    email: string;
    phone: string;
    fullName: string;
    password: string;
};

export type OrganizerBusinessType =
    | "EVENT_ORGANIZER"
    | "TICKETING_SELLER"
    | "TRAVEL_SELLER"
    | "HOTEL_SELLER"
    | "VOUCHER_SELLER"
    | "FULL_PLATFORM";

export type RegisterOrganizerPayload = RegisterPayload & {
    businessName: string;
    businessType: OrganizerBusinessType;
    enabledModules?: Partial<Record<
        | "events"
        | "ticketing"
        | "marketplace"
        | "buses"
        | "flights"
        | "vouchers"
        | "stay"
        | "sponsors"
        | "reports"
        | "payouts"
        | "reviews",
        boolean
    >>;
};

export type ForgotPasswordPayload = {
    identifier: string;
};

export type SendOtpPayload = {
    identifier: string;
    purpose: "PASSWORD_RESET" | "ACCOUNT_VERIFICATION";
};

export type VerifyOtpPayload = {
    identifier: string;
    otp: string;
    purpose: "PASSWORD_RESET" | "ACCOUNT_VERIFICATION";
};

export type VerifyOtpResponse = {
    message?: string;
    resetToken?: string;
};

export type ResetPasswordPayload = {
    identifier: string;
    otp?: string;
    resetToken?: string;
    newPassword: string;
};

export type RefreshTokenPayload = {
    refreshToken: string;
};

export type ResendSmsPayload = {
    phone: string;
    message: string;
};

export type MessageResponse = {
    message: string;
};
