//le nhut hao
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountRole, AccountStatus } from './types/account';
import { Mail, User, Shield, Calendar, AlertCircle, Undo2 } from 'lucide-react';

const AccountDetailDialog = ({ account, onClose, onBanUnban, onRestore }) => {
    if (!account) return null;

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-600 text-white font-semibold';
            case 'user':
                return 'bg-slate-600 text-white font-semibold';
            default:
                return 'bg-slate-600 text-white font-semibold';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin':
                return 'Quản trị viên';
            case 'user':
            default:
                return 'Người dùng';
        }
    };

    // UPDATED: Handle inactive status (gray badge)
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case AccountStatus.ACTIVE:
                return 'bg-green-600 text-white font-semibold';
            case AccountStatus.BANNED:
                return 'bg-red-600 text-white font-semibold';
            case AccountStatus.INACTIVE:  // NEW: Gray for inactive/deleted
                return 'bg-slate-600 text-white font-semibold';
            default:
                return 'bg-slate-600 text-white font-semibold';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case AccountStatus.ACTIVE:
                return 'Hoạt động';
            case AccountStatus.BANNED:
                return 'Bị khóa';
            case AccountStatus.INACTIVE:
                return 'Không hoạt động';
            default:
                return status;
        }
    };

    return (
        <Dialog open={!!account} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chi tiết tài khoản</DialogTitle>
                    <DialogDescription>
                        {account.is_deleted && (  // NEW: Warning for deleted accounts
                            <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                                ⚠️ Tài khoản này đã bị xoá (không hoạt động).
                            </div>
                        )}
                        Xem thông tin chi tiết của tài khoản này
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Name */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Họ tên</p>
                            <p className="text-gray-900">{account.name}</p>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <p className="text-gray-900">{account.email}</p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Vai trò</p>
                            <Badge className={getRoleBadgeColor(account.role)}>
                                {getRoleLabel(account.role)}
                            </Badge>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${account.status === AccountStatus.ACTIVE ? 'bg-green-100' :
                                account.status === AccountStatus.BANNED ? 'bg-red-100' : 'bg-gray-100'  // NEW: Gray for inactive
                                }`}
                        >
                            <AlertCircle
                                className={`w-5 h-5 ${account.status === AccountStatus.ACTIVE ? 'text-green-600' :
                                    account.status === AccountStatus.BANNED ? 'text-red-600' : 'text-gray-600'  // NEW: Gray for inactive
                                    }`}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                            <Badge className={getStatusBadgeClass(account.status)}>
                                {getStatusLabel(account.status)}
                            </Badge>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                            <p className="text-gray-900">{formatDate(account.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Dialog Footer with Actions */}
                <div className="border-t pt-4 flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                    {account.is_deleted && (
                        <Button
                            onClick={() => onRestore && onRestore(account)}
                            className="bg-sky-600 hover:bg-sky-700"
                        >
                            <Undo2 className="w-4 h-4 mr-2" />
                            Khôi phục tài khoản
                        </Button>
                    )}
                    {!account.is_deleted && account.role !== AccountRole.ADMIN && (
                        <Button
                            onClick={() => onBanUnban(account)}
                            className={
                                account.status === AccountStatus.ACTIVE
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                            }
                        >
                            {account.status === AccountStatus.ACTIVE ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { AccountDetailDialog };