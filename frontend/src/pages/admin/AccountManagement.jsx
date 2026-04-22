import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountTable } from './AccountTable';
import { AccountDetailDialog } from './AccountDetailDialog';
import { AssignRoleDialog } from './AssignRoleDialog';
import { BanConfirmationDialog } from './BanConfirmationDialog';
import { AccountRole, AccountStatus } from './types/account';
import { getAccounts, assignRole, banUnbanAccount, restoreAccount } from '@/services/accountManagementService';
import { toast } from "react-toastify";
import Pagination from '@/components/layout/Pagination';
import { debounce } from 'lodash';
import { AdminLayout } from '@/components/admin';

const AccountManagement = () => {
    const [accountsData, setAccountsData] = useState({ accounts: [], pagination: {} });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountToAssignRole, setAccountToAssignRole] = useState(null);
    const [accountToBanUnban, setAccountToBanUnban] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const params = {
                search: searchQuery || undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                page: currentPage,
                limit: 8,
            };
            console.log('Fetching accounts with params:', params);
            const data = await getAccounts(params);
            console.log('Accounts data received:', data);
            setAccountsData(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            const errorMessage = error.message || "Failed to fetch accounts";
            console.error('Error details:', errorMessage, error.status);
            // Show error in console and try to show toast
            try {
                toast.error(errorMessage);
            } catch (toastError) {
                console.error('Toast not available:', toastError);
                alert(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Debounced fetch for search (avoids API spam)
    const debouncedFetchAccounts = useCallback(
        debounce(async () => {
            await fetchAccounts();
        }, 300),
        [searchQuery, roleFilter, statusFilter, currentPage]
    );

    // UPDATED: Main useEffect for fetching
    useEffect(() => {
        debouncedFetchAccounts();
        return () => debouncedFetchAccounts.cancel();
    }, [searchQuery, roleFilter, statusFilter, currentPage, debouncedFetchAccounts]);

    // NEW: Reset page to 1 on search/filter changes (FIXES the bug)
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAssignRole = async (accountId, newRole) => {
        try {
            await assignRole(accountId, newRole);
            toast.success("Role assigned successfully!");
            setAccountToAssignRole(null);
            fetchAccounts();
        } catch (error) {
            toast.error(error.message || "Failed to assign role");
        }
    };

    const handleBanUnbanRequest = (account) => {
        if (account?.role === AccountRole.ADMIN) {
            toast.warning('Cannot ban an administrator account');
            return;
        }

        if (account?.status === AccountStatus.INACTIVE || account?.is_deleted) {
            toast.warning('Cannot ban/unban a deleted account');
            return;
        }
        setAccountToBanUnban(account);
    };

    const handleBanUnbanConfirm = async () => {
        if (accountToBanUnban) {
            try {
                let newStatus = null;
                if (accountToBanUnban.status === AccountStatus.ACTIVE) {
                    newStatus = AccountStatus.BANNED;
                } else if (accountToBanUnban.status === AccountStatus.BANNED) {
                    newStatus = AccountStatus.ACTIVE;
                }

                if (!newStatus) {
                    toast.warning('Can only ban/unban active or banned accounts');
                    setAccountToBanUnban(null);
                    return;
                }

                await banUnbanAccount(accountToBanUnban.id, newStatus);
                toast.success(`Account ${newStatus === AccountStatus.ACTIVE ? 'unbanned' : 'banned'} successfully!`);
                setAccountToBanUnban(null);
                fetchAccounts();
            } catch (error) {
                toast.error(error.message || "Failed to update account status");
            }
        }
    };

    const handleRestoreRequest = async (account) => {
        try {
            await restoreAccount(account.id);
            toast.success('Account restored successfully!');
            fetchAccounts();
        } catch (error) {
            toast.error(error.message || 'Failed to restore account');
        }
    };

    const { accounts, pagination } = accountsData;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2c2c2c] mb-6">
                        <TeamOutlined className="text-[#846551] text-[24px]" />
                        Account Management
                    </h2>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                                <SelectTrigger className="w-45 bg-white border-gray-200">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value={AccountStatus.ACTIVE}>Active</SelectItem>
                                    <SelectItem value={AccountStatus.BANNED}>Banned</SelectItem>
                                    <SelectItem value={AccountStatus.INACTIVE}>Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={setRoleFilter} disabled={isLoading}>
                                <SelectTrigger className="w-45 bg-white border-gray-200">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value={AccountRole.USER}>User</SelectItem>
                                    <SelectItem value={AccountRole.STAFF}>Staff</SelectItem>
                                    <SelectItem value={AccountRole.ADMIN}>Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Showing {accounts.length} of {pagination.totalItems || 0} accounts
                    </p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <AccountTable
                            accounts={accounts}
                            onViewDetail={setSelectedAccount}
                            onAssignRole={setAccountToAssignRole}
                            onBanUnban={handleBanUnbanRequest}
                            onRestore={handleRestoreRequest}
                        />
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination
                            page={currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {/* Dialogs */}
                <AccountDetailDialog
                    account={selectedAccount}
                    onClose={() => setSelectedAccount(null)}
                    onBanUnban={handleBanUnbanRequest}
                    onRestore={handleRestoreRequest}
                />
                <AssignRoleDialog
                    account={accountToAssignRole}
                    onClose={() => setAccountToAssignRole(null)}
                    onAssign={handleAssignRole}
                />
                <BanConfirmationDialog
                    account={accountToBanUnban}
                    onClose={() => setAccountToBanUnban(null)}
                    onConfirm={handleBanUnbanConfirm}
                />
            </div>
        </AdminLayout>
    );
};

export default AccountManagement;