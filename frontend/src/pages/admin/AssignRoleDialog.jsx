import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AccountRole } from './types/account';
import { User, Users, Stethoscope, Crown } from 'lucide-react';

const AssignRoleDialog = ({ account, onClose, onAssign }) => {
    const [selectedRole, setSelectedRole] = useState(AccountRole.USER);

    useEffect(() => {
        if (account) {
            setSelectedRole(account.role);
        }
    }, [account]);

    if (!account) return null;

    const handleAssign = () => {
        onAssign(account.id, selectedRole);
    };

    const roles = [
        {
            value: AccountRole.USER,
            label: 'Người dùng',
            icon: User,
            description: 'Tài khoản cơ bản với quyền hạn giới hạn',
        },
        {
            value: AccountRole.ADMIN,
            label: 'Quản trị viên',
            icon: Crown,
            description: 'Toàn quyền truy cập tất cả tính năng và cài đặt',
        },
    ];

    return (
        <Dialog open={!!account} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Phân công vai trò</DialogTitle>
                    <DialogDescription>
                        Phân công vai trò cho <span className="font-medium text-gray-900">{account.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value)}>
                        <div className="space-y-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                return (
                                    <div
                                        key={role.value}
                                        className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${selectedRole === role.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedRole(role.value)}
                                    >
                                        <RadioGroupItem value={role.value} id={role.value} className="mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className="w-4 h-4 text-gray-600" />
                                                <Label
                                                    htmlFor={role.value}
                                                    className="cursor-pointer"
                                                >
                                                    {role.label}
                                                </Label>
                                            </div>
                                            <p className="text-sm text-gray-500">{role.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={handleAssign} className="bg-[#846551] hover:bg-[#6B503F]">
                        Xác nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { AssignRoleDialog };