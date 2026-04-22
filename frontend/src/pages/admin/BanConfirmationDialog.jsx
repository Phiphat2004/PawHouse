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
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

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
                                <WarningOutlined className="w-6 h-6 text-red-600" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircleOutlined className="w-6 h-6 text-green-600" />
                            </div>
                        )}
                        <AlertDialogTitle>
                            {isBanning ? 'Ban Account' : 'Unban Account'}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        {isBanning ? (
                            <>
                                Are you sure you want to ban the account of{' '}
                                <span className="font-medium text-gray-900">{account.name}</span> (
                                {account.email})? This user will no longer be able to access the system.
                            </>
                        ) : (
                            <>
                                Are you sure you want to unban{' '}
                                <span className="font-medium text-gray-900">{account.name}</span> (
                                {account.email})? This user will be granted access to the system again.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={
                            isBanning
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                        }
                    >
                        {isBanning ? 'Ban Account' : 'Unban Account'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export { BanConfirmationDialog };