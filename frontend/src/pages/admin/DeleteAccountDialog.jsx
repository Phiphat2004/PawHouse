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
import { Trash2 } from 'lucide-react';

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
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle>
                            Xóa tài khoản
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của{' '}
                        <span className="font-medium text-gray-900">{account.name}</span> (
                        {account.email})? Hành động này không thể hoàn tác và toàn bộ dữ liệu liên quan sẽ bị xóa.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className='bg-red-600 hover:bg-red-700'
                    >
                        Xóa tài khoản
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export { DeleteAccountDialog };
