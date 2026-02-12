"use client";

import {
  type Column,
  type ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  RowSelectionState,
  type SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  CheckCheckIcon,
  CheckCircle,
  ChevronsUpDown,
  Clock,
  LoaderIcon,
  MoreHorizontal,
  Package,
  PieChart,
  RefreshCcw,
} from "lucide-react";
import type { CSSProperties } from "react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_OVERSCAN = 8;
const NON_NAVIGABLE_COLUMN_IDS = ["select", "actions"];
const DATA_URL =
  "https://raw.githubusercontent.com/zerostaticthemes/shadcnblocks-library-data/refs/heads/main/data/orders-ecommerce-1000.json";

type ColumnMeta = {
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
  className?: string;
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
};

type ColumnWithPinning = {
  getIsPinned?: () => "left" | "right" | false;
  getIsLastColumn?: (position: "left" | "right") => boolean;
  getIsFirstColumn?: (position: "left" | "right") => boolean;
  getStart?: (position: "left" | "right") => number;
  getAfter?: (position: "left" | "right") => number;
  getSize?: () => number;
};

type ComputedColumnStyles = {
  baseStyle: CSSProperties;
  pinnedStyle: CSSProperties;
  pinned: "left" | "right" | false;
  lastPinned?: "left" | "right";
  alignClass?: string;
};

function computeColumnStyles(
  meta: ColumnMeta,
  columnWithPinning: ColumnWithPinning,
): ComputedColumnStyles {
  const baseStyle: CSSProperties = {};

  if (meta.width !== undefined) {
    baseStyle.width =
      typeof meta.width === "number" ? `${meta.width}px` : meta.width;
  }
  if (meta.minWidth !== undefined) {
    baseStyle.minWidth =
      typeof meta.minWidth === "number" ? `${meta.minWidth}px` : meta.minWidth;
  }
  if (meta.maxWidth !== undefined) {
    baseStyle.maxWidth =
      typeof meta.maxWidth === "number" ? `${meta.maxWidth}px` : meta.maxWidth;
  }
  if (
    baseStyle.width === undefined &&
    typeof columnWithPinning.getSize === "function"
  ) {
    const computedWidth = columnWithPinning.getSize();
    if (typeof computedWidth === "number" && Number.isFinite(computedWidth)) {
      baseStyle.width = `${computedWidth}px`;
    }
  }

  const pinned = columnWithPinning.getIsPinned?.() ?? false;
  const pinnedStyle: CSSProperties = {};
  let lastPinned: "left" | "right" | undefined;

  if (pinned) {
    pinnedStyle.position = "sticky";
    pinnedStyle.zIndex = 20;

    if (pinned === "left") {
      const start = columnWithPinning.getStart?.("left") ?? 0;
      pinnedStyle.left = `${start}px`;
      if (columnWithPinning.getIsLastColumn?.("left")) {
        lastPinned = "left";
      }
    }

    if (pinned === "right") {
      const after = columnWithPinning.getAfter?.("right") ?? 0;
      pinnedStyle.right = `${after}px`;
      if (columnWithPinning.getIsFirstColumn?.("right")) {
        lastPinned = "right";
      }
    }

    const resolvedWidth =
      baseStyle.width ??
      (typeof columnWithPinning.getSize === "function"
        ? columnWithPinning.getSize()
        : undefined);
    if (resolvedWidth !== undefined) {
      pinnedStyle.width =
        typeof resolvedWidth === "number"
          ? `${resolvedWidth}px`
          : resolvedWidth;
    }
  }

  const alignClass =
    meta.align === "center"
      ? "text-center"
      : meta.align === "right"
        ? "text-right"
        : meta.align === "left"
          ? "text-left"
          : undefined;

  return {
    baseStyle,
    pinnedStyle,
    pinned,
    lastPinned,
    alignClass,
  };
}

type CellPosition = {
  rowIndex: number;
  columnId: string;
};

type SelectionRange = {
  start: CellPosition;
  end: CellPosition;
};

type SelectionState = {
  selectedCells: Set<string>;
  selectionRange: SelectionRange | null;
};

type UseDataTableOptions<TData> = {
  data: Array<TData>;
  columns: Array<ColumnDef<TData, unknown>>;
  getRowId?: (row: TData) => string;
  initialSorting?: SortingState;
  initialGlobalFilter?: string;
  initialFilters?: ColumnFiltersState;
  initialVisibility?: VisibilityState;
  initialSelection?: RowSelectionState;
  initialColumnPinning?: ColumnPinningState;
  enableRowSelection?: boolean;
  rowHeight?: number;
  overscan?: number;
  onLoadingChange?: (loading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
};

export function useDataTable<TData>(options: UseDataTableOptions<TData>) {
  const {
    data,
    columns,
    getRowId,
    initialSorting = [],

    initialSelection = {},
    enableRowSelection = true,
    initialColumnPinning = {},
    rowHeight = DEFAULT_ROW_HEIGHT,
    overscan = DEFAULT_OVERSCAN,
    onLoadingChange,
    onErrorChange,
  } = options;

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);

  const [rowSelection, setRowSelection] =
    React.useState<RowSelectionState>(initialSelection);
  const [columnPinning, setColumnPinning] =
    React.useState<ColumnPinningState>(initialColumnPinning);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [focusedCell, setFocusedCell] = React.useState<CellPosition | null>(
    null,
  );
  const [selectionState, setSelectionState] = React.useState<SelectionState>({
    selectedCells: new Set(),
    selectionRange: null,
  });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnPinning,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnPinningChange: setColumnPinning,
    enableRowSelection,
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const columnIds = React.useMemo(() => {
    return columns
      .map((column) => {
        if (column.id) return column.id;
        if ("accessorKey" in column && column.accessorKey) {
          return column.accessorKey.toString();
        }
        return undefined;
      })
      .filter((id): id is string => Boolean(id));
  }, [columns]);

  const navigableColumnIds = React.useMemo(() => {
    return columnIds.filter((id) => !NON_NAVIGABLE_COLUMN_IDS.includes(id));
  }, [columnIds]);

  const getCellKey = React.useCallback(
    (rowIndex: number, columnId: string) => `${rowIndex}:${columnId}`,
    [],
  );

  const clearSelection = React.useCallback(() => {
    setSelectionState({ selectedCells: new Set(), selectionRange: null });
  }, []);

  const selectSingleCell = React.useCallback(
    (position: CellPosition) => {
      const cellKey = getCellKey(position.rowIndex, position.columnId);
      setSelectionState({
        selectedCells: new Set([cellKey]),
        selectionRange: {
          start: { ...position },
          end: { ...position },
        },
      });
    },
    [getCellKey],
  );

  const selectRange = React.useCallback(
    (start: CellPosition, end: CellPosition) => {
      const startIndex = columnIds.indexOf(start.columnId);
      const endIndex = columnIds.indexOf(end.columnId);
      if (startIndex === -1 || endIndex === -1) return;

      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minCol = Math.min(startIndex, endIndex);
      const maxCol = Math.max(startIndex, endIndex);

      const selected = new Set<string>();
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const columnId = columnIds[col];
          if (!columnId) continue;
          selected.add(getCellKey(row, columnId));
        }
      }

      setSelectionState({
        selectedCells: selected,
        selectionRange: { start: { ...start }, end: { ...end } },
      });
    },
    [columnIds, getCellKey],
  );

  const toggleCellSelection = React.useCallback(
    (position: CellPosition) => {
      const cellKey = getCellKey(position.rowIndex, position.columnId);
      setSelectionState((prev) => {
        const next = new Set(prev.selectedCells);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        return {
          selectedCells: next,
          selectionRange: {
            start: { ...position },
            end: { ...position },
          },
        };
      });
    },
    [getCellKey],
  );

  const focusCell = React.useCallback(
    (rowIndex: number, columnId: string) => {
      setFocusedCell({ rowIndex, columnId });
      rowVirtualizer.scrollToIndex(rowIndex, { align: "auto" });
    },
    [rowVirtualizer],
  );

  const isCellSelected = React.useCallback(
    (rowIndex: number, columnId: string) => {
      return selectionState.selectedCells.has(getCellKey(rowIndex, columnId));
    },
    [selectionState.selectedCells, getCellKey],
  );

  const ensureContainerFocus = React.useCallback(() => {
    const el = tableContainerRef.current;
    if (el && document.activeElement !== el) {
      el.focus();
    }
  }, []);

  const escapeCsvValue = React.useCallback((value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "string" ? value : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }, []);

  const copySelectionToClipboard = React.useCallback(async () => {
    const selectedKeys = Array.from(selectionState.selectedCells);
    if (selectedKeys.length === 0) {
      toast("Select one or more cells to copy.");
      return;
    }

    const parsed = selectedKeys
      .map((key) => {
        const [rowIndexStr, columnId] = key.split(":");
        const rowIndex = Number.parseInt(rowIndexStr, 10);
        return Number.isFinite(rowIndex) && columnId
          ? { rowIndex, columnId }
          : null;
      })
      .filter((entry): entry is { rowIndex: number; columnId: string } =>
        Boolean(entry),
      );

    if (parsed.length === 0) {
      toast("Select one or more cells to copy.");
      return;
    }

    const rowModel = table.getRowModel().rows;
    const selectedRowIndexes = Array.from(
      new Set(parsed.map((item) => item.rowIndex)),
    ).sort((a, b) => a - b);
    const selectedColumnIds = columnIds.filter((id) =>
      parsed.some((item) => item.columnId === id),
    );

    if (selectedRowIndexes.length === 0 || selectedColumnIds.length === 0) {
      toast("Select one or more cells to copy.");
      return;
    }

    const headerRow = selectedColumnIds.join(",");
    const dataRows = selectedRowIndexes
      .map((rowIndex) => {
        const row = rowModel[rowIndex];
        if (!row) return null;

        const values = selectedColumnIds.map((columnId) => {
          const value = row.getValue(columnId);
          return escapeCsvValue(value);
        });

        return values.join(",");
      })
      .filter((row): row is string => Boolean(row));

    const csv = [headerRow, ...dataRows].join("\n");

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        toast.error("Clipboard is not available in this browser");
        return;
      }
      await navigator.clipboard.writeText(csv);
      toast.success(
        `Copied ${selectedKeys.length} selected cell${selectedKeys.length === 1 ? "" : "s"} as CSV`,
      );
    } catch (error) {
      console.error("Failed to copy selection", error);
      toast.error("Could not copy cells to clipboard");
    }
  }, [selectionState.selectedCells, table, columnIds, escapeCsvValue]);

  const handleCellClick = React.useCallback(
    (
      rowIndex: number,
      columnId: string,
      event?: React.MouseEvent<HTMLTableCellElement>,
    ) => {
      const position = { rowIndex, columnId };
      ensureContainerFocus();
      focusCell(position.rowIndex, position.columnId);

      if (event?.shiftKey) {
        const start = selectionState.selectionRange?.start ||
          focusedCell || { ...position };
        selectRange(start, position);
        return;
      }

      if (event?.metaKey || event?.ctrlKey) {
        toggleCellSelection(position);
        return;
      }

      selectSingleCell(position);
    },
    [
      ensureContainerFocus,
      focusCell,
      selectionState.selectionRange,
      focusedCell,
      selectRange,
      toggleCellSelection,
      selectSingleCell,
    ],
  );

  const navigateCell = React.useCallback(
    (direction: "up" | "down" | "left" | "right" | "home" | "end") => {
      if (!focusedCell) return null;
      const rowCount = table.getRowModel().rows.length;
      const currentColIndex = navigableColumnIds.indexOf(focusedCell.columnId);

      let nextRow = focusedCell.rowIndex;
      let nextColId = focusedCell.columnId;

      switch (direction) {
        case "up":
          nextRow = Math.max(0, focusedCell.rowIndex - 1);
          break;
        case "down":
          nextRow = Math.min(rowCount - 1, focusedCell.rowIndex + 1);
          break;
        case "left":
          if (currentColIndex > 0) {
            nextColId = navigableColumnIds[currentColIndex - 1] ?? nextColId;
          }
          break;
        case "right":
          if (currentColIndex < navigableColumnIds.length - 1) {
            nextColId = navigableColumnIds[currentColIndex + 1] ?? nextColId;
          }
          break;
        case "home":
          if (navigableColumnIds.length > 0) {
            nextColId = navigableColumnIds[0]!;
          }
          break;
        case "end":
          if (navigableColumnIds.length > 0) {
            nextColId = navigableColumnIds[navigableColumnIds.length - 1]!;
          }
          break;
      }

      return { rowIndex: nextRow, columnId: nextColId };
    },
    [focusedCell, navigableColumnIds, table],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key.toLowerCase() === "c" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        copySelectionToClipboard();
        return;
      }

      if (!focusedCell) return;

      const { key, shiftKey } = event;
      let direction: Parameters<typeof navigateCell>[0] | null = null;

      switch (key) {
        case "ArrowUp":
          direction = "up";
          break;
        case "ArrowDown":
          direction = "down";
          break;
        case "ArrowLeft":
          direction = "left";
          break;
        case "ArrowRight":
          direction = "right";
          break;
        case "Home":
          direction = "home";
          break;
        case "End":
          direction = "end";
          break;
        case "Escape":
          clearSelection();
          return;
        default:
          return;
      }

      if (!direction) return;

      const next = navigateCell(direction);
      if (!next) return;

      event.preventDefault();
      focusCell(next.rowIndex, next.columnId);

      if (shiftKey) {
        const start =
          selectionState.selectionRange?.start || focusedCell || next;
        selectRange(start, next);
      } else {
        selectSingleCell(next);
      }
    },
    [
      copySelectionToClipboard,
      focusedCell,
      navigateCell,
      focusCell,
      selectRange,
      selectionState.selectionRange,
      selectSingleCell,
      clearSelection,
    ],
  );

  React.useEffect(() => {
    if (
      !focusedCell &&
      table.getRowModel().rows.length > 0 &&
      navigableColumnIds.length > 0
    ) {
      const firstColumnId = navigableColumnIds[0];
      focusCell(0, firstColumnId);
      selectSingleCell({ rowIndex: 0, columnId: firstColumnId });
    }
  }, [focusedCell, table, navigableColumnIds, focusCell, selectSingleCell]);

  return {
    table,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    columnPinning,
    setColumnPinning,
    tableContainerRef,
    rowVirtualizer,
    focusedCell,
    handleCellClick,
    handleKeyDown,
    isCellSelected,
  };
}

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
};

export const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) => {
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

  if (!canSort) {
    return (
      <span className="flex h-8 items-center text-sm font-medium text-foreground">
        {title}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex h-8 items-center gap-2 px-0 text-sm font-medium text-foreground"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  schema: z.ZodSchema;
  itemName: string;
  idField?: string;
}

export function DataTableRowActions<TData>({
  row,
  schema,
  itemName,
  idField = "id",
}: DataTableRowActionsProps<TData>) {
  const item = schema.parse(row.original) as TData;
  const itemRecord = item as Record<string, unknown>;
  const handleCopy = async () => {
    const value = itemRecord[idField] ?? itemRecord.id;
    if (!value) {
      toast.error("No ID available to copy");
      return;
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      toast.error("Clipboard is not available in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      toast.success("ID copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard", error);
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCopy}>
          Copy {itemName} ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Edit {itemName}</DropdownMenuItem>
        <DropdownMenuItem>View details</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const schema = z.object({
  id: z.string(),
  purchased: z.string(),
  items: z.number(),
  customer: z.string(),
  customer_email: z.string(),
  customer_segment: z.string(),
  fulfillment_channel: z.string(),
  shipping_service: z.string(),
  warehouse: z.string(),
  order_status: z.string(),
  payment_status: z.string(),
  payment_method: z.string(),
  tracking_number: z.string(),
  assigned_to: z.string(),
  return_status: z.string(),
  coupon_code: z.string().nullable(),
  gift: z.boolean(),
  notes: z.string(),
});

export type Order = z.infer<typeof schema>;

export type StatusOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export const orderStatuses: StatusOption[] = [
  { label: "Fulfilled", value: "Fulfilled", icon: CheckCircle },
  { label: "Ready for pickup", value: "Ready for pickup", icon: Package },
  { label: "Unfulfilled", value: "Unfulfilled", icon: Clock },
];

export const paymentStatuses: StatusOption[] = [
  { label: "Paid", value: "Paid", icon: CheckCheckIcon },
  { label: "Pending", value: "Pending", icon: LoaderIcon },
  { label: "Refunded", value: "Refunded", icon: RefreshCcw },
  {
    label: "Partially refunded",
    value: "Partially refunded",
    icon: PieChart,
  },
];

const createStatusLookup = (options: StatusOption[]) =>
  options.reduce<Record<string, StatusOption>>((acc, option) => {
    acc[option.value] = option;
    return acc;
  }, {});

const orderStatusLookup = createStatusLookup(orderStatuses);
const paymentStatusLookup = createStatusLookup(paymentStatuses);

export const getOrderStatusMeta = (status: string) => orderStatusLookup[status];

export const getPaymentStatusMeta = (status: string) =>
  paymentStatusLookup[status];

export const getStatusVariant = (status: string) => {
  switch (status) {
    case "Fulfilled":
      return "default";
    case "Ready for pickup":
      return "secondary";
    case "Unfulfilled":
      return "outline";
    default:
      return "outline";
  }
};

export const getPaymentVariant = (status: string) => {
  switch (status) {
    case "Paid":
      return "default";
    case "Pending":
      return "secondary";
    case "Refunded":
      return "outline";
    case "Partially refunded":
      return "outline";
    default:
      return "outline";
  }
};

export const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      width: 56,
      minWidth: 48,
      headerClassName: "px-2",
      cellClassName: "px-2",
      align: "center",
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    cell: ({ row }) => (
      <div className="w-[120px] font-mono">{row.original.id}</div>
    ),
    enableSorting: true,
    enableHiding: false,
    meta: {
      width: 120,
    },
  },
  {
    accessorKey: "purchased",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purchased" />
    ),
    cell: ({ row }) => {
      const items = row.original.items;

      return (
        <div className="flex gap-2">
          <div className="max-w-[320px] truncate font-medium">
            {row.original.purchased}
          </div>
          {items ? <Badge variant="outline">{items}</Badge> : null}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      width: 280,
    },
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate">{row.original.customer}</div>
    ),
    meta: {
      width: 200,
    },
  },
  {
    accessorKey: "customer_email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Email" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[240px] truncate text-xs sm:text-sm">
        {row.original.customer_email}
      </span>
    ),
    meta: {
      width: 240,
    },
  },
  {
    accessorKey: "customer_segment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Segment" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.customer_segment}</Badge>
    ),
    meta: { className: "whitespace-nowrap", width: 160 },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "fulfillment_channel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fulfillment" />
    ),
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap sm:text-sm">
        {row.original.fulfillment_channel}
      </span>
    ),
    meta: { className: "whitespace-nowrap", width: 160 },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "shipping_service",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Shipping Service" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[240px] truncate text-xs sm:text-sm">
        {row.original.shipping_service}
      </span>
    ),
    meta: { width: 220 },
  },
  {
    accessorKey: "warehouse",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Warehouse" />
    ),
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap sm:text-sm">
        {row.original.warehouse}
      </span>
    ),
    meta: { className: "whitespace-nowrap", width: 140 },
  },
  {
    accessorKey: "order_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.order_status;
      const statusMeta = getOrderStatusMeta(status);
      const StatusIcon = statusMeta?.icon;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusVariant(status)}
            className="gap-1 whitespace-nowrap"
          >
            {StatusIcon ? <StatusIcon className="size-3" /> : null}
            <span>{statusMeta?.label ?? status}</span>
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return true;
      }
      const rowValue = String(row.getValue(id));
      return value.includes(rowValue);
    },
    enableSorting: false,
    meta: { width: 200 },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.payment_status;
      const statusMeta = getPaymentStatusMeta(status);
      const StatusIcon = statusMeta?.icon;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={getPaymentVariant(status)}
            className="gap-1 whitespace-nowrap"
          >
            {StatusIcon ? <StatusIcon className="size-3" /> : null}
            <span>{statusMeta?.label ?? status}</span>
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return true;
      }
      const rowValue = String(row.getValue(id));
      return value.includes(rowValue);
    },
    enableSorting: false,
    meta: { width: 200 },
  },
  {
    accessorKey: "payment_method",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Method" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs sm:text-sm">
        {row.original.payment_method}
      </div>
    ),
    meta: { width: 180 },
  },

  {
    accessorKey: "items",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
    cell: ({ row }) => (
      <span className="text-xs tabular-nums sm:text-sm">
        {row.original.items}
      </span>
    ),
    meta: { align: "center", className: "tabular-nums", width: 100 },
  },

  {
    accessorKey: "tracking_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tracking" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs sm:text-sm">
        {row.original.tracking_number}
      </span>
    ),
    meta: { className: "whitespace-nowrap", width: 200 },
  },
  {
    accessorKey: "assigned_to",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assignee" />
    ),
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap sm:text-sm">
        {row.original.assigned_to}
      </span>
    ),
    meta: { className: "whitespace-nowrap", width: 180 },
  },
  {
    accessorKey: "return_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Return Status" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.return_status}</Badge>
    ),
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(String(row.getValue(id)));
    },
    meta: { width: 180 },
  },

  {
    accessorKey: "coupon_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coupon" />
    ),
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm">
        {row.original.coupon_code ?? "—"}
      </span>
    ),
    meta: { width: 140 },
  },
  {
    accessorKey: "gift",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gift" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.gift ? "secondary" : "outline"}>
        {row.original.gift ? "Yes" : "No"}
      </Badge>
    ),
    meta: { width: 120 },
  },

  {
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[240px] truncate text-xs sm:text-sm">
        {row.original.notes}
      </span>
    ),
    meta: { width: 260 },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        schema={schema}
        itemName="order"
        idField="id"
      />
    ),
    meta: {
      width: 56,
      minWidth: 48,
      headerClassName: "px-2",
      cellClassName: "px-2",
      align: "center",
    },
  },
];

export const DataTable28 = () => {
  const [data, setData] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) {
          const message = `Failed to fetch orders data (${res.status})`;
          console.error(message, res.statusText);
          if (active) setError(message);
          return;
        }
        const json = await res.json();
        const parsed = schema.array().parse(json);
        if (active) {
          setData(parsed);
        }
      } catch (error) {
        console.error("Error fetching orders data", error);
        if (active) setError("Error fetching orders data");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const {
    table,
    tableContainerRef,
    rowVirtualizer,
    focusedCell,
    handleCellClick,
    handleKeyDown,
    isCellSelected,
  } = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    initialColumnPinning: { left: ["select"], right: ["actions"] },
    onLoadingChange: setIsLoading,
    onErrorChange: setError,
  });
  const visibleColumns = table.getVisibleLeafColumns();
  const visibleColumnCount = Math.max(visibleColumns.length, 1);
  const rowModel = table.getRowModel().rows;
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;
  const hasRows = rowModel.length > 0;

  return (
    <section className="py-32">
      <div className="container">
        <div className="w-full">
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              Virtualized Data Table With Grid Navigation through keybord
              controls
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Click any cell (or Press Tab to focus the grid), then use the
              arrow keys, Home/End, and Shift+Arrow to move focus and create
              multi-cell selections. Cmd/Ctrl+Click toggles individual cells,
              Cmd/Ctrl+C copies the current selection as CSV to the clipboard
              (with a toast), and Escape clears the selection.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border-2">
            <div
              ref={tableContainerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="relative max-h-[600px] overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLoading ? (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    <span>Loading orders…</span>
                  </div>
                </div>
              ) : null}
              <table className="w-full table-fixed caption-bottom border-separate border-spacing-0 text-sm [&_td]:border-border [&_tfoot_td]:border-t [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
                <TableHeader className="sticky top-0 z-20 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta =
                          (header.column.columnDef.meta as ColumnMeta) ?? {};
                        const columnWithPinning =
                          header.column as unknown as ColumnWithPinning;
                        const {
                          baseStyle,
                          pinnedStyle,
                          pinned,
                          lastPinned,
                          alignClass,
                        } = computeColumnStyles(meta, columnWithPinning);

                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{ ...baseStyle, ...pinnedStyle }}
                            className={cn(
                              "relative h-11 truncate border-r px-3 text-sm font-medium last:border-r-0 data-[pinned]:bg-muted/90 data-[pinned]:backdrop-blur-xs [&[data-pinned=left][data-last-col=left]]:border-r [&[data-pinned=right][data-last-col=right]]:border-l",
                              meta.className,
                              meta.headerClassName,
                              alignClass,
                            )}
                            data-pinned={pinned || undefined}
                            data-last-col={lastPinned || undefined}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className="border-b last:border-b-0">
                      <TableCell
                        colSpan={visibleColumnCount}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        <div className="inline-flex items-center gap-2">
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                          <span>Loading orders…</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow className="border-b last:border-b-0">
                      <TableCell
                        colSpan={visibleColumnCount}
                        className="h-24 text-center text-sm text-destructive"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : hasRows ? (
                    <>
                      {paddingTop > 0 ? (
                        <TableRow
                          className="pointer-events-none border-none"
                          aria-hidden="true"
                          style={{ height: paddingTop }}
                        >
                          {visibleColumns.map((column) => (
                            <TableCell
                              key={`pad-top-${column.id}`}
                              className="border-none p-0"
                            />
                          ))}
                        </TableRow>
                      ) : null}
                      {virtualRows.map((virtualRow) => {
                        const row = rowModel[virtualRow.index];
                        if (!row) return null;

                        return (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className="border-b last:border-b-0"
                            style={{ height: virtualRow.size }}
                          >
                            {row.getVisibleCells().map((cell) => {
                              const meta =
                                (cell.column.columnDef.meta as ColumnMeta) ??
                                {};
                              const columnWithPinning =
                                cell.column as unknown as ColumnWithPinning;
                              const {
                                baseStyle,
                                pinnedStyle,
                                pinned,
                                lastPinned,
                                alignClass,
                              } = computeColumnStyles(meta, columnWithPinning);

                              const isFocused =
                                focusedCell?.rowIndex === virtualRow.index &&
                                focusedCell?.columnId === cell.column.id;
                              const selected = isCellSelected(
                                virtualRow.index,
                                cell.column.id,
                              );
                              const isNavigable =
                                !NON_NAVIGABLE_COLUMN_IDS.includes(
                                  cell.column.id,
                                );

                              return (
                                <TableCell
                                  key={cell.id}
                                  style={{ ...baseStyle, ...pinnedStyle }}
                                  className={cn(
                                    "truncate border-r p-3 py-2 text-sm transition-colors duration-75 last:border-r-0 data-[pinned]:bg-background/90 data-[pinned]:backdrop-blur-xs [&[data-pinned=left][data-last-col=left]]:border-r [&[data-pinned=right][data-last-col=right]]:border-l",
                                    isNavigable &&
                                      "cursor-cell hover:bg-muted/40",
                                    "data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:data-[selected=true]:bg-muted/40",
                                    "dark[data-[focused=true]:shadow-[inset_0_0_0_2px_rgba(129,140,248,0.8)] data-[focused=true]:relative data-[focused=true]:z-10 data-[focused=true]:bg-background data-[focused=true]:shadow-[inset_0_0_0_2px_rgba(99,102,241,0.8)]",
                                    meta.className,
                                    meta.cellClassName,
                                    alignClass,
                                  )}
                                  data-pinned={pinned || undefined}
                                  data-last-col={lastPinned || undefined}
                                  data-focused={isFocused || undefined}
                                  data-selected={selected || undefined}
                                  onClick={(event) =>
                                    handleCellClick(
                                      virtualRow.index,
                                      cell.column.id,
                                      event,
                                    )
                                  }
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      {paddingBottom > 0 ? (
                        <TableRow
                          className="pointer-events-none border-none"
                          aria-hidden="true"
                          style={{ height: paddingBottom }}
                        >
                          {visibleColumns.map((column) => (
                            <TableCell
                              key={`pad-bottom-${column.id}`}
                              className="border-none p-0"
                            />
                          ))}
                        </TableRow>
                      ) : null}
                    </>
                  ) : (
                    <TableRow className="border-b last:border-b-0">
                      <TableCell
                        colSpan={visibleColumnCount}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
