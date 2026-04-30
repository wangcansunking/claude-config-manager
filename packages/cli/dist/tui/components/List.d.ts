export interface ListProps<T> {
    items: T[];
    renderItem: (item: T, selected: boolean, idx: number) => string | React.ReactNode;
    onSelect: (item: T) => void;
    filterKey?: (item: T) => string;
    /** when true, this list owns input focus */
    active?: boolean;
    /** controlled cursor (optional — falls back to internal state when undefined) */
    cursor?: number;
    /** notify parent when cursor moves (used in controlled mode) */
    onCursorChange?: (idx: number, item: T) => void;
}
export declare function List<T>({ items, renderItem, onSelect, filterKey, active, cursor: controlledCursor, onCursorChange, }: ListProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=List.d.ts.map