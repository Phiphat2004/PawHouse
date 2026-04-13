import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AccountStatus } from './types/account';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const BanConfirmationDialog = ({ account, onClose, onConfirm }) => {
    if (!account) return null;

    const isBanning = account.status === AccountStatus.ACTIVE;
    const handleOpenChange = (isOpen) => {
        if (!isOpen) {
            onClose();
        }
    };

    return (
        <AlertDialog open={!!account} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {isBanning ? (
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        )}
                        <AlertDialogTitle>
                            {isBanning ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        {isBanning ? (
                            <>
                                Bạn có chắc chắn muốn khoá tài khoản của{' '}
                                <span className="font-medium text-gray-900">{account.name}</span> (
                                {account.email})? Người dùng này sẽ không còn có thể truy cập hệ thống.
                            </>
                        ) : (
                            <>
                                Bạn có chắc chắn muốn mở khoá{' '}
                                <span className="font-medium text-gray-900">{account.name}</span> (
                                {account.email})? Người dùng này sẽ được trậy lại quyền truy cập hệ thống.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={
                            isBanning
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                        }
                    >
                        {isBanning ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export { BanConfirmationDialog };