import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import {
  loginUser,
  logoutUser,
} from "../api/auth";

const AuthContext = createContext(null);

const SESSION_KEY = "ekumusta_session";

/*
|--------------------------------------------------------------------------
| SESSION MANAGEMENT
|--------------------------------------------------------------------------
*/

function createSession(user, existingLoginTime = null) {
  return {
    userId: user.id,
    role: user.role,

    loginTime:
      existingLoginTime ||
      new Date().toISOString(),

    // Non-sensitive information only
    name: user.name,
    email: user.email,

    studentId:
      user.studentId || undefined,

    accountId:
      user.accountId || undefined,
  };
}

function saveSession(
  user,
  existingLoginTime = null
) {
  const session = createSession(
    user,
    existingLoginTime
  );

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

function loadSession() {
  try {
    const raw =
      sessionStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      "Failed to load session:",
      error
    );

    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(
    SESSION_KEY
  );
}

/*
|--------------------------------------------------------------------------
| AUTH PROVIDER
|--------------------------------------------------------------------------
*/

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [session, setSession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | RESTORE SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const savedSession =
      loadSession();

    if (savedSession) {
      const restoredUser = {
        id: savedSession.userId,

        name:
          savedSession.name,

        email:
          savedSession.email,

        role:
          savedSession.role,

        isActive: true,

        isActivated: true,

        studentId:
          savedSession.studentId,

        accountId:
          savedSession.accountId,
      };

      setUser(restoredUser);

      setSession(savedSession);
    }

    setLoading(false);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = useCallback(
    async (email, password) => {
      try {
        const result =
          await loginUser(
            email,
            password
          );

        console.log(
          "Laravel LOGIN RESPONSE:",
          result
        );

        if (
          result.success &&
          result.user
        ) {
          const authenticatedUser = {
            ...result.user,

            isActive: true,

            isActivated: true,
          };

          setUser(
            authenticatedUser
          );

          const newSession =
            saveSession(
              authenticatedUser
            );

          setSession(newSession);

          if (result.token) {
            localStorage.setItem(
              "ekumusta_token",
              result.token
            );
          }

          return {
            success: true,

            user:
              authenticatedUser,

            token:
              result.token || null,
          };
        }

        return {
          success: false,

          error:
            "INVALID_CREDENTIALS",

          message:
            result.message ||
            "Invalid email or password.",
        };
      } catch (error) {
        console.error(
          "Laravel LOGIN ERROR:",
          error
        );

        /*
        |--------------------------------------------------------------------------
        | Validation Error
        |--------------------------------------------------------------------------
        */

        if (
          error?.response
            ?.status === 422
        ) {
          return {
            success: false,

            error:
              "INVALID_CREDENTIALS",

            message:
              error.response.data
                ?.message ||
              "Invalid email or password.",
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Unauthorized
        |--------------------------------------------------------------------------
        */

        if (
          error?.response
            ?.status === 401
        ) {
          return {
            success: false,

            error:
              "INVALID_CREDENTIALS",

            message:
              "Invalid email or password.",
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Backend Unreachable
        |--------------------------------------------------------------------------
        */

        if (!error?.response) {
          return {
            success: false,

            error:
              "SERVER_ERROR",

            message:
              "Unable to connect to the server. Please make sure the Laravel backend is running.",
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Other Server Error
        |--------------------------------------------------------------------------
        */

        return {
          success: false,

          error:
            "SERVER_ERROR",

          message:
            error.response.data
              ?.message ||
            "Something went wrong. Please try again later.",
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = useCallback(
    async () => {
      try {
        const token =
          localStorage.getItem(
            "ekumusta_token"
          );

        /*
        |--------------------------------------------------------------------------
        | Tell Laravel to logout
        |--------------------------------------------------------------------------
        */

        if (token) {
          const result =
            await logoutUser();

          console.log(
            "Laravel LOGOUT RESPONSE:",
            result
          );
        }
      } catch (error) {
        /*
        |--------------------------------------------------------------------------
        | Even if Laravel is unavailable,
        | clear local authentication.
        |--------------------------------------------------------------------------
        */

        console.error(
          "Laravel LOGOUT ERROR:",
          error
        );
      } finally {
        /*
        |--------------------------------------------------------------------------
        | Clear React state
        |--------------------------------------------------------------------------
        */

        setUser(null);

        setSession(null);

        /*
        |--------------------------------------------------------------------------
        | Clear browser session
        |--------------------------------------------------------------------------
        */

        clearSession();

        /*
        |--------------------------------------------------------------------------
        | Remove API token
        |--------------------------------------------------------------------------
        */

        localStorage.removeItem(
          "ekumusta_token"
        );
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH USER FROM SAVED SESSION
  |--------------------------------------------------------------------------
  */

  const refreshUser =
    useCallback(() => {
      const savedSession =
        loadSession();

      if (!savedSession) {
        setUser(null);

        setSession(null);

        return;
      }

      const refreshedUser = {
        id: savedSession.userId,

        name:
          savedSession.name,

        email:
          savedSession.email,

        role:
          savedSession.role,

        isActive: true,

        isActivated: true,

        studentId:
          savedSession.studentId,

        accountId:
          savedSession.accountId,
      };

      setUser(
        refreshedUser
      );

      setSession(
        savedSession
      );
    }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE USER AFTER PROFILE EDIT
  |--------------------------------------------------------------------------
  |
  | This is used by AdminProfile.jsx after Laravel/MySQL
  | successfully updates the user's information.
  |
  */

  const setProfileUser =
    useCallback(
      (updatedUser) => {
        if (!updatedUser) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Preserve existing session login time
        |--------------------------------------------------------------------------
        */

        const currentSession =
          loadSession();

        const updatedUserWithDefaults = {
          ...updatedUser,

          isActive:
            updatedUser.isActive ??
            true,

          isActivated:
            updatedUser.isActivated ??
            true,
        };

        /*
        |--------------------------------------------------------------------------
        | Update React user state
        |--------------------------------------------------------------------------
        */

        setUser(
          updatedUserWithDefaults
        );

        /*
        |--------------------------------------------------------------------------
        | Update sessionStorage
        |--------------------------------------------------------------------------
        */

        const updatedSession =
          saveSession(
            updatedUserWithDefaults,
            currentSession?.loginTime ||
              null
          );

        /*
        |--------------------------------------------------------------------------
        | Update React session state
        |--------------------------------------------------------------------------
        */

        setSession(
          updatedSession
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | ROLE CHECKS
  |--------------------------------------------------------------------------
  */

  const isAuthenticated =
    !!user;

  const isStudent =
    user?.role === "student";

  const isAdmin =
    user?.role === "admin";

  const isGuidance =
    user?.role === "guidance";

  const hasRole = useCallback(
    (...roles) => {
      if (!user) {
        return false;
      }

      return roles.includes(
        user.role
      );
    },
    [user]
  );

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value = {
    user,

    session,

    loading,

    login,

    logout,

    refreshUser,

    setProfileUser,

    isAuthenticated,

    isStudent,

    isAdmin,

    isGuidance,

    hasRole,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

export default AuthContext;