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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch user role and permissions from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role);
                    setPermissions(userData.permissions);
                }
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setPermissions(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        return signOut(auth);
    };

    const registerUser = async (email, password, displayName, role, permissions) => {
        // Only admin can register users
        if (userRole !== 'admin') {
            throw new Error('Only admins can register users');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
            email,
            displayName,
            role,
            permissions,
            createdAt: new Date(),
            createdBy: currentUser.uid
        });

        return newUser;
    };

    const getAllUsers = async () => {
        if (userRole !== 'admin') {
            throw new Error('Only admins can view all users');
        }

        const usersSnapshot = await getDocs(collection(db, 'users'));
        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    };

    const updateUserRole = async (userId, newRole, newPermissions) => {
        if (userRole !== 'admin') {
            throw new Error('Only admins can update user roles');
        }

        await updateDoc(doc(db, 'users', userId), {
            role: newRole,
            permissions: newPermissions
        });
    };

    const deleteUser = async (userId) => {
        if (userRole !== 'admin') {
            throw new Error('Only admins can delete users');
        }

        await deleteDoc(doc(db, 'users', userId));
    };

    const value = useMemo(() => ({
        currentUser,
        userRole,
        permissions,
        login,
        logout,
        registerUser,
        getAllUsers,
        updateUserRole,
        deleteUser
    }), [currentUser, userRole, permissions]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};