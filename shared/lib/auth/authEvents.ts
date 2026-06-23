type Handler = () => void;

class AuthEvents {
    private logoutHandlers = new Set<Handler>();

    onLogout(handler: Handler) {
        this.logoutHandlers.add(handler);
        return () => this.logoutHandlers.delete(handler);
    }

    emitLogout() {
        for (const h of this.logoutHandlers) h();
    }
}

export const authEvents = new AuthEvents();
