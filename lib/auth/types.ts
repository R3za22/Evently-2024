export type AuthUser = { id: string; name: string; email?: string; initials: string };
export type AuthState = { status: "loading" | "signedIn" | "signedOut"; user: AuthUser | null; signOut: () => Promise<void> | void };
