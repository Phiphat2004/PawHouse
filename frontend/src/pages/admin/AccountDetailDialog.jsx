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
import {
    MailOutlined,
    UserOutlined,
    SafetyOutlined,
    CalendarOutlined,
    ExclamationCircleOutlined,
    UndoOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';

const AccountDetailDialog = ({ account, isLoading, onClose, onBanUnban, onRestore }) => {
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
                return 'Administrator';
            case 'staff':
                return 'Staff';
            case 'user':
            default:
                return 'Customer';
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
                return 'Active';
            case AccountStatus.BANNED:
                return 'Banned';
            case AccountStatus.INACTIVE:
                return 'Inactive';
            default:
                return status;
        }
    };

    const getAddressLabel = (address) => {
        if (!address) return 'Not set';
        const parts = [address.addressLine, address.ward, address.district, address.city].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Not set';
    };

    const accountName = account.profile?.fullName || account.name || 'Not set';
    const accountPhone = account.phone || 'Not set';
    const accountGender = account.profile?.gender || 'Not set';
    const accountDob = account.profile?.dob ? formatDate(account.profile.dob) : 'Not set';
    const accountAddress = getAddressLabel(account.profile?.address);
    const authProviderLabel = account.authProvider === 'google' ? 'Google' : 'Email/Password';
    const accountInitial = accountName?.charAt(0)?.toUpperCase() || 'U';
    const rawAvatarUrl = account.profile?.avatarUrl?.trim() || '';

    const getAvatarSrc = (url) => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (url.startsWith('//')) return `${window.location.protocol}${url}`;
        if (url.startsWith('/api/uploads/')) return url.replace(/^\/api/, '');
        if (url.startsWith('api/uploads/')) return `/${url.replace(/^api\//, '')}`;
        if (url.startsWith('uploads/')) return `/${url}`;
        return url;
    };

    const accountAvatarSrc = getAvatarSrc(rawAvatarUrl);

    const getStatusTone = (status) => {
        switch (status) {
            case AccountStatus.ACTIVE:
                return 'from-green-500 to-emerald-600';
            case AccountStatus.BANNED:
                return 'from-red-500 to-rose-600';
            case AccountStatus.INACTIVE:
                return 'from-slate-500 to-slate-600';
            default:
                return 'from-slate-500 to-slate-600';
        }
    };

    return (
        <Dialog open={!!account} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Account Details</DialogTitle>
                    <DialogDescription>
                        {account.is_deleted && (
                            <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                                ⚠️ This account has been deleted (inactive).
                            </div>
                        )}
                        View detailed information for this account
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="py-10 text-center text-gray-500">Loading account details...</div>
                ) : (
                    <div className="space-y-5 py-2">
                        <div className={`rounded-2xl bg-linear-to-r ${getStatusTone(account.status)} p-5 text-white`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 text-xl font-bold">
                                        {accountAvatarSrc ? (
                                            <img
                                                src={accountAvatarSrc}
                                                alt={accountName}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            accountInitial
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold leading-tight">{accountName}</p>
                                        <p className="text-sm text-white/85">{account.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="border-0 bg-white/20 text-white font-semibold">
                                        {getRoleLabel(account.role)}
                                    </Badge>
                                    <Badge className="border-0 bg-white/20 text-white font-semibold">
                                        {getStatusLabel(account.status)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <section className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Identity</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <UserOutlined className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Full Name</p>
                                            <p className="text-sm font-medium text-gray-900">{accountName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                            <SafetyOutlined className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Role</p>
                                            <Badge className={getRoleBadgeColor(account.role)}>{getRoleLabel(account.role)}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                            <CalendarOutlined className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Created At</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(account.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-4">
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Status & Security</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                            <ExclamationCircleOutlined className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge className={getStatusBadgeClass(account.status)}>{getStatusLabel(account.status)}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                            <CheckCircleOutlined className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Verified</p>
                                            <p className="text-sm font-medium text-gray-900">{account.isVerified ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                            <SafetyOutlined className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Auth Provider</p>
                                            <p className="text-sm font-medium text-gray-900">{authProviderLabel}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Contact & Profile</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="mt-1 text-sm font-medium text-gray-900 flex items-center gap-2 break-all">
                                            <MailOutlined className="text-green-600" />
                                            {account.email}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="mt-1 text-sm font-medium text-gray-900 flex items-center gap-2">
                                            <PhoneOutlined className="text-cyan-600" />
                                            {accountPhone}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">Gender</p>
                                        <p className="mt-1 text-sm font-medium text-gray-900">{accountGender}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">Date of Birth</p>
                                        <p className="mt-1 text-sm font-medium text-gray-900">{accountDob}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="mt-1 text-sm font-medium text-gray-900">{accountAddress}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* Dialog Footer with Actions */}
                <div className="border-t pt-4 flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {account.is_deleted && (
                        <Button
                            onClick={() => onRestore && onRestore(account)}
                            className="bg-sky-600 hover:bg-sky-700"
                        >
                            <UndoOutlined className="w-4 h-4 mr-2" />
                            Restore Account
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
                            {account.status === AccountStatus.ACTIVE ? 'Ban Account' : 'Unban Account'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { AccountDetailDialog };