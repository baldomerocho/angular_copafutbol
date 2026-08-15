/**
 * Production build.
 *
 * This points at the development tunnel on purpose: it is the only live API, and
 * the deployed site exists to be shown to people. Swap the host the day a real
 * production API stands up — nothing else needs to change, since every service
 * builds its URLs from this value.
 */
export const environment = {
    production: true,
    apiUrl: 'https://app-dev-clubfutbol.server.gt'
};
