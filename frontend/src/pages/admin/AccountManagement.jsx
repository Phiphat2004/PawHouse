import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountTable } from './AccountTable';
import { AccountDetailDialog } from './AccountDetailDialog';
import { AssignRoleDialog } from './AssignRoleDialog';
import { BanConfirmationDialog } from './BanConfirmationDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { AccountRole, AccountStatus } from './types/account';
import { getAccounts, assignRole, banUnbanAccount, deleteAccount } from '@/services/accountManagementService';
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
    const [accountToDelete, setAccountToDelete] = useState(null);
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
            toast.success("Đã phân công vai trò thành công!");
            setAccountToAssignRole(null);
            fetchAccounts();
        } catch (error) {
            toast.error(error.message || "Phân công vai trò thất bại");
        }
    };

    const handleBanUnbanRequest = (account) => {
        setAccountToBanUnban(account);
    };

    const handleBanUnbanConfirm = async () => {
        if (accountToBanUnban) {
            try {
                const newStatus = accountToBanUnban.status === AccountStatus.ACTIVE ? AccountStatus.BANNED : AccountStatus.ACTIVE;
                await banUnbanAccount(accountToBanUnban.id, newStatus);
                toast.success(`Tài khoản đã được ${newStatus === AccountStatus.ACTIVE ? 'mở khoá' : 'khoá'} thành công!`);
                setAccountToBanUnban(null);
                fetchAccounts();
            } catch (error) {
                toast.error(error.message || "Cập nhật trạng thái thất bại");
            }
        }
    };

    const handleDeleteRequest = (account) => {
        setAccountToDelete(account);
    };

    const handleDeleteConfirm = async () => {
        if (accountToDelete) {
            const deletedId = accountToDelete.id;
            try {
                await deleteAccount(deletedId);
                toast.success("Đã xóa tài khoản thành công!");
                setAccountToDelete(null);
                setAccountsData((prev) => {
                    const nextAccounts = prev.accounts.filter((item) => item.id !== deletedId);
                    const totalItems = Math.max((prev.pagination?.totalItems || 0) - 1, 0);
                    const totalPages = Math.max(Math.ceil(totalItems / 8), 1);

                    return {
                        accounts: nextAccounts,
                        pagination: {
                            ...prev.pagination,
                            totalItems,
                            totalPages,
                        },
                    };
                });
                fetchAccounts();  // Refresh list from server
            } catch (error) {
                if (error.status === 404) {
                    toast.info("Tài khoản đã bị xóa hoặc không tồn tại");
                    setAccountToDelete(null);
                    setAccountsData((prev) => ({
                        ...prev,
                        accounts: prev.accounts.filter((item) => item.id !== deletedId),
                    }));
                    fetchAccounts();
                    return;
                }
                toast.error(error.message || "Xóa tài khoản thất bại");
            }
        }
    };

    const { accounts, pagination } = accountsData;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2c2c2c] mb-6">
                        <Users size={24} className="text-[#846551]" />
                        Quản lý tài khoản
                    </h2>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                                <SelectTrigger className="w-[180px] bg-white border-gray-200">
                                    <SelectValue placeholder="Tất cả trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value={AccountStatus.ACTIVE}>Hoạt động</SelectItem>
                                    <SelectItem value={AccountStatus.BANNED}>Bị khoá</SelectItem>
                                    <SelectItem value={AccountStatus.INACTIVE}>Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={setRoleFilter} disabled={isLoading}>
                                <SelectTrigger className="w-[180px] bg-white border-gray-200">
                                    <SelectValue placeholder="Tất cả vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                                    <SelectItem value={AccountRole.USER}>Người dùng</SelectItem>
                                    <SelectItem value={AccountRole.ADMIN}>Quản trị viên</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Hiển thị {accounts.length} trong tổng số {pagination.totalItems || 0} tài khoản
                    </p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Đang tải...</div>
                    ) : (
                        <AccountTable
                            accounts={accounts}
                            onViewDetail={setSelectedAccount}
                            onAssignRole={setAccountToAssignRole}
                            onBanUnban={handleBanUnbanRequest}
                            onDelete={handleDeleteRequest}
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
                <DeleteAccountDialog
                    account={accountToDelete}
                    onClose={() => setAccountToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                />
            </div>
        </AdminLayout>
    );
};

export default AccountManagement;