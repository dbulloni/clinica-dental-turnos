import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TableColumn } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  rowClassName?: (record: T, index: number) => string;
  onRowClick?: (record: T, index: number) => void;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onSort,
  sortKey,
  sortDirection,
  className,
  rowClassName,
  onRowClick,
}: TableProps<T>) => {
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    const key = column.key as string;
    const newDirection = 
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(key, newDirection);
  };

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;

    const key = column.key as string;
    const isActive = sortKey === key;

    return (
      <span className="ml-1 inline-flex flex-col">
        <ChevronUp 
          className={cn(
            'w-3 h-3 -mb-1',
            isActive && sortDirection === 'asc' 
              ? 'text-primary-600' 
              : 'text-gray-400'
          )} 
        />
        <ChevronDown 
          className={cn(
            'w-3 h-3',
            isActive && sortDirection === 'desc' 
              ? 'text-primary-600' 
              : 'text-gray-400'
          )} 
        />
      </span>
    );
  };

  const getCellValue = (record: T, column: TableColumn<T>) => {
    const key = column.key as string;
    const value = key.includes('.') 
      ? key.split('.').reduce((obj, k) => obj?.[k], record)
      : record[key];
    
    return column.render ? column.render(value, record) : value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  'table-header-cell',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  <span>{column.title}</span>
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="table-cell text-center py-12 text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((record, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'table-row',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(record, rowIndex)
                )}
                onClick={() => onRowClick?.(record, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'table-cell',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {getCellValue(record, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;