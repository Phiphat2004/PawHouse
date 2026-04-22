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
import { DeleteOutlined } from '@ant-design/icons';

const DeleteAccountDialog = ({ account, onClose, onConfirm }) => {
    if (!account) return null;

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
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <DeleteOutlined className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>
                            Disable Account
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Are you sure you want to disable the account for{' '}
                        <span className="font-medium text-gray-900">{account.name}</span> (
                        {account.email})? The account will not be able to login until re-enabled by an administrator.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className='bg-red-600 hover:bg-red-700'
                    >
                        Confirm Disable
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export { DeleteAccountDialog };
