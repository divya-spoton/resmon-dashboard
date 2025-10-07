import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
    const { currentUser, userRole, permissions } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    if (requiredPermission && !permissions?.[requiredPermission]) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;