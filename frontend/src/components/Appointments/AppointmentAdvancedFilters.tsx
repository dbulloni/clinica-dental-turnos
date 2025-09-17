import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  User, 
  Clock, 
  FileText,
  Search,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { AppointmentFilters, Professional, TreatmentType, APPOINTMENT_STATUSES } from '../../types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentAdvancedFiltersProps {
  filters: AppointmentFilters;
  onFiltersChange: (filters: AppointmentFilters) => void;
  professionals: Professional[];
  treatmentTypes: TreatmentType[];
  onExport?: () => void;
  className?: string;
}

const AppointmentAdvancedFilters: React.FC<AppointmentAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  professionals,
  treatmentTypes,
  onExport,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date presets
  const datePresets = [
    {
      label: 'Hoy',
      getValue: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return { startDate: today, endDate: today };
      },
    },
    {
      label: 'Ayer',
      getValue: () => {
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        return { startDate: yesterday, endDate: yesterday };
      },
    },
    {
      label: 'Esta Semana',
      getValue: () => {
        const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        return { startDate: start, endDate: end };
      },
    },
    {
      label: 'Próximos 7 días',
      getValue: () => {
        const start = format(new Date(), 'yyyy-MM-dd');
        const end = format(addDays(new Date(), 7), 'yyyy-MM-dd');
        return { startDate: start, endDate: end };
      },
    },
    {
      label: 'Este Mes',
      getValue: () => {
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
        return { startDate: start, endDate: end };
      },
    },
  ];

  const handleFilterChange = (key: keyof AppointmentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleDatePreset = (preset: typeof datePresets[0]) => {
    const dates = preset.getValue();
    onFiltersChange({
      ...filters,
      startDate: dates.startDate,
      endDate: dates.endDate,
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  ) || searchQuery.trim() !== '';

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.professionalId) count++;
    if (filters.treatmentTypeId) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  // Update search in filters when searchQuery changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange('search', searchQuery.trim() || undefined);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <Card className={className}>
      <Card.Body>
        <div className="space-y-4">
          {/* Header with search and toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 max-w-md">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por paciente, profesional o tratamiento..."
                  startIcon={<Search className="w-4 h-4" />}
                />
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              >
                Filtros Avanzados
                {getActiveFilterCount() > 0 && (
                  <Badge variant="primary" size="sm" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Limpiar
                </Button>
              )}
              
              {onExport && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExport}
                  icon={<Download className="w-4 h-4" />}
                >
                  Exportar
                </Button>
              )}
            </div>
          </div>

          {/* Quick date presets */}
          <div className="flex flex-wrap gap-2">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => handleDatePreset(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Advanced filters */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t">
              {/* Status and Professional */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Estado</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input"
                  >
                    <option value="">Todos los estados</option>
                    {Object.entries(APPOINTMENT_STATUSES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Profesional</label>
                  <select
                    value={filters.professionalId || ''}
                    onChange={(e) => handleFilterChange('professionalId', e.target.value)}
                    className="input"
                  >
                    <option value="">Todos los profesionales</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        Dr. {professional.firstName} {professional.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Tipo de Tratamiento</label>
                  <select
                    value={filters.treatmentTypeId || ''}
                    onChange={(e) => handleFilterChange('treatmentTypeId', e.target.value)}
                    className="input"
                  >
                    <option value="">Todos los tratamientos</option>
                    {treatmentTypes.map((treatmentType) => (
                      <option key={treatmentType.id} value={treatmentType.id}>
                        {treatmentType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Duración</label>
                  <select
                    value={filters.duration || ''}
                    onChange={(e) => handleFilterChange('duration', e.target.value)}
                    className="input"
                  >
                    <option value="">Cualquier duración</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha desde</label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    startIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="label">Fecha hasta</label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    startIcon={<Calendar className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hora desde</label>
                  <Input
                    type="time"
                    value={filters.startTime || ''}
                    onChange={(e) => handleFilterChange('startTime', e.target.value)}
                    startIcon={<Clock className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="label">Hora hasta</label>
                  <Input
                    type="time"
                    value={filters.endTime || ''}
                    onChange={(e) => handleFilterChange('endTime', e.target.value)}
                    startIcon={<Clock className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Additional filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Creado por</label>
                  <select
                    value={filters.createdBy || ''}
                    onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                    className="input"
                  >
                    <option value="">Cualquier usuario</option>
                    <option value="current">Mi usuario</option>
                    {/* Add more users if needed */}
                  </select>
                </div>

                <div>
                  <label className="label">Con notas</label>
                  <select
                    value={filters.hasNotes || ''}
                    onChange={(e) => handleFilterChange('hasNotes', e.target.value)}
                    className="input"
                  >
                    <option value="">Todos</option>
                    <option value="true">Con notas</option>
                    <option value="false">Sin notas</option>
                  </select>
                </div>

                <div>
                  <label className="label">Notificaciones</label>
                  <select
                    value={filters.notificationStatus || ''}
                    onChange={(e) => handleFilterChange('notificationStatus', e.target.value)}
                    className="input"
                  >
                    <option value="">Todas</option>
                    <option value="sent">Enviadas</option>
                    <option value="failed">Fallidas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
              <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
              
              {searchQuery.trim() && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <Search className="w-3 h-3" />
                  <span>"{searchQuery.trim()}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.status && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <span>Estado: {APPOINTMENT_STATUSES[filters.status]}</span>
                  <button
                    onClick={() => handleFilterChange('status', undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.professionalId && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <User className="w-3 h-3" />
                  <span>
                    {professionals.find(p => p.id === filters.professionalId)?.firstName} {professionals.find(p => p.id === filters.professionalId)?.lastName}
                  </span>
                  <button
                    onClick={() => handleFilterChange('professionalId', undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.treatmentTypeId && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>
                    {treatmentTypes.find(t => t.id === filters.treatmentTypeId)?.name}
                  </span>
                  <button
                    onClick={() => handleFilterChange('treatmentTypeId', undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {(filters.startDate || filters.endDate) && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    {filters.startDate && filters.endDate 
                      ? `${format(new Date(filters.startDate), 'dd/MM')} - ${format(new Date(filters.endDate), 'dd/MM')}`
                      : filters.startDate 
                        ? `Desde ${format(new Date(filters.startDate), 'dd/MM/yyyy')}`
                        : `Hasta ${format(new Date(filters.endDate!), 'dd/MM/yyyy')}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      handleFilterChange('startDate', undefined);
                      handleFilterChange('endDate', undefined);
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {(filters.startTime || filters.endTime) && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center space-x-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {filters.startTime && filters.endTime 
                      ? `${filters.startTime} - ${filters.endTime}`
                      : filters.startTime 
                        ? `Desde ${filters.startTime}`
                        : `Hasta ${filters.endTime}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      handleFilterChange('startTime', undefined);
                      handleFilterChange('endTime', undefined);
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AppointmentAdvancedFilters;