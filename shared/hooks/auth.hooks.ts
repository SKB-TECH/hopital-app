import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import type {
    ForgotPasswordPayload,
    LoginPayload,
    RefreshTokenPayload,
    RegisterOrganizerPayload,
    RegisterPayload,
    ResendSmsPayload,
    ResetPasswordPayload,
    SendOtpPayload,
    VerifyOtpPayload,
} from "../types/auth.types";

export function useRegister() {
    return useMutation({
        mutationFn: (payload: RegisterPayload) => authService.register(payload),
    });
}

export function useRegisterOrganizer() {
    return useMutation({
        mutationFn: (payload: RegisterOrganizerPayload) => authService.registerOrganizer(payload),
    });
}

export function useLogin() {
    return useMutation({
        mutationFn: (payload: LoginPayload) => authService.login(payload),
    });
}

export function useRefreshToken() {
    return useMutation({
        mutationFn: (payload: RefreshTokenPayload) => authService.refreshToken(payload),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

export function useMe() {
    return useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => authService.me(),
        retry: false,
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
    });
}

export function useSendOtp() {
    return useMutation({
        mutationFn: (payload: SendOtpPayload) => authService.sendOtp(payload),
    });
}

export function useVerifyOtp() {
    return useMutation({
        mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
    });
}

export function useResendSms() {
    return useMutation({
        mutationFn: (payload: ResendSmsPayload) => authService.resendSms(payload),
    });
}
