import { useEffect } from 'react';
export function useAutoDismissToasts(store) {
    useEffect(() => {
        const id = setInterval(() => {
            const ts = store.getState().toasts;
            // Drop toasts older than 3s by id-timestamp prefix.
            const now = Date.now();
            ts.forEach((t) => {
                const ts0 = Number(t.id.split('-')[0]);
                if (Number.isFinite(ts0) && now - ts0 > 3000) {
                    store.getState().dismissToast(t.id);
                }
            });
        }, 250);
        return () => clearInterval(id);
    }, [store]);
}
//# sourceMappingURL=useToast.js.map