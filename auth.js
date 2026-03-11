    // auth.js — Supabase authentication and emergency contact management.

    const Auth = (() => {
    const SUPABASE_URL = CONFIG.SUPABASE_URL;
    const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

    let supabase = null;
    let currentUser = null;

    /**
     * Initialize the Supabase client.
     */
    function init() {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("[Auth] Supabase initialized");
        return true;
    }

    /**
     * Sign up a new user with email and password.
     */
    async function signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        currentUser = data.user;
        console.log("[Auth] Sign up successful:", email);
        return currentUser;
    }

    /**
     * Log in an existing user.
     */
    async function logIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        currentUser = data.user;
        console.log("[Auth] Login successful:", email);
        return currentUser;
    }

    /**
     * Log out the current user.
     */
    async function logOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
        currentUser = null;
        console.log("[Auth] Logged out");
    }

    /**
     * Get the current session (auto-login on page load).
     */
    async function getSession() {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
        currentUser = data.session.user;
        console.log("[Auth] Session restored:", currentUser.email);
        }
        return currentUser;
    }

    /**
     * Save emergency contacts to the profiles table.
     */
    async function saveContacts(contact1, contact2) {
        if (!currentUser) throw new Error("Not logged in.");

        const { error } = await supabase
        .from("profiles")
        .upsert({
            id: currentUser.id,
            email: currentUser.email,
            contact1: contact1 || null,
            contact2: contact2 || null,
        });

        if (error) throw new Error(error.message);
        console.log("[Auth] Contacts saved");
    }

    /**
     * Load emergency contacts from the profiles table.
     * Returns { contact1, contact2 }.
     */
    async function loadContacts() {
        if (!currentUser) return { contact1: "", contact2: "" };

        const { data, error } = await supabase
        .from("profiles")
        .select("contact1, contact2")
        .eq("id", currentUser.id)
        .single();

        if (error || !data) return { contact1: "", contact2: "" };
        return { contact1: data.contact1 || "", contact2: data.contact2 || "" };
    }

    /**
     * Check if user is logged in.
     */
    function isLoggedIn() {
        return !!currentUser;
    }

    /**
     * Get the current user's email.
     */
    function getUserEmail() {
        return currentUser?.email || "";
    }

    /**
     * Check if Supabase is configured.
     */
    function isConfigured() {
        return supabase !== null;
    }

    // Public API
    return {
        init,
        signUp,
        logIn,
        logOut,
        getSession,
        saveContacts,
        loadContacts,
        isLoggedIn,
        getUserEmail,
        isConfigured,
    };
    })();
