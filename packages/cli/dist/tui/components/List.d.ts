export interface ListProps<T> {
    items: T[];
    renderItem: (item: T, selected: boolean, idx: number) => string | React.ReactNode;
    onSelect: (item: T) => void;
    filterKey?: (item: T) => string;
    /** when true, this list owns input focus */
    active?: boolean;
}
export declare function List<T>({ items, renderItem, onSelect, filterKey, active }: ListProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=List.d.ts.map