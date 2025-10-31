import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (!mounted) return;
                setLoading(true);
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (!mounted) return;
                        setUserRole(userData.role || null);
                        setPermissions(userData.permissions || null);
                    } else {
                        if (!mounted) return;
                        setUserRole(null);
                        setPermissions(null);
                    }
                    if (!mounted) return;
                    setCurrentUser(user);
                } else {
                    if (!mounted) return;
                    setCurrentUser(null);
                    setUserRole(null);
                    setPermissions(null);
                }
            } catch (err) {
                console.error('Auth state error:', err);
                // optionally set an auth error state here
                if (mounted) {
                    setCurrentUser(null);
                    setUserRole(null);
                    setPermissions(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);


    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        return signOut(auth);
    };

    // const registerUser = async (email, password, displayName, role, permissions) => {
    //     // Only admin can register users
    //     if (userRole !== 'admin') {
    //         throw new Error('Only admins can register users');
    //     }

    //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //     const newUser = userCredential.user;

    //     // Create user document in Firestore
    //     await setDoc(doc(db, 'users', newUser.uid), {
    //         email,
    //         displayName,
    //         role,
    //         permissions,
    //         createdAt: new Date(),
    //         createdBy: currentUser.uid
    //     });

    //     return newUser;
    // };

    const getAllUsers = async () => {
        if (userRole !== 'admin') {
            throw new Error('Only admins can view all users');
        }

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            return usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    };

    const updateUserRole = async (userId, newRole, newPermissions) => {
        if (userRole !== 'admin') {
            throw new Error('Only admins can update user roles');
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                permissions: newPermissions,
                updatedAt: new Date(),
                updatedBy: currentUser.uid
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    };

    // const deleteUser = async (userId) => {
    //     if (userRole !== 'admin') {
    //         throw new Error('Only admins can delete users');
    //     }

    //     await deleteDoc(doc(db, 'users', userId));
    // };

    const value = useMemo(() => ({
        currentUser,
        userRole,
        permissions,
        login,
        logout,
        getAllUsers,
        updateUserRole
        // registerUser and deleteUser removed
    }), [currentUser, userRole, permissions]);

    return (
        <AuthContext.Provider value={value}>
            {loading && (
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 border-t-4 border-b-4 border-gray-300 border-solid rounded-full animate-spin"></div>
                        <span className="text-lg">Authenticating...</span>
                    </div>
                </div>
            )}
            {!loading && children}
        </AuthContext.Provider>
    );
};