// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { Users, UserPlus, Trash2, Edit, X } from 'lucide-react';
// import { useTheme } from '../contexts/ThemeContext';


// /**
//  * 
// ## Setup Instructions for Admin Account

// ### Create First Admin User Manually

// Since you need an admin to create other users, you'll need to create the first admin manually:

// 1. **Enable Email/Password Authentication in Firebase Console:**
//    - Go to Firebase Console → Authentication → Sign-in method
//    - Enable Email/Password provider

// 2. **Create admin user in Firebase Console:**
//    - Go to Authentication → Users → Add user
//    - Add email and password

// 3. **Add admin document in Firestore:**
//    - Go to Firestore Database → Create collection "users"
//    - Create document with ID matching the user's UID from Authentication
//    - Add these fields:
// ```
//      email: "admin@yourdomain.com"
//      displayName: "Admin User"
//      role: "admin"
//      permissions: {
//        canViewAllDevices: true,
//        canExportData: true,
//        canManageUsers: true,
//        assignedDevices: []
//      }
//      createdAt: [current timestamp]
//      createdBy: "system"
//  */

// const UserManagement = () => {
//     const { colors } = useTheme();

//     const { getAllUsers, registerUser, updateUserRole, deleteUser } = useAuth();
//     const [users, setUsers] = useState([]);
//     const [showModal, setShowModal] = useState(false);
//     const [editingUser, setEditingUser] = useState(null);
//     const [formData, setFormData] = useState({
//         email: '',
//         password: '',
//         displayName: '',
//         role: 'worker',
//         canViewAllDevices: false,
//         canExportData: false,
//         canManageUsers: false,
//         assignedDevices: []
//     });
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         let mounted = true;
//         (async () => {
//             try {
//                 setIsLoading(true);
//                 const usersList = await getAllUsers();
//                 if (mounted) setUsers(Array.isArray(usersList) ? usersList : []);
//             } catch (err) {
//                 console.error('Error loading users on mount', err);
//                 if (mounted) setError(err?.message || 'Failed to load users');
//             } finally {
//                 if (mounted) setIsLoading(false);
//             }
//         })();
//         return () => { mounted = false; };
//     }, [getAllUsers]);


//     const loadUsers = async () => {
//         setIsLoading(true);
//         setError(null);
//         try {
//             const usersList = await getAllUsers();
//             // make sure we always set an array
//             setUsers(Array.isArray(usersList) ? usersList : []);
//         } catch (err) {
//             console.error('Error loading users:', err);
//             setError(err?.message || 'Failed to load users');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             if (editingUser) {
//                 const userId = editingUser.id || editingUser.uid;
//                 // if we're changing an admin -> non-admin, ensure there's at least one other admin
//                 const currentlyAdmin = editingUser.role === 'admin';
//                 const willBeAdmin = formData.role === 'admin';
//                 const adminCount = users.filter(u => u.role === 'admin').length;

//                 if (currentlyAdmin && !willBeAdmin && adminCount <= 1) {
//                     alert('There must be at least one admin account. Create another admin before demoting this user.');
//                     return;
//                 }
//                 // pass displayName if your backend supports it (common case)
//                 await updateUserRole(userId, formData.role, {
//                     canViewAllDevices: formData.canViewAllDevices,
//                     canExportData: formData.canExportData,
//                     canManageUsers: formData.canManageUsers,
//                     assignedDevices: formData.assignedDevices
//                 });
//             } else {
//                 await registerUser(
//                     formData.email,
//                     formData.password,
//                     formData.displayName,
//                     formData.role,
//                     {
//                         canViewAllDevices: formData.canViewAllDevices,
//                         canExportData: formData.canExportData,
//                         canManageUsers: formData.canManageUsers,
//                         assignedDevices: formData.assignedDevices
//                     }
//                 );
//             }

//             setShowModal(false);
//             setEditingUser(null);
//             resetForm();
//             await loadUsers(); // await to ensure UI refresh before continuing
//         } catch (err) {
//             console.error(err);
//             alert(err?.message || 'Something went wrong while saving user');
//         }
//     };

//     const handleDelete = async (userIdOrObj) => {
//         const id = userIdOrObj?.id || userIdOrObj?.uid || userIdOrObj;
//         if (!id) return;
//         if (id === currentUser?.uid) {
//             alert('You cannot delete your own account');
//             return;
//         }
//         if (!window.confirm('Are you sure you want to delete this user?')) return;
//             try {
//             await deleteUser(id);
//             await loadUsers();
//             } catch (err) {
//             console.error('Delete failed', err);
//             alert(err?.message || 'Failed to delete user');
//         }
//     };

//     const resetForm = () => {
//         setFormData({
//             email: '',
//             password: '',
//             displayName: '',
//             role: 'worker',
//             canViewAllDevices: false,
//             canExportData: false,
//             canManageUsers: false,
//             assignedDevices: []
//         });
//     };

//     const openEditModal = (user) => {
//         setEditingUser(user);
//         setFormData({
//             email: user.email,
//             password: '',
//             displayName: user.displayName,
//             role: user.role,
//             canViewAllDevices: user.permissions?.canViewAllDevices || false,
//             canExportData: user.permissions?.canExportData || false,
//             canManageUsers: user.permissions?.canManageUsers || false,
//             assignedDevices: user.permissions?.assignedDevices || []
//         });
//         setShowModal(true);
//     };

//     return (
//         <div>
//             <div className="mb-6">
//                 <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>User Management</h1>
//                 <p className={colors.textSecondary}>Manage user accounts, roles, and permissions</p>
//             </div>


//             <div className={`${colors.cardBg} backdrop-blur-sm border ${colors.cardBorder} rounded-xl p-6`}>
//                 <div className="flex items-center justify-between mb-6">
//                     <div className="flex items-center gap-3">
//                         <Users className="w-6 h-6 text-cyan-400" />
//                         <h2 className={`text-xl font-bold ${colors.text}`}>User Management</h2>
//                     </div>
//                     <button
//                         onClick={() => {
//                             resetForm();
//                             setEditingUser(null);
//                             setShowModal(true);
//                         }}
//                         disabled={isLoading || configsLoading}
//                         className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors"
//                     >
//                         <UserPlus className="w-4 h-4" />
//                         Add User
//                     </button>
//                 </div>

//                 <div className="overflow-x-auto">
//                     <table className="w-full">
//                         <thead className={colors.tableBg}>
//                             <tr>
//                                 <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Name</th>
//                                 <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Email</th>
//                                 <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Role</th>
//                                 <th className={`px-4 py-3 text-left text-xs font-medium ${colors.textTertiary} uppercase`}>Permissions</th>
//                                 <th className={`px-4 py-3 text-right text-xs font-medium ${colors.textTertiary} uppercase`}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className={`divide-y ${colors.cardBorder}`}>
//                             {users.map((user) => (
//                                 <tr key={user.id} className={colors.hoverBg}>
//                                     <td className={`px-4 py-3 text-sm ${colors.text}`}>{user.displayName}</td>
//                                     <td className={`px-4 py-3 text-sm ${colors.textTertiary}`}>{user.email}</td>
//                                     <td className="px-4 py-3">
//                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
//                                             user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
//                                                 'bg-green-500/20 text-green-400'
//                                             }`}>
//                                             {user.role}
//                                         </span>
//                                     </td>
//                                     <td className="px-4 py-3 text-xs text-slate-400">
//                                         {user.permissions?.canViewAllDevices && 'All Devices, '}
//                                         {user.permissions?.canExportData && 'Export, '}
//                                         {user.permissions?.canManageUsers && 'Manage Users'}
//                                     </td>
//                                     <td className="px-4 py-3 text-right">
//                                         <button
//                                             onClick={() => openEditModal(user)}
//                                             className="text-cyan-400 hover:text-cyan-300 mr-3"
//                                         >
//                                             <Edit className="w-4 h-4" />
//                                         </button>
//                                         <button
//                                             onClick={() => handleDelete(user.id)}
//                                             className="text-red-400 hover:text-red-300"
//                                         >
//                                             <Trash2 className="w-4 h-4" />
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Modal */}
//                 {showModal && (
//                     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//                         <div className={`${colors.cardBg} rounded-xl p-6 max-w-md w-full border ${colors.cardBorder}`}>
//                             <div className="flex items-center justify-between mb-4">
//                                 <h3 className={`text-lg font-bold ${colors.text}`}>
//                                     {editingUser ? 'Edit User' : 'Add New User'}
//                                 </h3>
//                                 <button onClick={() => setShowModal(false)} className={`${colors.textSecondary} hover:${colors.text}`}>
//                                     <X className="w-5 h-5" />
//                                 </button>
//                             </div>

//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Display Name</label>
//                                     <input
//                                         type="text"
//                                         value={formData.displayName}
//                                         onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
//                                         className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
//                                         required
//                                     />
//                                 </div>

//                                 {!editingUser && (
//                                     <>
//                                         <div>
//                                             <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Email</label>
//                                             <input
//                                                 type="email"
//                                                 value={formData.email}
//                                                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                                                 className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
//                                                 required
//                                             />
//                                         </div>

//                                         <div>
//                                             <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Password</label>
//                                             <input
//                                                 type="password"
//                                                 value={formData.password}
//                                                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                                                 className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
//                                                 required
//                                                 minLength={6}
//                                             />
//                                         </div>
//                                     </>
//                                 )}

//                                 <div>
//                                     <label className={`block text-sm font-medium ${colors.textTertiary} mb-2`}>Role</label>
//                                     <select
//                                         value={formData.role}
//                                         onChange={(e) => setFormData({ ...formData, role: e.target.value })}
//                                         className={`w-full ${colors.inputBg} border ${colors.inputBorder} ${colors.text} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
//                                     >
//                                         <option value="worker">Worker</option>
//                                         <option value="manager">Manager</option>
//                                         <option value="admin">Admin</option>
//                                     </select>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <label className={`flex items-center text-sm ${colors.textTertiary}`}>
//                                         <input
//                                             type="checkbox"
//                                             checked={formData.canViewAllDevices}
//                                             onChange={(e) => setFormData({ ...formData, canViewAllDevices: e.target.checked })}
//                                             className="mr-2"
//                                         />
//                                         Can view all devices
//                                     </label>
//                                     <label className={`flex items-center text-sm ${colors.textTertiary}`}>
//                                         <input
//                                             type="checkbox"
//                                             checked={formData.canExportData}
//                                             onChange={(e) => setFormData({ ...formData, canExportData: e.target.checked })}
//                                             className="mr-2"
//                                         />
//                                         Can export data
//                                     </label>
//                                     <label className={`flex items-center text-sm ${colors.textTertiary}`}>
//                                         <input
//                                             type="checkbox"
//                                             checked={formData.canManageUsers}
//                                             onChange={(e) => setFormData({ ...formData, canManageUsers: e.target.checked })}
//                                             className="mr-2"
//                                         />
//                                         Can manage users
//                                     </label>
//                                 </div>

//                                 <button
//                                     type="submit"
//                                     className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg transition-colors"
//                                 >
//                                     {editingUser ? 'Update User' : 'Create User'}
//                                 </button>
//                             </form>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default UserManagement;
