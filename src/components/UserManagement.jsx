import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Trash2, Edit, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const UserManagement = () => {
    const { colors } = useTheme();

    const { getAllUsers, registerUser, updateUserRole, deleteUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'worker',
        canViewAllDevices: false,
        canExportData: false,
        canManageUsers: false,
        assignedDevices: []
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const usersList = await getAllUsers();
            setUsers(usersList);
        } catch (err) {
            console.error('Error loading users:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingUser) {
                await updateUserRole(editingUser.id, formData.role, {
                    canViewAllDevices: formData.canViewAllDevices,
                    canExportData: formData.canExportData,
                    canManageUsers: formData.canManageUsers,
                    assignedDevices: formData.assignedDevices
                });
            } else {
                await registerUser(
                    formData.email,
                    formData.password,
                    formData.displayName,
                    formData.role,
                    {
                        canViewAllDevices: formData.canViewAllDevices,
                        canExportData: formData.canExportData,
                        canManageUsers: formData.canManageUsers,
                        assignedDevices: formData.assignedDevices
                    }
                );
            }

            setShowModal(false);
            setEditingUser(null);
            resetForm();
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId);
                loadUsers();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            displayName: '',
            role: 'worker',
            canViewAllDevices: false,
            canExportData: false,
            canManageUsers: false,
            assignedDevices: []
        });
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            displayName: user.displayName,
            role: user.role,
            canViewAllDevices: user.permissions?.canViewAllDevices || false,
            canExportData: user.permissions?.canExportData || false,
            canManageUsers: user.permissions?.canManageUsers || false,
            assignedDevices: user.permissions?.assignedDevices || []
        });
        setShowModal(true);
    };

    return (
        <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-cyan-400" />
                    <h2 className={`text-xl font-bold ${colors.text}`}>User Management</h2>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingUser(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={colors.tableBg}>
                        <tr>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Name</th>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Email</th>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Role</th>
                            <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Permissions</th>
                            <th className={`px-4 py-3 text-right text-xs font-medium ${colors.textTertiary} uppercase`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${colors.cardBorder}`}>
                        {users.map((user) => (
                            <tr key={user.id} className={colors.hoverBg}>
                                <td className={`px-4 py-3 text-sm ${colors.text}`}>{user.displayName}</td>
                                <td className={`px-4 py-3 text-sm ${colors.textTertiary}`}>{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                        user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">
                                    {user.permissions?.canViewAllDevices && 'All Devices, '}
                                    {user.permissions?.canExportData && 'Export, '}
                                    {user.permissions?.canManageUsers && 'Manage Users'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="text-cyan-400 hover:text-cyan-300 mr-3"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${colors.cardBg} rounded-xl p-6 max-w-md w-full border ${colors.cardBorder}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${colors.text}`}>
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className={`${colors.textSecondary} hover:${colors.text}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <>
                                    <div>
                                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                >
                                    <option value="worker">Worker</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center text-sm ${colors.textTertiary}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.canViewAllDevices}
                                        onChange={(e) => setFormData({ ...formData, canViewAllDevices: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Can view all devices
                                </label>
                                <label className={`flex items-center text-sm ${colors.textTertiary}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.canExportData}
                                        onChange={(e) => setFormData({ ...formData, canExportData: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Can export data
                                </label>
                                <label className={`flex items-center text-sm ${colors.textTertiary}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.canManageUsers}
                                        onChange={(e) => setFormData({ ...formData, canManageUsers: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Can manage users
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;