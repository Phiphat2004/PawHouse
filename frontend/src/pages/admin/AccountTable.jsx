import { Eye, UserCog, Trash2 } from 'lucide-react';
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

const AccountTable = ({ accounts, onViewDetail, onAssignRole, onBanUnban, onDelete }) => {
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
                return 'bg-purple-100 text-purple-700 hover:bg-purple-100';
            case 'veterinarian':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
            case 'staff':
                return 'bg-green-100 text-green-700 hover:bg-green-100';
            case 'user':
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
        }
    };

    // NEW: Updated for inactive status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case AccountStatus.ACTIVE:
                return 'bg-green-100 text-green-700 hover:bg-green-100';
            case AccountStatus.BANNED:
                return 'bg-red-100 text-red-700 hover:bg-red-100';
            case AccountStatus.INACTIVE:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100';  // NEW: Gray for inactive
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
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
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
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
                        <TableRow key={account.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell className="text-gray-600">{account.email}</TableCell>
                            <TableCell>
                                <Badge className={getRoleBadgeColor(account.role)}>
                                    {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
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
                                                    <Eye className="w-4 h-4" />
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
                                                    <UserCog className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{account.is_deleted ? 'Không thể phân công vai trò cho tài khoản đã bị xóa' : 'Phân công vai trò'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        {/* Delete Button */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(account)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Xóa tài khoản</p>
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