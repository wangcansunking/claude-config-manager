export interface ConfirmModalProps {
    title: string;
    body: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm(): Promise<void> | void;
    onCancel(): void;
}
export declare function ConfirmModal({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel, }: ConfirmModalProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ConfirmModal.d.ts.map