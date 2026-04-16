import {
    EyeOutlined,
    UserSwitchOutlined,
    LockOutlined,
    UnlockOutlined,
    UndoOutlined,
} from '@ant-design/icons';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccountStatus } from './types/account';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const AccountTable = ({ accounts, onViewDetail, onAssignRole, onBanUnban, onRestore }) => {
    if (accounts.length === 0) {
        return (
            <div className="py-20 text-center text-gray-400">
                Không có tài khoản nào
            </div>
        );
    }

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
            case 'staff':
                return 'bg-blue-600 text-white font-semibold';
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
            case 'staff':
                return 'Nhân viên';
            case 'user':
            default:
                return 'Người dùng';
        }
    };

    // NEW: Updated for inactive status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case AccountStatus.ACTIVE:
                return 'bg-green-600 text-white font-semibold';
            case AccountStatus.BANNED:
                return 'bg-red-600 text-white font-semibold';
            case AccountStatus.INACTIVE:
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
                return 'Bị khoá';
            case AccountStatus.INACTIVE:
                return 'Không hoạt động';  // NEW: For soft-deleted
            default:
                return status;
        }
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-700 font-semibold">HỌ TÊN</TableHead>
                        <TableHead className="text-gray-700 font-semibold">EMAIL</TableHead>
                        <TableHead className="text-gray-700 font-semibold">VAI TRÒ</TableHead>
                        <TableHead className="text-gray-700 font-semibold">TRẠNG THÁI</TableHead>
                        <TableHead className="text-gray-700 font-semibold">NGÀY TẠO</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-center">THÁO TÁC</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((account, index) => (
                        <TableRow key={account.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-gray-600">{account.email}</TableCell>
                            <TableCell>
                                <Badge className={getRoleBadgeColor(account.role)}>
                                    {getRoleLabel(account.role)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={getStatusBadgeClass(account.status)}>
                                    {getStatusLabel(account.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                                {formatDate(account.createdAt)}
                            </TableCell>
                            <TableCell className="text-center">
                                <TooltipProvider>
                                    <div className="flex items-center justify-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewDetail(account)}
                                                >
                                                    <EyeOutlined className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Xem chi tiết</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        {/* UPDATED: Assign Role - Disabled + Tooltip for deleted */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => !account.is_deleted && onAssignRole(account)}  // NEW: Conditional onClick
                                                    disabled={account.is_deleted}  // NEW: Disable for deleted
                                                    className={account.is_deleted ? 'opacity-50 cursor-not-allowed' : ''}  // NEW: Visual disabled
                                                >
                                                    <UserSwitchOutlined className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{account.is_deleted ? 'Không thể phân công vai trò cho tài khoản đã bị xóa' : 'Phân công vai trò'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => account.status === AccountStatus.INACTIVE ? onRestore(account) : onBanUnban(account)}
                                                    disabled={account.role === 'admin'}
                                                    className={
                                                        account.role === 'admin'
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : account.status === AccountStatus.INACTIVE
                                                                ? 'text-sky-600'
                                                                : account.status === AccountStatus.BANNED
                                                                ? 'text-green-600'
                                                                : 'text-amber-600'
                                                    }
                                                >
                                                    {account.status === AccountStatus.INACTIVE ? (
                                                        <UndoOutlined className="w-4 h-4" />
                                                    ) : account.status === AccountStatus.BANNED ? (
                                                        <UnlockOutlined className="w-4 h-4" />
                                                    ) : (
                                                        <LockOutlined className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {account.role === 'admin'
                                                        ? 'Không thể khoá quản trị viên'
                                                        : account.status === AccountStatus.INACTIVE
                                                            ? 'Khôi phục tài khoản đã xoá'
                                                            : account.is_deleted
                                                                ? 'Không thể khoá/mở khoá tài khoản đã xoá'
                                                            : account.status === AccountStatus.BANNED
                                                                ? 'Mở khoá tài khoản'
                                                                : 'Khoá tài khoản'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export { AccountTable };